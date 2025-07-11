import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { googleAuthService } from "./services/google-auth";
import { googleServiceAuthService } from "./services/google-service-auth";
import { gmailAppPasswordService } from "./services/gmail-app-password";
import { outlookAuthService } from "./services/outlook-auth";
import { campaignProcessor } from "./services/campaign-processor";
import { queueManager } from "./services/queue-manager";
import { inboxLoadBalancer } from "./services/inbox-load-balancer";
import { timeSlotManager } from "./services/time-slot-manager";
import { multiProviderEmailService } from "./services/multi-provider-email";
import { oauthCalendarService } from "./services/oauth-calendar";
import { insertCampaignSchema, insertSystemSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { advancedScheduler } from "./services/advanced-scheduler";
import { rsvpTracker } from "./services/rsvp-tracker";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the queue manager
  queueManager.start();

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res) => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      console.log("Generated Google Auth URL for production:", authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google Auth URL:", error);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  // Gmail App Password authentication
  app.post("/api/auth/gmail/app-password", async (req, res) => {
    try {
      const { email, appPassword, name } = req.body;
      
      if (!email || !appPassword) {
        return res.status(400).json({ error: "Email and app password are required" });
      }

      const account = await gmailAppPasswordService.addAccount(email, appPassword, name);
      
      res.json({ 
        success: true, 
        message: "Gmail account connected successfully",
        account
      });
    } catch (error) {
      console.error("Gmail app password setup error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Gmail account" });
    }
  });

  // Google Service Account routes (bypass access code for setup)
  app.post("/api/auth/google/service-account", async (req, res) => {
    try {
      const { email, privateKey, projectId } = req.body;
      
      if (!email || !privateKey || !projectId) {
        return res.status(400).json({ error: "Email, privateKey, and projectId are required" });
      }

      const credentials = { email, privateKey, projectId };
      const account = await googleServiceAuthService.createServiceAccountConnection(email, credentials);
      
      res.json({ 
        success: true, 
        account: {
          id: account.id,
          email: account.email,
          name: account.name,
          type: "service_account"
        }
      });
    } catch (error) {
      console.error("Service account connection failed:", error);
      res.status(500).json({ error: "Failed to create service account connection" });
    }
  });

  // Add organizational user endpoint  
  app.post("/api/accounts/organization-user", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // For now, just create a placeholder organizational user record
      const orgUser = await storage.createGoogleAccount({
        email: email,
        name: name || `Organization User (${email})`,
        accessToken: "ORGANIZATION_USER_TOKEN",
        refreshToken: "ORGANIZATION_USER_REFRESH", 
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      });

      await storage.createActivityLog({
        type: "organization_user_added",
        message: `Added organization user: ${email}`,
        googleAccountId: orgUser.id
      });

      res.json({ success: true, account: orgUser });
    } catch (error) {
      console.error("Organization user addition failed:", error);
      res.status(500).json({ error: "Failed to add organization user" });
    }
  });

  app.get("/api/auth/service-account/status", async (req, res) => {
    try {
      const status = await googleServiceAuthService.testServiceAccountAccess();
      res.json({
        configured: googleServiceAuthService.isServiceAccountConfigured(),
        ...status
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check service account status" });
    }
  });

  // Outlook OAuth routes
  app.get("/api/auth/outlook", (req, res) => {
    const authUrl = outlookAuthService.getAuthUrl();
    res.json({ authUrl });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const { accessToken, refreshToken, expiresAt, userInfo } = 
        await googleAuthService.exchangeCodeForTokens(code);

      // Check if account already exists
      const existingAccount = await storage.getGoogleAccountByEmail(userInfo.email);
      
      if (existingAccount) {
        // Update existing account
        await storage.updateGoogleAccount(existingAccount.id, {
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
        });
        
        // Log account reconnection
        await storage.createActivityLog({
          type: "account_connected",
          googleAccountId: existingAccount.id,
          message: `Google account ${userInfo.email} reconnected successfully`,
          metadata: { email: userInfo.email, name: userInfo.name, action: "reconnected" }
        });
      } else {
        // Create new account
        const newAccount = await storage.createGoogleAccount({
          email: userInfo.email,
          name: userInfo.name,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
        });
        
        // Log new account connection
        await storage.createActivityLog({
          type: "account_connected",
          googleAccountId: newAccount.id,
          message: `New Google account ${userInfo.email} connected successfully`,
          metadata: { email: userInfo.email, name: userInfo.name, action: "new_connection" }
        });
      }

      res.redirect("/?connected=true");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.get("/api/auth/outlook/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const { accessToken, refreshToken, expiresAt, userInfo } = 
        await outlookAuthService.exchangeCodeForTokens(code);

      // Check if account already exists
      const existingAccount = await storage.getOutlookAccountByEmail(userInfo.email);
      
      if (existingAccount) {
        // Update existing account
        await storage.updateOutlookAccount(existingAccount.id, {
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
        });
      } else {
        // Create new account
        await storage.createOutlookAccount({
          email: userInfo.email,
          name: userInfo.name,
          microsoftId: userInfo.id,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
        });
      }

      res.redirect("/?connected=outlook");
    } catch (error) {
      console.error("Outlook OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Google Accounts
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccountsWithStatus();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get accounts" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the account first
      const account = await storage.getGoogleAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Cancel all pending queue items for this inbox
      try {
        const queueItems = await storage.getQueueItems("pending");
        const itemsToCancel = queueItems.filter(item => {
          const prospectData = item.prospectData as any;
          return prospectData.assignedInboxId === id;
        });

        for (const item of itemsToCancel) {
          await storage.updateQueueItem(item.id, {
            status: "cancelled",
          });
        }
      } catch (queueError) {
        console.warn("Failed to cancel queue items:", queueError);
      }

      // Try to revoke OAuth tokens
      try {
        if (account.refreshToken) {
          const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${account.refreshToken}`;
          await fetch(revokeUrl, { method: 'POST' });
        }
      } catch (revokeError) {
        console.warn("Failed to revoke OAuth tokens:", revokeError);
      }

      // Log the deletion
      try {
        await storage.createActivityLog({
          type: "account_deleted",
          googleAccountId: id,
          message: `Account ${account.email} has been deleted from the platform`,
          metadata: {
            email: account.email,
            action: "deletion"
          }
        });
      } catch (logError) {
        console.warn("Failed to log deletion:", logError);
      }

      // Delete the account
      await storage.deleteGoogleAccount(id);
      
      res.json({ 
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.put("/api/accounts/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getGoogleAccount(id);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      await storage.updateGoogleAccount(id, {
        isActive: !account.isActive,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle account" });
    }
  });

  // Campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaignsWithStats();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = req.body;
      
      // If advanced scheduling is enabled, generate randomized slots
      if (campaignData.schedulingMode === "advanced" && campaignData.dateRangeStart) {
        const config = {
          dateRangeStart: new Date(campaignData.dateRangeStart),
          dateRangeEnd: new Date(campaignData.dateRangeEnd),
          selectedDaysOfWeek: campaignData.selectedDaysOfWeek,
          timeWindowStart: campaignData.timeWindowStart,
          timeWindowEnd: campaignData.timeWindowEnd,
          timezone: campaignData.schedulingTimezone,
          totalSlots: campaignData.csvData.length
        };

        const slots = advancedScheduler.generateRandomizedSlots(config);
        campaignData.randomizedSlots = slots;
      }
      
      const validatedData = insertCampaignSchema.parse(campaignData);
      const campaign = await storage.createCampaign(validatedData);
      
      // Log campaign creation
      await storage.createActivityLog({
        type: "campaign_processed",
        campaignId: campaign.id,
        message: `Campaign "${campaign.name}" created successfully`,
        metadata: { 
          campaignName: campaign.name, 
          eventTitle: campaign.eventTitleTemplate,
          selectedInboxes: campaign.selectedInboxes?.length || 0,
          schedulingMode: campaign.schedulingMode,
          action: "created"
        }
      });
      
      // Process the campaign to populate queue
      await campaignProcessor.processCampaign(campaign);
      
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      console.error("Campaign creation error:", error);
      res.status(500).json({ error: "Failed to create campaign", details: (error as Error).message });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // CRITICAL FIX: Cancel queue when campaign is paused/stopped
      if (updates.status && (updates.status === "paused" || updates.status === "completed" || updates.isActive === false)) {
        await campaignProcessor.cancelCampaignQueue(id);
      }
      
      const campaign = await storage.updateCampaign(id, updates);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCampaign(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Campaign deletion error:", error);
      if (error.message && error.message.includes('while invites are being processed')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to delete campaign" });
      }
    }
  });

  app.post("/api/campaigns/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      await campaignProcessor.processCampaign(campaign);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process campaign" });
    }
  });

  // Manual test invite
  app.post("/api/invites/manual-test", async (req, res) => {
    try {
      const { prospectEmail, prospectName, prospectCompany, eventTitle, eventDescription, eventDuration, selectedAccountId, startTime, sendNow } = req.body;
      
      if (!prospectEmail || !prospectName || !eventTitle || !eventDescription || !selectedAccountId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the selected account
      const account = await storage.getGoogleAccount(selectedAccountId);
      if (!account) {
        return res.status(404).json({ error: "Selected account not found" });
      }

      // Create the invite record for tracking
      const inviteData = {
        prospectEmail,
        prospectName,
        prospectCompany: prospectCompany || null,
        googleAccountId: selectedAccountId,
        calendarProvider: "google" as const,
        isManualTest: true,
        status: "pending" as const,
        mergeData: {
          name: prospectName,
          email: prospectEmail,
          company: prospectCompany || "",
          eventTitle,
          eventDescription,
          duration: eventDuration,
          startTime
        }
      };

      const invite = await storage.createInvite(inviteData);

      if (sendNow) {
        // Send immediately using Gmail app password service - use default timing
        try {
          const startDateTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
          const duration = eventDuration || 30; // Default 30 minutes
          const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

          const eventDetails = {
            title: eventTitle,
            description: eventDescription,
            attendeeEmail: prospectEmail,
            attendeeName: prospectName,
            startTime: startDateTime,
            endTime: endDateTime,
            timeZone: "UTC"
          };

          // Use Gmail app password service to send the invite
          const eventId = await gmailAppPasswordService.createCalendarEvent(account, eventDetails);
          
          // Update invite with success
          await storage.updateInvite(invite.id, {
            status: "sent",
            eventId,
            sentAt: new Date()
          });

          // Log activity
          await storage.createActivityLog({
            type: "manual_test_sent",
            inviteId: invite.id,
            googleAccountId: selectedAccountId,
            message: `Manual test invite sent immediately to ${prospectEmail} from ${account.email}`,
            metadata: { eventId, eventTitle, sendNow: true }
          });

          res.json({ 
            success: true, 
            inviteId: invite.id,
            eventId,
            message: `Test invite sent immediately to ${prospectEmail}`,
            sentNow: true
          });

        } catch (error) {
          // Update invite with error
          await storage.updateInvite(invite.id, {
            status: "error",
            errorMessage: (error as Error).message
          });

          throw error;
        }
      } else {
        // Schedule for later - require timing fields for scheduling
        if (!startTime || !eventDuration) {
          return res.status(400).json({ error: "Start time and duration are required for scheduling" });
        }
        
        const scheduledTime = new Date(startTime);
        
        // Log scheduled manual test
        await storage.createActivityLog({
          type: "manual_test_scheduled",
          inviteId: invite.id,
          googleAccountId: selectedAccountId,
          message: `Manual test invite scheduled for ${scheduledTime.toLocaleString()} to ${prospectEmail} from ${account.email}`,
          metadata: { scheduledTime: scheduledTime.toISOString(), eventTitle, sendNow: false }
        });
        
        await storage.createQueueItem({
          campaignId: 0,
          prospectData: {
            email: prospectEmail,
            name: prospectName,
            company: prospectCompany || "",
            eventTitle,
            eventDescription,
            duration: eventDuration,
            startTime: scheduledTime.toISOString(),
            assignedInboxId: selectedAccountId,
            assignedInboxEmail: account.email,
            isManualTest: true
          } as any,
          scheduledFor: scheduledTime,
          status: "pending",
          attempts: 0
        });

        // Update invite status
        await storage.updateInvite(invite.id, {
          status: "scheduled"
        });

        // Log activity
        await storage.createActivityLog({
          type: "manual_test_scheduled",
          inviteId: invite.id,
          googleAccountId: selectedAccountId,
          message: `Manual test invite scheduled for ${scheduledTime.toLocaleString()} to ${prospectEmail} via ${account.email}`,
          metadata: { scheduledTime: scheduledTime.toISOString(), eventTitle, sendNow: false }
        });

        res.json({ 
          success: true, 
          inviteId: invite.id,
          message: `Test invite scheduled for ${scheduledTime.toLocaleString()} to ${prospectEmail}`,
          sentNow: false,
          scheduledFor: scheduledTime.toISOString()
        });
      }

    } catch (error) {
      console.error("Manual test invite error:", error);
      res.status(500).json({ 
        error: "Failed to send test invite",
        details: (error as Error).message 
      });
    }
  });

  // Invites
  app.get("/api/invites", async (req, res) => {
    try {
      const { campaignId } = req.query;
      const invites = await storage.getInvites(
        campaignId ? parseInt(campaignId as string) : undefined
      );
      res.json(invites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invites" });
    }
  });

  // OAuth Calendar Management
  app.post("/api/oauth-calendar/test-invite", async (req, res) => {
    try {
      const { prospectEmail, eventTitle, eventDescription, accountId } = req.body;
      
      if (!prospectEmail || !eventTitle || !accountId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const account = await storage.getGoogleAccount(parseInt(accountId));
      if (!account || !account.isActive) {
        return res.status(404).json({ error: "Account not found or inactive" });
      }

      // Create event details
      const startTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30-minute meeting

      const eventDetails = {
        title: eventTitle,
        description: eventDescription || "Test meeting invitation via OAuth Calendar",
        attendeeEmail: prospectEmail,
        startTime,
        endTime,
        timeZone: "America/New_York"
      };

      // Create calendar event using OAuth
      const eventId = await oauthCalendarService.createEventWithOAuth(account, eventDetails);

      // Create invite record
      const invite = await storage.createInvite({
        prospectEmail,
        eventId,
        googleAccountId: account.id,
        calendarProvider: "google_oauth",
        eventTitle,
        eventDescription: eventDetails.description,
        eventStartTime: startTime,
        eventEndTime: endTime,
        status: "sent",
        mergeData: { prospectEmail, eventTitle }
      });

      // Log activity
      await storage.createActivityLog({
        type: "oauth_test_sent",
        inviteId: invite.id,
        googleAccountId: account.id,
        message: `OAuth test invite sent to ${prospectEmail} via ${account.email}`,
        metadata: { eventId, eventTitle, method: "oauth_calendar" }
      });

      res.json({ 
        success: true, 
        inviteId: invite.id,
        eventId,
        message: `OAuth test invite sent to ${prospectEmail}`,
        account: account.email
      });

    } catch (error) {
      console.error("OAuth test invite error:", error);
      res.status(500).json({ 
        error: "Failed to send OAuth test invite",
        details: (error as Error).message 
      });
    }
  });

  app.post("/api/oauth-calendar/test-access", async (req, res) => {
    try {
      const { accountId } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ error: "Account ID required" });
      }

      const account = await storage.getGoogleAccount(parseInt(accountId));
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const testResult = await oauthCalendarService.testCalendarAccess(account);

      res.json({
        success: testResult.success,
        message: testResult.message,
        calendarName: testResult.calendarName,
        account: {
          id: account.id,
          email: account.email,
          name: account.name
        }
      });

    } catch (error) {
      console.error("OAuth calendar test error:", error);
      res.status(500).json({ 
        error: "Failed to test calendar access",
        details: (error as Error).message 
      });
    }
  });

  app.get("/api/oauth-calendar/accounts", async (req, res) => {
    try {
      const accounts = await storage.getGoogleAccounts();
      
      // Filter out service account and organization user tokens
      const oauthAccounts = accounts.filter(account => 
        account.accessToken !== "SERVICE_ACCOUNT_TOKEN" && 
        account.accessToken !== "ORGANIZATION_USER_TOKEN"
      );

      res.json(oauthAccounts.map(account => ({
        id: account.id,
        email: account.email,
        name: account.name,
        isActive: account.isActive,
        lastUsed: account.lastUsed,
        createdAt: account.createdAt
      })));

    } catch (error) {
      console.error("Error fetching OAuth accounts:", error);
      res.status(500).json({ error: "Failed to fetch OAuth accounts" });
    }
  });

  app.delete("/api/oauth-calendar/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the account first
      const account = await storage.getGoogleAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      console.log(`Starting deletion of OAuth account ${id} (${account.email})`);

      // Cancel all pending queue items for this inbox
      try {
        const queueItems = await storage.getQueueItems("pending");
        const itemsToCancel = queueItems.filter(item => {
          const prospectData = item.prospectData as any;
          return prospectData.assignedInboxId === id;
        });

        for (const item of itemsToCancel) {
          await storage.updateQueueItem(item.id, {
            status: "cancelled",
          });
        }
        console.log(`Cancelled ${itemsToCancel.length} pending queue items`);
      } catch (queueError) {
        console.warn("Failed to cancel queue items:", queueError);
      }

      // Try to revoke OAuth tokens
      try {
        if (account.refreshToken) {
          const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${account.refreshToken}`;
          await fetch(revokeUrl, { method: 'POST' });
          console.log("OAuth tokens revoked successfully");
        }
      } catch (revokeError) {
        console.warn("Failed to revoke OAuth tokens:", revokeError);
      }

      // Clean up all foreign key references to this account
      try {
        await storage.cleanupActivityLogsForAccount(id);
        console.log(`Cleaned up activity logs for account ${id}`);
      } catch (cleanupError) {
        console.warn("Failed to cleanup activity logs:", cleanupError);
      }

      try {
        await storage.cleanupInvitesForAccount(id);
        console.log(`Cleaned up invites for account ${id}`);
      } catch (cleanupError) {
        console.warn("Failed to cleanup invites:", cleanupError);
      }

      // Log the deletion (after cleanup, before deletion)
      try {
        await storage.createActivityLog({
          type: "account_deleted",
          googleAccountId: null, // Don't reference the account being deleted
          message: `OAuth account ${account.email} has been deleted from the platform`,
          metadata: {
            email: account.email,
            action: "deletion",
            deletedAccountId: id
          }
        });
      } catch (logError) {
        console.warn("Failed to log deletion:", logError);
      }

      // Delete the account
      await storage.deleteGoogleAccount(id);
      console.log(`OAuth account ${account.email} deleted successfully`);
      
      res.json({ 
        success: true,
        message: "OAuth account deleted successfully"
      });
    } catch (error) {
      console.error("Delete OAuth account error:", error);
      res.status(500).json({ error: "Failed to delete OAuth account" });
    }
  });

  // RSVP Tracking API
  app.get("/api/rsvp/events", async (req, res) => {
    try {
      const { inviteId } = req.query;
      const events = await storage.getRsvpEvents(
        inviteId ? parseInt(inviteId as string) : undefined
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP events" });
    }
  });

  app.get("/api/rsvp/history/:inviteId", async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const history = await storage.getRsvpHistory(inviteId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP history" });
    }
  });

  app.post("/api/rsvp/sync/:inviteId", async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      await rsvpTracker.forceSyncInvite(inviteId);
      res.json({ success: true, message: "RSVP status synced successfully" });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to sync RSVP status", 
        details: (error as Error).message 
      });
    }
  });

  app.get("/api/rsvp/stats/:campaignId", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const stats = await rsvpTracker.getCampaignRsvpStats(campaignId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP stats" });
    }
  });

  app.get("/api/invites/by-status/:rsvpStatus", async (req, res) => {
    try {
      const { rsvpStatus } = req.params;
      const invites = await storage.getInvitesByRsvpStatus(rsvpStatus);
      res.json(invites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invites by RSVP status" });
    }
  });

  // Webhook endpoints for real-time RSVP updates
  app.post("/api/webhooks/google-calendar", async (req, res) => {
    try {
      const payload = req.body;
      await rsvpTracker.processWebhookEvent('google_calendar_event_updated', payload);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Google Calendar webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.post("/api/webhooks/outlook-calendar", async (req, res) => {
    try {
      const payload = req.body;
      await rsvpTracker.processWebhookEvent('outlook_event_updated', payload);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Outlook Calendar webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.get("/api/webhooks/events", async (req, res) => {
    try {
      const { processed } = req.query;
      const processedFilter = processed === 'true' ? true : processed === 'false' ? false : undefined;
      const events = await storage.getWebhookEvents(processedFilter);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get webhook events" });
    }
  });

  // Activity Logs (enhanced with RSVP filtering)
  app.get("/api/activity", async (req, res) => {
    try {
      const { limit, type } = req.query;
      let logs = await storage.getActivityLogs(
        limit ? parseInt(limit as string) : undefined
      );
      
      // Filter by type if specified
      if (type) {
        logs = logs.filter(log => log.type === type);
      }
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get activity logs" });
    }
  });

  // System Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateSystemSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Queue Status
  app.get("/api/queue/status", async (req, res) => {
    try {
      const status = await queueManager.getQueueStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get queue status" });
    }
  });

  // Enhanced Load Balancing & Scheduling API
  app.get("/api/inbox/stats", async (req, res) => {
    try {
      const stats = await inboxLoadBalancer.getAllUsageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get inbox stats" });
    }
  });

  app.get("/api/inbox/stats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await inboxLoadBalancer.getInboxStats(id);
      
      if (!stats) {
        return res.status(404).json({ error: "Inbox stats not found" });
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get inbox stats" });
    }
  });

  app.post("/api/inbox/:id/pause", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      await inboxLoadBalancer.pauseInbox(id, reason || "Manual pause");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause inbox" });
    }
  });

  app.post("/api/inbox/:id/resume", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await inboxLoadBalancer.resumeInbox(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to resume inbox" });
    }
  });

  app.get("/api/inbox/config", async (req, res) => {
    try {
      const config = inboxLoadBalancer.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get load balancing config" });
    }
  });

  app.put("/api/inbox/config", async (req, res) => {
    try {
      const updates = req.body;
      inboxLoadBalancer.updateConfig(updates);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update load balancing config" });
    }
  });

  app.get("/api/inbox/:accountEmail/booked-slots", async (req, res) => {
    try {
      const { accountEmail } = req.params;
      const slots = timeSlotManager.getBookedSlots(accountEmail);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to get booked slots" });
    }
  });

  app.post("/api/inbox/reset-daily", async (req, res) => {
    try {
      await inboxLoadBalancer.resetDailyCounters();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset daily counters" });
    }
  });

  app.post("/api/scheduling/clear-old-slots", async (req, res) => {
    try {
      timeSlotManager.clearOldBookedSlots();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear old slots" });
    }
  });

  // Email Provider Management
  app.get("/api/email/providers", async (req, res) => {
    try {
      const providers = await multiProviderEmailService.getAvailableProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get email providers" });
    }
  });

  app.get("/api/email/providers/stats", async (req, res) => {
    try {
      const stats = await multiProviderEmailService.getProviderStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get provider stats" });
    }
  });

  app.post("/api/email/providers/:id/test", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const providers = await multiProviderEmailService.getAvailableProviders();
      const provider = providers.find(p => p.accountId === providerId);
      
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }

      const result = await multiProviderEmailService.testEmailProvider(provider);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to test email provider" });
    }
  });

  // Outlook Account Management
  app.get("/api/outlook/accounts", async (req, res) => {
    try {
      const accounts = await storage.getOutlookAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Outlook accounts" });
    }
  });

  app.delete("/api/outlook/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOutlookAccount(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete Outlook account" });
    }
  });

  app.put("/api/outlook/accounts/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getOutlookAccount(id);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      await storage.updateOutlookAccount(id, {
        isActive: !account.isActive,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle Outlook account" });
    }
  });

  // Process all campaigns manually
  app.post("/api/campaigns/process-all", async (req, res) => {
    try {
      await campaignProcessor.processAllCampaigns();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process campaigns" });
    }
  });


  // Advanced scheduling validation endpoint
  app.post("/api/campaigns/validate-scheduling", async (req, res) => {
    try {
      const { dateRangeStart, dateRangeEnd, selectedDaysOfWeek, timeWindowStart, timeWindowEnd, schedulingTimezone, totalSlots } = req.body;
      
      if (!dateRangeStart || !dateRangeEnd || !selectedDaysOfWeek || !timeWindowStart || !timeWindowEnd || !schedulingTimezone || !totalSlots) {
        return res.status(400).json({ error: "Missing required scheduling parameters" });
      }

      const config = {
        dateRangeStart: new Date(dateRangeStart),
        dateRangeEnd: new Date(dateRangeEnd),
        selectedDaysOfWeek,
        timeWindowStart,
        timeWindowEnd,
        timezone: schedulingTimezone,
        totalSlots
      };

      const validation = advancedScheduler.validateConfiguration(config);
      const availableSlots = advancedScheduler.getAvailableSlotCount(config);

      res.json({
        valid: validation.valid,
        errors: validation.errors,
        availableSlots
      });
    } catch (error) {
      console.error("Scheduling validation error:", error);
      res.status(500).json({ error: "Failed to validate scheduling configuration" });
    }
  });

  // Generate randomized slots endpoint
  app.post("/api/campaigns/generate-slots", async (req, res) => {
    try {
      const { dateRangeStart, dateRangeEnd, selectedDaysOfWeek, timeWindowStart, timeWindowEnd, schedulingTimezone, totalSlots } = req.body;
      
      const config = {
        dateRangeStart: new Date(dateRangeStart),
        dateRangeEnd: new Date(dateRangeEnd),
        selectedDaysOfWeek,
        timeWindowStart,
        timeWindowEnd,
        timezone: schedulingTimezone,
        totalSlots
      };

      const slots = advancedScheduler.generateRandomizedSlots(config);
      res.json({ slots });
    } catch (error) {
      console.error("Slot generation error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to generate slots" });
    }
  });

  // Check campaigns using specific inbox
  app.get("/api/campaigns/using-inbox/:inboxId", async (req, res) => {
    try {
      const inboxId = parseInt(req.params.inboxId);
      const campaigns = await storage.getCampaignsUsingInbox(inboxId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error checking campaigns using inbox:", error);
      res.status(500).json({ error: "Failed to check campaigns" });
    }
  });

  // Disconnect/remove inbox endpoint
  app.post("/api/accounts/:id/disconnect", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Get the account first to verify it exists
      const account = await storage.getGoogleAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Cancel all pending queue items for this inbox
      const queueItems = await storage.getQueueItems("pending");
      const itemsToCancel = queueItems.filter(item => {
        const prospectData = item.prospectData as any;
        return prospectData.assignedInboxId === accountId;
      });

      for (const item of itemsToCancel) {
        await storage.updateQueueItem(item.id, {
          status: "cancelled",
        });
      }

      // Revoke OAuth tokens and disconnect account
      try {
        // Attempt to revoke Google OAuth tokens
        const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${account.refreshToken}`;
        await fetch(revokeUrl, { method: 'POST' });
      } catch (revokeError) {
        console.warn("Failed to revoke OAuth tokens:", revokeError);
        // Continue with disconnection even if token revocation fails
      }

      // Log the deletion before removing the account
      await storage.createActivityLog({
        type: "account_deleted",
        googleAccountId: accountId,
        message: `Account ${account.email} has been permanently deleted from the platform`,
        metadata: {
          email: account.email,
          cancelledQueueItems: itemsToCancel.length,
          action: "complete_deletion"
        }
      });

      // COMPLETE DELETION: Remove account entirely from platform
      await storage.disconnectGoogleAccount(accountId);

      res.json({ 
        success: true, 
        message: "Account permanently deleted from platform",
        cancelledItems: itemsToCancel.length
      });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      res.status(500).json({ error: "Failed to disconnect account" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
