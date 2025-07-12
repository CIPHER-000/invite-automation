import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { StatusBadge, type ConnectionStatus } from "./status-badge";
import { ProviderIcon } from "./provider-icon";
import { MoreVertical, TestTube, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface InboxAccount {
  id: number;
  email: string;
  name: string;
  provider: 'google' | 'microsoft';
  status: 'active' | 'disconnected' | 'error';
  lastConnectionCheck?: string;
  connectionError?: string;
  lastUsed?: string;
  createdAt: string;
  isActive: boolean;
}

interface InboxCardProps {
  account: InboxAccount;
  onReconnect?: (accountId: number, provider: string) => void;
}

export function InboxCard({ account, onReconnect }: InboxCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectionStatus: ConnectionStatus = {
    status: testingConnection ? 'checking' : account.status,
    lastCheck: account.lastConnectionCheck,
    error: account.connectionError
  };

  const deleteAccountMutation = useMutation({
    mutationFn: () => {
      if (account.provider === 'microsoft') {
        return api.deleteMicrosoftAccount(account.id);
      }
      return api.deleteAccount(account.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account Deleted",
        description: `${account.email} has been removed from the platform.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await api.testConnection(account.id, account.provider);
      
      if (result.isHealthy) {
        toast({
          title: "Connection Healthy",
          description: `${account.email} is working properly.`,
        });
      } else {
        toast({
          title: "Connection Issues",
          description: result.error || "Connection test failed",
          variant: "destructive",
        });
      }
      
      // Refresh account data
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleReconnect = async () => {
    try {
      const response = await api.reconnectAccount(account.id, account.provider);
      if (response.authUrl) {
        window.open(response.authUrl, '_blank');
        toast({
          title: "Reconnection Started",
          description: "Complete the authorization in the new window.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Reconnection Failed",
        description: error.message || "Failed to start reconnection",
        variant: "destructive",
      });
    }
  };

  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return "Never";
    const date = new Date(lastUsed);
    return date.toLocaleDateString();
  };

  const formatLastCheck = (lastCheck?: string) => {
    if (!lastCheck) return "Not checked";
    const date = new Date(lastCheck);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ProviderIcon provider={account.provider} className="h-5 w-5" />
              <div>
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{account.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusBadge status={connectionStatus} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={testConnection} disabled={testingConnection}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </DropdownMenuItem>
                  
                  {account.status !== 'active' && (
                    <DropdownMenuItem onClick={handleReconnect}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={() => window.open(
                      account.provider === 'google' 
                        ? 'https://calendar.google.com' 
                        : 'https://outlook.live.com/calendar',
                      '_blank'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Calendar
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last Used:</span>
              <p className="font-medium">{formatLastUsed(account.lastUsed)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Check:</span>
              <p className="font-medium">{formatLastCheck(account.lastConnectionCheck)}</p>
            </div>
          </div>
          
          {account.connectionError && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Error:</strong> {account.connectionError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {account.email}? This will:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Remove the account from all campaigns</li>
                <li>Cancel all pending invites from this account</li>
                <li>Revoke calendar access permissions</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}