import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Pause, 
  Play,
  RefreshCw,
  Mail,
  Calendar,
  BarChart3
} from "lucide-react";

interface InboxStatsProps {
  accountId: number;
  accountEmail: string;
}

export function InboxStats({ accountId, accountEmail }: InboxStatsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/inbox/stats/${accountId}`],
    queryFn: () => api.getInboxStatsById(accountId),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const pauseMutation = useMutation({
    mutationFn: (reason: string) => api.pauseInbox(accountId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/inbox/stats/${accountId}`] });
      toast({
        title: "Inbox paused",
        description: "The inbox has been temporarily paused.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to pause inbox.",
        variant: "destructive",
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.resumeInbox(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/inbox/stats/${accountId}`] });
      toast({
        title: "Inbox resumed",
        description: "The inbox is now active again.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resume inbox.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Loading stats...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthBadge = () => {
    if (stats.healthScore >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (stats.healthScore >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (stats.healthScore >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getAvailabilityBadge = () => {
    if (stats.isAvailable) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Available</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800"><AlertTriangle size={12} className="mr-1" />Unavailable</Badge>;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Activity size={16} />
            <span>Inbox Performance</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getAvailabilityBadge()}
            {getHealthBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.invitesToday}</div>
            <div className="text-xs text-slate-600 flex items-center justify-center space-x-1">
              <Mail size={12} />
              <span>Today</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.invitesThisWeek}</div>
            <div className="text-xs text-slate-600 flex items-center justify-center space-x-1">
              <Calendar size={12} />
              <span>This Week</span>
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Health Score</span>
            <span className="text-sm text-slate-600">{Math.round(stats.healthScore)}/100</span>
          </div>
          <Progress value={stats.healthScore} className="h-2" />
        </div>

        {/* Success Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-sm text-slate-600">{Math.round(stats.successRate)}%</span>
          </div>
          <Progress value={stats.successRate} className="h-2" />
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-center space-x-1">
            <AlertTriangle size={12} />
            <span>Errors: {stats.errorCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>
              {stats.lastUsed 
                ? `Used ${new Date(stats.lastUsed).toLocaleTimeString()}`
                : "Never used"
              }
            </span>
          </div>
        </div>

        {/* Cooldown Status */}
        {stats.cooldownUntil && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Clock size={14} />
              <span className="text-sm">
                Cooldown until {new Date(stats.cooldownUntil).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {stats.isAvailable ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => pauseMutation.mutate("Manual pause")}
              disabled={pauseMutation.isPending}
              className="flex-1"
            >
              <Pause size={14} className="mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="flex-1"
            >
              <Play size={14} className="mr-1" />
              Resume
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/inbox/stats/${accountId}`] })}
            className="px-3"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}