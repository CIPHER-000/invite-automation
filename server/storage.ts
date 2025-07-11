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
import { eq, desc, and, sql, count } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // Google Accounts
  getGoogleAccounts(): Promise<GoogleAccount[]>;
  getGoogleAccount(id: number): Promise<GoogleAccount | undefined>;
  getGoogleAccountByEmail(email: string): Promise<GoogleAccount | undefined>;
  createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount>;
  updateGoogleAccount(id: number, updates: Partial<GoogleAccount>): Promise<GoogleAccount>;
  deleteGoogleAccount(id: number): Promise<void>;
  disconnectGoogleAccount(id: number): Promise<void>;
  getCampaignsUsingInbox(inboxId: number): Promise<{ id: number; name: string; status: string }[]>;
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
  getInvitesByRsvpStatus(rsvpStatus: string): Promise<Invite[]>;
  getInvitesToday(): Promise<number>;
  getAcceptedInvites(): Promise<number>;
  updateInviteRsvpStatus(inviteId: number, rsvpStatus: string, source: string, webhookPayload?: any): Promise<void>;
  getInviteByEventId(eventId: string): Promise<Invite | undefined>;

  // RSVP Events
  getRsvpEvents(inviteId?: number): Promise<RsvpEvent[]>;
  createRsvpEvent(event: InsertRsvpEvent): Promise<RsvpEvent>;
  getRsvpHistory(inviteId: number): Promise<RsvpEvent[]>;

  // Webhook Events
  getWebhookEvents(processed?: boolean): Promise<WebhookEvent[]>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  markWebhookProcessed(id: number, success: boolean, error?: string): Promise<void>;

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
    const account = this.googleAccounts.get(id);
    if (account) {
      const updatedAccount = {
        ...account,
        isActive: false,
        status: "disconnected" as const,
        disconnectedAt: new Date(),
        accessToken: "", // Clear tokens
        refreshToken: "",
      };
      this.googleAccounts.set(id, updatedAccount);
    }
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
    // Check if there are any processing queue items
    const processingItems = Array.from(this.inviteQueue.values()).filter(
      item => item.campaignId === id && item.status === 'processing'
    );

    if (processingItems.length > 0) {
      throw new Error('Cannot delete campaign while invites are being processed. Please wait and try again.');
    }

    // Set campaign as inactive first to prevent new processing
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.isActive = false;
      campaign.status = 'deleted';
      this.campaigns.set(id, campaign);
    }

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

  async getCampaignsWithStats(): Promise<CampaignWithStats[]> {
    const campaigns = await this.getCampaigns();
    
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

// Database storage implementation - imports moved to top

class PostgresStorage implements IStorage {
  private db: any;

  constructor() {
    this.db = db;
  }

  // Google Accounts
  async getGoogleAccounts(): Promise<GoogleAccount[]> {
    return await this.db.select().from(schema.googleAccounts);
  }

  async getGoogleAccount(id: number): Promise<GoogleAccount | undefined> {
    const result = await this.db.select().from(schema.googleAccounts).where(eq(schema.googleAccounts.id, id));
    return result[0];
  }

  async getGoogleAccountByEmail(email: string): Promise<GoogleAccount | undefined> {
    const result = await this.db.select().from(schema.googleAccounts).where(eq(schema.googleAccounts.email, email));
    return result[0];
  }

  async createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount> {
    const result = await this.db.insert(schema.googleAccounts).values(account).returning();
    return result[0];
  }

  async updateGoogleAccount(id: number, updates: Partial<GoogleAccount>): Promise<GoogleAccount> {
    const result = await this.db.update(schema.googleAccounts).set(updates).where(eq(schema.googleAccounts.id, id)).returning();
    return result[0];
  }

  async deleteGoogleAccount(id: number): Promise<void> {
    await this.db.delete(schema.googleAccounts).where(eq(schema.googleAccounts.id, id));
  }

  async disconnectGoogleAccount(id: number): Promise<void> {
    await this.db
      .update(schema.googleAccounts)
      .set({
        isActive: false,
        status: "disconnected",
        disconnectedAt: new Date(),
        accessToken: "", // Clear sensitive tokens
        refreshToken: "",
      })
      .where(eq(schema.googleAccounts.id, id));
  }

  async getCampaignsUsingInbox(inboxId: number): Promise<{ id: number; name: string; status: string }[]> {
    try {
      // Get all campaigns and filter those that include this inbox
      const campaigns = await this.db.select().from(schema.campaigns);
      
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

  async getAccountsWithStatus(): Promise<AccountWithStatus[]> {
    const accounts = await this.getGoogleAccounts();
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
  async getCampaigns(): Promise<Campaign[]> {
    return await this.db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.createdAt));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const result = await this.db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
    return result[0];
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const result = await this.db.insert(schema.campaigns).values(campaign).returning();
    return result[0];
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign> {
    const result = await this.db.update(schema.campaigns).set(updates).where(eq(schema.campaigns.id, id)).returning();
    return result[0];
  }

  async deleteCampaign(id: number): Promise<void> {
    // First check if there are any processing queue items
    const processingItems = await this.db.select()
      .from(schema.inviteQueue)
      .where(and(
        eq(schema.inviteQueue.campaignId, id),
        eq(schema.inviteQueue.status, 'processing')
      ));

    if (processingItems.length > 0) {
      throw new Error('Cannot delete campaign while invites are being processed. Please wait and try again.');
    }

    // Set campaign as inactive first to prevent new processing
    await this.db.update(schema.campaigns)
      .set({ isActive: false, status: 'deleted' })
      .where(eq(schema.campaigns.id, id));

    // Delete related records
    await this.db.delete(schema.inviteQueue).where(eq(schema.inviteQueue.campaignId, id));
    await this.db.delete(schema.invites).where(eq(schema.invites.campaignId, id));
    await this.db.delete(schema.activityLogs).where(eq(schema.activityLogs.campaignId, id));
    
    // Finally delete the campaign
    await this.db.delete(schema.campaigns).where(eq(schema.campaigns.id, id));
  }

  async getCampaignsWithStats(): Promise<CampaignWithStats[]> {
    const campaigns = await this.getCampaigns();
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
  async getInvites(campaignId?: number): Promise<Invite[]> {
    if (campaignId) {
      return await this.db.select().from(schema.invites).where(eq(schema.invites.campaignId, campaignId));
    }
    return await this.db.select().from(schema.invites).orderBy(desc(schema.invites.createdAt));
  }

  async getInvite(id: number): Promise<Invite | undefined> {
    const result = await this.db.select().from(schema.invites).where(eq(schema.invites.id, id));
    return result[0];
  }

  async createInvite(invite: InsertInvite): Promise<Invite> {
    const result = await this.db.insert(schema.invites).values(invite).returning();
    return result[0];
  }

  async updateInvite(id: number, updates: Partial<Invite>): Promise<Invite> {
    const result = await this.db.update(schema.invites).set(updates).where(eq(schema.invites.id, id)).returning();
    return result[0];
  }

  async getInvitesByStatus(status: string): Promise<Invite[]> {
    return await this.db.select().from(schema.invites).where(eq(schema.invites.status, status));
  }

  async getInvitesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.db.select({ count: count() }).from(schema.invites)
      .where(sql`${schema.invites.createdAt} >= ${today}`);
    return result[0]?.count || 0;
  }

  async getAcceptedInvites(): Promise<number> {
    const result = await this.db.select({ count: count() }).from(schema.invites)
      .where(eq(schema.invites.status, 'accepted'));
    return result[0]?.count || 0;
  }

  async getInvitesByRsvpStatus(rsvpStatus: string): Promise<Invite[]> {
    return await this.db.select().from(schema.invites).where(eq(schema.invites.rsvpStatus, rsvpStatus));
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
  async getRsvpEvents(inviteId?: number): Promise<RsvpEvent[]> {
    if (inviteId) {
      return await this.db.select().from(schema.rsvpEvents)
        .where(eq(schema.rsvpEvents.inviteId, inviteId))
        .orderBy(desc(schema.rsvpEvents.createdAt));
    }
    return await this.db.select().from(schema.rsvpEvents)
      .orderBy(desc(schema.rsvpEvents.createdAt));
  }

  async createRsvpEvent(event: InsertRsvpEvent): Promise<RsvpEvent> {
    const result = await this.db.insert(schema.rsvpEvents).values(event).returning();
    return result[0];
  }

  async getRsvpHistory(inviteId: number): Promise<RsvpEvent[]> {
    return await this.db.select().from(schema.rsvpEvents)
      .where(eq(schema.rsvpEvents.inviteId, inviteId))
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
  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    return await this.db.select().from(schema.activityLogs)
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await this.db.insert(schema.activityLogs).values(log).returning();
    return result[0];
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
  async getDashboardStats(): Promise<DashboardStats> {
    const campaigns = await this.db.select({ count: count() }).from(schema.campaigns)
      .where(eq(schema.campaigns.status, 'active'));
    const activeCampaigns = campaigns[0]?.count || 0;

    const invitesToday = await this.getInvitesToday();
    const acceptedInvites = await this.getAcceptedInvites();
    
    const accounts = await this.db.select({ count: count() }).from(schema.googleAccounts);
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
}

// Use in-memory storage temporarily while fixing database connection issues
export const storage = new PostgresStorage();
