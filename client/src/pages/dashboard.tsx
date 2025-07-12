import { useState } from "react";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { SystemHealth } from "@/components/dashboard/system-health";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignDetailView } from "@/components/campaigns/campaign-detail-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeRangeSelector } from "@/components/ui/time-range-selector";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { CampaignWithStats } from "@shared/schema";

export default function Dashboard() {
  const [viewingCampaign, setViewingCampaign] = useState<CampaignWithStats | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [timeRange, setTimeRange] = useState<number | null>(null);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: api.getCampaigns,
  });

  const handleView = (campaign: CampaignWithStats) => {
    setViewingCampaign(campaign);
    setShowDetailView(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your calendar invite campaigns</p>
        </div>
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          className="flex-shrink-0"
        />
      </div>

      <StatsGrid timeRange={timeRange} />

      {/* Active Campaigns Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Active Campaigns</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor and manage your ongoing calendar invite campaigns
              </p>
            </div>
            <Link href="/campaigns">
              <Button variant="outline">
                View All Campaigns
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-6">
                  <Skeleton className="h-6 w-1/3 mb-3" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-6">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.slice(0, 2).map((campaign: any) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign} 
                  onView={handleView}
                  showActions={true} 
                  isFullWidth={true} 
                />
              ))}
              {campaigns.length > 2 && (
                <div className="text-center pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-3">
                    Showing 2 of {campaigns.length} campaigns
                  </p>
                  <Link href="/campaigns">
                    <Button variant="outline">
                      View All {campaigns.length} Campaigns
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-slate-700 mb-2">No campaigns yet</h3>
                <p className="text-slate-500 mb-6">
                  Create your first campaign to start sending automated calendar invites to prospects.
                </p>
                <Link href="/campaigns">
                  <Button size="lg">
                    Create Your First Campaign
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SystemHealth />

      <CampaignDetailView 
        open={showDetailView} 
        onOpenChange={setShowDetailView} 
        campaign={viewingCampaign}
      />
    </div>
  );
}
