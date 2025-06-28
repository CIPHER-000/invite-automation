import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useRealtimeStats, useRealtimeQueue } from "@/hooks/use-realtime";
import { Skeleton } from "@/components/ui/skeleton";

export function SystemHealth() {
  const { data: stats, isLoading: statsLoading } = useRealtimeStats();
  const { data: queueStatus, isLoading: queueLoading } = useRealtimeQueue();

  if (statsLoading || queueLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dailyUsagePercentage = stats?.dailyLimit ? (stats.invitesToday / stats.dailyLimit) * 100 : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health & Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Daily Invite Limit</span>
              <span className="text-sm text-slate-600">
                {stats?.invitesToday || 0}/{stats?.dailyLimit || 0}
              </span>
            </div>
            <Progress value={dailyUsagePercentage} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">API Usage</span>
              <span className="text-sm text-slate-600">
                {stats?.apiUsage || 0}%
              </span>
            </div>
            <Progress value={stats?.apiUsage || 0} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Queue Status</span>
              <Badge variant="outline" className="text-xs">
                {queueStatus?.pending > 0 ? `${queueStatus.pending} pending` : "Idle"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600">
                {queueStatus?.processing > 0 
                  ? `Processing ${queueStatus.processing} items`
                  : "System active"
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
