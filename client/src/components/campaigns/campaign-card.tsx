import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  CheckCircle, 
  Database, 
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CampaignWithStats } from "@shared/schema";

interface CampaignCardProps {
  campaign: CampaignWithStats;
  onEdit?: (campaign: CampaignWithStats) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number, currentStatus: string) => void;
}

export function CampaignCard({ 
  campaign, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: CampaignCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success";
      case "paused":
        return "bg-warning/10 text-warning";
      case "completed":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary";
      case "paused":
        return "bg-warning";
      case "completed":
        return "bg-success";
      default:
        return "bg-slate-300";
    }
  };

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">{campaign.name}</h4>
            <p className="text-slate-600 text-sm mt-1">{campaign.description}</p>
            <div className="flex items-center space-x-4 mt-3 text-sm">
              <span className="text-slate-600 flex items-center">
                <Send size={14} className="mr-1" />
                {campaign.invitesSent} sent
              </span>
              <span className="text-slate-600 flex items-center">
                <CheckCircle size={14} className="mr-1" />
                {campaign.accepted} accepted
              </span>
              <span className="text-slate-600 flex items-center">
                <Database size={14} className="mr-1" />
                {campaign.totalProspects} prospects
              </span>
              {(campaign.pendingInvites > 0 || campaign.processingInvites > 0) && (
                <span className="text-orange-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {campaign.pendingInvites + campaign.processingInvites} pending
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Badge>
            <div className="text-right">
              <div className="text-xs text-slate-500">Progress</div>
              <div className="text-sm font-medium text-slate-800">
                {campaign.progress}%
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(campaign)}>
                  <Edit size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleStatus?.(campaign.id, campaign.status)}
                >
                  {campaign.status === "active" ? (
                    <>
                      <Pause size={14} className="mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={14} className="mr-2" />
                      Resume
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(campaign.id)}
                  className="text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                  {(campaign.pendingInvites > 0 || campaign.processingInvites > 0) && (
                    <AlertTriangle size={12} className="ml-2 text-orange-500" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-3">
          <Progress 
            value={campaign.progress} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
