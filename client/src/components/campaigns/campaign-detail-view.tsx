import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  Mail,
  Settings,
  Users,
  Edit,
  Save,
  X,
  Eye,
  MessageSquare,
  MapPin,
  Target,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import type { CampaignWithStats, GoogleAccount } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { InboxSearch, filterInboxes } from "@/components/inbox/inbox-search";

interface CampaignDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignWithStats | null;
}

interface EditingSection {
  basic: boolean;
  scheduling: boolean;
  messaging: boolean;
  inboxes: boolean;
}

export function CampaignDetailView({ open, onOpenChange, campaign }: CampaignDetailViewProps) {
  const [editing, setEditing] = useState<EditingSection>({
    basic: false,
    scheduling: false,
    messaging: false,
    inboxes: false,
  });
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    subjectLine: "",
    eventTitleTemplate: "",
    eventDescriptionTemplate: "",
    confirmationEmailTemplate: "",
    senderName: "",
    timeZone: "",
    eventDuration: 30,
    selectedInboxes: [] as number[],
    maxInvitesPerInbox: 20,
    maxDailyCampaignInvites: 100,
    schedulingMode: "immediate" as "immediate" | "advanced",
    dateRangeStart: "",
    dateRangeEnd: "",
    selectedDaysOfWeek: [] as number[],
    timeWindowStart: "",
    timeWindowEnd: "",
    schedulingTimezone: "",
  });
  
  const [inboxSearchTerm, setInboxSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Google accounts for inbox selection
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      return response.json();
    },
  });

  // Fetch campaign invites for stats
  const { data: invites = [] } = useQuery({
    queryKey: ["/api/invites", campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const response = await fetch(`/api/invites?campaignId=${campaign.id}`);
      return response.json();
    },
    enabled: !!campaign?.id,
  });

  // Fetch detailed campaign analytics
  const { data: inboxStats = [], refetch: refetchInboxStats } = useQuery({
    queryKey: ["/api/campaigns", campaign?.id, "inbox-stats"],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const response = await fetch(`/api/campaigns/${campaign.id}/inbox-stats`);
      return response.json();
    },
    enabled: !!campaign?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: detailedStats, refetch: refetchDetailedStats } = useQuery({
    queryKey: ["/api/campaigns", campaign?.id, "detailed-stats"],
    queryFn: async () => {
      if (!campaign?.id) return null;
      const response = await fetch(`/api/campaigns/${campaign.id}/detailed-stats`);
      return response.json();
    },
    enabled: !!campaign?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<typeof formData>) => {
      if (!campaign) throw new Error("No campaign selected");
      await apiRequest("PUT", `/api/campaigns/${campaign.id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Campaign Updated",
        description: "Your changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setEditing({ basic: false, scheduling: false, messaging: false, inboxes: false });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when campaign changes
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || "",
        description: campaign.description || "",
        status: campaign.status || "active",
        subjectLine: campaign.subjectLine || "",
        eventTitleTemplate: campaign.eventTitleTemplate || "",
        eventDescriptionTemplate: campaign.eventDescriptionTemplate || "",
        confirmationEmailTemplate: campaign.confirmationEmailTemplate || "",
        senderName: campaign.senderName || "",
        timeZone: campaign.timeZone || "UTC",
        eventDuration: campaign.eventDuration || 30,
        selectedInboxes: campaign.selectedInboxes || [],
        maxInvitesPerInbox: campaign.maxInvitesPerInbox || 20,
        maxDailyCampaignInvites: campaign.maxDailyCampaignInvites || 100,
        schedulingMode: campaign.schedulingMode || "immediate",
        dateRangeStart: campaign.dateRangeStart || "",
        dateRangeEnd: campaign.dateRangeEnd || "",
        selectedDaysOfWeek: campaign.selectedDaysOfWeek || [],
        timeWindowStart: campaign.timeWindowStart || "",
        timeWindowEnd: campaign.timeWindowEnd || "",
        schedulingTimezone: campaign.schedulingTimezone || "",
      });
    }
  }, [campaign]);

  const handleSave = (section: keyof EditingSection) => {
    updateMutation.mutate(formData);
  };

  const handleCancel = (section: keyof EditingSection) => {
    // Reset form data to original campaign values
    if (campaign) {
      setFormData({
        name: campaign.name || "",
        description: campaign.description || "",
        status: campaign.status || "active",
        subjectLine: campaign.subjectLine || "",
        eventTitleTemplate: campaign.eventTitleTemplate || "",
        eventDescriptionTemplate: campaign.eventDescriptionTemplate || "",
        confirmationEmailTemplate: campaign.confirmationEmailTemplate || "",
        senderName: campaign.senderName || "",
        timeZone: campaign.timeZone || "UTC",
        eventDuration: campaign.eventDuration || 30,
        selectedInboxes: campaign.selectedInboxes || [],
        maxInvitesPerInbox: campaign.maxInvitesPerInbox || 20,
        maxDailyCampaignInvites: campaign.maxDailyCampaignInvites || 100,
        schedulingMode: campaign.schedulingMode || "immediate",
        dateRangeStart: campaign.dateRangeStart || "",
        dateRangeEnd: campaign.dateRangeEnd || "",
        selectedDaysOfWeek: campaign.selectedDaysOfWeek || [],
        timeWindowStart: campaign.timeWindowStart || "",
        timeWindowEnd: campaign.timeWindowEnd || "",
        schedulingTimezone: campaign.schedulingTimezone || "",
      });
    }
    setEditing(prev => ({ ...prev, [section]: false }));
  };

  const getDayName = (dayIndex: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  if (!campaign) return null;

  // Format daily progress data for charts
  const dailyProgressData = detailedStats?.dailyProgress?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: day.sent,
    accepted: day.accepted,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Campaign Details: {campaign.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analytics & Stats</TabsTrigger>
            <TabsTrigger value="inboxes">Inbox Management</TabsTrigger>
            <TabsTrigger value="invites">Invites & Errors</TabsTrigger>
            <TabsTrigger value="overview">Campaign Settings</TabsTrigger>
            <TabsTrigger value="messaging">Templates & Messaging</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Campaign details and status</CardDescription>
                </div>
                {!editing.basic ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditing(prev => ({ ...prev, basic: true }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancel("basic")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSave("basic")}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    {editing.basic ? (
                      <Input
                        id="campaign-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{campaign.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Status</Label>
                    {editing.basic ? (
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="campaign-description">Description</Label>
                  {editing.basic ? (
                    <Textarea
                      id="campaign-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-sm">{campaign.description || "No description"}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm mt-1">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm mt-1">{new Date(campaign.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Total Prospects</Label>
                    <p className="text-sm mt-1">{campaign.totalProspects || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connected Inboxes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Connected Inboxes
                  </CardTitle>
                  <CardDescription>Email accounts used for sending invites</CardDescription>
                </div>
                {!editing.inboxes ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditing(prev => ({ ...prev, inboxes: true }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancel("inboxes")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSave("inboxes")}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editing.inboxes ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Select Inboxes</Label>
                      <InboxSearch
                        value={inboxSearchTerm}
                        onChange={setInboxSearchTerm}
                        placeholder="Search inboxes by email or name..."
                        className="mt-2 mb-2"
                      />
                      <div className="mt-2 space-y-2">
                        {filterInboxes(accounts, inboxSearchTerm).map((account: GoogleAccount) => (
                          <div key={account.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`inbox-${account.id}`}
                              checked={formData.selectedInboxes.includes(account.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedInboxes: [...prev.selectedInboxes, account.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedInboxes: prev.selectedInboxes.filter(id => id !== account.id)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`inbox-${account.id}`} className="text-sm">
                              {account.email} ({account.name})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-invites-per-inbox">Max Invites Per Inbox/Day</Label>
                        <Input
                          id="max-invites-per-inbox"
                          type="number"
                          min="1"
                          max="50"
                          value={formData.maxInvitesPerInbox}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            maxInvitesPerInbox: parseInt(e.target.value) 
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-daily-campaign">Max Daily Campaign Invites</Label>
                        <Input
                          id="max-daily-campaign"
                          type="number"
                          min="1"
                          max="500"
                          value={formData.maxDailyCampaignInvites}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            maxDailyCampaignInvites: parseInt(e.target.value) 
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {campaign.selectedInboxes?.map((inboxId) => {
                        const account = accounts.find((acc: GoogleAccount) => acc.id === inboxId);
                        return account ? (
                          <Badge key={inboxId} variant="outline">
                            {account.email}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Max per inbox/day:</span> {campaign.maxInvitesPerInbox || 20}
                      </div>
                      <div>
                        <span className="font-medium">Max daily total:</span> {campaign.maxDailyCampaignInvites || 100}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messaging Tab */}
          <TabsContent value="messaging" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Templates
                  </CardTitle>
                  <CardDescription>Email content and subject lines</CardDescription>
                </div>
                {!editing.messaging ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditing(prev => ({ ...prev, messaging: true }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancel("messaging")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSave("messaging")}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject-line">Subject Line</Label>
                    {editing.messaging ? (
                      <Input
                        id="subject-line"
                        value={formData.subjectLine}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjectLine: e.target.value }))}
                        className="mt-1"
                        placeholder="Meeting with {{name}}"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{campaign.subjectLine || "Default subject line"}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="sender-name">Sender Name</Label>
                    {editing.messaging ? (
                      <Input
                        id="sender-name"
                        value={formData.senderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                        className="mt-1"
                        placeholder="Your Name"
                      />
                    ) : (
                      <p className="mt-1 text-sm">{campaign.senderName || "Not set"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-title">Event Title Template</Label>
                  {editing.messaging ? (
                    <Input
                      id="event-title"
                      value={formData.eventTitleTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventTitleTemplate: e.target.value }))}
                      className="mt-1"
                      placeholder="Meeting with {{name}}"
                    />
                  ) : (
                    <p className="mt-1 text-sm">{campaign.eventTitleTemplate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="event-description">Event Description Template</Label>
                  {editing.messaging ? (
                    <Textarea
                      id="event-description"
                      value={formData.eventDescriptionTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDescriptionTemplate: e.target.value }))}
                      className="mt-1"
                      rows={4}
                      placeholder="Hi {{name}}, looking forward to our meeting..."
                    />
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{campaign.eventDescriptionTemplate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmation-email">Confirmation Email Template</Label>
                  {editing.messaging ? (
                    <Textarea
                      id="confirmation-email"
                      value={formData.confirmationEmailTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmationEmailTemplate: e.target.value }))}
                      className="mt-1"
                      rows={3}
                      placeholder="Thanks for accepting our meeting invitation!"
                    />
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{campaign.confirmationEmailTemplate}</p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Available Variables:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><code>{"{{name}}"}</code> - Recipient's name</p>
                    <p><code>{"{{company}}"}</code> - Recipient's company</p>
                    <p><code>{"{{email}}"}</code> - Recipient's email</p>
                    <p><code>{"{{sender_name}}"}</code> - Sender's name</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Scheduling Configuration
                  </CardTitle>
                  <CardDescription>When and how invites are sent</CardDescription>
                </div>
                {!editing.scheduling ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditing(prev => ({ ...prev, scheduling: true }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancel("scheduling")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSave("scheduling")}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Scheduling Mode</Label>
                    {editing.scheduling ? (
                      <Select 
                        value={formData.schedulingMode} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, schedulingMode: value as "immediate" | "advanced" }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm capitalize">{campaign.schedulingMode}</p>
                    )}
                  </div>

                  <div>
                    <Label>Timezone</Label>
                    {editing.scheduling ? (
                      <Select 
                        value={formData.timeZone} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timeZone: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm">{campaign.timeZone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-duration">Event Duration (minutes)</Label>
                  {editing.scheduling ? (
                    <Input
                      id="event-duration"
                      type="number"
                      min="15"
                      max="240"
                      value={formData.eventDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDuration: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm">{campaign.eventDuration} minutes</p>
                  )}
                </div>

                {campaign.schedulingMode === "advanced" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium">Advanced Scheduling Settings</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date-start">Date Range Start</Label>
                          {editing.scheduling ? (
                            <Input
                              id="date-start"
                              type="date"
                              value={formData.dateRangeStart}
                              onChange={(e) => setFormData(prev => ({ ...prev, dateRangeStart: e.target.value }))}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-sm">{formatDate(campaign.dateRangeStart || "")}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="date-end">Date Range End</Label>
                          {editing.scheduling ? (
                            <Input
                              id="date-end"
                              type="date"
                              value={formData.dateRangeEnd}
                              onChange={(e) => setFormData(prev => ({ ...prev, dateRangeEnd: e.target.value }))}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-sm">{formatDate(campaign.dateRangeEnd || "")}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Days of Week</Label>
                        {editing.scheduling ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                              <div key={day} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`day-${day}`}
                                  checked={formData.selectedDaysOfWeek.includes(day)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        selectedDaysOfWeek: [...prev.selectedDaysOfWeek, day]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        selectedDaysOfWeek: prev.selectedDaysOfWeek.filter(d => d !== day)
                                      }));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor={`day-${day}`} className="text-sm">
                                  {getDayName(day)}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {campaign.selectedDaysOfWeek?.map((day) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {getDayName(day)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="time-start">Time Window Start</Label>
                          {editing.scheduling ? (
                            <Input
                              id="time-start"
                              type="time"
                              value={formData.timeWindowStart}
                              onChange={(e) => setFormData(prev => ({ ...prev, timeWindowStart: e.target.value }))}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-sm">{campaign.timeWindowStart || "Not set"}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="time-end">Time Window End</Label>
                          {editing.scheduling ? (
                            <Input
                              id="time-end"
                              type="time"
                              value={formData.timeWindowEnd}
                              onChange={(e) => setFormData(prev => ({ ...prev, timeWindowEnd: e.target.value }))}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-sm">{campaign.timeWindowEnd || "Not set"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Main Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{detailedStats?.totalProspects || 0}</div>
                  <p className="text-xs text-muted-foreground">in campaign</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invites Sent</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{detailedStats?.invitesSent || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {detailedStats?.totalProspects ? 
                      Math.round((detailedStats.invitesSent / detailedStats.totalProspects) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{detailedStats?.accepted || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {detailedStats?.invitesSent ? 
                      Math.round((detailedStats.accepted / detailedStats.invitesSent) * 100) : 0}% acceptance rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{detailedStats?.pending || 0}</div>
                  <p className="text-xs text-muted-foreground">awaiting response</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Errors</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{detailedStats?.errors || 0}</div>
                  <p className="text-xs text-muted-foreground">failed invites</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Daily Progress (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {dailyProgressData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyProgressData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="sent" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Sent"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="accepted" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Accepted"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Inbox Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Inbox Usage Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {detailedStats?.inboxUsage?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={detailedStats.inboxUsage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="email" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [value, name === "usage" ? "Used" : "Limit"]} />
                          <Bar dataKey="usage" fill="#3b82f6" name="Used" />
                          <Bar dataKey="limit" fill="#e5e7eb" name="Limit" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No inbox data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RSVP Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  RSVP Response Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">Accepted</span>
                      <span className="text-sm font-bold">{detailedStats?.accepted || 0}</span>
                    </div>
                    <Progress 
                      value={detailedStats?.invitesSent ? (detailedStats.accepted / detailedStats.invitesSent) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-600">Declined</span>
                      <span className="text-sm font-bold">{detailedStats?.declined || 0}</span>
                    </div>
                    <Progress 
                      value={detailedStats?.invitesSent ? (detailedStats.declined / detailedStats.invitesSent) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-600">Tentative</span>
                      <span className="text-sm font-bold">{detailedStats?.tentative || 0}</span>
                    </div>
                    <Progress 
                      value={detailedStats?.invitesSent ? (detailedStats.tentative / detailedStats.invitesSent) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">Pending</span>
                      <span className="text-sm font-bold">{detailedStats?.pending || 0}</span>
                    </div>
                    <Progress 
                      value={detailedStats?.invitesSent ? (detailedStats.pending / detailedStats.invitesSent) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Inbox Management Tab */}
          <TabsContent value="inboxes" className="space-y-6">
            {/* Campaign Inbox Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Campaign Inbox Management
                  </CardTitle>
                  <CardDescription>
                    Manage inbox assignments and limits for this campaign
                  </CardDescription>
                </div>
                {!editing.inboxes ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditing(prev => ({ ...prev, inboxes: true }))}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Inboxes
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancel("inboxes")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSave("inboxes")}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Campaign Limits Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Total Inboxes</div>
                      <div className="text-2xl font-bold">{campaign.selectedInboxes?.length || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Max Per Inbox</div>
                      <div className="text-2xl font-bold">{campaign.maxInvitesPerInbox || 20}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Daily Campaign Limit</div>
                      <div className="text-2xl font-bold">{campaign.maxDailyCampaignInvites || 100}</div>
                    </div>
                  </div>

                  {/* Rate Limiting Controls */}
                  {editing.inboxes && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Rate Limiting Controls</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max-per-inbox">Max Invites Per Inbox (1-20)</Label>
                          <Input
                            id="max-per-inbox"
                            type="number"
                            min="1"
                            max="20"
                            value={formData.maxInvitesPerInbox}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              maxInvitesPerInbox: Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                            }))}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum invites each inbox can send per day
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="max-daily-campaign">Max Daily Campaign Invites</Label>
                          <Input
                            id="max-daily-campaign"
                            type="number"
                            min="1"
                            max={20 * (campaign.selectedInboxes?.length || 1)}
                            value={formData.maxDailyCampaignInvites}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              maxDailyCampaignInvites: Math.min(
                                20 * (campaign.selectedInboxes?.length || 1), 
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }))}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum total invites for this campaign per day (max: {20 * (campaign.selectedInboxes?.length || 1)})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inbox Selection */}
                  {editing.inboxes && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Inbox Selection</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {accounts.map((account: GoogleAccount) => (
                          <div key={account.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                            <Checkbox
                              id={`inbox-${account.id}`}
                              checked={formData.selectedInboxes.includes(account.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedInboxes: [...prev.selectedInboxes, account.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedInboxes: prev.selectedInboxes.filter(id => id !== account.id)
                                  }));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`inbox-${account.id}`} className="font-medium">
                                {account.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">{account.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-Inbox Analytics */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Per-Inbox Performance</h4>
                      <div className="text-sm text-muted-foreground">
                        Showing {campaign.selectedInboxes?.length || 0} campaign inbox{(campaign.selectedInboxes?.length || 0) !== 1 ? 'es' : ''}
                      </div>
                    </div>
                    
                    {/* Debug information */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-muted-foreground p-2 bg-yellow-50 rounded">
                        Debug: Campaign has {campaign.selectedInboxes?.length || 0} selected inboxes, 
                        fetched {inboxStats.length} inbox stats, 
                        {accounts.length} total accounts available
                      </div>
                    )}
                    
                    {campaign.selectedInboxes?.length > 0 ? (
                      <div className="space-y-4">
                        {campaign.selectedInboxes.map((inboxId: number) => {
                          const account = accounts.find((acc: GoogleAccount) => acc.id === inboxId);
                          const inboxStat = inboxStats.find((stat: any) => stat.inboxId === inboxId);
                          
                          // Calculate stats from invites if inboxStat is not available
                          const campaignInvites = invites.filter((invite: any) => invite.fromInbox === inboxId);
                          const calculatedStats = {
                            invitesSent: campaignInvites.filter((invite: any) => invite.status === 'sent').length,
                            accepted: campaignInvites.filter((invite: any) => invite.rsvpStatus === 'accepted').length,
                            declined: campaignInvites.filter((invite: any) => invite.rsvpStatus === 'declined').length,
                            tentative: campaignInvites.filter((invite: any) => invite.rsvpStatus === 'tentative').length,
                            pending: campaignInvites.filter((invite: any) => invite.status === 'sent' && !invite.rsvpStatus).length,
                            dailyUsed: campaignInvites.filter((invite: any) => {
                              if (!invite.sentAt) return false;
                              const sentDate = new Date(invite.sentAt);
                              const today = new Date();
                              return sentDate.toDateString() === today.toDateString();
                            }).length,
                            lastUsed: campaignInvites
                              .filter((invite: any) => invite.sentAt)
                              .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0]?.sentAt
                          };
                          
                          const displayStats = inboxStat || calculatedStats;
                          
                          if (!account) {
                            return (
                              <Card key={inboxId} className="p-4 border-yellow-200 bg-yellow-50">
                                <div className="text-sm text-yellow-800">
                                  ⚠️ Inbox {inboxId} is selected but account not found
                                </div>
                              </Card>
                            );
                          }
                          
                          return (
                            <Card key={inboxId} className="p-4">
                              <div className="space-y-4">
                                {/* Header with email and daily usage */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2">
                                      {account.name}
                                      <Badge variant="outline" className="text-xs">
                                        Campaign Inbox
                                      </Badge>
                                    </h4>
                                    <p className="text-sm text-muted-foreground">{account.email}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium">
                                      {displayStats.dailyUsed || 0} / {campaign.maxInvitesPerInbox || 20} invites today
                                    </div>
                                    <Progress 
                                      value={((displayStats.dailyUsed || 0) / (campaign.maxInvitesPerInbox || 20)) * 100} 
                                      className="w-32 h-2 mt-1"
                                    />
                                  </div>
                                </div>

                                {/* Performance metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{displayStats.invitesSent || 0}</div>
                                    <div className="text-xs text-muted-foreground">Sent</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">{displayStats.accepted || 0}</div>
                                    <div className="text-xs text-muted-foreground">Accepted</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">{displayStats.declined || 0}</div>
                                    <div className="text-xs text-muted-foreground">Declined</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">{displayStats.tentative || 0}</div>
                                    <div className="text-xs text-muted-foreground">Tentative</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-orange-600">{displayStats.pending || 0}</div>
                                    <div className="text-xs text-muted-foreground">Pending</div>
                                  </div>
                                </div>

                                {/* Success rate and last used */}
                                <div className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Success Rate: </span>
                                    <span className="font-medium">
                                      {(displayStats.invitesSent || 0) > 0 ? 
                                        Math.round(((displayStats.accepted || 0) / (displayStats.invitesSent || 1)) * 100) : 0}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Last Used: </span>
                                    <span className="font-medium">
                                      {displayStats.lastUsed ? 
                                        new Date(displayStats.lastUsed).toLocaleDateString() : 
                                        "Never"
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Additional Campaign-Specific Info */}
                                <div className="pt-2 border-t">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Campaign Invites: </span>
                                      <span className="font-medium">{campaignInvites.length}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Response Rate: </span>
                                      <span className="font-medium">
                                        {campaignInvites.length > 0 ? 
                                          Math.round((campaignInvites.filter((inv: any) => inv.rsvpStatus).length / campaignInvites.length) * 100) : 0}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No inboxes selected for this campaign</p>
                        <p className="text-xs mt-1">Click "Edit Inboxes" above to assign inboxes to this campaign</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invites & Errors Tab */}
          <TabsContent value="invites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Invite Details & Error Analysis
                </CardTitle>
                <CardDescription>
                  View all invites sent for this campaign with detailed error information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invites.length > 0 ? (
                    <div className="space-y-3">
                      {invites.map((invite: any) => (
                        <Card key={invite.id} className={`p-4 ${invite.status === 'error' ? 'border-red-200 bg-red-50' : ''}`}>
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{invite.prospectName || invite.prospectEmail}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {invite.prospectEmail}
                                  {invite.prospectCompany && ` • ${invite.prospectCompany}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={
                                  invite.status === 'sent' ? 'default' :
                                  invite.status === 'pending' ? 'secondary' :
                                  invite.status === 'error' ? 'destructive' : 'outline'
                                }>
                                  {invite.status}
                                </Badge>
                                {invite.rsvpStatus && (
                                  <Badge variant={
                                    invite.rsvpStatus === 'accepted' ? 'default' :
                                    invite.rsvpStatus === 'declined' ? 'destructive' :
                                    invite.rsvpStatus === 'tentative' ? 'secondary' : 'outline'
                                  } className="ml-2">
                                    {invite.rsvpStatus}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Sent: </span>
                                <span className="font-medium">
                                  {invite.sentAt ? new Date(invite.sentAt).toLocaleDateString() : "Not sent"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Scheduled: </span>
                                <span className="font-medium">
                                  {invite.scheduledFor ? new Date(invite.scheduledFor).toLocaleDateString() : "Not scheduled"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">From: </span>
                                <span className="font-medium">
                                  {invite.fromInbox ? 
                                    accounts.find((acc: GoogleAccount) => acc.id === invite.fromInbox)?.email || "Unknown" : 
                                    "Not assigned"
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Event ID: </span>
                                <span className="font-medium text-xs">
                                  {invite.eventId || "None"}
                                </span>
                              </div>
                            </div>

                            {/* Error Details */}
                            {invite.status === 'error' && invite.errorMessage && (
                              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-red-900 mb-1">Error Details</h5>
                                    <p className="text-sm text-red-800 mb-2">{invite.errorMessage}</p>
                                    {invite.errorDetails && (
                                      <details className="text-xs">
                                        <summary className="cursor-pointer text-red-700 hover:text-red-900">
                                          Technical Details
                                        </summary>
                                        <pre className="mt-2 p-2 bg-red-50 rounded text-red-700 overflow-x-auto">
                                          {typeof invite.errorDetails === 'string' ? 
                                            invite.errorDetails : 
                                            JSON.stringify(invite.errorDetails, null, 2)
                                          }
                                        </pre>
                                      </details>
                                    )}
                                    {invite.retryCount && (
                                      <p className="text-xs text-red-600 mt-1">
                                        Retry attempts: {invite.retryCount}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* RSVP Response Details */}
                            {invite.rsvpStatus && invite.rsvpResponseTime && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Users className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-green-900 mb-1">RSVP Response</h5>
                                    <p className="text-sm text-green-800">
                                      Responded {invite.rsvpStatus} on {new Date(invite.rsvpResponseTime).toLocaleDateString()}
                                    </p>
                                    {invite.rsvpNote && (
                                      <p className="text-xs text-green-700 mt-1">
                                        Note: {invite.rsvpNote}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No invites found for this campaign
                    </div>
                  )}

                  {/* Error Summary */}
                  {invites.filter((invite: any) => invite.status === 'error').length > 0 && (
                    <Card className="mt-6 border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-900">
                          <AlertCircle className="h-4 w-4" />
                          Error Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Errors:</span>
                            <span className="font-medium text-red-900">
                              {invites.filter((invite: any) => invite.status === 'error').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Success Rate:</span>
                            <span className="font-medium text-red-900">
                              {invites.length > 0 ? 
                                Math.round((invites.filter((invite: any) => invite.status === 'sent').length / invites.length) * 100) : 0
                              }%
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-red-700">
                            <p className="font-medium">Common Error Types:</p>
                            <ul className="mt-1 space-y-1">
                              {Array.from(new Set(
                                invites
                                  .filter((invite: any) => invite.status === 'error')
                                  .map((invite: any) => invite.errorMessage?.split(':')[0] || 'Unknown Error')
                              )).map((errorType: string) => (
                                <li key={errorType} className="flex justify-between">
                                  <span>{errorType}</span>
                                  <span>
                                    {invites.filter((invite: any) => 
                                      invite.status === 'error' && invite.errorMessage?.startsWith(errorType)
                                    ).length}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}