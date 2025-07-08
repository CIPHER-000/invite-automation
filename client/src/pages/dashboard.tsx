import { StatsGrid } from "@/components/dashboard/stats-grid";

import { SystemHealth } from "@/components/dashboard/system-health";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: api.getCampaigns,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your calendar invite campaigns</p>
      </div>

      <StatsGrid />

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.slice(0, 6).map((campaign: any) => (
                <CampaignCard key={campaign.id} campaign={campaign} showActions={false} />
              ))}
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
    </div>
  );
}
