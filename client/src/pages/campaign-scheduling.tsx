import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, ArrowLeft, CheckCircle, XCircle, Clock3, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Campaign, ScheduledInvite } from '@shared/schema';

interface CampaignSchedulingStats {
  totalScheduled: number;
  pendingInvites: number;
  acceptedInvites: number;
  declinedInvites: number;
  canceledInvites: number;
  doubleBookedSlots: number;
  averageLeadTime: number;
  upcomingInvites: number;
  conflictingSlots: number;
}

export default function CampaignScheduling() {
  const [, params] = useRoute('/campaigns/:id/scheduling');
  const campaignId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId,
  });

  // Fetch scheduled invites for this campaign
  const { data: scheduledInvites = [], isLoading: invitesLoading } = useQuery<ScheduledInvite[]>({
    queryKey: ['/api/scheduling/invites', campaignId],
    enabled: !!campaignId,
    refetchInterval: 30000,
  });

  // Fetch campaign scheduling stats
  const { data: stats } = useQuery<CampaignSchedulingStats>({
    queryKey: ['/api/scheduling/campaigns', campaignId, 'stats'],
    enabled: !!campaignId,
    refetchInterval: 30000,
  });

  // Reschedule invite mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ inviteId, newTime }: { inviteId: number; newTime: string }) => {
      const response = await apiRequest('POST', `/api/scheduling/invites/${inviteId}/reschedule`, { newTime });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling/invites', campaignId] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling/invites', campaignId] });
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
      case 'needs_attention': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock3 className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'declined': return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      case 'canceled': return <Badge className="bg-gray-100 text-gray-800">Canceled</Badge>;
      case 'needs_attention': return <Badge className="bg-orange-100 text-orange-800">Needs Attention</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupInvitesByDate = (invites: ScheduledInvite[]) => {
    const grouped: { [date: string]: ScheduledInvite[] } = {};
    invites.forEach(invite => {
      const date = new Date(invite.scheduledTimeUtc).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(invite);
    });
    return grouped;
  };

  const groupedInvites = groupInvitesByDate(scheduledInvites);

  if (campaignLoading || invitesLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <p className="text-muted-foreground">The campaign you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule Management</h2>
          <p className="text-muted-foreground">
            Campaign: {campaign.name}
          </p>
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
            <div className="text-2xl font-bold">{stats?.totalScheduled || 0}</div>
            <p className="text-xs text-muted-foreground">Meeting invites</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInvites || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.acceptedInvites || 0}</div>
            <p className="text-xs text-muted-foreground">Confirmed meetings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conflictingSlots || 0}</div>
            <p className="text-xs text-muted-foreground">Require manual review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Schedule Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Invites by Date</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedInvites).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled invites</h3>
                  <p className="text-gray-600">
                    This campaign doesn't have any scheduled invites yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedInvites)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, invites]) => (
                      <div key={date} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          <Badge variant="outline">{invites.length} invites</Badge>
                        </div>
                        <div className="space-y-3">
                          {invites
                            .sort((a, b) => new Date(a.scheduledTimeUtc).getTime() - new Date(b.scheduledTimeUtc).getTime())
                            .map((invite) => (
                              <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(invite.status)}
                                  <div>
                                    <h4 className="font-medium">{invite.recipientName || invite.recipientEmail}</h4>
                                    <p className="text-sm text-gray-600">
                                      {formatDateTime(invite.scheduledTimeUtc)} ({invite.recipientTimezone})
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(invite.status)}
                                  {invite.wasDoubleBooked && (
                                    <Badge variant="outline" className="text-orange-600">Double Booked</Badge>
                                  )}
                                  {invite.status === 'pending' && (
                                    <div className="flex space-x-1">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
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
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chronological Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                All scheduled invites in chronological order
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledInvites
                  .sort((a, b) => new Date(a.scheduledTimeUtc).getTime() - new Date(b.scheduledTimeUtc).getTime())
                  .map((invite, index) => (
                    <div key={invite.id} className="relative">
                      {index > 0 && <div className="absolute left-4 top-0 h-4 w-0.5 bg-gray-200"></div>}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{invite.recipientName || invite.recipientEmail}</h4>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(invite.scheduledTimeUtc)} ({invite.recipientTimezone})
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(invite.status)}
                              {invite.wasDoubleBooked && (
                                <Badge variant="outline" className="text-orange-600">Double Booked</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < scheduledInvites.length - 1 && (
                        <div className="absolute left-4 top-8 h-4 w-0.5 bg-gray-200"></div>
                      )}
                    </div>
                  ))}
                {scheduledInvites.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled invites</h3>
                    <p className="text-gray-600">
                      This campaign doesn't have any scheduled invites yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visual calendar representation of scheduled meetings
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
      </Tabs>
    </div>
  );
}