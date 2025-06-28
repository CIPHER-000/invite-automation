import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { googleAuthService } from "./services/google-auth";
import { campaignProcessor } from "./services/campaign-processor";
import { queueManager } from "./services/queue-manager";
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

  // Google OAuth routes
  app.get("/api/auth/google", (req, res) => {
    const authUrl = googleAuthService.getAuthUrl();
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
