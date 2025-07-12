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
import { schedulingService } from "./services/scheduling-service";
import { insertCampaignSchema, insertSystemSettingsSchema, insertUserSchema, users } from "@shared/schema";
import { z } from "zod";
import { advancedScheduler } from "./services/advanced-scheduler";
import { rsvpTracker } from "./services/rsvp-tracker";
import { requireAuth, optionalAuth, hashPassword, verifyPassword, validateEmail, validatePassword } from "./auth";
import { prospectValidationRouter } from "./routes/prospect-validation";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the queue manager
  queueManager.start();

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // User signup
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email" });
      }

      // Create new user
      const passwordHash = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
      }).returning();

      // Create session
      req.session.userId = newUser.id;

      res.status(201).json({
        message: "Account created successfully",
        user: { id: newUser.id, email: newUser.email, createdAt: newUser.createdAt }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // User login
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      req.session.userId = user.id;

      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, createdAt: user.createdAt }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user (for testing session)
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json({ id: user.id, email: user.email, createdAt: user.createdAt });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // ============================================================================
  // PROTECTED APPLICATION ROUTES
  // ============================================================================

  // Dashboard stats - protected route
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { days } = req.query;
      
      let timeRange: { start: Date; end: Date } | undefined;
      
      if (days) {
        const daysNum = parseInt(days as string);
        if (!isNaN(daysNum) && daysNum > 0) {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - daysNum);
          timeRange = { start, end };
        }
      }
      
      const stats = await storage.getDashboardStats(userId, timeRange);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Google OAuth routes - protected
  app.get("/api/auth/google", requireAuth, (req, res) => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      console.log("Generated Google Auth URL for production:", authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google Auth URL:", error);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  // Microsoft OAuth routes
  app.get("/api/auth/microsoft", requireAuth, async (req, res) => {
    try {
      const { microsoftAuthService } = await import("./services/microsoft-auth");
      if (!microsoftAuthService.isConfigured()) {
        return res.status(500).json({ error: "Microsoft OAuth not configured" });
      }
      const authUrl = microsoftAuthService.getAuthUrl();
      console.log("Generated Microsoft Auth URL:", authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Microsoft Auth URL:", error);
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

      // Check if account already exists for this user
      const userId = (req as any).user.id;
      const existingAccount = await storage.getGoogleAccountByEmail(userInfo.email, userId);
      
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
        // Create new account for this user
        const newAccount = await storage.createGoogleAccount({
          email: userInfo.email,
          name: userInfo.name,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
          userId: userId,
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

  app.get("/api/auth/microsoft/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const { microsoftAuthService } = await import("./services/microsoft-auth");
      const authResult = await microsoftAuthService.exchangeCodeForTokens(code);
      const userProfile = await microsoftAuthService.getUserProfile(authResult.accessToken);

      // Check if account already exists for this user
      const userId = (req as any).user.id;
      const existingAccount = await storage.getOutlookAccountByEmail(userProfile.mail || userProfile.userPrincipalName, userId);
      
      if (existingAccount) {
        // Update existing account
        await storage.updateOutlookAccount(existingAccount.id, {
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken || "",
          expiresAt: new Date(authResult.expiresOn || Date.now() + 3600000),
          isActive: true,
        }, userId);
        
        // Log account reconnection
        await storage.createActivityLog({
          type: "account_connected",
          outlookAccountId: existingAccount.id,
          userId: userId,
          message: `Microsoft account ${userProfile.mail || userProfile.userPrincipalName} reconnected successfully`,
          metadata: { email: userProfile.mail || userProfile.userPrincipalName, name: userProfile.displayName, action: "reconnected" }
        });
      } else {
        // Create new account for this user
        const accountData = microsoftAuthService.formatAccountData(authResult, userProfile, userId);
        const newAccount = await storage.createOutlookAccount(accountData);
        
        // Log new account connection
        await storage.createActivityLog({
          type: "account_connected",
          outlookAccountId: newAccount.id,
          userId: userId,
          message: `New Microsoft account ${userProfile.mail || userProfile.userPrincipalName} connected successfully`,
          metadata: { email: userProfile.mail || userProfile.userPrincipalName, name: userProfile.displayName, action: "new_connection" }
        });
      }

      res.redirect("/?connected=microsoft");
    } catch (error) {
      console.error("Microsoft OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Google Accounts
  app.get("/api/accounts", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const googleAccounts = await storage.getAccountsWithStatus(userId);
      const outlookAccounts = await storage.getOutlookAccounts(userId);
      
      // Combine both account types with provider identification
      const allAccounts = [
        ...googleAccounts.map(acc => ({ ...acc, provider: 'google' })),
        ...outlookAccounts.map(acc => ({ 
          ...acc, 
          provider: 'microsoft',
          nextAvailable: null,
          isInCooldown: false
        }))
      ];
      
      res.json(allAccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get accounts" });
    }
  });

  // Microsoft Accounts management
  app.get("/api/microsoft-accounts", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const accounts = await storage.getOutlookAccounts(userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Microsoft accounts" });
    }
  });

  app.delete("/api/microsoft-accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Get the account first (ensure it belongs to this user)
      const account = await storage.getOutlookAccount(id, userId);
      if (!account) {
        return res.status(404).json({ error: "Microsoft account not found" });
      }

      // Cancel all pending queue items for this inbox
      try {
        const queueItems = await storage.getQueueItems("pending");
        const itemsToCancel = queueItems.filter(item => {
          const prospectData = item.prospectData as any;
          return prospectData.assignedOutlookInboxId === id;
        });

        for (const item of itemsToCancel) {
          await storage.updateQueueItem(item.id, {
            status: "cancelled",
          });
        }
      } catch (queueError) {
        console.warn("Failed to cancel queue items for Microsoft account:", queueError);
      }

      // Try to revoke Microsoft tokens
      try {
        const { microsoftAuthService } = await import("./services/microsoft-auth");
        await microsoftAuthService.revokeTokens(account.accessToken);
      } catch (revokeError) {
        console.warn("Failed to revoke Microsoft tokens:", revokeError);
      }

      // Log the deletion
      try {
        await storage.createActivityLog({
          type: "account_deleted",
          outlookAccountId: id,
          userId: userId,
          message: `Microsoft account ${account.email} has been deleted from the platform`,
          metadata: {
            email: account.email,
            name: account.name,
            deletedAt: new Date().toISOString(),
            action: "permanent_deletion"
          }
        });
      } catch (logError) {
        console.warn("Failed to log account deletion:", logError);
      }

      // Delete the account completely
      await storage.deleteOutlookAccount(id, userId);

      res.json({ 
        success: true, 
        message: `Microsoft account ${account.email} deleted successfully` 
      });
    } catch (error) {
      console.error("Failed to delete Microsoft account:", error);
      res.status(500).json({ error: "Failed to delete Microsoft account" });
    }
  });

  // Connection monitoring and testing routes
  app.post("/api/accounts/:id/test-connection", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const { provider } = req.body;

      if (!provider || !["google", "microsoft"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider specified" });
      }

      const { connectionMonitorService } = await import("./services/connection-monitor");
      const result = await connectionMonitorService.testAccountConnection(id, provider, userId);

      res.json(result);
    } catch (error) {
      console.error("Connection test failed:", error);
      res.status(500).json({ error: "Connection test failed" });
    }
  });

  app.post("/api/accounts/:id/reconnect", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const { provider } = req.body;

      if (!provider || !["google", "microsoft"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider specified" });
      }

      const { connectionMonitorService } = await import("./services/connection-monitor");
      const authUrl = await connectionMonitorService.getReconnectionUrl(id, provider, userId);

      res.json({ authUrl });
    } catch (error) {
      console.error("Reconnection URL generation failed:", error);
      res.status(500).json({ error: "Failed to generate reconnection URL" });
    }
  });

  // Health check endpoint for monitoring service
  app.get("/api/connection-health", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { connectionMonitorService } = await import("./services/connection-monitor");
      
      await connectionMonitorService.checkUserConnections(userId);
      
      res.json({ message: "Health check completed" });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ error: "Health check failed" });
    }
  });

  app.delete("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Get the account first (ensure it belongs to this user)
      const account = await storage.getGoogleAccount(id, userId);
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

      // Delete the account (ensure user owns it)
      await storage.deleteGoogleAccount(id, userId);
      
      res.json({ 
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.put("/api/accounts/:id/toggle", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const account = await storage.getGoogleAccount(id, userId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      await storage.updateGoogleAccount(id, {
        isActive: !account.isActive,
      }, userId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle account" });
    }
  });

  // Campaigns - protected
  app.get("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const campaigns = await storage.getCampaignsWithStats(userId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  app.get("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const campaign = await storage.getCampaign(id, userId);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  app.post("/api/campaigns", requireAuth, async (req, res) => {
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
      
      const userId = (req as any).user.id;
      const validatedData = insertCampaignSchema.parse({
        ...campaignData,
        userId: userId
      });
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

  app.put("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const updates = req.body;
      
      // CRITICAL FIX: Cancel queue when campaign is paused/stopped
      if (updates.status && (updates.status === "paused" || updates.status === "completed" || updates.isActive === false)) {
        await campaignProcessor.cancelCampaignQueue(id);
      }
      
      const campaign = await storage.updateCampaign(id, updates, userId);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      console.log(`Attempting to delete campaign ${id} for user ${userId}`);
      
      // First verify the campaign exists and belongs to the user
      const campaign = await storage.getCampaign(id, userId);
      if (!campaign) {
        console.log(`Campaign ${id} not found for user ${userId}`);
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      console.log(`Found campaign: ${campaign.name}, deleting...`);
      await storage.deleteCampaign(id, userId);
      console.log(`Campaign ${id} deleted successfully`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Campaign deletion error:", error);
      if (error.message && error.message.includes('while invites are being processed')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || "Failed to delete campaign" });
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
  app.get("/api/invites", requireAuth, async (req, res) => {
    try {
      const { campaignId } = req.query;
      const userId = (req as any).user.id;
      const invites = await storage.getInvites(
        userId,
        campaignId ? parseInt(campaignId as string) : undefined
      );
      res.json(invites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invites" });
    }
  });

  // OAuth Calendar Management
  // Get Google OAuth URL
  app.get("/api/auth/google/url", requireAuth, async (req, res) => {
    try {
      const authUrl = await googleAuthService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error getting Google auth URL:", error);
      res.status(500).json({ error: "Failed to get auth URL" });
    }
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).send("Authorization code missing");
      }

      // Exchange code for tokens
      const result = await googleAuthService.exchangeCodeForTokens(code as string);
      
      // Create or update Google account record
      const userId = (req as any).user?.id;
      if (!userId) {
        // If no user session, redirect to login
        return res.redirect("/?error=login_required");
      }

      const googleAccount = await storage.createGoogleAccount({
        userId,
        email: result.userInfo.email,
        name: result.userInfo.name,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
        isActive: true,
        status: "connected"
      });

      // Log successful connection
      await storage.createActivityLog({
        type: "oauth_connected",
        googleAccountId: googleAccount.id,
        message: `Google account ${result.userInfo.email} connected successfully`,
        metadata: { email: result.userInfo.email, name: result.userInfo.name }
      });

      // Redirect to success page
      res.redirect("/?oauth=success&account=" + encodeURIComponent(result.userInfo.email));
      
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  app.post("/api/oauth-calendar/test-invite", requireAuth, async (req, res) => {
    try {
      const { prospectEmail, eventTitle, eventDescription, accountId } = req.body;
      
      if (!prospectEmail || !eventTitle || !accountId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const userId = (req as any).user.id;
      const account = await storage.getGoogleAccount(parseInt(accountId), userId);
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

  app.post("/api/oauth-calendar/test-access", requireAuth, async (req, res) => {
    try {
      const { accountId } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ error: "Account ID required" });
      }

      const userId = (req as any).user.id;
      const account = await storage.getGoogleAccount(parseInt(accountId), userId);
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

  app.get("/api/oauth-calendar/accounts", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const accounts = await storage.getGoogleAccounts(userId);
      
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

  app.get("/api/oauth-calendar/accounts/:id/daily-stats", requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const invitesToday = await storage.getInvitesTodayByAccount(accountId, userId);
      const maxDailyLimit = 20; // Per-inbox daily limit
      
      res.json({
        invitesToday,
        maxDailyLimit,
        remaining: Math.max(0, maxDailyLimit - invitesToday)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get daily stats" });
    }
  });

  // Campaign Analytics API endpoints
  app.get("/api/campaigns/:id/inbox-stats", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const stats = await storage.getCampaignInboxStats(campaignId, userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign inbox stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign inbox stats" });
    }
  });

  app.get("/api/campaigns/:id/detailed-stats", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const stats = await storage.getCampaignDetailedStats(campaignId, userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign detailed stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign detailed stats" });
    }
  });

  app.delete("/api/oauth-calendar/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.id;
      
      // Get the account first
      const account = await storage.getGoogleAccount(id, userId);
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
      await storage.deleteGoogleAccount(id, userId);
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
  app.get("/api/rsvp/events", requireAuth, async (req, res) => {
    try {
      const { inviteId } = req.query;
      const userId = (req as any).user.id;
      const events = await storage.getRsvpEvents(
        inviteId ? parseInt(inviteId as string) : undefined,
        userId
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP events" });
    }
  });

  app.get("/api/rsvp/history/:inviteId", requireAuth, async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const userId = (req as any).user.id;
      const history = await storage.getRsvpHistory(inviteId, userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP history" });
    }
  });

  app.post("/api/rsvp/sync/:inviteId", requireAuth, async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const userId = (req as any).user.id;
      
      // Verify the invite belongs to this user
      const invite = await storage.getInvite(inviteId, userId);
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }
      
      await rsvpTracker.forceSyncInvite(inviteId);
      res.json({ success: true, message: "RSVP status synced successfully" });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to sync RSVP status", 
        details: (error as Error).message 
      });
    }
  });

  app.get("/api/rsvp/stats/:campaignId", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = (req as any).user.id;
      
      // Verify the campaign belongs to this user
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      const stats = await rsvpTracker.getCampaignRsvpStats(campaignId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP stats" });
    }
  });

  app.get("/api/invites/by-status/:rsvpStatus", requireAuth, async (req, res) => {
    try {
      const { rsvpStatus } = req.params;
      const userId = (req as any).user.id;
      const invites = await storage.getInvitesByRsvpStatus(rsvpStatus, userId);
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

  app.get("/api/webhooks/events", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { processed } = req.query;
      const processedFilter = processed === 'true' ? true : processed === 'false' ? false : undefined;
      const events = await storage.getWebhookEvents(processedFilter);
      
      // Filter webhook events to only show those related to this user's data
      const userCampaigns = await storage.getCampaigns(userId);
      const userCampaignIds = userCampaigns.map(c => c.id);
      
      const filteredEvents = events.filter(event => {
        if (event.metadata && (event.metadata as any).campaignId) {
          return userCampaignIds.includes((event.metadata as any).campaignId);
        }
        return false; // If no campaign association, don't show
      });
      
      res.json(filteredEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get webhook events" });
    }
  });

  // Activity Logs (comprehensive filtering and pagination)
  app.get("/api/activity", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const {
        limit = '50',
        offset = '0',
        eventType,
        campaignId,
        inboxId,
        inboxType,
        recipientEmail,
        severity,
        startDate,
        endDate,
        search
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        eventType: eventType as string,
        campaignId: campaignId ? parseInt(campaignId as string) : undefined,
        inboxId: inboxId ? parseInt(inboxId as string) : undefined,
        inboxType: inboxType as string,
        recipientEmail: recipientEmail as string,
        severity: severity as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
      };

      // Filter out undefined values
      Object.keys(options).forEach(key => {
        if (options[key as keyof typeof options] === undefined || options[key as keyof typeof options] === '') {
          delete options[key as keyof typeof options];
        }
      });

      const [logs, total] = await Promise.all([
        storage.getActivityLogs(userId, options),
        storage.getActivityLogCount(userId, options)
      ]);

      res.json({
        logs,
        total,
        hasMore: (options.offset + options.limit) < total
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ error: "Failed to get activity logs" });
    }
  });

  // System Settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.put("/api/settings", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateSystemSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Queue Status
  app.get("/api/queue/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const status = await queueManager.getQueueStatus();
      // Filter queue status to only show this user's items
      const userQueueItems = await storage.getQueueItems();
      const userPendingItems = userQueueItems.filter(item => 
        item.status === 'pending' && 
        item.metadata && 
        (item.metadata as any).userId === userId
      );
      
      res.json({
        ...status,
        pendingItems: userPendingItems.length,
        userSpecific: true
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get queue status" });
    }
  });

  // Enhanced Load Balancing & Scheduling API
  app.get("/api/inbox/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      // Get only this user's account stats
      const userAccounts = await storage.getAccountsWithStatus(userId);
      res.json(userAccounts);
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
  app.get("/api/email/providers", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      // Get providers specific to this user's connected accounts
      const userAccounts = await storage.getAccountsWithStatus(userId);
      const availableProviders = userAccounts.map(account => ({
        id: account.email,
        type: 'gmail',
        name: account.name || account.email,
        email: account.email,
        isActive: account.isActive
      }));
      res.json(availableProviders);
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

  // ============================================================================
  // SCHEDULING API ROUTES
  // ============================================================================

  // Get scheduling settings
  app.get("/api/scheduling/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const settings = await schedulingService.getSchedulingSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching scheduling settings:", error);
      res.status(500).json({ error: "Failed to fetch scheduling settings" });
    }
  });

  // Update scheduling settings
  app.patch("/api/scheduling/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await schedulingService.updateSchedulingSettings(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating scheduling settings:", error);
      res.status(500).json({ error: "Failed to update scheduling settings" });
    }
  });

  // Get scheduled invites (all or by campaign)
  app.get("/api/scheduling/invites", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { campaignId, status, startDate, endDate } = req.query;
      
      const filters = {
        campaignId: campaignId ? parseInt(campaignId as string) : undefined,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      const invites = campaignId 
        ? await schedulingService.getScheduledInvites(parseInt(campaignId as string), userId)
        : await schedulingService.getAllScheduledInvites(userId, filters);

      res.json(invites);
    } catch (error) {
      console.error("Error fetching scheduled invites:", error);
      res.status(500).json({ error: "Failed to fetch scheduled invites" });
    }
  });

  // Get scheduling statistics
  app.get("/api/scheduling/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const stats = await schedulingService.getSchedulingStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching scheduling stats:", error);
      res.status(500).json({ error: "Failed to fetch scheduling stats" });
    }
  });

  // Get campaign scheduling statistics
  app.get("/api/scheduling/campaigns/:campaignId/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const campaignId = parseInt(req.params.campaignId);
      const stats = await schedulingService.getSchedulingStats(userId, campaignId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign scheduling stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign scheduling stats" });
    }
  });

  // Reschedule an invite
  app.post("/api/scheduling/invites/:inviteId/reschedule", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const inviteId = parseInt(req.params.inviteId);
      const { newTime } = req.body;

      if (!newTime) {
        return res.status(400).json({ error: "New time is required" });
      }

      const result = await schedulingService.rescheduleInvite(inviteId, newTime, userId);
      res.json(result);
    } catch (error) {
      console.error("Error rescheduling invite:", error);
      res.status(500).json({ error: "Failed to reschedule invite" });
    }
  });

  // Cancel an invite
  app.post("/api/scheduling/invites/:inviteId/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const inviteId = parseInt(req.params.inviteId);

      const result = await schedulingService.cancelInvite(inviteId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error canceling invite:", error);
      res.status(500).json({ error: "Failed to cancel invite" });
    }
  });

  // Schedule a new invite
  app.post("/api/scheduling/invites", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const inviteData = {
        ...req.body,
        userId,
      };

      const result = await schedulingService.scheduleInvite(inviteData);
      res.json(result);
    } catch (error) {
      console.error("Error scheduling invite:", error);
      res.status(500).json({ error: "Failed to schedule invite" });
    }
  });

  // Register prospect validation routes
  app.use("/api/prospect-validation", prospectValidationRouter);

  // Register confirmation email routes
  const confirmationEmailRouter = await import("./routes/confirmation-emails");
  app.use("/api/confirmation-emails", confirmationEmailRouter.default);

  const httpServer = createServer(app);
  return httpServer;
}
