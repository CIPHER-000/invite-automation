import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignDetailView } from "@/components/campaigns/campaign-detail-view";
import { ManualTestDialog } from "@/components/test-invite/manual-test-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Megaphone, Send } from "lucide-react";
import type { CampaignWithStats } from "@shared/schema";

export default function Campaigns() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithStats | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<CampaignWithStats | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCampaign,
    onSuccess: () => {
      console.log("Campaign deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign deleted",
        description: "Campaign has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Delete campaign error:", error);
      const errorMessage = error?.message || "Failed to delete campaign.";
      console.log("Full error object:", error);
      toast({
        title: "Cannot delete campaign",
        description: errorMessage.includes('while invites are being processed') 
          ? "Campaign cannot be deleted while invites are being sent. Please wait a moment and try again."
          : errorMessage,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.updateCampaign(id, { 
        status: status === "active" ? "paused" : "active" 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign updated",
        description: "Campaign status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update campaign status.",
        variant: "destructive",
      });
    },
  });

  const processMutation = useMutation({
    mutationFn: api.processCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign processed",
        description: "Campaign has been processed and added to queue.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process campaign.",
        variant: "destructive",
      });
    },
  });

  const filteredCampaigns = campaigns?.filter((campaign: CampaignWithStats) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const activeCampaigns = filteredCampaigns.filter((c: CampaignWithStats) => c.status === "active");
  const pausedCampaigns = filteredCampaigns.filter((c: CampaignWithStats) => c.status === "paused");
  const completedCampaigns = filteredCampaigns.filter((c: CampaignWithStats) => c.status === "completed");

  const handleEdit = (campaign: CampaignWithStats) => {
    setEditingCampaign(campaign);
    setShowDetailView(true);
    setViewingCampaign(campaign);
  };

  const handleView = (campaign: CampaignWithStats) => {
    setViewingCampaign(campaign);
    setShowDetailView(true);
  };

  const handleDelete = (id: number) => {
    console.log(`Attempting to delete campaign ${id}`);
    if (confirm("Are you sure you want to delete this campaign?")) {
      console.log(`User confirmed deletion of campaign ${id}`);
      deleteMutation.mutate(id);
    } else {
      console.log(`User canceled deletion of campaign ${id}`);
    }
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    toggleStatusMutation.mutate({ id, status: currentStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">Manage your calendar invite campaigns</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowTestDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            Test Invite
          </Button>
          <Button onClick={() => navigate("/campaigns/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {campaigns?.length || 0} total
                  </Badge>
                  <Badge variant="outline" className="text-success border-success">
                    {activeCampaigns.length} active
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/campaigns/new")}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus size={16} className="mr-2" />
                New Campaign
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({filteredCampaigns.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({pausedCampaigns.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCampaigns.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <CampaignsList 
              campaigns={filteredCampaigns}
              isLoading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <CampaignsList 
              campaigns={activeCampaigns}
              isLoading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>

          <TabsContent value="paused" className="mt-6">
            <CampaignsList 
              campaigns={pausedCampaigns}
              isLoading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <CampaignsList 
              campaigns={completedCampaigns}
              isLoading={isLoading}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>
        </Tabs>
      </div>


      
      <ManualTestDialog 
        open={showTestDialog} 
        onOpenChange={setShowTestDialog} 
      />

      <CampaignDetailView 
        open={showDetailView} 
        onOpenChange={setShowDetailView} 
        campaign={viewingCampaign}
      />
    </div>
  );
}

function CampaignsList({ 
  campaigns, 
  isLoading, 
  onEdit, 
  onView,
  onDelete, 
  onToggleStatus 
}: {
  campaigns: CampaignWithStats[];
  isLoading: boolean;
  onEdit: (campaign: CampaignWithStats) => void;
  onView: (campaign: CampaignWithStats) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, status: string) => void;
}) {
  const [, navigate] = useLocation();
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <div className="flex space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Megaphone size={48} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No campaigns found</h3>
          <p className="text-slate-600 mb-4">
            Create your first campaign to start sending calendar invites.
          </p>
          <Button 
            onClick={() => navigate("/campaigns/new")}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
