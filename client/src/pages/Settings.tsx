import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { GoogleAccount } from '../../../shared/schema';
import { apiRequest } from '@/lib/queryClient';

function Settings() {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<GoogleAccount[]>({
    queryKey: ['/api/google-accounts'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/google-accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-accounts'] });
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your Google accounts and system preferences.
          </p>
        </div>
        
        <div className="animate-pulse">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your Google accounts and system preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Google Accounts</CardTitle>
                <CardDescription>
                  Connected Google accounts for calendar automation
                </CardDescription>
              </div>
              <Button onClick={() => alert('OAuth integration required to connect Google accounts')}>
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {accounts && accounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No Google accounts connected yet.</p>
                <Button onClick={() => alert('OAuth integration required to connect Google accounts')}>
                  Connect Your First Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts?.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{account.email}</p>
                        <p className="text-sm text-gray-500">
                          Connected: {new Date(account.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={account.isConnected ? 'default' : 'secondary'}>
                        {account.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(account.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
            <CardDescription>
              Configure your automation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive updates about campaign progress</p>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Auto-follow up</h4>
                <p className="text-sm text-gray-500">Automatically send follow-up invites</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Analytics Tracking</h4>
                <p className="text-sm text-gray-500">Track meeting response rates</p>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Manage your API keys and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your Google OAuth Client ID"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <Button className="w-full">Save Configuration</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;