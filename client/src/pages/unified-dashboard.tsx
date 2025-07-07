import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar,
  FileSpreadsheet,
  Play,
  Pause,
  Settings,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Send,
  BarChart3,
  Clock,
  Mail,
  Zap
} from "lucide-react";

export default function UnifiedDashboard() {
  const [newCampaignMode, setNewCampaignMode] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    sheetsUrl: "",
    eventTitle: "",
    eventDescription: "",
    duration: 30,
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/campaigns");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["/api/activity"],
    queryFn: async () => {
      const response = await fetch("/api/activity");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const { data: serviceStatus } = useQuery({
    queryKey: ["/api/auth/service-account/status"],
    queryFn: async () => {
      const response = await fetch("/api/auth/service-account/status");
      if (!response.ok) return { configured: false };
      return response.json();
    },
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(campaignData),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to create campaign");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Campaign created successfully!" });
      setNewCampaignMode(false);
      setCampaignForm({
        name: "",
        sheetsUrl: "",
        eventTitle: "",
        eventDescription: "",
        duration: 30,
        isActive: true
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const serviceAccount = accounts?.find((acc: any) => acc.email?.includes('iam.gserviceaccount.com'));
  const isSystemReady = serviceStatus?.configured && serviceAccount;

  const handleCreateCampaign = () => {
    if (!campaignForm.name || !campaignForm.sheetsUrl || !campaignForm.eventTitle) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: campaignForm.name,
      sheetsUrl: campaignForm.sheetsUrl,
      eventTitle: campaignForm.eventTitle,
      eventDescription: campaignForm.eventDescription,
      duration: campaignForm.duration,
      isActive: campaignForm.isActive,
      accountId: serviceAccount?.id,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Shady 5.0
              </h1>
              <p className="text-slate-600">AI-Powered Calendar Automation</p>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              {isSystemReady ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {isSystemReady ? "System Ready" : "Setup Required"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-600">Calendar API</span>
              {serviceStatus?.calendar && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-600">Sheets API</span>
              {serviceStatus?.sheets && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{campaigns?.length || 0}</p>
                  <p className="text-sm text-blue-700">Active Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Send className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{stats?.invitesToday || 0}</p>
                  <p className="text-sm text-green-700">Invites Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{stats?.acceptedInvites || 0}</p>
                  <p className="text-sm text-purple-700">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">{accounts?.length || 0}</p>
                  <p className="text-sm text-orange-700">Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Campaign Management */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle>Campaign Management</CardTitle>
                </div>
                <Button 
                  onClick={() => setNewCampaignMode(!newCampaignMode)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {newCampaignMode && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Q1 Outreach Campaign"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sheetsUrl">Google Sheets URL</Label>
                    <Input
                      id="sheetsUrl"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={campaignForm.sheetsUrl}
                      onChange={(e) => setCampaignForm({...campaignForm, sheetsUrl: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Meeting Title</Label>
                    <Input
                      id="eventTitle"
                      placeholder="e.g., Quick Discovery Call"
                      value={campaignForm.eventTitle}
                      onChange={(e) => setCampaignForm({...campaignForm, eventTitle: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDescription">Meeting Description</Label>
                    <Textarea
                      id="eventDescription"
                      placeholder="Brief introduction and agenda"
                      value={campaignForm.eventDescription}
                      onChange={(e) => setCampaignForm({...campaignForm, eventDescription: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={campaignForm.duration}
                        onChange={(e) => setCampaignForm({...campaignForm, duration: parseInt(e.target.value)})}
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={campaignForm.isActive}
                        onCheckedChange={(checked) => setCampaignForm({...campaignForm, isActive: checked})}
                      />
                      <Label>Start Active</Label>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleCreateCampaign}
                      disabled={createCampaignMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Campaign
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setNewCampaignMode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Campaign List */}
              <div className="space-y-3">
                {campaigns?.length > 0 ? (
                  campaigns.map((campaign: any) => (
                    <div key={campaign.id} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-slate-600">{campaign.eventTitle}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={campaign.isActive ? "default" : "secondary"}>
                            {campaign.isActive ? "Active" : "Paused"}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            {campaign.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns yet. Create your first campaign to get started!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status & Activity */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <CardTitle>System Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Service Account Status */}
              {serviceAccount && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Service Account Active</span>
                  </div>
                  <p className="text-sm text-green-700">{serviceAccount.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-green-600">
                    <span>Calendar ✓</span>
                    <span>Sheets ✓</span>
                    <span>Drive ✓</span>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Recent Activity</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activity?.length > 0 ? (
                    activity.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-slate-50 rounded">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">{item.message || item.type}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and system management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileSpreadsheet className="w-6 h-6" />
                <span>Test Sheets</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Mail className="w-6 h-6" />
                <span>Send Test Invite</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Settings className="w-6 h-6" />
                <span>System Settings</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <BarChart3 className="w-6 h-6" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}