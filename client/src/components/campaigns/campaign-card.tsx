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
  showActions?: boolean;
  isFullWidth?: boolean;
}

export function CampaignCard({ 
  campaign, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  showActions = true,
  isFullWidth = false
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

  if (isFullWidth) {
    return (
      <Card className="hover:border-slate-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-lg text-slate-800 mb-2">{campaign.name}</h4>
              <p className="text-slate-600 mb-4">{campaign.description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getStatusColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
              <div className="text-right">
                <div className="text-xs text-slate-500">Progress</div>
                <div className="text-lg font-medium text-slate-800">
                  {campaign.progress}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center text-slate-700">
                <Send size={16} className="mr-2 text-blue-500" />
                <span className="font-medium">{campaign.invitesSent}</span>
                <span className="text-slate-500 ml-1">sent</span>
              </div>
              <div className="flex items-center text-slate-700">
                <CheckCircle size={16} className="mr-2 text-green-500" />
                <span className="font-medium">{campaign.accepted}</span>
                <span className="text-slate-500 ml-1">accepted</span>
              </div>
              <div className="flex items-center text-slate-700">
                <Database size={16} className="mr-2 text-purple-500" />
                <span className="font-medium">{campaign.totalProspects}</span>
                <span className="text-slate-500 ml-1">prospects</span>
              </div>
              {(campaign.pendingInvites > 0 || campaign.processingInvites > 0) && (
                <div className="flex items-center text-orange-600">
                  <Clock size={16} className="mr-2" />
                  <span className="font-medium">{campaign.pendingInvites + campaign.processingInvites}</span>
                  <span className="ml-1">pending</span>
                </div>
              )}
            </div>
            
            {campaign.accepted > 0 && campaign.invitesSent > 0 && (
              <div className="text-right">
                <div className="text-xs text-slate-500">Acceptance Rate</div>
                <div className="text-sm font-medium text-green-600">
                  {Math.round((campaign.accepted / campaign.invitesSent) * 100)}%
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Campaign Progress</span>
              <span className="font-medium text-slate-800">{campaign.progress}%</span>
            </div>
            <Progress 
              value={campaign.progress} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {showActions && (
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
            )}
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
