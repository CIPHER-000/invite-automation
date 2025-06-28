import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Mail,
  Calendar,
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  Power,
  Trash2,
  TestTube,
  BarChart3,
  Send
} from "lucide-react";

interface ProviderAccountCardProps {
  account: any;
  provider: "google" | "outlook";
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onTest?: (id: number) => void;
}

function ProviderAccountCard({ account, provider, onToggle, onDelete, onTest }: ProviderAccountCardProps) {
  const getProviderIcon = () => {
    switch (provider) {
      case "google":
        return "🔵"; // Google blue
      case "outlook":
        return "🟦"; // Microsoft blue
      default:
        return "📧";
    }
  };

  const getProviderName = () => {
    switch (provider) {
      case "google":
        return "Google Workspace";
      case "outlook":
        return "Microsoft 365";
      default:
        return "Email Provider";
    }
  };

  return (
    <Card className={`border-l-4 ${account.isActive ? 'border-l-green-500' : 'border-l-gray-400'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center space-x-2">
            <span className="text-xl">{getProviderIcon()}</span>
            <div>
              <div className="text-sm font-medium">{account.name}</div>
              <div className="text-xs text-slate-600">{getProviderName()}</div>
            </div>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={account.isActive ? "default" : "secondary"}>
              {account.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Mail size={14} />
          <span className="truncate">{account.email}</span>
        </div>

        {account.lastUsed && (
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Clock size={14} />
            <span>Last used: {new Date(account.lastUsed).toLocaleString()}</span>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggle(account.id)}
            className="flex-1"
          >
            <Power size={14} className="mr-1" />
            {account.isActive ? "Deactivate" : "Activate"}
          </Button>
          
          {onTest && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTest(account.id)}
              className="px-3"
            >
              <TestTube size={14} />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(account.id)}
            className="px-3 text-red-600 hover:text-red-700"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MultiProviderAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("google");

  const { data: googleAccounts, isLoading: loadingGoogle } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: api.getAccounts,
    refetchInterval: 30000,
  });

  const { data: outlookAccounts, isLoading: loadingOutlook } = useQuery({
    queryKey: ["/api/outlook/accounts"],
    queryFn: () => fetch("/api/outlook/accounts").then(res => res.json()),
    refetchInterval: 30000,
  });

  const { data: emailProviders } = useQuery({
    queryKey: ["/api/email/providers"],
    queryFn: () => fetch("/api/email/providers").then(res => res.json()),
    refetchInterval: 30000,
  });

  const { data: emailStats } = useQuery({
    queryKey: ["/api/email/providers/stats"],
    queryFn: () => fetch("/api/email/providers/stats").then(res => res.json()),
    refetchInterval: 30000,
  });

  const connectGoogleMutation = useMutation({
    mutationFn: api.getAuthUrl,
    onSuccess: (data) => {
      window.open(data.authUrl, '_blank', 'width=500,height=600');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get Google authorization URL.",
        variant: "destructive",
      });
    },
  });

  const connectOutlookMutation = useMutation({
    mutationFn: () => fetch("/api/auth/outlook").then(res => res.json()),
    onSuccess: (data) => {
      window.open(data.authUrl, '_blank', 'width=500,height=600');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get Outlook authorization URL.",
        variant: "destructive",
      });
    },
  });

  const toggleGoogleMutation = useMutation({
    mutationFn: (id: number) => api.toggleAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Account updated", description: "Account status changed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update account.", variant: "destructive" });
    },
  });

  const deleteGoogleMutation = useMutation({
    mutationFn: (id: number) => api.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Account deleted", description: "Account removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
    },
  });

  const toggleOutlookMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/outlook/accounts/${id}/toggle`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlook/accounts"] });
      toast({ title: "Outlook account updated", description: "Account status changed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update Outlook account.", variant: "destructive" });
    },
  });

  const deleteOutlookMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/outlook/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlook/accounts"] });
      toast({ title: "Outlook account deleted", description: "Account removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete Outlook account.", variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/email/providers/${id}/test`, { method: "POST" }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: data.success ? "Test successful" : "Test failed",
        description: data.success ? "Email provider is working correctly." : "Email provider test failed.",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to test email provider.", variant: "destructive" });
    },
  });

  const totalAccounts = (googleAccounts?.length || 0) + (outlookAccounts?.length || 0);
  const activeAccounts = (googleAccounts?.filter((acc: any) => acc.isActive).length || 0) + 
                       (outlookAccounts?.filter((acc: any) => acc.isActive).length || 0);
  const totalEmailsSent = emailStats?.reduce((sum: number, stat: any) => sum + stat.emailsSent, 0) || 0;

  if (loadingGoogle && loadingOutlook) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-24" />
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
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalAccounts}</p>
                <p className="text-xs text-slate-600">Total Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeAccounts}</p>
                <p className="text-xs text-slate-600">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalEmailsSent}</p>
                <p className="text-xs text-slate-600">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google">Google Accounts ({googleAccounts?.length || 0})</TabsTrigger>
          <TabsTrigger value="outlook">Outlook Accounts ({outlookAccounts?.length || 0})</TabsTrigger>
          <TabsTrigger value="email">Email Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Google Workspace Accounts</h3>
              <p className="text-sm text-slate-600">Manage Google Calendar and Gmail integration</p>
            </div>
            <Button 
              onClick={() => connectGoogleMutation.mutate()}
              disabled={connectGoogleMutation.isPending}
            >
              <Plus size={16} className="mr-2" />
              Connect Google Account
            </Button>
          </div>

          {googleAccounts?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">No Google accounts connected</h3>
                    <p className="text-sm text-slate-600">Connect your Google Workspace account to send calendar invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {googleAccounts?.map((account: any) => (
                <ProviderAccountCard
                  key={account.id}
                  account={account}
                  provider="google"
                  onToggle={toggleGoogleMutation.mutate}
                  onDelete={deleteGoogleMutation.mutate}
                  onTest={testEmailMutation.mutate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outlook" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Microsoft 365 Accounts</h3>
              <p className="text-sm text-slate-600">Manage Outlook Calendar and Email integration</p>
            </div>
            <Button 
              onClick={() => connectOutlookMutation.mutate()}
              disabled={connectOutlookMutation.isPending}
            >
              <Plus size={16} className="mr-2" />
              Connect Outlook Account
            </Button>
          </div>

          {outlookAccounts?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">No Outlook accounts connected</h3>
                    <p className="text-sm text-slate-600">Connect your Microsoft 365 account to send calendar invites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {outlookAccounts?.map((account: any) => (
                <ProviderAccountCard
                  key={account.id}
                  account={account}
                  provider="outlook"
                  onToggle={toggleOutlookMutation.mutate}
                  onDelete={deleteOutlookMutation.mutate}
                  onTest={testEmailMutation.mutate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Email Provider Statistics</h3>
            <p className="text-sm text-slate-600">Monitor email sending performance across all providers</p>
          </div>

          {emailStats && emailStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {emailStats.map((stat: any) => (
                <Card key={`${stat.type}-${stat.accountId}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      <span className="text-xl">{stat.type === 'gmail' ? '🔵' : '🟦'}</span>
                      <div>
                        <div className="text-sm font-medium">{stat.name}</div>
                        <div className="text-xs text-slate-600">{stat.type === 'gmail' ? 'Gmail' : 'Outlook'}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{stat.emailsSent}</div>
                        <div className="text-xs text-slate-600">Emails Sent</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{Math.round(stat.successRate)}%</div>
                        <div className="text-xs text-slate-600">Success Rate</div>
                      </div>
                    </div>
                    
                    {stat.lastUsed && (
                      <div className="text-xs text-slate-600 text-center">
                        Last used: {new Date(stat.lastUsed).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-12 w-12 text-slate-400 mx-auto" />
                  <div>
                    <h3 className="font-medium text-slate-800">No Email Statistics</h3>
                    <p className="text-sm text-slate-600">Connect accounts and send emails to see statistics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}