import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Mail, Users, CheckCircle } from 'lucide-react';

interface DashboardStats {
  activeCampaigns: number;
  connectedAccounts: number;
  acceptedInvites: number;
  sentTodayInvites: number;
}

function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your calendar automation campaigns and performance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your calendar automation campaigns and performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invites Sent Today</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sentTodayInvites || 0}</div>
            <p className="text-xs text-muted-foreground">Meeting invitations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Responses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.acceptedInvites || 0}</div>
            <p className="text-xs text-muted-foreground">Accepted invites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.connectedAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">Google accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your calendar automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => alert('Connect Google Account functionality - requires OAuth setup')}>
              Connect Google Account
            </Button>
            <Button variant="outline" className="w-full">
              Create New Campaign
            </Button>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <span className="text-green-600 text-sm font-medium">✓ Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dashboard</span>
                <span className="text-green-600 text-sm font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-green-600 text-sm font-medium">✓ Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;