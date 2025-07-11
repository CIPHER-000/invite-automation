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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simple direct delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!inbox) throw new Error("No inbox selected");
      await apiRequest("DELETE", `/api/accounts/${inbox.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Inbox Deleted",
        description: "The inbox has been removed from the platform.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete inbox. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!inbox) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Inbox
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this inbox? This will deactivate it and remove it from the platform.
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
                  This will deactivate the inbox
                </div>
                <div className="text-yellow-700 dark:text-yellow-300 mt-1">
                  • The inbox will be removed from campaigns
                  • Scheduled sends will be cancelled
                  • The inbox will disappear from the platform
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
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Inbox"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}