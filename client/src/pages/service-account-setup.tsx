import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  Settings,
  Copy,
  ExternalLink,
  Plus,
  Users,
  Mail,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";

export default function ServiceAccountSetup() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserAppPassword, setNewUserAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/oauth-calendar/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/oauth-calendar/accounts");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    retry: false,
  });

  const { data: serviceStatus } = useQuery({
    queryKey: ["/api/auth/service-account/status"],
    queryFn: async () => {
      const response = await fetch("/api/auth/service-account/status");
      if (!response.ok) return { configured: false, calendar: false, sheets: false };
      return response.json();
    },
    retry: false,
  });

  const oauthAccounts = accounts || [];
  const isConfigured = oauthAccounts.length > 0;

  // Add organizational user mutation
  const addUserMutation = useMutation({
    mutationFn: async ({ email, name, appPassword }: { email: string; name: string; appPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/gmail/app-password", {
        email,
        name,
        appPassword
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setNewUserEmail("");
      setNewUserName("");
      setNewUserAppPassword("");
      toast({
        title: "User Added",
        description: "Organizational user added successfully with app password authentication",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add organizational user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/accounts/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "User Removed",
        description: "Organizational user removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    },
  });

  const handleCopyEmail = () => {
    if (serviceAccount) {
      navigator.clipboard.writeText(serviceAccount.email);
      toast({
        title: "Copied",
        description: "Service account email copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Account Setup</h1>
          <p className="text-gray-600">Configure service account and organizational users</p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-10 w-[150px]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Setup</h1>
          <p className="text-muted-foreground mt-2">
            Connect Google accounts for automated calendar invitations
          </p>
        </div>
        <Button onClick={() => window.location.href = '/oauth-calendar'} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Connect Google Account
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">OAuth Accounts</p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured ? `${oauthAccounts.length} connected` : "Not connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Calendar API</p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Sheets API</p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OAuth Account Status */}
      {isConfigured ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>OAuth Connection Active</AlertTitle>
          <AlertDescription>
            Your Google accounts are connected and ready for automation.
            Calendar and Sheets APIs are both connected and operational.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Google Account Required</AlertTitle>
          <AlertDescription>
            Connect a Google account to start sending automated calendar invitations.
            Click "Connect Google Account" to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* Connected OAuth Accounts */}
      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connected Google Accounts
            </CardTitle>
            <CardDescription>
              OAuth accounts connected for calendar automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {oauthAccounts.map((account: any) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{account.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Connected: {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">OAuth</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(account.email)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Google Calendar API</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Google Sheets API</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Usage</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Create calendar events</p>
                    <p>• Send meeting invitations</p>
                    <p>• Read/write Google Sheets</p>
                    <p>• Process campaign data</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OAuth Setup Instructions */}
      {!isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              OAuth Setup Guide
            </CardTitle>
            <CardDescription>
              Instructions to connect your Google account for calendar automation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>OAuth Setup Required</AlertTitle>
              <AlertDescription>
                To get started with calendar automation, you need to connect your Google account using OAuth:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click the "Connect Google Account" button above</li>
                  <li>Grant permission for Calendar and Sheets access</li>
                  <li>Your account will be automatically configured for sending invites</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Google Cloud Console Setup</h4>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>If you're setting up OAuth for the first time, ensure the following in Google Cloud Console:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>APIs Enabled:</strong> Google Calendar API and Google Sheets API</li>
                  <li><strong>OAuth Consent Screen:</strong> Configured with your app information</li>
                  <li><strong>Authorized Redirect URIs:</strong> Include your domain + /api/auth/google/callback</li>
                  <li><strong>Scopes:</strong> Calendar, Sheets, and user profile access</li>
                </ul>
              </div>
            </div>

            <div className="text-center py-6">
              <Button 
                onClick={() => window.location.href = '/oauth-calendar'} 
                size="lg"
                className="px-8"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Go to OAuth Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Ready to Start</CardTitle>
          <CardDescription>
            Your service account is configured. You can now create campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/campaigns">
                Create Campaign
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">
                View Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}