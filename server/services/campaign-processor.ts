import { storage } from "../storage";
import { googleSheetsService } from "./google-sheets";
import { googleCalendarService } from "./google-calendar";
import type { Campaign, GoogleAccount, ProspectData } from "@shared/schema";

export class CampaignProcessor {
  async processCampaign(campaign: Campaign): Promise<void> {
    if (campaign.status !== "active" || !campaign.isActive) {
      return;
    }

    try {
      // Get a Google account to read the sheet
      const accounts = await storage.getGoogleAccounts();
      const activeAccount = accounts.find(acc => acc.isActive);
      
      if (!activeAccount) {
        throw new Error("No active Google account available");
      }

      // Read prospect data from Google Sheets
      const prospects = await googleSheetsService.readProspectData(activeAccount, campaign);
      
      if (prospects.length === 0) {
        return;
      }

      // Get existing invites for this campaign to avoid duplicates
      const existingInvites = await storage.getInvites(campaign.id);
      const existingEmails = new Set(existingInvites.map(invite => invite.prospectEmail));

      // Add new prospects to the queue
      for (const [index, prospect] of prospects.entries()) {
        if (existingEmails.has(prospect.email)) {
          continue; // Skip already processed prospects
        }

        // Calculate when this invite should be sent
        const scheduledFor = this.calculateScheduleTime(index);

        await storage.createQueueItem({
          campaignId: campaign.id,
          prospectData: prospect as any,
          scheduledFor,
          status: "pending",
          attempts: 0,
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

    // Find available Google account
    const availableAccount = await this.findAvailableAccount();
    if (!availableAccount) {
      throw new Error("No available Google account");
    }

    const prospect = queueItem.prospectData as ProspectData;
    
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

      // Update Google account last used time
      await storage.updateGoogleAccount(availableAccount.id, {
        lastUsed: new Date(),
      });

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
        message: `Failed to send invite to ${prospect.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
        metadata: { 
          prospectEmail: prospect.email,
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
