import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Download,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { ActivityLogItem } from "@/components/activity/activity-log-item";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ActivityLog } from "@shared/schema";

interface ActivityFilters {
  search: string;
  eventType: string;
  severity: string;
  inboxType: string;
  startDate?: Date;
  endDate?: Date;
  campaignId?: number;
  recipientEmail: string;
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'invite_sent', label: 'Invite Sent' },
  { value: 'invite_accepted', label: 'Invite Accepted' },
  { value: 'invite_declined', label: 'Invite Declined' },
  { value: 'invite_tentative', label: 'Invite Tentative' },
  { value: 'inbox_connected', label: 'Inbox Connected' },
  { value: 'inbox_disconnected', label: 'Inbox Disconnected' },
  { value: 'inbox_reconnected', label: 'Inbox Reconnected' },
  { value: 'campaign_created', label: 'Campaign Created' },
  { value: 'campaign_updated', label: 'Campaign Updated' },
  { value: 'campaign_deleted', label: 'Campaign Deleted' },
  { value: 'system_error', label: 'System Error' },
];

const SEVERITY_LEVELS = [
  { value: '', label: 'All Severities' },
  { value: 'success', label: 'Success' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

const INBOX_TYPES = [
  { value: '', label: 'All Providers' },
  { value: 'google', label: 'Google' },
  { value: 'microsoft', label: 'Microsoft' },
];

export default function ActivityLog() {
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    eventType: '',
    severity: '',
    inboxType: '',
    recipientEmail: '',
  });
  
  const [offset, setOffset] = useState(0);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const { toast } = useToast();

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', '20');
    params.set('offset', offset.toString());
    
    if (filters.search) params.set('search', filters.search);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.inboxType) params.set('inboxType', filters.inboxType);
    if (filters.recipientEmail) params.set('recipientEmail', filters.recipientEmail);
    if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
    
    return params.toString();
  }, [filters, offset]);

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/activity", queryParams],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: false,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
    setAllLogs([]);
  }, [filters]);

  // Accumulate logs for infinite scroll
  useEffect(() => {
    if (offset === 0) {
      setAllLogs(logs);
    } else {
      setAllLogs(prev => [...prev, ...logs]);
    }
  }, [logs, offset]);

  const loadMore = () => {
    setOffset(prev => prev + 20);
  };

  const updateFilter = (key: keyof ActivityFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      eventType: '',
      severity: '',
      inboxType: '',
      recipientEmail: '',
    });
  };

  const exportLogs = async () => {
    try {
      // Build export URL with current filters
      const exportParams = new URLSearchParams();
      exportParams.set('limit', '10000'); // Export more records
      exportParams.set('offset', '0');
      
      if (filters.search) exportParams.set('search', filters.search);
      if (filters.eventType) exportParams.set('eventType', filters.eventType);
      if (filters.severity) exportParams.set('severity', filters.severity);
      if (filters.inboxType) exportParams.set('inboxType', filters.inboxType);
      if (filters.recipientEmail) exportParams.set('recipientEmail', filters.recipientEmail);
      if (filters.startDate) exportParams.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) exportParams.set('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/activity?${exportParams.toString()}`);
      const exportData = await response.json();
      
      // Convert to CSV
      const csvContent = [
        ['Timestamp', 'Event Type', 'Action', 'Description', 'Severity', 'Recipient', 'Campaign ID', 'Inbox Type'].join(','),
        ...exportData.logs.map((log: ActivityLog) => [
          new Date(log.createdAt).toISOString(),
          log.eventType,
          log.action,
          `"${log.description.replace(/"/g, '""')}"`,
          log.severity,
          log.recipientEmail || '',
          log.campaignId || '',
          log.inboxType || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: `Exported ${exportData.logs.length} activity log entries`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export activity logs",
        variant: "destructive",
      });
    }
  };

  const getFilteredCounts = () => {
    const success = allLogs.filter(log => log.severity === 'success').length;
    const warnings = allLogs.filter(log => log.severity === 'warning').length;
    const errors = allLogs.filter(log => log.severity === 'error').length;
    const invites = allLogs.filter(log => log.eventType.startsWith('invite_')).length;
    
    return { success, warnings, errors, invites };
  };

  const counts = getFilteredCounts();

  // Handle authentication error
  if (error && error.message?.includes('401')) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground text-center">
              Please log in to view the activity log.
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="mt-4"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && allLogs.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
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
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
          <p className="text-muted-foreground">
            Track all system events, invites, and account activities in real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={exportLogs}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {allLogs.length} currently loaded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invites</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.invites}</div>
            <p className="text-xs text-muted-foreground">
              Invite-related events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{counts.warnings}</div>
            <p className="text-xs text-muted-foreground">
              Issues requiring attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.errors}</div>
            <p className="text-xs text-muted-foreground">
              Critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search descriptions, actions, or recipients..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Filter Controls */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select value={filters.eventType} onValueChange={(value) => updateFilter('eventType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.severity} onValueChange={(value) => updateFilter('severity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.inboxType} onValueChange={(value) => updateFilter('inboxType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {INBOX_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Recipient email..."
              value={filters.recipientEmail}
              onChange={(e) => updateFilter('recipientEmail', e.target.value)}
            />
          </div>
          
          {/* Date Range */}
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => updateFilter('startDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => updateFilter('endDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
          
          {/* Active Filters Display */}
          {(filters.search || filters.eventType || filters.severity || filters.inboxType || filters.recipientEmail || filters.startDate || filters.endDate) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Active filters:</span>
              {filters.search && (
                <Badge variant="secondary">Search: {filters.search}</Badge>
              )}
              {filters.eventType && (
                <Badge variant="secondary">
                  Event: {EVENT_TYPES.find(t => t.value === filters.eventType)?.label}
                </Badge>
              )}
              {filters.severity && (
                <Badge variant="secondary">
                  Severity: {SEVERITY_LEVELS.find(s => s.value === filters.severity)?.label}
                </Badge>
              )}
              {filters.inboxType && (
                <Badge variant="secondary">
                  Provider: {INBOX_TYPES.find(t => t.value === filters.inboxType)?.label}
                </Badge>
              )}
              {filters.recipientEmail && (
                <Badge variant="secondary">Recipient: {filters.recipientEmail}</Badge>
              )}
              {filters.startDate && (
                <Badge variant="secondary">From: {format(filters.startDate, "MMM d")}</Badge>
              )}
              {filters.endDate && (
                <Badge variant="secondary">To: {format(filters.endDate, "MMM d")}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {allLogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activity found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {Object.values(filters).some(f => f) 
                  ? "No events match your current filters. Try adjusting your search criteria."
                  : "No activity logs have been recorded yet. Activity will appear here as you use the system."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {allLogs.map((log) => (
              <ActivityLogItem key={log.id} log={log} />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
            
            {/* Footer Info */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              Showing {allLogs.length} of {total.toLocaleString()} events
              {isLoading && <span className="ml-2">• Refreshing...</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}