import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  CalendarIcon,
  SendIcon,
  TestTube2Icon,
  UserIcon,
  PlusIcon,
  Search,
  Mail,
  Settings
} from "lucide-react";
import { ProviderIcon } from "@/components/inbox/provider-icon";
import { InboxSearch, filterInboxes } from "@/components/inbox/inbox-search";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import type { GoogleAccount } from "@shared/schema";

interface OAuthAccount {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

interface InboxWithStatus extends GoogleAccount {
  status: 'connected' | 'disconnected' | 'error';
  lastUsed?: string;
  nextAvailable?: string;
  isInCooldown: boolean;
  campaignsCount: number;
  invitesSentToday: number;
  dailyLimit: number;
}

interface DailyStats {
  invitesToday: number;
  maxDailyLimit: number;
  remaining: number;
}

function DailyStatsDisplay({ accountId }: { accountId: number }) {
  const { data: stats, isLoading } = useQuery<DailyStats>({
    queryKey: [`/api/oauth-calendar/accounts/${accountId}/daily-stats`],
    refetchInterval: 30000,
  });

  if (isLoading || !stats) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading stats...
      </div>
    );
  }

  const progressPercentage = (stats.invitesToday / stats.maxDailyLimit) * 100;
  const isNearLimit = progressPercentage >= 80;
  const isAtLimit = progressPercentage >= 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Today's invites</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'}`}>
          {stats.invitesToday}/{stats.maxDailyLimit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {stats.remaining > 0 ? `${stats.remaining} remaining` : 'Daily limit reached'}
      </div>
    </div>
  );
}

export default function UnifiedInboxManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<InboxWithStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  
  // Test invite form state
  const [prospectEmail, setProspectEmail] = useState("");
  const [eventTitle, setEventTitle] = useState("Quick Meeting Request");
  const [eventDescription, setEventDescription] = useState("I'd love to schedule a quick meeting to discuss potential collaboration opportunities.");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all account data
  const { data: accounts = [], isLoading: accountsLoading, refetch } = useQuery<InboxWithStatus[]>({
    queryKey: ["/api/accounts/with-status"],
    refetchInterval: 30000,
  });

  const { data: oauthAccounts = [], isLoading: oauthLoading } = useQuery<OAuthAccount[]>({
    queryKey: ["/api/oauth-calendar/accounts"],
    refetchInterval: 30000,
  });

  const { data: microsoftAccounts = [] } = useQuery({
    queryKey: ["/api/microsoft/accounts"],
    refetchInterval: 30000,
  });

  // Connect new Google account mutation
  const connectAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
      return data;
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Google connection",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (account: InboxWithStatus) => {
      return await api.deleteAccount(account.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/with-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oauth-calendar/accounts"] });
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

  // Test connection mutation
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

  // Reconnect mutation
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

  // Get auth URL mutations
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

  // Send test invite mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId || !prospectEmail || !eventTitle) {
        throw new Error("Please fill in all required fields and select an account");
      }

      const response = await apiRequest("POST", "/api/oauth-calendar/send-test-invite", {
        accountId: selectedAccountId,
        prospectEmail,
        eventTitle,
        eventDescription,
      });

      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Test Invite Sent",
          description: `Calendar invite successfully sent to ${prospectEmail}`,
        });
        setProspectEmail("");
        setEventTitle("Quick Meeting Request");
        setEventDescription("I'd love to schedule a quick meeting to discuss potential collaboration opportunities.");
        setSelectedAccountId(null);
      } else {
        toast({
          title: "Test Failed",
          description: data.message || "Failed to send test invite",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Failed to send test invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
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

  // Filter accounts for search
  const filteredAccounts = filterInboxes(accounts, searchTerm);
  const filteredOAuthAccounts = filterInboxes(oauthAccounts, searchTerm);

  // Statistics
  const totalAccounts = accounts.length + microsoftAccounts.length;
  const connectedAccounts = accounts.filter(acc => acc.status === 'connected').length;
  const disconnectedAccounts = accounts.filter(acc => acc.status === 'disconnected').length;
  const errorAccounts = accounts.filter(acc => acc.status === 'error').length;

  // Debug logging
  console.log('Unified Inbox Management - Debug Info:', {
    accountsLength: accounts.length,
    oauthAccountsLength: oauthAccounts.length,
    microsoftAccountsLength: microsoftAccounts.length,
    totalAccounts,
    connectedAccounts,
    accountsLoading,
    oauthLoading,
    accounts: accounts.slice(0, 2), // Show first 2 accounts for debugging
    oauthAccounts: oauthAccounts.slice(0, 2)
  });

  if (accountsLoading) {
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
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            Manage your connected email accounts and calendar integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
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
            <CheckCircle className="h-4 w-4 text-green-600" />
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
            <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
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
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Require reconnection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="setup">Add Account</TabsTrigger>
          <TabsTrigger value="testing">Test Invites</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Status Overview</CardTitle>
                <CardDescription>
                  Monitor the health and status of all your connected accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h3>
                      <p className="text-gray-600 mb-4">
                        Connect your first Gmail account to start sending calendar invites.
                      </p>
                      <Button onClick={() => setActiveTab("setup")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {accounts.slice(0, 5).map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(account)}
                            <div>
                              <div className="font-medium">{account.email}</div>
                              <div className="text-sm text-muted-foreground">
                                {account.invitesSentToday} invites sent today
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(account)}
                            {account.status !== 'connected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reconnectMutation.mutate(account)}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Reconnect
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {accounts.length > 5 && (
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("accounts")}
                          >
                            View All {accounts.length} Accounts
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Connected Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Manage your Google and Microsoft accounts
              </p>
            </div>
            <InboxSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>

          <div className="grid gap-4">
            {/* Google Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ProviderIcon provider="google" className="h-5 w-5" />
                  <span>Google Accounts</span>
                  <Badge variant="secondary">{filteredAccounts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(account)}
                        <div className="flex-1">
                          <div className="font-medium">{account.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {account.campaignsCount} campaigns • {account.invitesSentToday}/{account.dailyLimit} invites today
                          </div>
                          {account.isInCooldown && (
                            <div className="text-xs text-orange-600 mt-1">
                              In cooldown until {account.nextAvailable}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(account)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnectionMutation.mutate(account)}
                          disabled={testingConnection === account.id}
                        >
                          {testingConnection === account.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          Test
                        </Button>
                        {account.status !== 'connected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reconnectMutation.mutate(account)}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Reconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <div className="text-center py-8">
                      <Mail className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">No Google accounts found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Microsoft Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ProviderIcon provider="microsoft" className="h-5 w-5" />
                  <span>Microsoft Accounts</span>
                  <Badge variant="secondary">{microsoftAccounts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {microsoftAccounts.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">No Microsoft accounts connected</p>
                      <Button 
                        className="mt-2"
                        onClick={() => getMicrosoftAuthUrlMutation.mutate()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Microsoft Account
                      </Button>
                    </div>
                  ) : (
                    microsoftAccounts.map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">{account.email}</div>
                            <div className="text-sm text-muted-foreground">
                              Microsoft Office 365
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ProviderIcon provider="google" className="h-5 w-5" />
                  <span>Add Google Account</span>
                </CardTitle>
                <CardDescription>
                  Connect a Gmail account to send calendar invites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• Full Gmail and Google Calendar access</li>
                      <li>• Send calendar invites directly</li>
                      <li>• Track invite responses</li>
                      <li>• Automated follow-ups</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => getAuthUrlMutation.mutate()}
                    className="w-full"
                    disabled={getAuthUrlMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Google Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ProviderIcon provider="microsoft" className="h-5 w-5" />
                  <span>Add Microsoft Account</span>
                </CardTitle>
                <CardDescription>
                  Connect Office 365 or Outlook.com account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• Office 365 integration</li>
                      <li>• Outlook Calendar access</li>
                      <li>• Teams meeting integration</li>
                      <li>• Enterprise features</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => getMicrosoftAuthUrlMutation.mutate()}
                    className="w-full"
                    disabled={getMicrosoftAuthUrlMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Microsoft Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube2Icon className="h-5 w-5" />
                <span>Test Calendar Invites</span>
              </CardTitle>
              <CardDescription>
                Send a test calendar invite to verify your setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-select">Select Account</Label>
                    <select
                      id="account-select"
                      className="w-full p-2 border rounded-md"
                      value={selectedAccountId || ""}
                      onChange={(e) => setSelectedAccountId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">Choose an account...</option>
                      {filteredOAuthAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.email} ({account.isActive ? 'Active' : 'Inactive'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prospect-email">Prospect Email</Label>
                    <Input
                      id="prospect-email"
                      type="email"
                      placeholder="recipient@example.com"
                      value={prospectEmail}
                      onChange={(e) => setProspectEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-title">Event Title</Label>
                    <Input
                      id="event-title"
                      placeholder="Meeting subject"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-description">Event Description</Label>
                    <Textarea
                      id="event-description"
                      placeholder="Meeting details and agenda"
                      rows={3}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProspectEmail("");
                      setEventTitle("Quick Meeting Request");
                      setEventDescription("I'd love to schedule a quick meeting to discuss potential collaboration opportunities.");
                      setSelectedAccountId(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => sendTestMutation.mutate()}
                    disabled={sendTestMutation.isPending || !selectedAccountId || !prospectEmail || !eventTitle}
                  >
                    {sendTestMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <SendIcon className="h-4 w-4 mr-2" />
                    )}
                    Send Test Invite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats for Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Available Accounts</CardTitle>
              <CardDescription>
                Daily usage statistics for test invites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {filteredOAuthAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{account.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? 'Ready' : 'Inactive'}
                      </Badge>
                      <DailyStatsDisplay accountId={account.id} />
                    </div>
                  </div>
                ))}
                {filteredOAuthAccounts.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No accounts available for testing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account
              <strong> {accountToDelete?.email}</strong> and remove it from all campaigns.
              <br /><br />
              <strong>This will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Revoke OAuth tokens</li>
                <li>Cancel all pending invites</li>
                <li>Remove from all campaigns</li>
                <li>Permanently delete the account</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}