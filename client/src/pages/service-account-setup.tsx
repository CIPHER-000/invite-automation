import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  Users
} from "lucide-react";

export default function ServiceAccountSetup() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    retry: false,
  });

  const { data: serviceStatus } = useQuery({
    queryKey: ["/api/auth/service-account/status"],
    queryFn: async () => {
      const response = await fetch("/api/auth/service-account/status");
      if (!response.ok) return { configured: false };
      return response.json();
    },
    retry: false,
  });

  const serviceAccount = accounts?.find((acc: any) => acc.email?.includes('iam.gserviceaccount.com'));
  const organizationalUsers = accounts?.filter((acc: any) => !acc.email?.includes('iam.gserviceaccount.com')) || [];
  const isConfigured = serviceStatus?.configured && serviceAccount;

  // Add organizational user mutation
  const addUserMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const response = await fetch("/api/accounts/organization-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!response.ok) throw new Error("Failed to add organizational user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setNewUserEmail("");
      setNewUserName("");
      toast({
        title: "User Added",
        description: "Organizational user added successfully",
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
          <h1 className="text-3xl font-bold">Service Account Setup</h1>
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
          <h1 className="text-3xl font-bold">Service Account Setup</h1>
          <p className="text-muted-foreground mt-2">
            Configure Google Service Account for automated calendar invitations
          </p>
        </div>
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
                <p className="font-medium">Service Account</p>
                <p className="text-sm text-muted-foreground">
                  {isConfigured ? "Active" : "Not configured"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {serviceStatus?.calendar ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Calendar API</p>
                <p className="text-sm text-muted-foreground">
                  {serviceStatus?.calendar ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {serviceStatus?.sheets ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Sheets API</p>
                <p className="text-sm text-muted-foreground">
                  {serviceStatus?.sheets ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Account Status */}
      {isConfigured ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Service Account Active</AlertTitle>
          <AlertDescription>
            Your Google Service Account is configured and ready for automation.
            Calendar and Sheets APIs are both connected and operational.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Account Required</AlertTitle>
          <AlertDescription>
            A Google Service Account is required for automated calendar invitations.
            Contact your administrator to configure the service account credentials.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Service Account */}
      {serviceAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current Service Account
            </CardTitle>
            <CardDescription>
              Active service account configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{serviceAccount.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(serviceAccount.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Service Account</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmail}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Google Calendar API</span>
                      {serviceStatus?.calendar && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Google Sheets API</span>
                      {serviceStatus?.sheets && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
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

      {/* Organizational Users Management */}
      {isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organizational Users
            </CardTitle>
            <CardDescription>
              Add organizational email accounts to send invites from. Requires domain-wide delegation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Domain-wide delegation instructions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Domain-Wide Delegation Required</AlertTitle>
              <AlertDescription>
                To use organizational users, configure domain-wide delegation in Google Workspace Admin Console:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to Google Workspace Admin Console → Security → API Controls</li>
                  <li>Add the service account client ID: <code className="bg-muted px-1 rounded text-xs">inviteautomate@new-app-464423.iam.gserviceaccount.com</code></li>
                  <li>Grant scopes: <code className="bg-muted px-1 rounded text-xs">https://www.googleapis.com/auth/calendar, https://www.googleapis.com/auth/spreadsheets</code></li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Add new organizational user */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Add Organizational User</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userEmail">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="shaw@getmemeetings.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="userName">Display Name (Optional)</Label>
                  <Input
                    id="userName"
                    placeholder="Shaw"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => addUserMutation.mutate({ email: newUserEmail, name: newUserName })}
                disabled={!newUserEmail || addUserMutation.isPending}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addUserMutation.isPending ? "Adding..." : "Add Organizational User"}
              </Button>
            </div>

            {/* List existing organizational users */}
            {organizationalUsers.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Current Organizational Users</h4>
                <div className="space-y-2">
                  {organizationalUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
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