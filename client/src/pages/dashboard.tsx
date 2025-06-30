import { Header } from "@/components/layout/header";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { SystemHealth } from "@/components/dashboard/system-health";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { AccountStatus } from "@/components/accounts/account-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRealtimeAccounts } from "@/hooks/use-realtime";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: api.getCampaigns,
  });

  const { data: accounts, isLoading: accountsLoading } = useRealtimeAccounts();

  return (
    <div className="flex-1 ml-64">
      <Header 
        title="Shady 5.0 Dashboard" 
        subtitle="Monitor your calendar invite campaigns"
        showCreateButton
      />

      <div className="p-6 space-y-6">
        <StatsGrid />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Campaigns List */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Campaigns</CardTitle>
                  <Link href="/campaigns">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaignsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex space-x-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))
                ) : campaigns && campaigns.length > 0 ? (
                  campaigns.slice(0, 3).map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <p>No campaigns yet. Create your first campaign to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Google Accounts Status */}
            <Card>
              <CardHeader>
                <CardTitle>Google Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : accounts && accounts.length > 0 ? (
                  accounts.slice(0, 3).map((account: any) => (
                    <AccountStatus key={account.id} account={account} />
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-4">
                    <p className="text-sm">No Google accounts connected.</p>
                    <Link href="/accounts">
                      <Button variant="outline" size="sm" className="mt-2">
                        Connect Account
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <RecentActivity />
          </div>
        </div>

        <SystemHealth />
      </div>
    </div>
  );
}
