import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { AccountStatus } from "@/components/accounts/account-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Users, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  Power,
  Trash2
} from "lucide-react";
import { RemoveInboxDialog } from "@/components/inbox/remove-inbox-dialog";
import { InboxSearch, filterInboxes } from "@/components/inbox/inbox-search";
import type { AccountWithStatus } from "@shared/schema";

export default function Accounts() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<AccountWithStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/accounts");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched accounts:", data);
        return data;
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
        throw err;
      }
    },
    retry: false,
  });

  const { data: serviceStatus } = useQuery({
    queryKey: ["/api/auth/service-account/status"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/service-account/status");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("Service status:", data);
        return data;
      } catch (err) {
        console.error("Failed to fetch service status:", err);
        return { configured: false };
      }
    },
    retry: false,
  });

  // Debug logging
  console.log("Component rendered - Accounts:", accounts, "Loading:", isLoading, "Error:", error);

  const connectMutation = useMutation({
    mutationFn: api.getGoogleAuthUrl,
    onSuccess: (data: any) => {
      if (!data.authUrl) {
        toast({
          title: "Authentication Error",
          description: "Failed to generate authentication URL. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      window.open(data.authUrl, "_blank", "width=500,height=600");
      setIsConnecting(true);
      
      toast({
        title: "Authentication Started",
        description: "Complete the OAuth flow in the new window to connect your Google account.",
      });
      
      // Check for connection completion
      const checkInterval = setInterval(() => {
        refetch().then(() => {
          clearInterval(checkInterval);
          setIsConnecting(false);
          toast({
            title: "Account Connected",
            description: "Google account connected successfully!",
          });
        });
      }, 2000);

      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        setIsConnecting(false);
      }, 300000);
    },
    onError: (error: any) => {
      console.error("OAuth error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to start authentication. Please check your internet connection and try again.",
        variant: "destructive",
      });
    },
  });

  const processAllMutation = useMutation({
    mutationFn: api.processAllCampaigns,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  const filteredAccounts = filterInboxes(accounts || [], searchTerm);
  const activeAccounts = filteredAccounts.filter((acc: AccountWithStatus) => acc.isActive);
  const inactiveAccounts = filteredAccounts.filter((acc: AccountWithStatus) => !acc.isActive);
  const cooldownAccounts = activeAccounts.filter((acc: AccountWithStatus) => acc.isInCooldown);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 ml-64">
        <Header 
          title="Google Accounts" 
          subtitle="Loading account information..."
        />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 ml-64">
        <Header 
          title="Google Accounts" 
          subtitle="Error loading accounts"
        />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load accounts: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64">
      <Header 
        title="Google Accounts" 
        subtitle="Manage your connected Google accounts for calendar invites"
      />

      <div className="p-6 space-y-6">
        {/* OAuth Status */}
        {accounts && accounts.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">OAuth Authentication Active</AlertTitle>
            <AlertDescription className="text-green-700">
              Google accounts connected via OAuth 2.0. Calendar and Sheets access available through connected accounts.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        {accounts && accounts.length > 0 && (
          <InboxSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search accounts by email or name..."
            className="mb-6"
          />
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {filteredAccounts.length}
                  </p>
                  {searchTerm && (
                    <p className="text-xs text-gray-500">of {accounts?.length || 0} total</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-success" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {activeAccounts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-warning" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">In Cooldown</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {cooldownAccounts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Power className="text-slate-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Disabled</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {inactiveAccounts.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        {accounts && accounts.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Google accounts connected</AlertTitle>
            <AlertDescription>
              Connect a Google account using OAuth 2.0 to start sending calendar invites.
              You'll need to grant permissions for Calendar and Google Sheets access.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Account Management</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw 
                    className={`mr-2 ${isLoading ? "animate-spin" : ""}`} 
                    size={16} 
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => processAllMutation.mutate()}
                  disabled={processAllMutation.isPending}
                >
                  <RefreshCw 
                    className={`mr-2 ${processAllMutation.isPending ? "animate-spin" : ""}`} 
                    size={16} 
                  />
                  Process All Campaigns
                </Button>
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={isConnecting || connectMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="mr-2 animate-spin" size={16} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2" size={16} />
                      Connect Google Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 space-y-2">
              <p>• Accounts are automatically rotated with a 30-minute cooldown between sends</p>
              <p>• Each account can send up to 50 invites per day (system limit: 100 total)</p>
              <p>• Make sure your Google Sheets are shared with the connected accounts</p>
              <p>• Permissions required: Calendar (read/write), Sheets (read/write), Profile (read)</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Accounts */}
        {activeAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Accounts</CardTitle>
                <Badge variant="outline" className="text-success border-success">
                  {activeAccounts.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : (
                activeAccounts.map((account: AccountWithStatus) => (
                  <AccountStatus key={account.id} account={account} />
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Inactive Accounts */}
        {inactiveAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Disabled Accounts</CardTitle>
                <Badge variant="outline" className="text-slate-600 border-slate-300">
                  {inactiveAccounts.length} disabled
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {inactiveAccounts.map((account: AccountWithStatus) => (
                <AccountStatus key={account.id} account={account} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* OAuth Setup Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ExternalLink size={20} />
              <span>OAuth Setup Guide</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600 space-y-3">
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Required Environment Variables:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><code className="bg-slate-100 px-1 rounded">GOOGLE_CLIENT_ID</code> - Your OAuth 2.0 Client ID</li>
                  <li><code className="bg-slate-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> - Your OAuth 2.0 Client Secret</li>
                  <li><code className="bg-slate-100 px-1 rounded">GOOGLE_REDIRECT_URI</code> - Set to your domain + /api/auth/google/callback</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Google Cloud Console Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Create a project in Google Cloud Console</li>
                  <li>Enable Google Calendar API and Google Sheets API</li>
                  <li>Create OAuth 2.0 credentials (Web application)</li>
                  <li>Add your domain to authorized origins</li>
                  <li>Add callback URL to authorized redirect URIs</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remove Inbox Dialog */}
        <RemoveInboxDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          inbox={selectedInbox}
        />
      </div>
    </div>
  );

  // Helper function to handle remove inbox
  const handleRemoveInbox = (account: AccountWithStatus) => {
    setSelectedInbox(account);
    setRemoveDialogOpen(true);
  };
}
