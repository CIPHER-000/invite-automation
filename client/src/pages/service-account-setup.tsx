import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  Settings,
  Copy,
  ExternalLink
} from "lucide-react";

export default function ServiceAccountSetup() {
  const [isConfiguring, setIsConfiguring] = useState(false);
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
  const isConfigured = serviceStatus?.configured && serviceAccount;

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