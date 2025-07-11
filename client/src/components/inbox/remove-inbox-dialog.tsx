import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Mail, Trash2 } from "lucide-react";
import type { GoogleAccount } from "@shared/schema";

interface RemoveInboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inbox: GoogleAccount | null;
}

interface ActiveCampaignInfo {
  id: number;
  name: string;
  status: string;
}

export function RemoveInboxDialog({ open, onOpenChange, inbox }: RemoveInboxDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaignInfo[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for active campaigns using this inbox
  const checkCampaignsMutation = useMutation({
    mutationFn: async () => {
      if (!inbox) return [];
      const response = await apiRequest(`/api/campaigns/using-inbox/${inbox.id}`, "GET");
      return response;
    },
    onSuccess: (campaigns) => {
      setActiveCampaigns(campaigns);
      setShowConfirmation(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to check campaigns using this inbox",
        variant: "destructive",
      });
    },
  });

  // Remove inbox mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!inbox) throw new Error("No inbox selected");
      await apiRequest(`/api/accounts/${inbox.id}/disconnect`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Inbox Removed",
        description: "The inbox has been successfully disconnected and removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      onOpenChange(false);
      setShowConfirmation(false);
      setActiveCampaigns([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove inbox. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveClick = () => {
    checkCampaignsMutation.mutate();
  };

  const handleConfirmRemoval = () => {
    removeMutation.mutate();
  };

  const handleCancel = () => {
    onOpenChange(false);
    setShowConfirmation(false);
    setActiveCampaigns([]);
  };

  if (!inbox) return null;

  return (
    <>
      {/* Initial dialog */}
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Remove Inbox
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this inbox from your account?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">{inbox.email}</div>
                <div className="text-sm text-gray-600">{inbox.name}</div>
              </div>
              <Badge variant={inbox.status === "active" ? "default" : "secondary"}>
                {inbox.status}
              </Badge>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    Warning: This action cannot be undone
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                    • All OAuth tokens will be revoked
                    • Scheduled sends will be cancelled
                    • The inbox will be removed from all campaigns
                    • No future emails can be sent from this account
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveClick}
              disabled={checkCampaignsMutation.isPending}
            >
              {checkCampaignsMutation.isPending ? "Checking..." : "Remove Inbox"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Inbox Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                You are about to remove <strong>{inbox.email}</strong> from your account.
              </div>
              
              {activeCampaigns.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                    ⚠️ Active campaigns will be affected:
                  </div>
                  <div className="space-y-1">
                    {activeCampaigns.map((campaign) => (
                      <div key={campaign.id} className="text-sm text-red-700 dark:text-red-300">
                        • {campaign.name} ({campaign.status})
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-2">
                    All scheduled sends from these campaigns using this inbox will be immediately cancelled.
                  </div>
                </div>
              )}

              <div className="text-sm">
                This will permanently:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Revoke all OAuth tokens and API access</li>
                  <li>Cancel all pending/scheduled sends from this inbox</li>
                  <li>Remove the inbox from all campaigns</li>
                  <li>Prevent any future use of this account for sending</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoval}
              disabled={removeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMutation.isPending ? "Removing..." : "Yes, Remove Inbox"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}