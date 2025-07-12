import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Mail, MessageSquare, Settings, TrendingUp, ExternalLink, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Link } from "wouter";

interface EmailActivity {
  id: number;
  fromEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  matchingCriteria: string;
  relatedInviteId?: number;
  relatedCampaignId?: number;
}

interface MonitoringSettings {
  id: number;
  accountType: 'google' | 'outlook';
  accountId: number;
  isMonitoringEnabled: boolean;
  domainMatching: boolean;
  subjectMatching: boolean;
  syncStatus: 'active' | 'paused' | 'error';
  lastSync?: string;
}

export default function ResponseIntelligence() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [activityFilter, setActivityFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get recent email activity
  const { data: recentActivity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/response-intelligence/recent-activity'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get monitoring settings
  const { data: settings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/response-intelligence/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ settingId, updates }: { settingId: number; updates: any }) => {
      return apiRequest(`/api/response-intelligence/settings/${settingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Monitoring settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/response-intelligence/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getMatchingBadge = (criteria: string) => {
    const variants = {
      direct_reply: "default",
      domain_activity: "secondary",
      subject_match: "outline"
    } as const;
    
    return (
      <Badge variant={variants[criteria as keyof typeof variants] || "outline"}>
        {criteria?.replace('_', ' ') || 'unknown'}
      </Badge>
    );
  };

  const getSyncStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      paused: "secondary",
      error: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const handleToggleMonitoring = (settingId: number, enabled: boolean) => {
    updateSettingsMutation.mutate({
      settingId,
      updates: { isMonitoringEnabled: enabled }
    });
  };

  const handleToggleDomainMatching = (settingId: number, enabled: boolean) => {
    updateSettingsMutation.mutate({
      settingId,
      updates: { domainMatching: enabled }
    });
  };

  const handleToggleSubjectMatching = (settingId: number, enabled: boolean) => {
    updateSettingsMutation.mutate({
      settingId,
      updates: { subjectMatching: enabled }
    });
  };

  // Filter recent activity
  const filteredActivity = recentActivity.filter((activity: EmailActivity) => {
    if (activityFilter === "all") return true;
    return activity.matchingCriteria === activityFilter;
  });

  // Calculate stats
  const stats = {
    totalEmails: recentActivity.length,
    directReplies: recentActivity.filter((a: EmailActivity) => a.matchingCriteria === 'direct_reply').length,
    domainActivity: recentActivity.filter((a: EmailActivity) => a.matchingCriteria === 'domain_activity').length,
    activeMonitoring: settings.filter((s: MonitoringSettings) => s.isMonitoringEnabled).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Response Intelligence</h1>
          <p className="text-muted-foreground">
            Track and analyze all post-invite interactions and responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Auto-refresh: 30s
          </span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Email Activity</TabsTrigger>
          <TabsTrigger value="settings">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmails}</div>
                <p className="text-xs text-muted-foreground">Tracked this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Direct Replies</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.directReplies}</div>
                <p className="text-xs text-muted-foreground">From prospects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Domain Activity</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.domainActivity}</div>
                <p className="text-xs text-muted-foreground">Same domain emails</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Monitors</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMonitoring}</div>
                <p className="text-xs text-muted-foreground">Accounts monitored</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest email interactions from monitored accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="p-8 text-center">Loading activity...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent email activity</p>
                  <p className="text-sm">Set up monitoring to start tracking responses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity: EmailActivity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{activity.fromEmail}</span>
                          {getMatchingBadge(activity.matchingCriteria)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.receivedAt), 'PPp')}
                        </p>
                      </div>
                      {activity.relatedInviteId && (
                        <Link href={`/invites/${activity.relatedInviteId}/timeline`}>
                          <Button size="sm" variant="outline">
                            View Timeline
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                  {recentActivity.length > 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedTab("activity")}
                      >
                        View All Activity
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Activity</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="direct_reply">Direct Replies</SelectItem>
                  <SelectItem value="domain_activity">Domain Activity</SelectItem>
                  <SelectItem value="subject_match">Subject Matches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Match Type</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivity.map((activity: EmailActivity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {activity.fromEmail}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {activity.subject}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {activity.snippet}
                      </TableCell>
                      <TableCell>
                        {getMatchingBadge(activity.matchingCriteria)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(activity.receivedAt), 'PPp')}
                      </TableCell>
                      <TableCell>
                        {activity.relatedInviteId && (
                          <Link href={`/invites/${activity.relatedInviteId}/timeline`}>
                            <Button size="sm" variant="outline">
                              Timeline
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email activity found</p>
                  <p className="text-sm">Try adjusting the filter or check monitoring settings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-2xl font-semibold">Monitoring Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Monitoring
              </CardTitle>
              <CardDescription>
                Configure email monitoring for your connected accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="p-8 text-center">Loading settings...</div>
              ) : settings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No monitoring configured</p>
                  <p className="text-sm">Connect accounts to enable response intelligence</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {settings.map((setting: MonitoringSettings) => (
                    <div key={setting.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold capitalize">
                            {setting.accountType} Account #{setting.accountId}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getSyncStatusBadge(setting.syncStatus)}
                            {setting.lastSync && (
                              <span className="text-sm text-muted-foreground">
                                Last sync: {format(new Date(setting.lastSync), 'PPp')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={setting.isMonitoringEnabled}
                            onCheckedChange={(checked) => 
                              handleToggleMonitoring(setting.id, checked)
                            }
                          />
                          <Label>Enable Monitoring</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={setting.domainMatching}
                            onCheckedChange={(checked) => 
                              handleToggleDomainMatching(setting.id, checked)
                            }
                            disabled={!setting.isMonitoringEnabled}
                          />
                          <Label>Domain Matching</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={setting.subjectMatching}
                            onCheckedChange={(checked) => 
                              handleToggleSubjectMatching(setting.id, checked)
                            }
                            disabled={!setting.isMonitoringEnabled}
                          />
                          <Label>Subject Matching</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-semibold">Response Analytics</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Response Insights
              </CardTitle>
              <CardDescription>
                Analytics and insights from tracked email responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics coming soon</p>
                <p className="text-sm">Advanced analytics and insights will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}