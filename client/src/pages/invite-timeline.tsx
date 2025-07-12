import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Clock, Mail, Calendar, MessageSquare, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Link } from "wouter";

interface TimelineEvent {
  id: number;
  type: 'invite_sent' | 'rsvp_response' | 'email_received' | 'time_proposal' | 'domain_activity';
  source: 'gmail' | 'outlook' | 'calendar_api' | 'webhook';
  action?: string;
  summary: string;
  details?: any;
  recipientEmail?: string;
  senderEmail?: string;
  subject?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export default function InviteTimeline() {
  const [match, params] = useRoute("/invites/:inviteId/timeline");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const inviteId = params?.inviteId ? parseInt(params.inviteId) : null;

  // Get timeline data
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: [`/api/invites/${inviteId}/timeline`],
    enabled: !!inviteId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invite_sent': return <Calendar className="h-4 w-4" />;
      case 'rsvp_response': return <MessageSquare className="h-4 w-4" />;
      case 'email_received': return <Mail className="h-4 w-4" />;
      case 'time_proposal': return <Clock className="h-4 w-4" />;
      case 'domain_activity': return <ExternalLink className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invite_sent': return 'bg-blue-500';
      case 'rsvp_response': return 'bg-green-500';
      case 'email_received': return 'bg-purple-500';
      case 'time_proposal': return 'bg-yellow-500';
      case 'domain_activity': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      success: "default",
      info: "secondary",
      warning: "outline",
      error: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || "secondary"}>
        {severity}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      gmail: "bg-red-100 text-red-800",
      outlook: "bg-blue-100 text-blue-800",
      calendar_api: "bg-green-100 text-green-800",
      webhook: "bg-purple-100 text-purple-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {source.replace('_', ' ')}
      </span>
    );
  };

  // Filter timeline events
  const filteredTimeline = timeline.filter((event: TimelineEvent) => {
    if (filterType !== "all" && event.type !== filterType) return false;
    if (filterSeverity !== "all" && event.severity !== filterSeverity) return false;
    return true;
  });

  const formatEventDetails = (event: TimelineEvent) => {
    if (!event.details) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
        {event.subject && (
          <div className="mb-2">
            <strong>Subject:</strong> {event.subject}
          </div>
        )}
        {event.details.snippet && (
          <div className="mb-2">
            <strong>Preview:</strong> {event.details.snippet}
          </div>
        )}
        {event.details.eventId && (
          <div className="mb-2">
            <strong>Event ID:</strong> <code className="bg-gray-200 px-1 rounded">{event.details.eventId}</code>
          </div>
        )}
        {event.details.messageId && (
          <div className="mb-2">
            <strong>Message ID:</strong> <code className="bg-gray-200 px-1 rounded">{event.details.messageId}</code>
          </div>
        )}
        {event.details.matchType && (
          <div>
            <strong>Match Type:</strong> {event.details.matchType.replace('_', ' ')}
          </div>
        )}
      </div>
    );
  };

  if (!match || !inviteId) {
    return (
      <div className="p-8 text-center">
        <p>Invalid invite ID</p>
        <Link href="/campaigns">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8">Loading invite timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Invite Timeline</h1>
            <p className="text-muted-foreground">
              Complete activity history for invite #{inviteId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invite_sent">Invite Sent</SelectItem>
                <SelectItem value="rsvp_response">RSVP Response</SelectItem>
                <SelectItem value="email_received">Email Received</SelectItem>
                <SelectItem value="time_proposal">Time Proposal</SelectItem>
                <SelectItem value="domain_activity">Domain Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            All post-invite interactions and responses ({filteredTimeline.length} events)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No timeline events found</p>
              <p className="text-sm">Activity will appear here as interactions occur</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTimeline.map((event: TimelineEvent, index: number) => (
                <div key={event.id} className="relative">
                  {/* Timeline line */}
                  {index < filteredTimeline.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200" />
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getTypeColor(event.type)} flex items-center justify-center text-white`}>
                      {getTypeIcon(event.type)}
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {event.summary}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">
                                {format(new Date(event.timestamp), 'PPpp')}
                              </span>
                              {getSourceBadge(event.source)}
                              {getSeverityBadge(event.severity)}
                            </div>
                          </div>
                        </div>
                        
                        {event.action && (
                          <div className="mb-2">
                            <Badge variant="outline">{event.action}</Badge>
                          </div>
                        )}
                        
                        {(event.recipientEmail || event.senderEmail) && (
                          <div className="text-sm text-gray-600 mb-2">
                            {event.recipientEmail && (
                              <div><strong>To:</strong> {event.recipientEmail}</div>
                            )}
                            {event.senderEmail && (
                              <div><strong>From:</strong> {event.senderEmail}</div>
                            )}
                          </div>
                        )}
                        
                        {formatEventDetails(event)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}