import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Settings, Filter, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ScheduledInvite {
  id: number;
  campaignId: number;
  recipientEmail: string;
  recipientName?: string;
  scheduledTimeUtc: string;
  recipientTimezone: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  senderCalendarEventId?: string;
  wasDoubleBooked: boolean;
  createdAt: string;
  updatedAt: string;
  campaignName: string;
  senderEmail: string;
}

interface SchedulingSettings {
  enableDoubleBooking: boolean;
  minimumLeadTimeDays: number;
  maximumLeadTimeDays: number;
  preferredStartHour: number;
  preferredEndHour: number;
  fallbackPolicy: 'skip' | 'double_book';
}

interface SchedulingStats {
  totalScheduled: number;
  pendingInvites: number;
  acceptedInvites: number;
  declinedInvites: number;
  canceledInvites: number;
  doubleBookedSlots: number;
  needsAttention: number;
}

export default function SchedulingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("week");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduling data
  const { data: scheduledInvites = [], isLoading: invitesLoading } = useQuery<ScheduledInvite[]>({
    queryKey: ['/api/scheduling/invites', selectedCampaign, statusFilter, dateRange],
    refetchInterval: 30000,
  });

  const { data: schedulingStats } = useQuery<SchedulingStats>({
    queryKey: ['/api/scheduling/stats'],
    refetchInterval: 30000,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/campaigns'],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<SchedulingSettings>({
    queryKey: ['/api/scheduling/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SchedulingSettings>) => {
      const response = await apiRequest('PATCH', '/api/scheduling/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling/settings'] });
      toast({ title: "Settings Updated", description: "Scheduling settings have been saved successfully." });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Failed to update scheduling settings.", variant: "destructive" });
    },
  });

  // Reschedule invite mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ inviteId, newTime }: { inviteId: number; newTime: string }) => {
      const response = await apiRequest('POST', `/api/scheduling/invites/${inviteId}/reschedule`, { newTime });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling/invites'] });
      toast({ title: "Invite Rescheduled", description: "The invite has been rescheduled successfully." });
    },
    onError: () => {
      toast({ title: "Reschedule Failed", description: "Failed to reschedule the invite.", variant: "destructive" });
    },
  });

  // Cancel invite mutation
  const cancelMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const response = await apiRequest('POST', `/api/scheduling/invites/${inviteId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling/invites'] });
      toast({ title: "Invite Canceled", description: "The invite has been canceled successfully." });
    },
    onError: () => {
      toast({ title: "Cancel Failed", description: "Failed to cancel the invite.", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'canceled': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock3 className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'declined': return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      case 'canceled': return <Badge className="bg-gray-100 text-gray-800">Canceled</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const filteredInvites = scheduledInvites.filter(invite => {
    if (statusFilter !== 'all' && invite.status !== statusFilter) return false;
    if (selectedCampaign && invite.campaignId !== selectedCampaign) return false;
    
    const inviteDate = new Date(invite.scheduledTimeUtc);
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return inviteDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return inviteDate >= weekAgo && inviteDate <= weekAhead;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return inviteDate >= monthAgo && inviteDate <= monthAhead;
      default:
        return true;
    }
  });

  if (invitesLoading || settingsLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Scheduling Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scheduling Dashboard</h2>
          <p className="text-muted-foreground">
            Manage calendar invite scheduling and timing optimization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/scheduling'] })} 
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedulingStats?.totalScheduled || 0}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedulingStats?.pendingInvites || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedulingStats?.acceptedInvites || 0}</div>
            <p className="text-xs text-muted-foreground">Confirmed meetings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedulingStats?.needsAttention || 0}</div>
            <p className="text-xs text-muted-foreground">Manual action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Schedule Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Scheduled Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="campaign-filter">Campaign</Label>
                  <Select value={selectedCampaign?.toString() || "all"} onValueChange={(value) => setSelectedCampaign(value === "all" ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      {campaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedCampaign(null);
                      setStatusFilter("all");
                      setDateRange("week");
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Invites List */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Invites ({filteredInvites.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvites.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled invites</h3>
                  <p className="text-gray-600">
                    No invites match your current filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvites.map((invite) => (
                    <div key={invite.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(invite.status)}
                            <h4 className="font-medium">{invite.recipientName || invite.recipientEmail}</h4>
                            {getStatusBadge(invite.status)}
                            {invite.wasDoubleBooked && (
                              <Badge variant="outline" className="text-orange-600">Double Booked</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Campaign: {invite.campaignName}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            Scheduled: {new Date(invite.scheduledTimeUtc).toLocaleString()} ({invite.recipientTimezone})
                          </p>
                          <p className="text-sm text-gray-600">
                            From: {invite.senderEmail}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {invite.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // Open reschedule dialog
                                  const newTime = prompt("Enter new time (YYYY-MM-DD HH:MM):");
                                  if (newTime) {
                                    rescheduleMutation.mutate({ inviteId: invite.id, newTime });
                                  }
                                }}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => cancelMutation.mutate(invite.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visual calendar representation of scheduled invites
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View Coming Soon</h3>
                <p className="text-gray-600">
                  Interactive calendar view with drag-and-drop rescheduling will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Scheduling Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure system-wide scheduling behavior and constraints
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Lead Time Settings</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min-lead-time">Minimum Lead Time (business days)</Label>
                    <Input
                      id="min-lead-time"
                      type="number"
                      min="1"
                      max="10"
                      value={settings?.minimumLeadTimeDays || 2}
                      onChange={(e) => 
                        updateSettingsMutation.mutate({ 
                          minimumLeadTimeDays: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-lead-time">Maximum Lead Time (business days)</Label>
                    <Input
                      id="max-lead-time"
                      type="number"
                      min="3"
                      max="30"
                      value={settings?.maximumLeadTimeDays || 6}
                      onChange={(e) => 
                        updateSettingsMutation.mutate({ 
                          maximumLeadTimeDays: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Preferred Time Window</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start-hour">Start Hour (24-hour format)</Label>
                    <Input
                      id="start-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={settings?.preferredStartHour || 12}
                      onChange={(e) => 
                        updateSettingsMutation.mutate({ 
                          preferredStartHour: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end-hour">End Hour (24-hour format)</Label>
                    <Input
                      id="end-hour"
                      type="number"
                      min="0"
                      max="23"
                      value={settings?.preferredEndHour || 16}
                      onChange={(e) => 
                        updateSettingsMutation.mutate({ 
                          preferredEndHour: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Advanced Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="double-booking">Enable Double Booking</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow scheduling over unconfirmed slots when all other slots are exhausted
                      </p>
                    </div>
                    <Switch
                      id="double-booking"
                      checked={settings?.enableDoubleBooking || false}
                      onCheckedChange={(checked) => 
                        updateSettingsMutation.mutate({ enableDoubleBooking: checked })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fallback-policy">Fallback Policy</Label>
                    <Select 
                      value={settings?.fallbackPolicy || 'skip'} 
                      onValueChange={(value) => 
                        updateSettingsMutation.mutate({ 
                          fallbackPolicy: value as 'skip' | 'double_book' 
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip if no slots available</SelectItem>
                        <SelectItem value="double_book">Double book if enabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}