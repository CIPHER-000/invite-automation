import { storage } from "../storage";
import { googleCalendarService } from "./google-calendar";
import { timeSlotManager, ProspectScheduleData } from "./time-slot-manager";
import { inboxLoadBalancer } from "./inbox-load-balancer";
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

      // Get existing invites for this campaign to avoid duplicates
      const existingInvites = await storage.getInvites(campaign.id);
      const existingEmails = new Set(existingInvites.map(invite => invite.prospectEmail));

      // Add new prospects to the queue with smart scheduling
      for (const [index, prospect] of prospects.entries()) {
        if (existingEmails.has(prospect.email)) {
          continue; // Skip already processed prospects
        }

        // Convert prospect data to scheduling format
        const prospectScheduleData: ProspectScheduleData = {
          email: prospect.email,
          timezone: prospect.timezone || prospect.time_zone,
          preferredHours: prospect.preferred_hours || prospect.preferredHours,
          preferredDays: prospect.preferred_days || prospect.preferredDays,
        };

        // Get best available inbox for this prospect
        const availableInbox = await inboxLoadBalancer.getBestAvailableInbox();
        if (!availableInbox) {
          console.warn(`No available inbox for prospect ${prospect.email}, using fallback scheduling`);
          // Fallback to old method if no inbox available
          const scheduledFor = this.calculateScheduleTime(index);
          await storage.createQueueItem({
            campaignId: campaign.id,
            prospectData: prospect as any,
            scheduledFor,
            status: "pending",
            attempts: 0,
          });
          continue;
        }

        // Generate smart time slot
        const scheduledFor = timeSlotManager.generateTimeSlot(
          prospectScheduleData,
          campaign,
          availableInbox.email,
          new Date()
        );

        await storage.createQueueItem({
          campaignId: campaign.id,
          prospectData: {
            ...prospect,
            assignedInboxId: availableInbox.id,
            assignedInboxEmail: availableInbox.email,
          } as any,
          scheduledFor,
          status: "pending",
          attempts: 0,
        });

        await storage.createActivityLog({
          type: "prospect_scheduled",
          message: `Prospect ${prospect.email} scheduled for ${scheduledFor.toLocaleString()} via ${availableInbox.email}`,
          campaignId: campaign.id,
          googleAccountId: availableInbox.id,
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
    return csvData.map(row => ({
      email: row.email || row.Email || "",
      name: row.name || row.Name || row.first_name || row.firstName || "",
      company: row.company || row.Company || row.organization || "",
      timezone: row.timezone || row.time_zone || row.Timezone || "",
      preferred_hours: row.preferred_hours || row.preferredHours || "",
      preferred_days: row.preferred_days || row.preferredDays || "",
      ...row // Include all other fields as merge data
    })).filter(prospect => prospect.email); // Only include rows with valid email
  }

  async processAllCampaigns(): Promise<void> {
    const campaigns = await storage.getCampaigns();
    
    for (const campaign of campaigns) {
      if (campaign.status === "active" && campaign.isActive) {
        await this.processCampaign(campaign);
      }
    }
  }

  private calculateScheduleTime(index: number): Date {
    // Distribute invites throughout the day
    const now = new Date();
    const minutesDelay = index * 5; // 5 minutes between each invite
    return new Date(now.getTime() + minutesDelay * 60000);
  }

  async createInviteFromQueue(queueItem: any): Promise<void> {
    const campaign = await storage.getCampaign(queueItem.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Use load balancer to get best available inbox
    let availableAccount: GoogleAccount | null = null;
    
    // Check if prospect has pre-assigned inbox
    const prospectData = queueItem.prospectData as ProspectData;
    if (prospectData.assignedInboxId) {
      const assignedAccount = await storage.getGoogleAccount(prospectData.assignedInboxId);
      if (assignedAccount && assignedAccount.isActive) {
        availableAccount = assignedAccount;
      }
    }
    
    // If no assigned account or it's not available, get best one
    if (!availableAccount) {
      availableAccount = await inboxLoadBalancer.getBestAvailableInbox();
    }
    
    if (!availableAccount) {
      throw new Error("No available Google account");
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
      // Process merge fields
      const mergeData = {
        name: prospect.name || prospect.email,
        email: prospect.email,
        company: prospect.company || "",
        ...prospect,
      };

      const eventTitle = googleCalendarService.processMergeFields(
        campaign.eventTitleTemplate,
        mergeData
      );

      const eventDescription = googleCalendarService.processMergeFields(
        campaign.eventDescriptionTemplate,
        mergeData
      );

      // Calculate event times
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      startTime.setHours(10, 0, 0, 0); // 10 AM
      const endTime = new Date(startTime.getTime() + campaign.eventDuration * 60000);

      // Create calendar event
      const eventId = await googleCalendarService.createEvent(availableAccount, {
        title: eventTitle,
        description: eventDescription,
        attendeeEmail: prospect.email,
        startTime,
        endTime,
        timeZone: campaign.timeZone,
      });

      // Update invite with event ID and status
      await storage.updateInvite(invite.id, {
        eventId,
        status: "sent",
        sentAt: new Date(),
      });

      // Record successful usage in load balancer
      await inboxLoadBalancer.recordUsage(availableAccount.id, true);

      // Update Google Sheets
      try {
        await googleSheetsService.updateSheetRow(
          availableAccount,
          campaign,
          queueItem.prospectData.rowIndex || 0,
          {
            status: "INVITE_SENT",
            timestamp: new Date().toISOString(),
            senderInbox: availableAccount.email,
            confirmationSent: "NO",
          }
        );
      } catch (sheetError) {
        console.error("Failed to update sheet:", sheetError);
        // Don't fail the invite if sheet update fails
      }

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
}

export const campaignProcessor = new CampaignProcessor();
