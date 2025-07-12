import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Server, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Zap,
  Calendar
} from "lucide-react";
import { ProviderIcon } from "@/components/inbox/provider-icon";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import type { GoogleAccount } from "@shared/schema";

interface InboxWithStatus extends GoogleAccount {
  status: 'connected' | 'disconnected' | 'error';
  lastUsed?: string;
  nextAvailable?: string;
  isInCooldown: boolean;
  campaignsCount: number;
  invitesSentToday: number;
  dailyLimit: number;
}

export default function InboxManagement() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<InboxWithStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: accounts = [], isLoading, refetch } = useQuery<InboxWithStatus[]>({
    queryKey: ["/api/accounts/with-status"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: microsoftAccounts = [] } = useQuery({
    queryKey: ["/api/microsoft/accounts"],
    refetchInterval: 30000,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (account: InboxWithStatus) => {
      return await api.deleteAccount(account.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/with-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Account Deleted",
        description: "The inbox has been permanently removed from the platform.",
      });
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (account: InboxWithStatus) => {
      setTestingConnection(account.id);
      return await api.testConnection(account.id, 'google');
    },
    onSuccess: (data, account) => {
      toast({
        title: "Connection Test",
        description: data.success 
          ? `${account.email} is connected and working properly.`
          : `Connection issue detected: ${data.message}`,
        variant: data.success ? "default" : "destructive",
      });
      refetch();
    },
    onError: (error, account) => {
      toast({
        title: "Test Failed",
        description: `Failed to test connection for ${account.email}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setTestingConnection(null);
    },
  });

  const reconnectMutation = useMutation({
    mutationFn: async (account: InboxWithStatus) => {
      return await api.reconnectAccount(account.id, 'google');
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
      toast({
        title: "Reconnection Started",
        description: "Please complete the authentication in the new window.",
      });
    },
    onError: () => {
      toast({
        title: "Reconnection Failed",
        description: "Failed to initiate reconnection process.",
        variant: "destructive",
      });
    },
  });

  const getAuthUrlMutation = useMutation({
    mutationFn: api.getGoogleAuthUrl,
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
        toast({
          title: "Authentication Started",
          description: "Please complete the setup in the new window.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Failed to initiate account setup.",
        variant: "destructive",
      });
    },
  });

  const getMicrosoftAuthUrlMutation = useMutation({
    mutationFn: api.getMicrosoftAuthUrl,
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
        toast({
          title: "Microsoft Authentication Started",
          description: "Please complete the setup in the new window.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Microsoft Setup Failed",
        description: "Failed to initiate Microsoft account setup.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = (account: InboxWithStatus) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccountMutation.mutate(accountToDelete);
    }
  };

  const getStatusBadge = (account: InboxWithStatus) => {
    switch (account.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Connected</Badge>;
      case 'disconnected':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Disconnected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (account: InboxWithStatus) => {
    switch (account.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const totalAccounts = accounts.length + microsoftAccounts.length;
  const connectedAccounts = accounts.filter(acc => acc.status === 'connected').length;
  const disconnectedAccounts = accounts.filter(acc => acc.status === 'disconnected').length;
  const errorAccounts = accounts.filter(acc => acc.status === 'error').length;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Inbox Management</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inbox Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage all connected email accounts and their connection status.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            onClick={() => getAuthUrlMutation.mutate()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Google Account
          </Button>
          
          <Button
            onClick={() => getMicrosoftAuthUrlMutation.mutate()}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Microsoft Account
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Google & Microsoft accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{connectedAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Working properly
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{disconnectedAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Google Accounts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ProviderIcon provider="google" className="h-5 w-5" />
          Google Accounts ({accounts.length})
        </h3>
        
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Google accounts connected</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Connect your first Google account to start sending calendar invites.
              </p>
              <Button
                onClick={() => getAuthUrlMutation.mutate()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Google Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ProviderIcon provider="google" className="h-4 w-4" />
                      <span className="font-medium text-sm">{account.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(account)}
                      {getStatusBadge(account)}
                    </div>
                  </div>
                  
                  {account.name && (
                    <p className="text-sm text-muted-foreground">{account.name}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Usage Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Today's Usage</span>
                      <span className="font-medium">
                        {account.invitesSentToday || 0} / {account.dailyLimit || 100}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((account.invitesSentToday || 0) / (account.dailyLimit || 100) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {account.lastUsed && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last used: {new Date(account.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                    
                    {account.campaignsCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Used in {account.campaignsCount} campaigns
                      </div>
                    )}
                    
                    {account.isInCooldown && account.nextAvailable && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        In cooldown until {new Date(account.nextAvailable).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate(account)}
                      disabled={testingConnection === account.id}
                      className="flex-1 gap-1"
                    >
                      {testingConnection === account.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3" />
                          Test
                        </>
                      )}
                    </Button>
                    
                    {account.status !== 'connected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reconnectMutation.mutate(account)}
                        className="flex-1 gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Reconnect
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAccount(account)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Microsoft Accounts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ProviderIcon provider="microsoft" className="h-5 w-5" />
          Microsoft Accounts ({microsoftAccounts.length})
        </h3>
        
        {microsoftAccounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Microsoft accounts connected</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Connect your Microsoft/Outlook account to expand your sending capabilities.
              </p>
              <Button
                onClick={() => getMicrosoftAuthUrlMutation.mutate()}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Microsoft Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {microsoftAccounts.map((account: any) => (
              <Card key={account.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ProviderIcon provider="microsoft" className="h-4 w-4" />
                      <span className="font-medium text-sm">{account.email}</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      Microsoft
                    </Badge>
                  </div>
                  
                  {account.name && (
                    <p className="text-sm text-muted-foreground">{account.name}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Microsoft 365 / Outlook integration</div>
                    {account.lastUsed && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last used: {new Date(account.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      Test
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the account{" "}
              <strong>{accountToDelete?.email}</strong>? This action cannot be undone.
              <br /><br />
              <strong>This will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently remove the account from the platform</li>
                <li>Cancel all pending invites from this account</li>
                <li>Revoke OAuth access tokens</li>
                <li>Remove the account from all campaigns</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}