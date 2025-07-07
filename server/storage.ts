import { Campaign, InsertCampaign, GoogleAccount, InsertGoogleAccount, MeetingInvite, InsertMeetingInvite } from '../shared/schema.js';

export interface IStorage {
  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | null>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | null>;
  deleteCampaign(id: string): Promise<boolean>;

  // Google Accounts
  getGoogleAccounts(): Promise<GoogleAccount[]>;
  getGoogleAccount(id: string): Promise<GoogleAccount | null>;
  getGoogleAccountByEmail(email: string): Promise<GoogleAccount | null>;
  createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount>;
  updateGoogleAccount(id: string, account: Partial<InsertGoogleAccount>): Promise<GoogleAccount | null>;
  deleteGoogleAccount(id: string): Promise<boolean>;

  // Meeting Invites
  getMeetingInvites(): Promise<MeetingInvite[]>;
  getMeetingInvitesByCampaign(campaignId: string): Promise<MeetingInvite[]>;
  createMeetingInvite(invite: InsertMeetingInvite): Promise<MeetingInvite>;
  updateMeetingInvite(id: string, invite: Partial<InsertMeetingInvite>): Promise<MeetingInvite | null>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private campaigns: Campaign[] = [];
  private googleAccounts: GoogleAccount[] = [];
  private meetingInvites: MeetingInvite[] = [];

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return this.campaigns;
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    return this.campaigns.find(c => c.id === id) || null;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const newCampaign: Campaign = {
      ...campaign,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | null> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    this.campaigns[index] = {
      ...this.campaigns[index],
      ...campaign,
      updatedAt: new Date(),
    };
    return this.campaigns[index];
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.campaigns.splice(index, 1);
    return true;
  }

  // Google Accounts
  async getGoogleAccounts(): Promise<GoogleAccount[]> {
    return this.googleAccounts;
  }

  async getGoogleAccount(id: string): Promise<GoogleAccount | null> {
    return this.googleAccounts.find(a => a.id === id) || null;
  }

  async getGoogleAccountByEmail(email: string): Promise<GoogleAccount | null> {
    return this.googleAccounts.find(a => a.email === email) || null;
  }

  async createGoogleAccount(account: InsertGoogleAccount): Promise<GoogleAccount> {
    const newAccount: GoogleAccount = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.googleAccounts.push(newAccount);
    return newAccount;
  }

  async updateGoogleAccount(id: string, account: Partial<InsertGoogleAccount>): Promise<GoogleAccount | null> {
    const index = this.googleAccounts.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    this.googleAccounts[index] = {
      ...this.googleAccounts[index],
      ...account,
    };
    return this.googleAccounts[index];
  }

  async deleteGoogleAccount(id: string): Promise<boolean> {
    const index = this.googleAccounts.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.googleAccounts.splice(index, 1);
    return true;
  }

  // Meeting Invites
  async getMeetingInvites(): Promise<MeetingInvite[]> {
    return this.meetingInvites;
  }

  async getMeetingInvitesByCampaign(campaignId: string): Promise<MeetingInvite[]> {
    return this.meetingInvites.filter(i => i.campaignId === campaignId);
  }

  async createMeetingInvite(invite: InsertMeetingInvite): Promise<MeetingInvite> {
    const newInvite: MeetingInvite = {
      ...invite,
      id: crypto.randomUUID(),
      sentAt: new Date(),
    };
    this.meetingInvites.push(newInvite);
    return newInvite;
  }

  async updateMeetingInvite(id: string, invite: Partial<InsertMeetingInvite>): Promise<MeetingInvite | null> {
    const index = this.meetingInvites.findIndex(i => i.id === id);
    if (index === -1) return null;
    
    this.meetingInvites[index] = {
      ...this.meetingInvites[index],
      ...invite,
    };
    return this.meetingInvites[index];
  }
}

export const storage = new MemStorage();