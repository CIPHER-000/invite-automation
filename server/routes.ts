import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { googleAuthService } from "./services/google-auth";
import { googleServiceAuthService } from "./services/google-service-auth";
import { outlookAuthService } from "./services/outlook-auth";
import { campaignProcessor } from "./services/campaign-processor";
import { queueManager } from "./services/queue-manager";
import { inboxLoadBalancer } from "./services/inbox-load-balancer";
import { timeSlotManager } from "./services/time-slot-manager";
import { multiProviderEmailService } from "./services/multi-provider-email";
import { insertCampaignSchema, insertSystemSettingsSchema } from "@shared/schema";
import { z } from "zod";

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

  // Google OAuth routes (disabled due to org_internal restriction)
  app.get("/api/auth/google", (req, res) => {
    // Return service account info instead of OAuth URL
    res.json({ 
      error: "OAuth disabled - use Service Account authentication",
      serviceAccountRequired: true,
      setupUrl: "/service-account"
    });
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
      } else {
        // Create new account
        await storage.createGoogleAccount({
          email: userInfo.email,
          name: userInfo.name,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
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
      await storage.deleteGoogleAccount(id);
      res.json({ success: true });
    } catch (error) {
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
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      
      // Process the campaign to populate queue
      await campaignProcessor.processCampaign(campaign);
      
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
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
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
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

  // Activity Logs
  app.get("/api/activity", async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getActivityLogs(
        limit ? parseInt(limit as string) : undefined
      );
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

  const httpServer = createServer(app);
  return httpServer;
}
