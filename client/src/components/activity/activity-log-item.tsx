import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Calendar, 
  User, 
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { ProviderIcon } from "@/components/inbox/provider-icon";
import type { ActivityLog } from "@shared/schema";

interface ActivityLogItemProps {
  log: ActivityLog;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'invite_sent':
      return Mail;
    case 'invite_accepted':
      return CheckCircle;
    case 'invite_declined':
      return XCircle;
    case 'invite_tentative':
      return Clock;
    case 'inbox_connected':
    case 'inbox_reconnected':
      return CheckCircle;
    case 'inbox_disconnected':
      return XCircle;
    case 'campaign_created':
    case 'campaign_updated':
      return Calendar;
    case 'user_login':
    case 'user_logout':
      return User;
    case 'system_error':
    case 'invite_error':
      return AlertTriangle;
    default:
      return Settings;
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'success':
      return {
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        iconColor: 'text-green-600'
      };
    case 'warning':
      return {
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        iconColor: 'text-yellow-600'
      };
    case 'error':
      return {
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        iconColor: 'text-red-600'
      };
    default:
      return {
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        iconColor: 'text-blue-600'
      };
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

export function ActivityLogItem({ log }: ActivityLogItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const Icon = getEventIcon(log.eventType);
  const severityConfig = getSeverityConfig(log.severity);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon and Timeline Line */}
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-full bg-white dark:bg-gray-800 border-2 ${severityConfig.iconColor} border-current`}>
              <Icon className={`h-4 w-4 ${severityConfig.iconColor}`} />
            </div>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mt-2"></div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{log.action}</h3>
                  <Badge className={severityConfig.className}>
                    {log.severity}
                  </Badge>
                  {log.inboxType && (
                    <div className="flex items-center gap-1">
                      <ProviderIcon provider={log.inboxType as 'google' | 'microsoft'} className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground capitalize">{log.inboxType}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {log.description}
                </p>
                
                {/* Key Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatTimestamp(log.createdAt)}</span>
                  
                  {log.recipientEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {log.recipientEmail}
                    </span>
                  )}
                  
                  {log.campaignId && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Campaign #{log.campaignId}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Expand Button */}
              {hasMetadata && (
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>

            {/* Expanded Details */}
            {hasMetadata && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Details</h4>
                    
                    {/* Error Message */}
                    {log.metadata?.errorMessage && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <p className="text-sm text-red-800 dark:text-red-300">
                          <strong>Error:</strong> {log.metadata.errorMessage}
                        </p>
                      </div>
                    )}
                    
                    {/* Meeting Link */}
                    {log.metadata?.meetingLink && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Meeting Link:</span>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-blue-600 hover:text-blue-700"
                          onClick={() => window.open(log.metadata?.meetingLink, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    )}
                    
                    {/* Time Slot */}
                    {log.metadata?.timeSlot && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Time Slot:</span>
                        <span className="text-sm text-muted-foreground">{log.metadata.timeSlot}</span>
                      </div>
                    )}
                    
                    {/* Campaign Name */}
                    {log.metadata?.campaignName && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Campaign:</span>
                        <span className="text-sm text-muted-foreground">{log.metadata.campaignName}</span>
                      </div>
                    )}
                    
                    {/* Inbox Email */}
                    {log.metadata?.inboxEmail && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Inbox:</span>
                        <span className="text-sm text-muted-foreground">{log.metadata.inboxEmail}</span>
                      </div>
                    )}
                    
                    {/* Before/After State Changes */}
                    {(log.metadata?.beforeState || log.metadata?.afterState) && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Changes:</span>
                        {log.metadata?.beforeState && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Before:</strong> {JSON.stringify(log.metadata.beforeState, null, 2)}
                          </div>
                        )}
                        {log.metadata?.afterState && (
                          <div className="text-xs text-muted-foreground">
                            <strong>After:</strong> {JSON.stringify(log.metadata.afterState, null, 2)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Raw Metadata (for debugging) */}
                    {Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Raw Data
                        </summary>
                        <pre className="text-xs text-muted-foreground mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}