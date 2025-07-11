import { storage } from "../storage";
import { googleCalendarService } from "./google-calendar";
import { oauthCalendarService } from "./oauth-calendar";
import { timeSlotManager, ProspectScheduleData } from "./time-slot-manager";
import { inboxLoadBalancer } from "./inbox-load-balancer";
import { advancedScheduler } from "./advanced-scheduler";
import type { Campaign, GoogleAccount } from "@shared/schema";

interface ProspectData {
  email: string;
  name?: string;
  company?: string;
  timezone?: string;
  time_zone?: string;
  preferred_hours?: string;
  preferredHours?: string;
  preferred_days?: string;
  preferredDays?: string;
  [key: string]: any;
}

export class CampaignProcessor {
  async processCampaign(campaign: Campaign): Promise<void> {
    if (campaign.status !== "active" || !campaign.isActive) {
      return;
    }

    try {
      // Get prospect data from CSV data stored in campaign
      const prospects = this.parseCSVProspects(campaign.csvData as Record<string, string>[]);
      
      if (prospects.length === 0) {
        return;
      }

      // Get campaign selected inboxes - CRITICAL FIX for inbox selection
      const selectedInboxes = campaign.selectedInboxes || [];
      if (selectedInboxes.length === 0) {
        console.warn(`Campaign ${campaign.id} has no selected inboxes, skipping`);
        return;
      }

      // Get only the selected accounts for this campaign
      const selectedAccounts: GoogleAccount[] = [];
      for (const inboxId of selectedInboxes) {
        const account = await storage.getGoogleAccount(inboxId);
        // CRITICAL FAIL-SAFE: Only use accounts with active status
        if (account && account.isActive && account.status === "active") {
          selectedAccounts.push(account);
        }
      }

      if (selectedAccounts.length === 0) {
        console.warn(`Campaign ${campaign.id} has no active selected inboxes available`);
        return;
      }

      // Get existing invites for this campaign to avoid duplicates
      const existingInvites = await storage.getInvites(campaign.id);
      const existingEmails = new Set(existingInvites.map(invite => invite.prospectEmail));

      // Handle scheduling based on campaign mode
      let scheduleSlots: Date[] = [];
      
      if (campaign.schedulingMode === "advanced" && campaign.randomizedSlots) {
        // Use pre-calculated randomized slots for advanced scheduling
        const slots = campaign.randomizedSlots as any[];
        scheduleSlots = slots.map(slot => new Date(slot.utcDateTime));
      } else {
        // Use immediate scheduling with proper 30-minute gaps - CRITICAL FIX
        scheduleSlots = prospects.map((_, index) => this.calculateScheduleTimeWithProperGaps(index));
      }

      // Add new prospects to the queue
      for (let index = 0; index < prospects.length; index++) {
        const prospect = prospects[index];
        if (existingEmails.has(prospect.email)) {
          continue; // Skip already processed prospects
        }

        // Get the scheduled time for this prospect
        const scheduledFor = scheduleSlots[index] || this.calculateScheduleTimeWithProperGaps(index);

        // Select inbox from campaign's selected inboxes only - CRITICAL FIX
        const selectedAccount = selectedAccounts[index % selectedAccounts.length];

        await storage.createQueueItem({
          campaignId: campaign.id,
          prospectData: {
            ...prospect,
            assignedInboxId: selectedAccount.id,
            assignedInboxEmail: selectedAccount.email,
          } as any,
          scheduledFor,
          status: "pending",
          attempts: 0,
        });

        await storage.createActivityLog({
          type: "prospect_scheduled",
          message: `Prospect ${prospect.email} scheduled for ${scheduledFor.toLocaleString()} via ${selectedAccount.email}`,
          campaignId: campaign.id,
          googleAccountId: selectedAccount.id,
        });
      }

      await storage.createActivityLog({
        type: "campaign_processed",
        campaignId: campaign.id,
        message: `Processed ${prospects.length} prospects for campaign ${campaign.name}`,
        metadata: { prospectCount: prospects.length },
      });
    } catch (error) {
      console.error(`Error processing campaign ${campaign.id}:`, error);
      
      await storage.createActivityLog({
        type: "campaign_error",
        campaignId: campaign.id,
        message: `Error processing campaign ${campaign.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  private parseCSVProspects(csvData: Record<string, string>[]): ProspectData[] {
    return csvData.map(row => {
      // Support both merge field format ({{field}}) and direct field names
      const cleanRow: Record<string, string> = {};
      
      // Clean merge field brackets and create both formats
      Object.keys(row).forEach(key => {
        const cleanKey = key.replace(/^\{\{|\}\}$/g, ''); // Remove {{ and }}
        cleanRow[cleanKey] = row[key];
        cleanRow[key] = row[key]; // Keep original key as well
      });

      const prospectData = {
        email: cleanRow.email || cleanRow.Email || cleanRow['{{email}}'] || "",
        name: cleanRow.firstname || cleanRow.name || cleanRow.Name || cleanRow.first_name || cleanRow.firstName || cleanRow['{{firstname}}'] || "",
        company: cleanRow.company || cleanRow.Company || cleanRow.organization || cleanRow['{{company}}'] || "",
        timezone: cleanRow.timezone || cleanRow.time_zone || cleanRow.Timezone || "",
        preferred_hours: cleanRow.preferred_hours || cleanRow.preferredHours || "",
        preferred_days: cleanRow.preferred_days || cleanRow.preferredDays || "",
        title: cleanRow.title || cleanRow.Title || cleanRow['{{title}}'] || "",
        website: cleanRow.website || cleanRow.Website || cleanRow['{{website}}'] || "",
        competitors: cleanRow.competitors || cleanRow.Competitors || cleanRow['{{competitors}}'] || "",
        ...cleanRow // Include all fields as merge data for templates
      };
      
      return prospectData;
    }).filter(prospect => prospect.email); // Only include rows with valid email
  }

  async processAllCampaigns(): Promise<void> {
    const campaigns = await storage.getCampaigns();
    
    for (const campaign of campaigns) {
      // CRITICAL FIX: Only process truly active campaigns
      if (campaign.status === "active" && campaign.isActive) {
        await this.processCampaign(campaign);
      }
    }
  }

  private calculateScheduleTime(index: number): Date {
    // Send invites starting 1 minute from now, with 30 seconds between each (LEGACY METHOD)
    const now = new Date();
    const minutesDelay = 1 + (index * 0.5); // Start at 1 minute, then 30 seconds between each
    return new Date(now.getTime() + minutesDelay * 60000);
  }

  private calculateScheduleTimeWithProperGaps(index: number): Date {
    // CRITICAL FIX: Send invites with minimum 30-minute gaps
    const now = new Date();
    const minutesDelay = 2 + (index * 30); // Start at 2 minutes, then 30 minutes between each
    return new Date(now.getTime() + minutesDelay * 60000);
  }

  private processMergeFields(template: string, data: Record<string, any>): string {
    let processed = template;
    
    Object.keys(data).forEach(key => {
      const value = data[key] || '';
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return processed;
  }

  private processSubjectLine(campaign: Campaign, prospectData: Record<string, any>): string {
    // Use campaign's custom subject line or default fallback
    const subjectTemplate = campaign.subjectLine || "Hi from {{sender_name}}";
    
    // Process merge fields
    const mergeData = {
      name: prospectData.name || prospectData.first_name || prospectData.firstName || '',
      company: prospectData.company || prospectData.company_name || prospectData.companyName || '',
      sender_name: campaign.senderName || 'Your Team',
      email: prospectData.email || ''
    };
    
    return this.processMergeFields(subjectTemplate, mergeData);
  }

  async createInviteFromQueue(queueItem: any): Promise<void> {
    const campaign = await storage.getCampaign(queueItem.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // CRITICAL FIX: Check campaign status before processing
    if (campaign.status !== "active" || !campaign.isActive) {
      console.log(`Skipping queue item for paused/inactive campaign ${campaign.id}`);
      await storage.updateQueueItem(queueItem.id, {
        status: "cancelled",
      });
      return;
    }

    // CRITICAL FIX: Only use pre-assigned inbox from campaign's selected inboxes
    let availableAccount: GoogleAccount | null = null;
    
    // Check if prospect has pre-assigned inbox from campaign selection
    const prospectData = queueItem.prospectData as ProspectData;
    if (prospectData.assignedInboxId) {
      const assignedAccount = await storage.getGoogleAccount(prospectData.assignedInboxId);
      if (assignedAccount && assignedAccount.isActive) {
        // Verify this account is in campaign's selected inboxes
        const selectedInboxes = campaign.selectedInboxes || [];
        if (selectedInboxes.includes(assignedAccount.id)) {
          availableAccount = assignedAccount;
        }
      }
    }
    
    // If no assigned account, select from campaign's selected inboxes only
    if (!availableAccount) {
      const selectedInboxes = campaign.selectedInboxes || [];
      for (const inboxId of selectedInboxes) {
        const account = await storage.getGoogleAccount(inboxId);
        if (account && account.isActive) {
          availableAccount = account;
          break;
        }
      }
    }
    
    if (!availableAccount) {
      throw new Error("No available Google account from campaign's selected inboxes");
    }

    // CRITICAL FAIL-SAFE: Double check account status before using
    if (availableAccount.status !== "active" || !availableAccount.isActive) {
      throw new Error(`Account ${availableAccount.email} is not active (status: ${availableAccount.status})`);
    }

    const prospect = prospectData;
    
    // Create the invite record
    const invite = await storage.createInvite({
      campaignId: campaign.id,
      googleAccountId: availableAccount.id,
      prospectEmail: prospect.email,
      prospectName: prospect.name,
      prospectCompany: prospect.company,
      mergeData: prospect,
      status: "pending",
    });

    try {
      // Process merge fields including sender information
      const mergeData = {
        name: prospect.name || prospect.email,
        company: prospect.company || "",
        sender_name: campaign.senderName || availableAccount.name || "Sales Team",
        sender_email: availableAccount.email,
        ...prospect,
      };

      const eventTitle = this.processMergeFields(
        campaign.eventTitleTemplate,
        mergeData
      );

      const eventDescription = this.processMergeFields(
        campaign.eventDescriptionTemplate,
        mergeData
      );

      // Process subject line for the invite email
      const subjectLine = this.processSubjectLine(campaign, mergeData);

      // Calculate event times
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      startTime.setHours(10, 0, 0, 0); // 10 AM
      const endTime = new Date(startTime.getTime() + campaign.eventDuration * 60000);

      // Create calendar event using OAuth calendar service
      const eventId = await oauthCalendarService.createEventWithOAuth(availableAccount, {
        title: eventTitle,
        description: eventDescription,
        attendeeEmail: prospect.email,
        startTime,
        endTime,
        timeZone: campaign.timeZone,
        subjectLine: subjectLine,
      });

      // Update invite with event ID and status
      await storage.updateInvite(invite.id, {
        eventId,
        status: "sent",
        sentAt: new Date(),
      });

      // Record successful usage in load balancer
      await inboxLoadBalancer.recordUsage(availableAccount.id, true);

      // Log successful invite creation
      console.log(`Calendar invite sent successfully to ${prospect.email}, Event ID: ${eventId}`);

      // Mark queue item as completed
      await storage.updateQueueItem(queueItem.id, {
        status: "completed",
      });

      await storage.createActivityLog({
        type: "invite_sent",
        campaignId: campaign.id,
        inviteId: invite.id,
        googleAccountId: availableAccount.id,
        message: `Invite sent to ${prospect.email}`,
        metadata: { 
          prospectEmail: prospect.email,
          eventId,
          senderEmail: availableAccount.email,
        },
      });
    } catch (error) {
      console.error(`Failed to send invite:`, error);
      
      await storage.updateInvite(invite.id, {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      // Record failed usage in load balancer
      await inboxLoadBalancer.recordUsage(availableAccount.id, false);

      await storage.updateQueueItem(queueItem.id, {
        status: "failed",
        attempts: queueItem.attempts + 1,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      await storage.createActivityLog({
        type: "invite_error",
        campaignId: campaign.id,
        inviteId: invite.id,
        googleAccountId: availableAccount.id,
        message: `Failed to send invite to ${queueItem.prospectData.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
        metadata: { 
          prospectEmail: queueItem.prospectData.email,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  private async findAvailableAccount(): Promise<GoogleAccount | null> {
    const accounts = await storage.getAccountsWithStatus();
    const settings = await storage.getSystemSettings();
    
    // Find accounts not in cooldown
    const availableAccounts = accounts.filter(
      account => account.isActive && !account.isInCooldown
    );

    if (availableAccounts.length === 0) {
      return null;
    }

    // Return the account that was used longest ago
    return availableAccounts.sort((a, b) => {
      const aLastUsed = a.lastUsed?.getTime() || 0;
      const bLastUsed = b.lastUsed?.getTime() || 0;
      return aLastUsed - bLastUsed;
    })[0];
  }

  // Cancel all pending queue items for a campaign when it's paused/stopped
  async cancelCampaignQueue(campaignId: number): Promise<void> {
    try {
      const pendingItems = await storage.getQueueItems("pending");
      const campaignItems = pendingItems.filter(item => item.campaignId === campaignId);
      
      for (const item of campaignItems) {
        await storage.updateQueueItem(item.id, {
          status: "cancelled",
        });
      }

      await storage.createActivityLog({
        type: "campaign_queue_cancelled",
        campaignId,
        message: `Cancelled ${campaignItems.length} pending queue items for campaign`,
        metadata: { cancelledItems: campaignItems.length },
      });

      console.log(`Cancelled ${campaignItems.length} pending queue items for campaign ${campaignId}`);
    } catch (error) {
      console.error(`Error cancelling queue for campaign ${campaignId}:`, error);
    }
  }
}

export const campaignProcessor = new CampaignProcessor();
