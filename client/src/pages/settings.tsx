import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw,
  Clock,
  Mail,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

const settingsSchema = z.object({
  dailyInviteLimit: z.number().min(1).max(1000),
  inboxCooldownMinutes: z.number().min(1).max(1440),
  acceptanceCheckIntervalMinutes: z.number().min(1).max(1440),
  isSystemActive: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: api.getSettings,
  });

  const { data: queueStatus } = useQuery({
    queryKey: ["/api/queue/status"],
    queryFn: api.getQueueStatus,
    refetchInterval: 5000,
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      dailyInviteLimit: settings.dailyInviteLimit,
      inboxCooldownMinutes: settings.inboxCooldownMinutes,
      acceptanceCheckIntervalMinutes: settings.acceptanceCheckIntervalMinutes,
      isSystemActive: settings.isSystemActive,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Settings updated",
        description: "System settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const processAllMutation = useMutation({
    mutationFn: api.processAllCampaigns,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue/status"] });
      toast({
        title: "Processing started",
        description: "All campaigns are being processed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process campaigns.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure system behavior and limits</p>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure system behavior and limits</p>
      </div>

      <div className="space-y-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield size={20} />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${settings?.isSystemActive ? 'bg-success animate-pulse' : 'bg-slate-400'}`}></div>
                <div>
                  <p className="text-sm font-medium">System Status</p>
                  <p className="text-xs text-slate-600">
                    {settings?.isSystemActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Queue Status</p>
                  <p className="text-xs text-slate-600">
                    {queueStatus?.pending || 0} pending items
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-xs text-slate-600">
                    {queueStatus?.completed || 0} today
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={16} className="text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-xs text-slate-600">
                    {queueStatus?.failed || 0} items
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon size={20} />
                  <span>System Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="isSystemActive"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            System Active
                          </FormLabel>
                          <FormDescription>
                            Enable or disable the entire campaign automation system
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dailyInviteLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Mail size={16} />
                          <span>Daily Invite Limit</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of invites to send per day across all accounts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inboxCooldownMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Clock size={16} />
                          <span>Inbox Cooldown (minutes)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={1440}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Time to wait between sending invites from the same account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="acceptanceCheckIntervalMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <RefreshCw size={16} />
                        <span>Acceptance Check Interval (minutes)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={1440}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How often to check for accepted calendar invites
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* Manual Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <h4 className="font-medium text-slate-800">Process All Campaigns</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Manually trigger processing of all active campaigns to refresh the queue
                </p>
              </div>
              <Button
                onClick={() => processAllMutation.mutate()}
                disabled={processAllMutation.isPending}
                variant="outline"
              >
                {processAllMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info size={20} />
              <span>API Limits & Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Google Calendar API</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Quota: 1,000,000 requests/day</li>
                  <li>• Rate limit: 100 requests/100 seconds/user</li>
                  <li>• Event creation: Real-time</li>
                  <li>• Status checking: Every 5 minutes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-slate-800 mb-2">Google Sheets API</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Quota: 100 requests/100 seconds/user</li>
                  <li>• Read operations: Batch supported</li>
                  <li>• Write operations: Atomic updates</li>
                  <li>• Sheet sync: On campaign processing</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-slate-800 mb-2">System Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-success border-success">
                    Optimal Settings
                  </Badge>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Daily limit: 50-100 invites</li>
                    <li>• Cooldown: 30-60 minutes</li>
                    <li>• Check interval: 30-60 minutes</li>
                    <li>• Accounts: 3-5 for rotation</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Badge variant="outline" className="text-warning border-warning">
                    Rate Limiting
                  </Badge>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Gmail: 250 emails/day per account</li>
                    <li>• Calendar: 1M API calls/day</li>
                    <li>• Sheets: 300 requests/minute</li>
                    <li>• OAuth: Token refresh every hour</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
