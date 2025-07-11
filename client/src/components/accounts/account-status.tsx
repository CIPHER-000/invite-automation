import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Trash2, 
  Power,
  Clock,
  CheckCircle
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { AccountWithStatus } from "@shared/schema";

interface AccountStatusProps {
  account: AccountWithStatus;
}

export function AccountStatus({ account }: AccountStatusProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/accounts/${account.id}/disconnect`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account removed",
        description: "Google account has been safely disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove account.",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.toggleAccount(account.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: account.isActive ? "Account disabled" : "Account enabled",
        description: `${account.email} has been ${account.isActive ? "disabled" : "enabled"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle account status.",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = () => {
    if (!account.isActive) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Power size={10} className="mr-1" />
          Disabled
        </Badge>
      );
    }
    
    if (account.isInCooldown) {
      return (
        <Badge variant="outline" className="text-xs text-warning border-warning">
          <Clock size={10} className="mr-1" />
          Cooldown
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-xs text-success border-success">
        <CheckCircle size={10} className="mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            {getInitials(account.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-slate-800">{account.email}</p>
          <p className="text-xs text-slate-500">
            {account.isInCooldown && account.nextAvailable
              ? `Next available: ${account.nextAvailable}`
              : account.lastUsed
              ? `Last used: ${new Date(account.lastUsed).toLocaleTimeString()}`
              : "Never used"
            }
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {getStatusBadge()}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
            >
              <Power size={14} className="mr-2" />
              {account.isActive ? "Disable" : "Enable"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
