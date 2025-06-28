import { apiRequest } from "./queryClient";

export const api = {
  // Dashboard
  getDashboardStats: () => fetch("/api/dashboard/stats").then(res => res.json()),

  // Google Auth
  getGoogleAuthUrl: () => fetch("/api/auth/google").then(res => res.json()),

  // Accounts
  getAccounts: () => fetch("/api/accounts").then(res => res.json()),
  deleteAccount: (id: number) => apiRequest("DELETE", `/api/accounts/${id}`),
  toggleAccount: (id: number) => apiRequest("PUT", `/api/accounts/${id}/toggle`),

  // Campaigns
  getCampaigns: () => fetch("/api/campaigns").then(res => res.json()),
  getCampaign: (id: number) => fetch(`/api/campaigns/${id}`).then(res => res.json()),
  createCampaign: (data: any) => apiRequest("POST", "/api/campaigns", data),
  updateCampaign: (id: number, data: any) => apiRequest("PUT", `/api/campaigns/${id}`, data),
  deleteCampaign: (id: number) => apiRequest("DELETE", `/api/campaigns/${id}`),
  processCampaign: (id: number) => apiRequest("POST", `/api/campaigns/${id}/process`),
  processAllCampaigns: () => apiRequest("POST", "/api/campaigns/process-all"),

  // Invites
  getInvites: (campaignId?: number) => {
    const url = campaignId ? `/api/invites?campaignId=${campaignId}` : "/api/invites";
    return fetch(url).then(res => res.json());
  },

  // Activity
  getActivity: (limit?: number) => {
    const url = limit ? `/api/activity?limit=${limit}` : "/api/activity";
    return fetch(url).then(res => res.json());
  },

  // Settings
  getSettings: () => fetch("/api/settings").then(res => res.json()),
  updateSettings: (data: any) => apiRequest("PUT", "/api/settings", data),

  // Queue
  getQueueStatus: () => fetch("/api/queue/status").then(res => res.json()),
};
