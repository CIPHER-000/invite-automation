import { Card, CardContent } from "@/components/ui/card";
import { 
  Megaphone, 
  Send, 
  CheckCircle, 
  Users,
  TrendingUp,
  ArrowUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsGridProps {
  timeRange?: number | null;
}

export function StatsGrid({ timeRange }: StatsGridProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", timeRange],
    queryFn: () => api.getDashboardStats(timeRange || undefined),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active Campaigns</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats?.activeCampaigns || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Megaphone className="text-primary" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-success flex items-center">
              <ArrowUp size={12} className="mr-1" />
              12%
            </span>
            <span className="text-slate-600 ml-1">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Invites Sent Today</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats?.invitesToday || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Send className="text-success" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-600">Daily limit: </span>
            <span className="text-slate-800 font-medium ml-1">
              {stats?.dailyLimit || 0}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Accepted Invites</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats?.acceptedInvites || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-warning" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-warning">
              {stats?.acceptanceRate?.toFixed(1) || 0}%
            </span>
            <span className="text-slate-600 ml-1">acceptance rate</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Connected Accounts</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats?.connectedAccounts || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Users className="text-success" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-success flex items-center">
              <CheckCircle size={12} className="mr-1" />
              All active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
