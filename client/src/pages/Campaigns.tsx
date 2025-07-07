import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Trash2 } from 'lucide-react';
import { Campaign } from '../../../shared/schema';
import { apiRequest } from '@/lib/queryClient';

function Campaigns() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/campaigns/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your calendar automation campaigns.
          </p>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your calendar automation campaigns.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {campaigns && campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first campaign.</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns?.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    {campaign.description && (
                      <CardDescription className="mt-2">
                        {campaign.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(campaign.status || 'draft')}>
                      {campaign.status || 'draft'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Created: {new Date(campaign.createdAt!).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                    <Button variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(campaign.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateCampaignForm onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  );
}

function CreateCampaignForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as const,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create New Campaign</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Campaigns;