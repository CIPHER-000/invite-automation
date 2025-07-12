import { apiRequest } from "@/lib/queryClient";

export const api = {
  // Test connection for inbox monitoring
  testConnection: async (accountId: number, provider: string) => {
    const response = await apiRequest(`/api/connection/test`, {
      method: 'POST',
      body: JSON.stringify({ accountId, provider }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  },

  // Reconnect account
  reconnectAccount: async (accountId: number, provider: string) => {
    const response = await apiRequest(`/api/connection/reconnect`, {
      method: 'POST',
      body: JSON.stringify({ accountId, provider }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  },

  // Delete Google account
  deleteAccount: async (accountId: number) => {
    const response = await apiRequest(`/api/accounts/${accountId}`, {
      method: 'DELETE'
    });
    return response;
  },

  // Delete Microsoft account  
  deleteMicrosoftAccount: async (accountId: number) => {
    const response = await apiRequest(`/api/microsoft/accounts/${accountId}`, {
      method: 'DELETE'
    });
    return response;
  },

  // Get Google auth URL
  getGoogleAuthUrl: async () => {
    const response = await apiRequest('/api/auth/google/url');
    return response;
  },

  // Get Microsoft auth URL
  getMicrosoftAuthUrl: async () => {
    const response = await apiRequest('/api/microsoft/auth/url');
    return response;
  },

  // Export activity logs
  exportActivityLogs: async (filters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    const response = await fetch(`/api/activity/export?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to export activity logs');
    }
    
    const blob = await response.blob();
    return blob;
  },

  // Get campaigns
  getCampaigns: async () => {
    const response = await apiRequest('GET', '/api/campaigns');
    return response.json();
  },

  // Get campaign
  getCampaign: async (id: number) => {
    const response = await apiRequest('GET', `/api/campaigns/${id}`);
    return response.json();
  },

  // Create campaign
  createCampaign: async (campaign: any) => {
    const response = await apiRequest('POST', '/api/campaigns', campaign);
    return response.json();
  },

  // Update campaign
  updateCampaign: async (id: number, updates: any) => {
    const response = await apiRequest('PATCH', `/api/campaigns/${id}`, updates);
    return response.json();
  },

  // Delete campaign
  deleteCampaign: async (id: number) => {
    const response = await apiRequest('DELETE', `/api/campaigns/${id}`);
    return response.json();
  },

  // Process campaign
  processCampaign: async (id: number) => {
    const response = await apiRequest('POST', `/api/campaigns/${id}/process`);
    return response.json();
  }
};