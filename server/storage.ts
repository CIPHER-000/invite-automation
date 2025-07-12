import {
  googleAccounts,
  campaigns,
  invites,
  activityLogs,
  systemSettings,
  inviteQueue,
  outlookAccounts,
  rsvpEvents,
  webhookEvents,
  type GoogleAccount,
  type InsertGoogleAccount,
  type OutlookAccount,
  type InsertOutlookAccount,
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
  type RsvpEvent,
  type InsertRsvpEvent,
  type WebhookEvent,
  type InsertWebhookEvent,
  type DashboardStats,
  type CampaignWithStats,
  type AccountWithStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // Google Accounts
  getGoogleAccounts(userId: string): Promise<GoogleAccount[]>;
  getGoogleAccount(id: number, userId: string): Promise<GoogleAccount | undefined>;
  getGoogleAccountByEmail(email: string, userId: string): Promise<GoogleAccount | undefined>;
  createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount>;
  updateGoogleAccount(id: number, updates: Partial<GoogleAccount>, userId: string): Promise<GoogleAccount>;
  deleteGoogleAccount(id: number, userId: string): Promise<void>;
  disconnectGoogleAccount(id: number, userId: string): Promise<void>;
  getCampaignsUsingInbox(inboxId: number, userId: string): Promise<{ id: number; name: string; status: string }[]>;
  getAccountsWithStatus(userId: string): Promise<AccountWithStatus[]>;

  // Outlook Accounts
  getOutlookAccounts(): Promise<OutlookAccount[]>;
  getOutlookAccount(id: number): Promise<OutlookAccount | undefined>;
  getOutlookAccountByEmail(email: string): Promise<OutlookAccount | undefined>;
  createOutlookAccount(account: InsertOutlookAccount): Promise<OutlookAccount>;
  updateOutlookAccount(id: number, updates: Partial<OutlookAccount>): Promise<OutlookAccount>;
  deleteOutlookAccount(id: number): Promise<void>;

  // Campaigns
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: number, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>, userId: string): Promise<Campaign>;
  deleteCampaign(id: number, userId: string): Promise<void>;
  getCampaignsWithStats(userId: string): Promise<CampaignWithStats[]>;

  // Invites
  getInvites(userId: string, campaignId?: number): Promise<Invite[]>;
  getInvite(id: number, userId: string): Promise<Invite | undefined>;
  createInvite(invite: InsertInvite): Promise<Invite>;
  updateInvite(id: number, updates: Partial<Invite>, userId: string): Promise<Invite>;
  getInvitesByStatus(status: string, userId: string): Promise<Invite[]>;
  getInvitesByRsvpStatus(rsvpStatus: string, userId: string): Promise<Invite[]>;
  getInvitesToday(userId: string): Promise<number>;
  getAcceptedInvites(userId: string): Promise<number>;
  getInvitesTodayByAccount(accountId: number, userId: string): Promise<number>;
  updateInviteRsvpStatus(inviteId: number, rsvpStatus: string, source: string, webhookPayload?: any): Promise<void>;
  getInviteByEventId(eventId: string): Promise<Invite | undefined>;

  // RSVP Events
  getRsvpEvents(inviteId?: number, userId?: string): Promise<RsvpEvent[]>;
  createRsvpEvent(event: InsertRsvpEvent): Promise<RsvpEvent>;
  getRsvpHistory(inviteId: number, userId?: string): Promise<RsvpEvent[]>;

  // Webhook Events
  getWebhookEvents(processed?: boolean): Promise<WebhookEvent[]>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  markWebhookProcessed(id: number, success: boolean, error?: string): Promise<void>;

  // Activity Logs
  getActivityLogs(limit?: number, userId?: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  cleanupActivityLogsForAccount(accountId: number): Promise<void>;
  cleanupInvitesForAccount(accountId: number): Promise<void>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings>;

  // Queue
  getQueueItems(status?: string): Promise<InviteQueue[]>;
  createQueueItem(item: InsertInviteQueue): Promise<InviteQueue>;
  updateQueueItem(id: number, updates: Partial<InviteQueue>): Promise<InviteQueue>;
  getNextQueueItem(): Promise<InviteQueue | undefined>;

  // Dashboard
  getDashboardStats(userId: string): Promise<DashboardStats>;
  
  // Campaign Analytics
  getCampaignInboxStats(campaignId: number, userId: string): Promise<Array<{
    inboxId: number;
    email: string;
    name: string;
    invitesSent: number;
    accepted: number;
    declined: number;
    tentative: number;
    pending: number;
    lastUsed: string | null;
    dailyLimit: number;
    dailyUsed: number;
  }>>;
  getCampaignDetailedStats(campaignId: number, userId: string): Promise<{
    totalProspects: number;
    invitesSent: number;
    pending: number;
    accepted: number;
    declined: number;
    tentative: number;
    errors: number;
    dailyProgress: Array<{ date: string; sent: number; accepted: number }>;
    inboxUsage: Array<{ inboxId: number; email: string; usage: number; limit: number }>;
  }>;
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
      dailyInviteLimit: 400, // 20 inboxes × 20 invites = 400 max per day system-wide
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

  async disconnectGoogleAccount(id: number): Promise<void> {
    // COMPLETE DELETION: Remove account entirely from platform
    this.googleAccounts.delete(id);
  }

  async getCampaignsUsingInbox(inboxId: number): Promise<{ id: number; name: string; status: string }[]> {
    const campaigns = Array.from(this.campaigns.values());
    return campaigns
      .filter(campaign => campaign.selectedInboxes?.includes(inboxId))
      .map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status
      }));
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

  async getAccountsWithStatus(userId: string): Promise<AccountWithStatus[]> {
    const accounts = Array.from(this.googleAccounts.values())
      .filter(account => account.userId === userId);
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
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(c => c.isActive && c.userId === userId);
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    return campaign && campaign.userId === userId ? campaign : undefined;
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

  async updateCampaign(id: number, updates: Partial<Campaign>, userId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(id);
    if (!campaign || campaign.userId !== userId) throw new Error("Campaign not found");
    
    const updated = { ...campaign, ...updates, updatedAt: new Date() };
    this.campaigns.set(id, updated);
    return updated;
  }

  async deleteCampaign(id: number, userId: string): Promise<void> {
    // Verify campaign ownership
    const campaign = this.campaigns.get(id);
    if (!campaign || campaign.userId !== userId) {
      throw new Error('Campaign not found');
    }

    // Check if there are any processing queue items
    const processingItems = Array.from(this.inviteQueue.values()).filter(
      item => item.campaignId === id && item.status === 'processing'
    );

    if (processingItems.length > 0) {
      throw new Error('Cannot delete campaign while invites are being processed. Please wait and try again.');
    }

    // Set campaign as inactive first to prevent new processing
    campaign.isActive = false;
    campaign.status = 'deleted';
    this.campaigns.set(id, campaign);

    // Delete related records
    Array.from(this.inviteQueue.entries()).forEach(([queueId, item]) => {
      if (item.campaignId === id) {
        this.inviteQueue.delete(queueId);
      }
    });
    
    Array.from(this.invites.entries()).forEach(([inviteId, invite]) => {
      if (invite.campaignId === id) {
        this.invites.delete(inviteId);
      }
    });
    
    Array.from(this.activityLogs.entries()).forEach(([logId, log]) => {
      if (log.campaignId === id) {
        this.activityLogs.delete(logId);
      }
    });
    
    // Finally delete the campaign
    this.campaigns.delete(id);
  }

  async getCampaignsWithStats(userId: string): Promise<CampaignWithStats[]> {
    const campaigns = await this.getCampaigns(userId);
    
    return campaigns.map(campaign => {
      const campaignInvites = Array.from(this.invites.values()).filter(
        invite => invite.campaignId === campaign.id
      );
      
      const campaignQueueItems = Array.from(this.inviteQueue.values()).filter(
        item => item.campaignId === campaign.id
      );
      
      const invitesSent = campaignInvites.filter(i => i.status === "sent" || i.status === "accepted").length;
      const accepted = campaignInvites.filter(i => i.status === "accepted").length;
      const pendingInvites = campaignQueueItems.filter(i => i.status === "pending").length;
      const processingInvites = campaignQueueItems.filter(i => i.status === "processing").length;
      const totalProspects = campaignInvites.length;
      const progress = totalProspects > 0 ? (invitesSent / totalProspects) * 100 : 0;

      return {
        ...campaign,
        invitesSent,
        accepted,
        totalProspects,
        progress: Math.round(progress * 10) / 10,
        pendingInvites,
        processingInvites
      };
    });
  }

  // Invites
  async getInvites(userId: string, campaignId?: number): Promise<Invite[]> {
    const invites = Array.from(this.invites.values())
      .filter(invite => invite.userId === userId);
    return campaignId 
      ? invites.filter(invite => invite.campaignId === campaignId)
      : invites;
  }

  async getInvite(id: number, userId: string): Promise<Invite | undefined> {
    const invite = this.invites.get(id);
    return invite && invite.userId === userId ? invite : undefined;
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

  async updateInvite(id: number, updates: Partial<Invite>, userId: string): Promise<Invite> {
    const invite = this.invites.get(id);
    if (!invite || invite.userId !== userId) throw new Error("Invite not found");
    
    const updated = { ...invite, ...updates, updatedAt: new Date() };
    this.invites.set(id, updated);
    return updated;
  }

  async getInvitesByStatus(status: string, userId: string): Promise<Invite[]> {
    return Array.from(this.invites.values()).filter(invite => invite.status === status && invite.userId === userId);
  }

  async getInvitesByRsvpStatus(rsvpStatus: string, userId: string): Promise<Invite[]> {
    return Array.from(this.invites.values()).filter(invite => invite.rsvpStatus === rsvpStatus && invite.userId === userId);
  }

  async getInvitesToday(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.invites.values()).filter(
      invite => invite.sentAt && invite.sentAt >= today && invite.userId === userId
    ).length;
  }

  async getAcceptedInvites(userId: string): Promise<number> {
    return Array.from(this.invites.values()).filter(
      invite => invite.status === "accepted" && invite.userId === userId
    ).length;
  }

  async getInvitesTodayByAccount(accountId: number, userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.invites.values()).filter(
      invite => invite.googleAccountId === accountId && 
                invite.sentAt && 
                invite.sentAt >= today &&
                invite.userId === userId
    ).length;
  }

  // Activity Logs
  async getActivityLogs(limit = 50, userId?: string): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values());
    
    // Filter by userId if provided
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    return logs
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

  async cleanupActivityLogsForAccount(accountId: number): Promise<void> {
    // Update all activity logs that reference this account
    for (const [id, log] of this.activityLogs.entries()) {
      if (log.googleAccountId === accountId) {
        this.activityLogs.set(id, { ...log, googleAccountId: null });
      }
    }
  }

  async cleanupInvitesForAccount(accountId: number): Promise<void> {
    // Update all invites that reference this account
    for (const [id, invite] of this.invites.entries()) {
      if (invite.googleAccountId === accountId) {
        this.invites.set(id, { ...invite, googleAccountId: null });
      }
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    return this.systemSettings;
  }

  async updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    this.systemSettings = { ...this.systemSettings, ...updates, updatedAt: new Date() };
    return this.systemSettings;
  }

  // RSVP Events (placeholders for MemStorage)
  async getRsvpEvents(inviteId?: number, userId?: string): Promise<RsvpEvent[]> {
    // Placeholder implementation for memory storage
    return [];
  }

  async createRsvpEvent(event: InsertRsvpEvent): Promise<RsvpEvent> {
    // Placeholder implementation for memory storage
    const newEvent = {
      ...event,
      id: this.currentId++,
      createdAt: new Date()
    } as RsvpEvent;
    return newEvent;
  }

  async getRsvpHistory(inviteId: number, userId?: string): Promise<RsvpEvent[]> {
    // Placeholder implementation for memory storage
    return [];
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
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const activeCampaigns = Array.from(this.campaigns.values()).filter(
      c => c.isActive && c.status === "active" && c.userId === userId
    ).length;
    
    const invitesToday = await this.getInvitesToday(userId);
    const acceptedInvites = await this.getAcceptedInvites(userId);
    const connectedAccounts = Array.from(this.googleAccounts.values()).filter(
      a => a.isActive && a.userId === userId
    ).length;
    
    const totalInvites = Array.from(this.invites.values()).filter(
      invite => invite.userId === userId
    ).length;
    const acceptanceRate = totalInvites > 0 ? (acceptedInvites / totalInvites) * 100 : 0;
    
    const pendingQueue = Array.from(this.inviteQueue.values()).filter(
      item => item.status === "pending" && 
      item.metadata && (item.metadata as any).userId === userId
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

  async getCampaignInboxStats(campaignId: number, userId: string): Promise<Array<{
    inboxId: number;
    email: string;
    name: string;
    invitesSent: number;
    accepted: number;
    declined: number;
    tentative: number;
    pending: number;
    lastUsed: string | null;
    dailyLimit: number;
    dailyUsed: number;
  }>> {
    const campaign = await this.getCampaign(campaignId, userId);
    if (!campaign) return [];

    const stats: Array<any> = [];
    
    for (const inboxId of campaign.selectedInboxes) {
      const inbox = this.googleAccounts.get(inboxId);
      if (!inbox || inbox.userId !== userId) continue;

      const campaignInvites = Array.from(this.invites.values()).filter(
        invite => invite.campaignId === campaignId && 
                 invite.googleAccountId === inboxId &&
                 invite.userId === userId
      );

      const dailyUsed = await this.getInvitesTodayByAccount(inboxId, userId);

      stats.push({
        inboxId: inbox.id,
        email: inbox.email,
        name: inbox.name,
        invitesSent: campaignInvites.filter(i => i.status === 'sent' || i.sentAt).length,
        accepted: campaignInvites.filter(i => i.rsvpStatus === 'accepted').length,
        declined: campaignInvites.filter(i => i.rsvpStatus === 'declined').length,
        tentative: campaignInvites.filter(i => i.rsvpStatus === 'tentative').length,
        pending: campaignInvites.filter(i => i.status === 'pending').length,
        lastUsed: inbox.lastUsed ? inbox.lastUsed.toISOString() : null,
        dailyLimit: campaign.maxInvitesPerInbox || 20,
        dailyUsed
      });
    }

    return stats;
  }

  async getCampaignDetailedStats(campaignId: number, userId: string): Promise<{
    totalProspects: number;
    invitesSent: number;
    pending: number;
    accepted: number;
    declined: number;
    tentative: number;
    errors: number;
    dailyProgress: Array<{ date: string; sent: number; accepted: number }>;
    inboxUsage: Array<{ inboxId: number; email: string; usage: number; limit: number }>;
  }> {
    const campaignInvites = Array.from(this.invites.values()).filter(
      invite => invite.campaignId === campaignId && invite.userId === userId
    );

    const campaign = await this.getCampaign(campaignId, userId);
    const csvData = campaign?.csvData as any[];
    
    const stats = {
      totalProspects: csvData?.length || 0,
      invitesSent: campaignInvites.filter(i => i.status === 'sent' || i.sentAt).length,
      pending: campaignInvites.filter(i => i.status === 'pending').length,
      accepted: campaignInvites.filter(i => i.rsvpStatus === 'accepted').length,
      declined: campaignInvites.filter(i => i.rsvpStatus === 'declined').length,
      tentative: campaignInvites.filter(i => i.rsvpStatus === 'tentative').length,
      errors: campaignInvites.filter(i => i.status === 'error').length,
      dailyProgress: [] as Array<{ date: string; sent: number; accepted: number }>,
      inboxUsage: [] as Array<{ inboxId: number; email: string; usage: number; limit: number }>
    };

    // Generate daily progress for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySent = campaignInvites.filter(invite => 
        invite.sentAt && invite.sentAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayAccepted = campaignInvites.filter(invite => 
        invite.rsvpResponseAt && invite.rsvpResponseAt.toISOString().split('T')[0] === dateStr &&
        invite.rsvpStatus === 'accepted'
      ).length;

      stats.dailyProgress.push({ date: dateStr, sent: daySent, accepted: dayAccepted });
    }

    // Generate inbox usage stats
    if (campaign) {
      for (const inboxId of campaign.selectedInboxes) {
        const inbox = this.googleAccounts.get(inboxId);
        if (inbox) {
          const dailyUsed = await this.getInvitesTodayByAccount(inboxId, userId);
          stats.inboxUsage.push({
            inboxId: inbox.id,
            email: inbox.email,
            usage: dailyUsed,
            limit: campaign.maxInvitesPerInbox || 20
          });
        }
      }
    }

    return stats;
  }
}

// Database storage implementation - imports moved to top

class PostgresStorage implements IStorage {
  private db: any;

  constructor() {
    this.db = db;
  }

  // Google Accounts
  async getGoogleAccounts(userId: string): Promise<GoogleAccount[]> {
    return await this.db.select().from(schema.googleAccounts).where(
      and(
        eq(schema.googleAccounts.userId, userId),
        eq(schema.googleAccounts.isActive, true)
      )
    );
  }

  async getGoogleAccount(id: number, userId: string): Promise<GoogleAccount | undefined> {
    const result = await this.db.select().from(schema.googleAccounts).where(
      and(
        eq(schema.googleAccounts.id, id),
        eq(schema.googleAccounts.userId, userId)
      )
    );
    return result[0];
  }

  async getGoogleAccountByEmail(email: string, userId: string): Promise<GoogleAccount | undefined> {
    const result = await this.db.select().from(schema.googleAccounts).where(
      and(
        eq(schema.googleAccounts.email, email),
        eq(schema.googleAccounts.userId, userId)
      )
    );
    return result[0];
  }

  async createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount> {
    const result = await this.db.insert(schema.googleAccounts).values(account).returning();
    return result[0];
  }

  async updateGoogleAccount(id: number, updates: Partial<GoogleAccount>, userId: string): Promise<GoogleAccount> {
    const result = await this.db.update(schema.googleAccounts).set(updates).where(
      and(
        eq(schema.googleAccounts.id, id),
        eq(schema.googleAccounts.userId, userId)
      )
    ).returning();
    return result[0];
  }

  async deleteGoogleAccount(id: number, userId: string): Promise<void> {
    await this.db.delete(schema.googleAccounts).where(
      and(
        eq(schema.googleAccounts.id, id),
        eq(schema.googleAccounts.userId, userId)
      )
    );
  }

  async disconnectGoogleAccount(id: number, userId: string): Promise<void> {
    // COMPLETE DELETION: Remove account entirely from database
    await this.db
      .delete(schema.googleAccounts)
      .where(
        and(
          eq(schema.googleAccounts.id, id),
          eq(schema.googleAccounts.userId, userId)
        )
      );
  }

  async getCampaignsUsingInbox(inboxId: number, userId: string): Promise<{ id: number; name: string; status: string }[]> {
    try {
      // Get user's campaigns and filter those that include this inbox
      const campaigns = await this.db.select().from(schema.campaigns).where(eq(schema.campaigns.userId, userId));
      
      return campaigns
        .filter(campaign => {
          if (!campaign.selectedInboxes) return false;
          // Handle both array and JSON string formats
          const inboxes = Array.isArray(campaign.selectedInboxes) 
            ? campaign.selectedInboxes 
            : JSON.parse(campaign.selectedInboxes);
          return inboxes.includes(inboxId);
        })
        .map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status
        }));
    } catch (error) {
      console.error("Error in getCampaignsUsingInbox:", error);
      return [];
    }
  }

  async getAccountsWithStatus(userId: string): Promise<AccountWithStatus[]> {
    const accounts = await this.getGoogleAccounts(userId);
    return accounts.map(account => ({
      ...account,
      nextAvailable: null,
      isInCooldown: false
    }));
  }

  // Outlook Accounts
  async getOutlookAccounts(): Promise<OutlookAccount[]> {
    return await this.db.select().from(schema.outlookAccounts);
  }

  async getOutlookAccount(id: number): Promise<OutlookAccount | undefined> {
    const result = await this.db.select().from(schema.outlookAccounts).where(eq(schema.outlookAccounts.id, id));
    return result[0];
  }

  async getOutlookAccountByEmail(email: string): Promise<OutlookAccount | undefined> {
    const result = await this.db.select().from(schema.outlookAccounts).where(eq(schema.outlookAccounts.email, email));
    return result[0];
  }

  async createOutlookAccount(account: InsertOutlookAccount): Promise<OutlookAccount> {
    const result = await this.db.insert(schema.outlookAccounts).values(account).returning();
    return result[0];
  }

  async updateOutlookAccount(id: number, updates: Partial<OutlookAccount>): Promise<OutlookAccount> {
    const result = await this.db.update(schema.outlookAccounts).set(updates).where(eq(schema.outlookAccounts.id, id)).returning();
    return result[0];
  }

  async deleteOutlookAccount(id: number): Promise<void> {
    await this.db.delete(schema.outlookAccounts).where(eq(schema.outlookAccounts.id, id));
  }

  // Campaigns
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await this.db.select().from(schema.campaigns).where(eq(schema.campaigns.userId, userId)).orderBy(desc(schema.campaigns.createdAt));
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const result = await this.db.select().from(schema.campaigns).where(
      and(
        eq(schema.campaigns.id, id),
        eq(schema.campaigns.userId, userId)
      )
    );
    return result[0];
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const result = await this.db.insert(schema.campaigns).values(campaign).returning();
    return result[0];
  }

  async updateCampaign(id: number, updates: Partial<Campaign>, userId: string): Promise<Campaign> {
    const result = await this.db.update(schema.campaigns).set(updates).where(
      and(
        eq(schema.campaigns.id, id),
        eq(schema.campaigns.userId, userId)
      )
    ).returning();
    return result[0];
  }

  async deleteCampaign(id: number, userId: string): Promise<void> {
    try {
      console.log(`Starting deletion of campaign ${id} for user ${userId}`);
      
      // First check if there are any processing queue items
      const processingItems = await this.db.select()
        .from(schema.inviteQueue)
        .where(and(
          eq(schema.inviteQueue.campaignId, id),
          eq(schema.inviteQueue.status, 'processing')
        ));

      console.log(`Found ${processingItems.length} processing items for campaign ${id}`);

      if (processingItems.length > 0) {
        throw new Error('Cannot delete campaign while invites are being processed. Please wait and try again.');
      }

      // Set campaign as inactive first to prevent new processing
      console.log(`Setting campaign ${id} as inactive...`);
      await this.db.update(schema.campaigns)
        .set({ isActive: false, status: 'deleted' })
        .where(and(
          eq(schema.campaigns.id, id),
          eq(schema.campaigns.userId, userId)
        ));

      // Delete related records
      console.log(`Deleting related records for campaign ${id}...`);
      
      // Delete queue items first
      const deletedQueue = await this.db.delete(schema.inviteQueue)
        .where(eq(schema.inviteQueue.campaignId, id))
        .returning();
      console.log(`Deleted ${deletedQueue.length} queue items`);
      
      // Get all invites for this campaign to delete their related records
      const campaignInvites = await this.db.select({ id: schema.invites.id })
        .from(schema.invites)
        .where(and(
          eq(schema.invites.campaignId, id),
          eq(schema.invites.userId, userId)
        ));
      
      // Delete related records for these invites
      if (campaignInvites.length > 0) {
        const inviteIds = campaignInvites.map(invite => invite.id);
        let deletedRsvpEventsCount = 0;
        let deletedActivityLogsCount = 0;
        
        // Delete RSVP events and activity logs for each invite
        for (const inviteId of inviteIds) {
          // Delete RSVP events first
          const deletedRsvpEvents = await this.db.delete(schema.rsvpEvents)
            .where(eq(schema.rsvpEvents.inviteId, inviteId))
            .returning();
          deletedRsvpEventsCount += deletedRsvpEvents.length;
          
          // Delete activity logs that reference this invite
          const deletedActivityLogs = await this.db.delete(schema.activityLogs)
            .where(and(
              eq(schema.activityLogs.inviteId, inviteId),
              eq(schema.activityLogs.userId, userId)
            ))
            .returning();
          deletedActivityLogsCount += deletedActivityLogs.length;
        }
        
        console.log(`Deleted ${deletedRsvpEventsCount} RSVP events`);
        console.log(`Deleted ${deletedActivityLogsCount} activity logs linked to invites`);
      }
      
      // Delete invites
      const deletedInvites = await this.db.delete(schema.invites)
        .where(and(
          eq(schema.invites.campaignId, id),
          eq(schema.invites.userId, userId)
        ))
        .returning();
      console.log(`Deleted ${deletedInvites.length} invites`);
      
      // Delete remaining activity logs (those not linked to specific invites)
      const deletedLogs = await this.db.delete(schema.activityLogs)
        .where(and(
          eq(schema.activityLogs.campaignId, id),
          eq(schema.activityLogs.userId, userId),
          isNull(schema.activityLogs.inviteId) // Only delete logs without invite references
        ))
        .returning();
      console.log(`Deleted ${deletedLogs.length} remaining activity logs`);
      
      // Finally delete the campaign (with user filtering)
      console.log(`Deleting campaign ${id}...`);
      const deletedCampaigns = await this.db.delete(schema.campaigns)
        .where(and(
          eq(schema.campaigns.id, id),
          eq(schema.campaigns.userId, userId)
        ))
        .returning();
      
      if (deletedCampaigns.length === 0) {
        throw new Error('Campaign not found or does not belong to user');
      }
      
      console.log(`Successfully deleted campaign ${id}`);
    } catch (error) {
      console.error(`Error deleting campaign ${id}:`, error);
      throw error;
    }
  }

  async getCampaignsWithStats(userId: string): Promise<CampaignWithStats[]> {
    const campaigns = await this.getCampaigns(userId);
    const campaignsWithStats: CampaignWithStats[] = [];

    for (const campaign of campaigns) {
      const invites = await this.db.select().from(schema.invites).where(eq(schema.invites.campaignId, campaign.id));
      const sentInvites = invites.filter(invite => invite.status === 'sent' || invite.status === 'accepted');
      const accepted = invites.filter(invite => invite.status === 'accepted').length;
      
      // Get queue statistics
      const queueItems = await this.db.select().from(schema.inviteQueue).where(eq(schema.inviteQueue.campaignId, campaign.id));
      const pendingInvites = queueItems.filter(item => item.status === 'pending').length;
      const processingInvites = queueItems.filter(item => item.status === 'processing').length;
      
      // Calculate total prospects from CSV data
      const csvData = campaign.csvData as Record<string, string>[] || [];
      const totalProspects = csvData.length;
      
      // Calculate progress as sent invites vs total prospects
      const progress = totalProspects > 0 ? (sentInvites.length / totalProspects) * 100 : 0;
      
      // Calculate RSVP statistics
      const declined = invites.filter(invite => invite.rsvpStatus === 'declined').length;
      const tentative = invites.filter(invite => invite.rsvpStatus === 'tentative').length;
      const noResponse = invites.filter(invite => invite.status === 'sent' && !invite.rsvpStatus).length;
      
      const acceptanceRate = sentInvites.length > 0 ? Math.round((accepted / sentInvites.length) * 100 * 10) / 10 : 0;
      const responseRate = sentInvites.length > 0 ? Math.round(((accepted + declined + tentative) / sentInvites.length) * 100 * 10) / 10 : 0;

      campaignsWithStats.push({
        ...campaign,
        invitesSent: sentInvites.length,
        accepted,
        declined,
        tentative,
        noResponse,
        totalProspects,
        progress: Math.round(progress * 10) / 10,
        pendingInvites,
        processingInvites,
        acceptanceRate,
        responseRate
      });
    }

    return campaignsWithStats;
  }

  // Invites
  async getInvites(userId: string, campaignId?: number): Promise<Invite[]> {
    if (campaignId) {
      return await this.db.select().from(schema.invites).where(
        and(
          eq(schema.invites.campaignId, campaignId),
          eq(schema.invites.userId, userId)
        )
      );
    }
    return await this.db.select().from(schema.invites).where(eq(schema.invites.userId, userId)).orderBy(desc(schema.invites.createdAt));
  }

  async getInvite(id: number, userId: string): Promise<Invite | undefined> {
    const result = await this.db.select().from(schema.invites).where(
      and(
        eq(schema.invites.id, id),
        eq(schema.invites.userId, userId)
      )
    );
    return result[0];
  }

  async createInvite(invite: InsertInvite): Promise<Invite> {
    const result = await this.db.insert(schema.invites).values(invite).returning();
    return result[0];
  }

  async updateInvite(id: number, updates: Partial<Invite>, userId: string): Promise<Invite> {
    const result = await this.db.update(schema.invites).set(updates).where(
      and(
        eq(schema.invites.id, id),
        eq(schema.invites.userId, userId)
      )
    ).returning();
    return result[0];
  }

  async getInvitesByStatus(status: string, userId: string): Promise<Invite[]> {
    return await this.db.select().from(schema.invites).where(
      and(
        eq(schema.invites.status, status),
        eq(schema.invites.userId, userId)
      )
    );
  }

  async getInvitesToday(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.db.select({ count: count() }).from(schema.invites)
      .where(and(
        eq(schema.invites.userId, userId),
        sql`${schema.invites.createdAt} >= ${today}`
      ));
    return result[0]?.count || 0;
  }

  async getAcceptedInvites(userId: string): Promise<number> {
    const result = await this.db.select({ count: count() }).from(schema.invites)
      .where(and(
        eq(schema.invites.userId, userId),
        eq(schema.invites.status, 'accepted')
      ));
    return result[0]?.count || 0;
  }

  async getInvitesTodayByAccount(accountId: number, userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.db.select({ count: count() }).from(schema.invites)
      .where(and(
        eq(schema.invites.userId, userId),
        eq(schema.invites.googleAccountId, accountId),
        sql`${schema.invites.sentAt} >= ${today}`
      ));
    return result[0]?.count || 0;
  }

  async getInvitesByRsvpStatus(rsvpStatus: string, userId: string): Promise<Invite[]> {
    return await this.db.select().from(schema.invites).where(
      and(
        eq(schema.invites.rsvpStatus, rsvpStatus),
        eq(schema.invites.userId, userId)
      )
    );
  }

  async updateInviteRsvpStatus(inviteId: number, rsvpStatus: string, source: string, webhookPayload?: any): Promise<void> {
    const invite = await this.getInvite(inviteId);
    if (!invite) throw new Error(`Invite ${inviteId} not found`);

    const now = new Date();
    const previousStatus = invite.rsvpStatus;

    // Update invite record
    const updates: Partial<Invite> = {
      rsvpStatus,
      rsvpResponseAt: now,
      lastStatusCheck: now,
      webhookReceived: source === 'webhook',
      updatedAt: now,
    };

    // Set specific timestamp fields based on status
    if (rsvpStatus === 'accepted') {
      updates.acceptedAt = now;
      updates.status = 'accepted';
    } else if (rsvpStatus === 'declined') {
      updates.declinedAt = now;
      updates.status = 'declined';
    } else if (rsvpStatus === 'tentative') {
      updates.tentativeAt = now;
      updates.status = 'tentative';
    }

    await this.updateInvite(inviteId, updates);

    // Create RSVP event record
    if (invite.eventId) {
      await this.createRsvpEvent({
        inviteId,
        eventId: invite.eventId,
        prospectEmail: invite.prospectEmail,
        rsvpStatus,
        previousStatus,
        source,
        webhookPayload,
        responseAt: now,
      });
    }

    // Create activity log
    await this.createActivityLog({
      type: `invite_${rsvpStatus}`,
      campaignId: invite.campaignId,
      inviteId,
      googleAccountId: invite.googleAccountId,
      message: `${invite.prospectEmail} ${rsvpStatus} calendar invite`,
      metadata: { 
        prospectEmail: invite.prospectEmail, 
        rsvpStatus, 
        previousStatus,
        source 
      },
    });
  }

  async getInviteByEventId(eventId: string): Promise<Invite | undefined> {
    const result = await this.db.select().from(schema.invites).where(eq(schema.invites.eventId, eventId));
    return result[0];
  }

  // RSVP Events
  async getRsvpEvents(inviteId?: number, userId?: string): Promise<RsvpEvent[]> {
    const conditions = [];
    if (inviteId) {
      conditions.push(eq(schema.rsvpEvents.inviteId, inviteId));
    }
    if (userId) {
      conditions.push(eq(schema.rsvpEvents.userId, userId));
    }
    
    let query = this.db.select().from(schema.rsvpEvents);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(schema.rsvpEvents.createdAt));
  }

  async createRsvpEvent(event: InsertRsvpEvent): Promise<RsvpEvent> {
    const result = await this.db.insert(schema.rsvpEvents).values(event).returning();
    return result[0];
  }

  async getRsvpHistory(inviteId: number, userId?: string): Promise<RsvpEvent[]> {
    const conditions = [eq(schema.rsvpEvents.inviteId, inviteId)];
    if (userId) {
      conditions.push(eq(schema.rsvpEvents.userId, userId));
    }
    
    return await this.db.select().from(schema.rsvpEvents)
      .where(and(...conditions))
      .orderBy(schema.rsvpEvents.responseAt);
  }

  // Webhook Events
  async getWebhookEvents(processed?: boolean): Promise<WebhookEvent[]> {
    if (processed !== undefined) {
      return await this.db.select().from(schema.webhookEvents)
        .where(eq(schema.webhookEvents.processed, processed))
        .orderBy(desc(schema.webhookEvents.createdAt));
    }
    return await this.db.select().from(schema.webhookEvents)
      .orderBy(desc(schema.webhookEvents.createdAt));
  }

  async createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const result = await this.db.insert(schema.webhookEvents).values(event).returning();
    return result[0];
  }

  async markWebhookProcessed(id: number, success: boolean, error?: string): Promise<void> {
    const updates: Partial<WebhookEvent> = {
      processed: true,
    };
    if (error) {
      updates.processingError = error;
    }
    await this.db.update(schema.webhookEvents).set(updates).where(eq(schema.webhookEvents.id, id));
  }

  // Activity Logs
  async getActivityLogs(limit = 50, userId?: string): Promise<ActivityLog[]> {
    let query = this.db.select().from(schema.activityLogs);
    
    if (userId) {
      query = query.where(eq(schema.activityLogs.userId, userId));
    }
    
    return await query
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await this.db.insert(schema.activityLogs).values(log).returning();
    return result[0];
  }

  async cleanupActivityLogsForAccount(accountId: number): Promise<void> {
    const { activityLogs } = schema;
    await this.db.update(activityLogs)
      .set({ googleAccountId: null })
      .where(eq(activityLogs.googleAccountId, accountId));
  }

  async cleanupInvitesForAccount(accountId: number): Promise<void> {
    const { invites } = schema;
    await this.db.update(invites)
      .set({ googleAccountId: null })
      .where(eq(invites.googleAccountId, accountId));
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const result = await this.db.select().from(schema.systemSettings).limit(1);
    if (result.length === 0) {
      // Create default settings
      const defaultSettings = {
        dailyInviteLimit: 100,
        inboxCooldownMinutes: 30,
        inviteIntervalMinutes: 5,
        enableEmailConfirmations: true,
        enableTimeSlotScheduling: true
      };
      const created = await this.db.insert(schema.systemSettings).values(defaultSettings).returning();
      return created[0];
    }
    return result[0];
  }

  async updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const settings = await this.getSystemSettings();
    const result = await this.db.update(schema.systemSettings).set(updates).where(eq(schema.systemSettings.id, settings.id)).returning();
    return result[0];
  }

  // Queue
  async getQueueItems(status?: string): Promise<InviteQueue[]> {
    if (status) {
      return await this.db.select().from(schema.inviteQueue).where(eq(schema.inviteQueue.status, status));
    }
    return await this.db.select().from(schema.inviteQueue).orderBy(schema.inviteQueue.scheduledFor);
  }

  async createQueueItem(item: InsertInviteQueue): Promise<InviteQueue> {
    const result = await this.db.insert(schema.inviteQueue).values(item).returning();
    return result[0];
  }

  async updateQueueItem(id: number, updates: Partial<InviteQueue>): Promise<InviteQueue> {
    const result = await this.db.update(schema.inviteQueue).set(updates).where(eq(schema.inviteQueue.id, id)).returning();
    return result[0];
  }

  async getNextQueueItem(): Promise<InviteQueue | undefined> {
    const result = await this.db.select().from(schema.inviteQueue)
      .where(eq(schema.inviteQueue.status, 'pending'))
      .orderBy(schema.inviteQueue.scheduledFor)
      .limit(1);
    return result[0];
  }

  // Dashboard
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const campaigns = await this.db.select({ count: count() }).from(schema.campaigns)
      .where(and(
        eq(schema.campaigns.userId, userId),
        eq(schema.campaigns.status, 'active')
      ));
    const activeCampaigns = campaigns[0]?.count || 0;

    const invitesToday = await this.getInvitesToday(userId);
    const acceptedInvites = await this.getAcceptedInvites(userId);
    
    const accounts = await this.db.select({ count: count() }).from(schema.googleAccounts)
      .where(eq(schema.googleAccounts.userId, userId));
    const outlookAccounts = await this.db.select({ count: count() }).from(schema.outlookAccounts);
    const connectedAccounts = (accounts[0]?.count || 0) + (outlookAccounts[0]?.count || 0);

    const acceptanceRate = invitesToday > 0 ? (acceptedInvites / invitesToday) * 100 : 0;

    const pendingQueue = await this.db.select({ count: count() }).from(schema.inviteQueue)
      .where(eq(schema.inviteQueue.status, 'pending'));
    const queueCount = pendingQueue[0]?.count || 0;

    const settings = await this.getSystemSettings();

    return {
      activeCampaigns,
      invitesToday,
      acceptedInvites,
      connectedAccounts,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      dailyLimit: settings.dailyInviteLimit,
      apiUsage: Math.round((invitesToday / settings.dailyInviteLimit) * 100),
      queueStatus: queueCount > 0 ? `Processing ${queueCount} items` : "Idle",
    };
  }

  async getCampaignInboxStats(campaignId: number, userId: string): Promise<Array<{
    inboxId: number;
    email: string;
    name: string;
    invitesSent: number;
    accepted: number;
    declined: number;
    tentative: number;
    pending: number;
    lastUsed: string | null;
    dailyLimit: number;
    dailyUsed: number;
  }>> {
    const campaign = await this.getCampaign(campaignId, userId);
    if (!campaign) return [];

    const stats: Array<any> = [];
    
    for (const inboxId of campaign.selectedInboxes) {
      const inbox = await this.getGoogleAccount(inboxId, userId);
      if (!inbox) continue;

      // Get campaign-specific invite statistics for this user
      const campaignInvites = await this.db.select().from(schema.invites)
        .where(and(
          eq(schema.invites.campaignId, campaignId),
          eq(schema.invites.googleAccountId, inboxId),
          eq(schema.invites.userId, userId)
        ));

      const dailyUsed = await this.getInvitesTodayByAccount(inboxId, userId);

      stats.push({
        inboxId: inbox.id,
        email: inbox.email,
        name: inbox.name,
        invitesSent: campaignInvites.filter(i => i.status === 'sent' || i.sentAt).length,
        accepted: campaignInvites.filter(i => i.rsvpStatus === 'accepted').length,
        declined: campaignInvites.filter(i => i.rsvpStatus === 'declined').length,
        tentative: campaignInvites.filter(i => i.rsvpStatus === 'tentative').length,
        pending: campaignInvites.filter(i => i.status === 'pending').length,
        lastUsed: inbox.lastUsed ? inbox.lastUsed.toISOString() : null,
        dailyLimit: campaign.maxInvitesPerInbox || 20,
        dailyUsed
      });
    }

    return stats;
  }

  async getCampaignDetailedStats(campaignId: number, userId: string): Promise<{
    totalProspects: number;
    invitesSent: number;
    pending: number;
    accepted: number;
    declined: number;
    tentative: number;
    errors: number;
    dailyProgress: Array<{ date: string; sent: number; accepted: number }>;
    inboxUsage: Array<{ inboxId: number; email: string; usage: number; limit: number }>;
  }> {
    const campaignInvites = await this.db.select().from(schema.invites)
      .where(and(
        eq(schema.invites.campaignId, campaignId),
        eq(schema.invites.userId, userId)
      ));

    const campaign = await this.getCampaign(campaignId, userId);
    const csvData = campaign?.csvData as any[];
    
    const stats = {
      totalProspects: csvData?.length || 0,
      invitesSent: campaignInvites.filter(i => i.status === 'sent' || i.sentAt).length,
      pending: campaignInvites.filter(i => i.status === 'pending').length,
      accepted: campaignInvites.filter(i => i.rsvpStatus === 'accepted').length,
      declined: campaignInvites.filter(i => i.rsvpStatus === 'declined').length,
      tentative: campaignInvites.filter(i => i.rsvpStatus === 'tentative').length,
      errors: campaignInvites.filter(i => i.status === 'error').length,
      dailyProgress: [] as Array<{ date: string; sent: number; accepted: number }>,
      inboxUsage: [] as Array<{ inboxId: number; email: string; usage: number; limit: number }>
    };

    // Generate daily progress for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySent = campaignInvites.filter(invite => 
        invite.sentAt && invite.sentAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayAccepted = campaignInvites.filter(invite => 
        invite.rsvpResponseAt && invite.rsvpResponseAt.toISOString().split('T')[0] === dateStr &&
        invite.rsvpStatus === 'accepted'
      ).length;

      stats.dailyProgress.push({ date: dateStr, sent: daySent, accepted: dayAccepted });
    }

    // Generate inbox usage stats
    if (campaign) {
      for (const inboxId of campaign.selectedInboxes) {
        const inbox = await this.getGoogleAccount(inboxId, userId);
        if (inbox) {
          const dailyUsed = await this.getInvitesTodayByAccount(inboxId, userId);
          stats.inboxUsage.push({
            inboxId: inbox.id,
            email: inbox.email,
            usage: dailyUsed,
            limit: campaign.maxInvitesPerInbox || 20
          });
        }
      }
    }

    return stats;
  }
}

// Use in-memory storage temporarily while fixing database connection issues
export const storage = new PostgresStorage();
