import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimeRangeSelector } from "@/components/ui/time-range-selector";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Search,
  RefreshCw,
  Send, 
  CheckCircle, 
  Mail, 
  AlertTriangle,
  Clock,
  Filter,
  Calendar,
  Activity as ActivityIcon
} from "lucide-react";

const activityIcons = {
  invite_sent: Send,
  invite_accepted: CheckCircle,
  invite_declined: AlertTriangle,
  invite_tentative: Clock,
  confirmation_sent: Mail,
  invite_error: AlertTriangle,
  campaign_processed: Clock,
  campaign_error: AlertTriangle,
  manual_test_sent: Send,
  manual_test_scheduled: Calendar,
  manual_test_error: AlertTriangle,
  queue_processed: Clock,
  queue_error: AlertTriangle,
  account_connected: CheckCircle,
  account_error: AlertTriangle,
};

const activityColors = {
  invite_sent: "text-success bg-success/10 border-success/20",
  invite_accepted: "text-green-600 bg-green-100 border-green-200",
  invite_declined: "text-red-600 bg-red-100 border-red-200",
  invite_tentative: "text-yellow-600 bg-yellow-100 border-yellow-200",
  confirmation_sent: "text-primary bg-primary/10 border-primary/20",
  invite_error: "text-destructive bg-destructive/10 border-destructive/20",
  campaign_processed: "text-slate-600 bg-slate-100 border-slate-200",
  campaign_error: "text-destructive bg-destructive/10 border-destructive/20",
  manual_test_sent: "text-success bg-success/10 border-success/20",
  manual_test_scheduled: "text-blue-600 bg-blue-100 border-blue-200",
  manual_test_error: "text-destructive bg-destructive/10 border-destructive/20",
  queue_processed: "text-slate-600 bg-slate-100 border-slate-200",
  queue_error: "text-destructive bg-destructive/10 border-destructive/20",
  account_connected: "text-success bg-success/10 border-success/20",
  account_error: "text-destructive bg-destructive/10 border-destructive/20",
};

const activityLabels = {
  invite_sent: "Invite Sent",
  invite_accepted: "Invite Accepted",
  invite_declined: "Invite Declined",
  invite_tentative: "Invite Tentative",
  confirmation_sent: "Confirmation Sent",
  invite_error: "Invite Error",
  campaign_processed: "Campaign Processed",
  campaign_error: "Campaign Error",
  manual_test_sent: "Manual Test Sent",
  manual_test_scheduled: "Manual Test Scheduled",
  manual_test_error: "Manual Test Error",
  queue_processed: "Queue Processed",
  queue_error: "Queue Error",
  account_connected: "Account Connected",
  account_error: "Account Error",
};

export default function Activity() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);
  const [timeRange, setTimeRange] = useState<number | null>(null);

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["/api/activity", { limit, timeRange }],
    queryFn: () => api.getActivity(limit, timeRange || undefined),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  const filteredActivities = activities?.filter((activity: any) => {
    const matchesSearch = activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         activity.eventType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.action?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || activity.eventType === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const getActivityStats = () => {
    if (!activities) return {};
    
    const stats = activities.reduce((acc: any, activity: any) => {
      acc[activity.eventType] = (acc[activity.eventType] || 0) + 1;
      return acc;
    }, {});

    return stats;
  };

  const stats = getActivityStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">Monitor all system activities and events</p>
        </div>
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          className="flex-shrink-0"
        />
      </div>

      <div className="space-y-6">
        {/* Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Send className="text-success" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Sent</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.invite_sent || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Accepted</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.invite_accepted || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Declined</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.invite_declined || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tentative</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.invite_tentative || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Confirmed</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.confirmation_sent || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Errors</p>
                  <p className="text-xl font-bold text-slate-800">
                    {(stats.invite_error || 0) + (stats.campaign_error || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-slate-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Processed</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats.campaign_processed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                  <ActivityIcon className="text-slate-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-xl font-bold text-slate-800">
                    {activities?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <Filter size={16} className="mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="invite_sent">Invites Sent</SelectItem>
                    <SelectItem value="invite_accepted">✅ Accepted</SelectItem>
                    <SelectItem value="invite_declined">❌ Declined</SelectItem>
                    <SelectItem value="invite_tentative">⏳ Tentative</SelectItem>
                    <SelectItem value="confirmation_sent">Confirmations</SelectItem>
                    <SelectItem value="invite_error">Invite Errors</SelectItem>
                    <SelectItem value="campaign_processed">Campaigns</SelectItem>
                    <SelectItem value="campaign_error">Campaign Errors</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                    <SelectItem value="200">200 items</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="outline">
                  {filteredActivities.length} results
                </Badge>
              </div>

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw 
                  className={`mr-2 ${isLoading ? "animate-spin" : ""}`} 
                  size={16} 
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-lg mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="space-y-3">
                {filteredActivities.map((activity: any) => {
                  const Icon = activityIcons[activity.eventType as keyof typeof activityIcons] || Clock;
                  const colorClass = activityColors[activity.eventType as keyof typeof activityColors] || "text-slate-600 bg-slate-100 border-slate-200";
                  const label = activityLabels[activity.eventType as keyof typeof activityLabels] || activity.eventType;
                  const campaign = campaigns?.find((c: any) => c.id === activity.campaignId);
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {label}
                          </Badge>
                          {campaign && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar size={10} className="mr-1" />
                              {campaign.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 mb-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                          <span>{format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                              View details
                            </summary>
                            <pre className="text-xs bg-slate-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">
                <ActivityIcon size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No activities found</h3>
                <p>
                  {searchQuery || typeFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "System activities will appear here as they occur"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
