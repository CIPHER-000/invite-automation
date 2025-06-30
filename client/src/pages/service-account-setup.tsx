import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ServiceAccountSetup() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const { data: status } = useQuery({
    queryKey: ["/api/auth/service-account/status"],
  });

  const createServiceAccountMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/auth/google/service-account", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service account connected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    createServiceAccountMutation.mutate(email);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Configuration copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Google Service Account Setup</h1>
        <p className="text-gray-600 mt-2">
          Connect your Google Service Account for automated calendar and sheets access without OAuth approval delays.
        </p>
      </div>

      {/* Status Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Account Status</CardTitle>
          <CardDescription>Current configuration status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {status?.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Service Account Configured: {status?.configured ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center gap-2">
              {status?.calendar ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Calendar API Access: {status?.calendar ? "Working" : "Not Working"}</span>
            </div>
            <div className="flex items-center gap-2">
              {status?.sheets ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Sheets API Access: {status?.sheets ? "Working" : "Not Working"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!status?.configured && (
        <>
          {/* Setup Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to configure Google Service Account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">1. Create Service Account in Google Cloud Console</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Create a new service account</li>
                  <li>Download the JSON key file</li>
                  <li>Enable Calendar API and Sheets API</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">2. Configure Environment Variables</h4>
                <p className="text-sm text-gray-600">Add these environment variables to your Replit:</p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span>GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("GOOGLE_SERVICE_ACCOUNT_EMAIL")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GOOGLE_PROJECT_ID=your-project-id</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("GOOGLE_PROJECT_ID")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After adding environment variables, restart your Replit to apply the changes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}

      {/* Connect Service Account */}
      {status?.configured && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Service Account</CardTitle>
            <CardDescription>Add a service account connection for calendar automation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Calendar Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-calendar@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This should be the email address that will create calendar events. The service account must have calendar access to this email.
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={createServiceAccountMutation.isPending || !email}
              >
                {createServiceAccountMutation.isPending ? "Connecting..." : "Connect Service Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}