import {
  googleAccounts,
  campaigns,
  invites,
  activityLogs,
  systemSettings,
  inviteQueue,
  type GoogleAccount,
  type InsertGoogleAccount,
  type Campaign,
  type InsertCampaign,
  type Invite,
  type InsertInvite,
  type ActivityLog,
  type InsertActivityLog,
  type SystemSettings,
  type InsertSystemSettings,
  type InviteQueue,
  type InsertInviteQueue,
  type DashboardStats,
  type CampaignWithStats,
  type AccountWithStatus,
} from "@shared/schema";

export interface IStorage {
  // Google Accounts
  getGoogleAccounts(): Promise<GoogleAccount[]>;
  getGoogleAccount(id: number): Promise<GoogleAccount | undefined>;
  getGoogleAccountByEmail(email: string): Promise<GoogleAccount | undefined>;
  createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount>;
  updateGoogleAccount(id: number, updates: Partial<GoogleAccount>): Promise<GoogleAccount>;
  deleteGoogleAccount(id: number): Promise<void>;
  getAccountsWithStatus(): Promise<AccountWithStatus[]>;

  // Outlook Accounts
  getOutlookAccounts(): Promise<OutlookAccount[]>;
  getOutlookAccount(id: number): Promise<OutlookAccount | undefined>;
  getOutlookAccountByEmail(email: string): Promise<OutlookAccount | undefined>;
  createOutlookAccount(account: InsertOutlookAccount): Promise<OutlookAccount>;
  updateOutlookAccount(id: number, updates: Partial<OutlookAccount>): Promise<OutlookAccount>;
  deleteOutlookAccount(id: number): Promise<void>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;
  getCampaignsWithStats(): Promise<CampaignWithStats[]>;

  // Invites
  getInvites(campaignId?: number): Promise<Invite[]>;
  getInvite(id: number): Promise<Invite | undefined>;
  createInvite(invite: InsertInvite): Promise<Invite>;
  updateInvite(id: number, updates: Partial<Invite>): Promise<Invite>;
  getInvitesByStatus(status: string): Promise<Invite[]>;
  getInvitesToday(): Promise<number>;
  getAcceptedInvites(): Promise<number>;

  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings>;

  // Queue
  getQueueItems(status?: string): Promise<InviteQueue[]>;
  createQueueItem(item: InsertInviteQueue): Promise<InviteQueue>;
  updateQueueItem(id: number, updates: Partial<InviteQueue>): Promise<InviteQueue>;
  getNextQueueItem(): Promise<InviteQueue | undefined>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private googleAccounts: Map<number, GoogleAccount> = new Map();
  private outlookAccounts: Map<number, OutlookAccount> = new Map();
  private campaigns: Map<number, Campaign> = new Map();
  private invites: Map<number, Invite> = new Map();
  private activityLogs: Map<number, ActivityLog> = new Map();
  private systemSettings: SystemSettings;
  private inviteQueue: Map<number, InviteQueue> = new Map();
  private currentId = 1;

  constructor() {
    this.systemSettings = {
      id: 1,
      dailyInviteLimit: 100,
      inboxCooldownMinutes: 30,
      acceptanceCheckIntervalMinutes: 60,
      isSystemActive: true,
      updatedAt: new Date(),
    };
  }

  // Google Accounts
  async getGoogleAccounts(): Promise<GoogleAccount[]> {
    return Array.from(this.googleAccounts.values());
  }

  async getGoogleAccount(id: number): Promise<GoogleAccount | undefined> {
    return this.googleAccounts.get(id);
  }

  async getGoogleAccountByEmail(email: string): Promise<GoogleAccount | undefined> {
    return Array.from(this.googleAccounts.values()).find(account => account.email === email);
  }

  async createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount> {
    const id = this.currentId++;
    const newAccount: GoogleAccount = {
      ...account,
      id,
      createdAt: new Date(),
      isActive: account.isActive ?? true,
      lastUsed: account.lastUsed ?? null,
    };
    this.googleAccounts.set(id, newAccount);
    return newAccount;
  }

  async updateGoogleAccount(id: number, updates: Partial<GoogleAccount>): Promise<GoogleAccount> {
    const account = this.googleAccounts.get(id);
    if (!account) throw new Error("Account not found");
    
    const updated = { ...account, ...updates };
    this.googleAccounts.set(id, updated);
    return updated;
  }

  async deleteGoogleAccount(id: number): Promise<void> {
    this.googleAccounts.delete(id);
  }

  async getOutlookAccounts(): Promise<OutlookAccount[]> {
    return Array.from(this.outlookAccounts.values());
  }

  async getOutlookAccount(id: number): Promise<OutlookAccount | undefined> {
    return this.outlookAccounts.get(id);
  }

  async getOutlookAccountByEmail(email: string): Promise<OutlookAccount | undefined> {
    return Array.from(this.outlookAccounts.values()).find(account => account.email === email);
  }

  async createOutlookAccount(account: InsertOutlookAccount): Promise<OutlookAccount> {
    const id = this.currentId++;
    const newAccount: OutlookAccount = {
      ...account,
      id,
      createdAt: new Date(),
      isActive: account.isActive ?? true,
      lastUsed: account.lastUsed ?? null,
    };
    this.outlookAccounts.set(id, newAccount);
    return newAccount;
  }

  async updateOutlookAccount(id: number, updates: Partial<OutlookAccount>): Promise<OutlookAccount> {
    const account = this.outlookAccounts.get(id);
    if (!account) throw new Error("Outlook account not found");
    
    const updated = { ...account, ...updates };
    this.outlookAccounts.set(id, updated);
    return updated;
  }

  async deleteOutlookAccount(id: number): Promise<void> {
    this.outlookAccounts.delete(id);
  }

  async getAccountsWithStatus(): Promise<AccountWithStatus[]> {
    const accounts = Array.from(this.googleAccounts.values());
    const now = new Date();
    
    return accounts.map(account => {
      const cooldownEnd = account.lastUsed 
        ? new Date(account.lastUsed.getTime() + this.systemSettings.inboxCooldownMinutes * 60000)
        : null;
      
      const isInCooldown = cooldownEnd && cooldownEnd > now;
      const nextAvailable = isInCooldown 
        ? Math.ceil((cooldownEnd.getTime() - now.getTime()) / 60000) + "m"
        : null;

      return {
        ...account,
        nextAvailable,
        isInCooldown: !!isInCooldown,
      };
    });
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.isActive);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentId++;
    const now = new Date();
    const newCampaign: Campaign = {
      ...campaign,
      id,
      createdAt: now,
      updatedAt: now,
      status: campaign.status ?? "active",
      isActive: campaign.isActive ?? true,
      description: campaign.description ?? null,
      sheetRange: campaign.sheetRange ?? "A:Z",
      timeZone: campaign.timeZone ?? "UTC",
    };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaigns.get(id);
    if (!campaign) throw new Error("Campaign not found");
    
    const updated = { ...campaign, ...updates, updatedAt: new Date() };
    this.campaigns.set(id, updated);
    return updated;
  }

  async deleteCampaign(id: number): Promise<void> {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.isActive = false;
      this.campaigns.set(id, campaign);
    }
  }

  async getCampaignsWithStats(): Promise<CampaignWithStats[]> {
    const campaigns = await this.getCampaigns();
    
    return campaigns.map(campaign => {
      const campaignInvites = Array.from(this.invites.values()).filter(
        invite => invite.campaignId === campaign.id
      );
      
      const invitesSent = campaignInvites.filter(i => i.status === "sent" || i.status === "accepted").length;
      const accepted = campaignInvites.filter(i => i.status === "accepted").length;
      const totalProspects = campaignInvites.length;
      const progress = totalProspects > 0 ? (invitesSent / totalProspects) * 100 : 0;

      return {
        ...campaign,
        invitesSent,
        accepted,
        totalProspects,
        progress: Math.round(progress * 10) / 10,
      };
    });
  }

  // Invites
  async getInvites(campaignId?: number): Promise<Invite[]> {
    const invites = Array.from(this.invites.values());
    return campaignId 
      ? invites.filter(invite => invite.campaignId === campaignId)
      : invites;
  }

  async getInvite(id: number): Promise<Invite | undefined> {
    return this.invites.get(id);
  }

  async createInvite(invite: InsertInvite): Promise<Invite> {
    const id = this.currentId++;
    const now = new Date();
    const newInvite: Invite = {
      ...invite,
      id,
      createdAt: now,
      updatedAt: now,
      status: invite.status ?? "pending",
      prospectName: invite.prospectName ?? null,
      prospectCompany: invite.prospectCompany ?? null,
      mergeData: invite.mergeData ?? null,
      eventId: invite.eventId ?? null,
      sheetRowIndex: invite.sheetRowIndex ?? null,
      errorMessage: invite.errorMessage ?? null,
      sentAt: invite.sentAt ?? null,
      acceptedAt: invite.acceptedAt ?? null,
      confirmationSent: invite.confirmationSent ?? false,
      confirmationSentAt: invite.confirmationSentAt ?? null,
    };
    this.invites.set(id, newInvite);
    return newInvite;
  }

  async updateInvite(id: number, updates: Partial<Invite>): Promise<Invite> {
    const invite = this.invites.get(id);
    if (!invite) throw new Error("Invite not found");
    
    const updated = { ...invite, ...updates, updatedAt: new Date() };
    this.invites.set(id, updated);
    return updated;
  }

  async getInvitesByStatus(status: string): Promise<Invite[]> {
    return Array.from(this.invites.values()).filter(invite => invite.status === status);
  }

  async getInvitesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.invites.values()).filter(
      invite => invite.sentAt && invite.sentAt >= today
    ).length;
  }

  async getAcceptedInvites(): Promise<number> {
    return Array.from(this.invites.values()).filter(
      invite => invite.status === "accepted"
    ).length;
  }

  // Activity Logs
  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId++;
    const newLog: ActivityLog = {
      ...log,
      id,
      createdAt: new Date(),
      metadata: log.metadata ?? null,
      campaignId: log.campaignId ?? null,
      inviteId: log.inviteId ?? null,
      googleAccountId: log.googleAccountId ?? null,
    };
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    return this.systemSettings;
  }

  async updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    this.systemSettings = { ...this.systemSettings, ...updates, updatedAt: new Date() };
    return this.systemSettings;
  }

  // Queue
  async getQueueItems(status?: string): Promise<InviteQueue[]> {
    const items = Array.from(this.inviteQueue.values());
    return status ? items.filter(item => item.status === status) : items;
  }

  async createQueueItem(item: InsertInviteQueue): Promise<InviteQueue> {
    const id = this.currentId++;
    const now = new Date();
    const newItem: InviteQueue = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
      status: item.status ?? "pending",
      attempts: item.attempts ?? 0,
      errorMessage: item.errorMessage ?? null,
    };
    this.inviteQueue.set(id, newItem);
    return newItem;
  }

  async updateQueueItem(id: number, updates: Partial<InviteQueue>): Promise<InviteQueue> {
    const item = this.inviteQueue.get(id);
    if (!item) throw new Error("Queue item not found");
    
    const updated = { ...item, ...updates, updatedAt: new Date() };
    this.inviteQueue.set(id, updated);
    return updated;
  }

  async getNextQueueItem(): Promise<InviteQueue | undefined> {
    const pending = Array.from(this.inviteQueue.values())
      .filter(item => item.status === "pending")
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    
    return pending.length > 0 ? pending[0] : undefined;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const activeCampaigns = Array.from(this.campaigns.values()).filter(
      c => c.isActive && c.status === "active"
    ).length;
    
    const invitesToday = await this.getInvitesToday();
    const acceptedInvites = await this.getAcceptedInvites();
    const connectedAccounts = Array.from(this.googleAccounts.values()).filter(
      a => a.isActive
    ).length;
    
    const totalInvites = Array.from(this.invites.values()).length;
    const acceptanceRate = totalInvites > 0 ? (acceptedInvites / totalInvites) * 100 : 0;
    
    const pendingQueue = Array.from(this.inviteQueue.values()).filter(
      item => item.status === "pending"
    ).length;
    
    return {
      activeCampaigns,
      invitesToday,
      acceptedInvites,
      connectedAccounts,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      dailyLimit: this.systemSettings.dailyInviteLimit,
      apiUsage: Math.round((invitesToday / this.systemSettings.dailyInviteLimit) * 100),
      queueStatus: pendingQueue > 0 ? `Processing ${pendingQueue} items` : "Idle",
    };
  }
}

export const storage = new MemStorage();
