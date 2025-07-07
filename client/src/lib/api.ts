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

  // Enhanced Load Balancing & Scheduling
  getInboxStats: () => fetch("/api/inbox/stats").then(res => res.json()),
  getInboxStatsById: (id: number) => fetch(`/api/inbox/stats/${id}`).then(res => res.json()),
  pauseInbox: (id: number, reason?: string) => apiRequest("POST", `/api/inbox/${id}/pause`, { reason }),
  resumeInbox: (id: number) => apiRequest("POST", `/api/inbox/${id}/resume`),
  getLoadBalancingConfig: () => fetch("/api/inbox/config").then(res => res.json()),
  updateLoadBalancingConfig: (config: any) => apiRequest("PUT", "/api/inbox/config", config),
  getBookedSlots: (accountEmail: string) => fetch(`/api/inbox/${accountEmail}/booked-slots`).then(res => res.json()),
  resetDailyCounters: () => apiRequest("POST", "/api/inbox/reset-daily"),
  clearOldSlots: () => apiRequest("POST", "/api/scheduling/clear-old-slots"),

  // Multi-Provider Email & Calendar
  getOutlookAuthUrl: () => fetch("/api/auth/outlook").then(res => res.json()),
  getOutlookAccounts: () => fetch("/api/outlook/accounts").then(res => res.json()),
  toggleOutlookAccount: (id: number) => apiRequest("PUT", `/api/outlook/accounts/${id}/toggle`),
  deleteOutlookAccount: (id: number) => apiRequest("DELETE", `/api/outlook/accounts/${id}`),
  getEmailProviders: () => fetch("/api/email/providers").then(res => res.json()),
  getEmailProviderStats: () => fetch("/api/email/providers/stats").then(res => res.json()),
  testEmailProvider: (id: number) => apiRequest("POST", `/api/email/providers/${id}/test`),
};
