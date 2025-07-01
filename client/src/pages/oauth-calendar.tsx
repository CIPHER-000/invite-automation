import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, SendIcon, TestTube2Icon, UserIcon, CheckCircleIcon, AlertCircleIcon, PlusIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OAuthAccount {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function OAuthCalendar() {
  const [prospectEmail, setProspectEmail] = useState("");
  const [eventTitle, setEventTitle] = useState("Quick Meeting Request");
  const [eventDescription, setEventDescription] = useState("I'd love to schedule a quick meeting to discuss potential collaboration opportunities.");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch OAuth accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/oauth-calendar/accounts"],
  });

  // Connect new Google account mutation
  const connectAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/google");
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
      return response;
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Google connection",
        variant: "destructive",
      });
    },
  });

  // Test calendar access mutation
  const testAccessMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return await apiRequest("/api/oauth-calendar/test-access", {
        method: "POST",
        body: { accountId },
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Calendar Access Verified" : "Access Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  // Send test invite mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccountId || !prospectEmail || !eventTitle) {
        throw new Error("Please fill in all required fields and select an account");
      }

      return await apiRequest("/api/oauth-calendar/test-invite", {
        method: "POST",
        body: {
          prospectEmail,
          eventTitle,
          eventDescription,
          accountId: selectedAccountId,
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Test Invite Sent!",
        description: `Calendar invite sent to ${prospectEmail} via OAuth`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
    },
    onError: (error) => {
      toast({
        title: "Send Failed",
        description: "Failed to send OAuth test invite",
        variant: "destructive",
      });
    },
  });

  const activeAccounts = accounts.filter((account: OAuthAccount) => account.isActive);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">OAuth Calendar Integration</h1>
        <p className="text-muted-foreground">
          Connect your Google accounts directly with OAuth 2.0 for immediate calendar access - no Domain-Wide Delegation required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              OAuth Accounts
            </CardTitle>
            <CardDescription>
              Manage your connected Google accounts for calendar automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => connectAccountMutation.mutate()}
              disabled={connectAccountMutation.isPending}
              className="w-full"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Connect New Google Account
            </Button>

            {accountsLoading && (
              <div className="text-center py-4 text-muted-foreground">
                Loading accounts...
              </div>
            )}

            {accounts.length === 0 && !accountsLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No OAuth accounts connected yet</p>
                <p className="text-sm">Connect a Google account to get started</p>
              </div>
            )}

            {accounts.map((account: OAuthAccount) => (
              <div
                key={account.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAccountId === account.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedAccountId(account.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{account.name}</h3>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    {account.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used: {new Date(account.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        testAccessMutation.mutate(account.id);
                      }}
                      disabled={testAccessMutation.isPending}
                    >
                      <TestTube2Icon className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Test Calendar Invite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendIcon className="h-5 w-5" />
              Send Test Invite
            </CardTitle>
            <CardDescription>
              Test OAuth calendar integration by sending a live invite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prospectEmail">Prospect Email</Label>
              <Input
                id="prospectEmail"
                type="email"
                placeholder="prospect@example.com"
                value={prospectEmail}
                onChange={(e) => setProspectEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input
                id="eventTitle"
                placeholder="Quick Meeting Request"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDescription">Event Description</Label>
              <Textarea
                id="eventDescription"
                placeholder="Meeting description..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            {selectedAccountId && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                  Selected Account
                </p>
                <p className="text-sm text-muted-foreground">
                  {accounts.find((a: OAuthAccount) => a.id === selectedAccountId)?.email}
                </p>
              </div>
            )}

            {!selectedAccountId && activeAccounts.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  <AlertCircleIcon className="h-4 w-4 inline mr-1" />
                  Select an account above to send invites
                </p>
              </div>
            )}

            <Button
              onClick={() => sendTestMutation.mutate()}
              disabled={
                sendTestMutation.isPending || 
                !selectedAccountId || 
                !prospectEmail || 
                !eventTitle
              }
              className="w-full"
            >
              <SendIcon className="h-4 w-4 mr-2" />
              {sendTestMutation.isPending ? "Sending..." : "Send Test Invite"}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>Meeting will be scheduled for 5 minutes from now (30-minute duration)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>OAuth Calendar Benefits</CardTitle>
          <CardDescription>
            Why OAuth 2.0 is the ideal solution for calendar automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                ✅ Immediate Setup
              </h3>
              <p className="text-sm text-muted-foreground">
                No Domain-Wide Delegation required. Connect accounts instantly with OAuth 2.0.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                ✅ Personal Control
              </h3>
              <p className="text-sm text-muted-foreground">
                Each user controls their own calendar access. Invites sent from personal calendars.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                ✅ Production Ready
              </h3>
              <p className="text-sm text-muted-foreground">
                Full calendar automation without administrative barriers or setup delays.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}