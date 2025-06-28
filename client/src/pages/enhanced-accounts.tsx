import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { AccountStatus } from "@/components/accounts/account-status";
import { InboxStats } from "@/components/accounts/inbox-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeAccounts } from "@/hooks/use-realtime";
import type { AccountWithStatus } from "@shared/schema";
import { 
  Plus, 
  Users, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  Power,
  BarChart3,
  Settings,
  TrendingUp,
  Shield,
  Activity,
  Zap
} from "lucide-react";

export default function EnhancedAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useRealtimeAccounts();
  const { data: inboxStats } = useQuery({
    queryKey: ["/api/inbox/stats"],
    queryFn: api.getInboxStats,
    refetchInterval: 10000,
  });

  const { data: loadBalancingConfig } = useQuery({
    queryKey: ["/api/inbox/config"],
    queryFn: api.getLoadBalancingConfig,
  });

  const connectAccountMutation = useMutation({
    mutationFn: api.getAuthUrl,
    onSuccess: (data) => {
      window.open(data.authUrl, '_blank', 'width=500,height=600');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get authorization URL.",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: api.updateLoadBalancingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inbox/config"] });
      toast({
        title: "Configuration Updated",
        description: "Load balancing settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    },
  });

  const resetDailyMutation = useMutation({
    mutationFn: api.resetDailyCounters,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inbox/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Daily Counters Reset",
        description: "All daily usage counters have been reset.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset daily counters.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 ml-64">
        <Header title="Google Accounts" subtitle="Manage your connected accounts and load balancing" />
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeAccounts = accounts?.filter((acc: AccountWithStatus) => acc.isActive) || [];
  const inactiveAccounts = accounts?.filter((acc: AccountWithStatus) => !acc.isActive) || [];
  const cooldownAccounts = activeAccounts.filter((acc: AccountWithStatus) => acc.isInCooldown);
  
  // Calculate overall stats
  const totalInboxes = accounts?.length || 0;
  const healthyInboxes = inboxStats?.filter((stat: any) => stat.healthScore >= 70).length || 0;
  const availableInboxes = inboxStats?.filter((stat: any) => stat.isAvailable).length || 0;
  const totalDailyInvites = inboxStats?.reduce((sum: number, stat: any) => sum + stat.invitesToday, 0) || 0;

  return (
    <div className="flex-1 ml-64">
      <Header title="Google Accounts" subtitle="Enhanced account management with smart load balancing" showCreateButton />
      
      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{totalInboxes}</p>
                  <p className="text-xs text-slate-600">Total Inboxes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{availableInboxes}</p>
                  <p className="text-xs text-slate-600">Available Now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{healthyInboxes}</p>
                  <p className="text-xs text-slate-600">Healthy (70%+)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{totalDailyInvites}</p>
                  <p className="text-xs text-slate-600">Sent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="accounts">Account Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance Stats</TabsTrigger>
            <TabsTrigger value="settings">Load Balancing Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            {accounts?.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">No Google accounts connected</h3>
                      <p className="text-sm text-slate-600">Connect your first Google account to start sending calendar invites</p>
                    </div>
                    <Button 
                      onClick={() => connectAccountMutation.mutate()}
                      disabled={connectAccountMutation.isPending}
                      className="w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      Connect Google Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Alerts */}
                {cooldownAccounts.length > 0 && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Accounts in Cooldown</AlertTitle>
                    <AlertDescription>
                      {cooldownAccounts.length} account(s) are currently in cooldown period and temporarily unavailable.
                    </AlertDescription>
                  </Alert>
                )}

                {activeAccounts.length === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Active Accounts</AlertTitle>
                    <AlertDescription>
                      All accounts are inactive. Enable at least one account to send invites.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Active Accounts */}
                {activeAccounts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Active Accounts ({activeAccounts.length})</span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {activeAccounts.map((account: AccountWithStatus) => (
                        <AccountStatus key={account.id} account={account} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive Accounts */}
                {inactiveAccounts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium flex items-center space-x-2 mb-4">
                      <Power className="h-5 w-5 text-slate-400" />
                      <span>Inactive Accounts ({inactiveAccounts.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {inactiveAccounts.map((account: AccountWithStatus) => (
                        <AccountStatus key={account.id} account={account} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {inboxStats && inboxStats.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Inbox Performance Metrics</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/inbox/stats"] })}
                  >
                    <RefreshCw size={14} className="mr-2" />
                    Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {accounts?.map((account: AccountWithStatus) => (
                    <InboxStats 
                      key={account.id} 
                      accountId={account.id}
                      accountEmail={account.email}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto" />
                    <div>
                      <h3 className="font-medium text-slate-800">No Performance Data</h3>
                      <p className="text-sm text-slate-600">Connect accounts and send invites to see performance metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings size={20} />
                  <span>Load Balancing Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadBalancingConfig && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Daily Quota Per Inbox</Label>
                        <Input 
                          type="number" 
                          defaultValue={loadBalancingConfig.dailyQuotaPerInbox}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-600 mt-1">Maximum invites per day per inbox</p>
                      </div>

                      <div>
                        <Label>Cooldown Period (minutes)</Label>
                        <Input 
                          type="number" 
                          defaultValue={loadBalancingConfig.cooldownMinutes}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-600 mt-1">Time between sends from same inbox</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Max Errors Before Pause</Label>
                        <Input 
                          type="number" 
                          defaultValue={loadBalancingConfig.maxErrorsBeforePause}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-600 mt-1">Consecutive errors before auto-pause</p>
                      </div>

                      <div>
                        <Label>Health Threshold (%)</Label>
                        <Input 
                          type="number" 
                          defaultValue={loadBalancingConfig.healthThreshold}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-600 mt-1">Minimum health score to use inbox</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={() => updateConfigMutation.mutate(loadBalancingConfig)}
                    disabled={updateConfigMutation.isPending}
                  >
                    <Settings size={16} className="mr-2" />
                    Save Configuration
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => resetDailyMutation.mutate()}
                    disabled={resetDailyMutation.isPending}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Reset Daily Counters
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap size={20} />
                  <span>Smart Scheduling Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Dynamic Time Slots</h4>
                      <ul className="text-slate-600 space-y-1">
                        <li>• Respects recipient timezones</li>
                        <li>• Schedules within business hours</li>
                        <li>• Randomizes minutes for natural feel</li>
                        <li>• Avoids double-booking slots</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Load Balancing</h4>
                      <ul className="text-slate-600 space-y-1">
                        <li>• Automatic inbox rotation</li>
                        <li>• Health-based selection</li>
                        <li>• Rate limit enforcement</li>
                        <li>• Auto-pause on errors</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}