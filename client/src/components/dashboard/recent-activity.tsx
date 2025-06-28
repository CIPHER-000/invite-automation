import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  CheckCircle, 
  Mail, 
  AlertTriangle,
  Clock
} from "lucide-react";
import { useRealtimeActivity } from "@/hooks/use-realtime";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const activityIcons = {
  invite_sent: Send,
  invite_accepted: CheckCircle,
  confirmation_sent: Mail,
  invite_error: AlertTriangle,
  campaign_processed: Clock,
  campaign_error: AlertTriangle,
};

const activityColors = {
  invite_sent: "text-success bg-success/10",
  invite_accepted: "text-warning bg-warning/10",
  confirmation_sent: "text-primary bg-primary/10",
  invite_error: "text-destructive bg-destructive/10",
  campaign_processed: "text-slate-600 bg-slate-100",
  campaign_error: "text-destructive bg-destructive/10",
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRealtimeActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="w-8 h-8 rounded-full mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities?.map((activity: any) => {
          const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Clock;
          const colorClass = activityColors[activity.type as keyof typeof activityColors] || "text-slate-600 bg-slate-100";
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${colorClass}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{activity.message}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        
        {(!activities || activities.length === 0) && (
          <div className="text-center text-slate-500 py-8">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No activity yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
