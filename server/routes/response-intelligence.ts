import type { Express } from "express";
import { db } from "../db";
import { inviteTimeline, emailActivity, responseSettings, invites } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { responseIntelligence } from "../services/response-intelligence";
import { requireAuth } from "../auth";

export function registerResponseIntelligenceRoutes(app: Express) {
  // Get invite timeline
  app.get("/api/invites/:inviteId/timeline", requireAuth, async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const userId = req.user!.id;

      // Verify invite belongs to user
      const invite = await db
        .select()
        .from(invites)
        .where(and(eq(invites.id, inviteId), eq(invites.userId, userId)))
        .limit(1);

      if (!invite.length) {
        return res.status(404).json({ error: "Invite not found" });
      }

      const timeline = await responseIntelligence.getInviteTimeline(inviteId);
      res.json(timeline);
    } catch (error) {
      console.error("Error getting invite timeline:", error);
      res.status(500).json({ error: "Failed to get invite timeline" });
    }
  });

  // Get campaign activity summary
  app.get("/api/campaigns/:campaignId/activity-summary", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const summary = await responseIntelligence.getCampaignActivitySummary(campaignId);
      res.json(summary);
    } catch (error) {
      console.error("Error getting campaign activity summary:", error);
      res.status(500).json({ error: "Failed to get campaign activity summary" });
    }
  });

  // Get email activity for a campaign
  app.get("/api/campaigns/:campaignId/email-activity", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = req.user!.id;

      const activity = await db
        .select()
        .from(emailActivity)
        .where(
          and(
            eq(emailActivity.userId, userId),
            eq(emailActivity.relatedCampaignId, campaignId)
          )
        )
        .orderBy(desc(emailActivity.receivedAt));

      res.json(activity);
    } catch (error) {
      console.error("Error getting email activity:", error);
      res.status(500).json({ error: "Failed to get email activity" });
    }
  });

  // Setup monitoring for an account
  app.post("/api/response-intelligence/setup-monitoring", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { accountType, accountId, accessToken } = req.body;

      if (accountType === 'google') {
        await responseIntelligence.setupGmailMonitoring(userId, accountId, accessToken);
      } else if (accountType === 'outlook') {
        // TODO: Implement Outlook monitoring setup
        res.status(501).json({ error: "Outlook monitoring not yet implemented" });
        return;
      } else {
        res.status(400).json({ error: "Invalid account type" });
        return;
      }

      res.json({ success: true, message: "Monitoring setup successfully" });
    } catch (error) {
      console.error("Error setting up monitoring:", error);
      res.status(500).json({ error: "Failed to setup monitoring" });
    }
  });

  // Get monitoring settings
  app.get("/api/response-intelligence/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const settings = await db
        .select()
        .from(responseSettings)
        .where(eq(responseSettings.userId, userId))
        .orderBy(desc(responseSettings.createdAt));

      res.json(settings);
    } catch (error) {
      console.error("Error getting monitoring settings:", error);
      res.status(500).json({ error: "Failed to get monitoring settings" });
    }
  });

  // Update monitoring settings
  app.patch("/api/response-intelligence/settings/:settingId", requireAuth, async (req, res) => {
    try {
      const settingId = parseInt(req.params.settingId);
      const userId = req.user!.id;
      const updates = req.body;

      await db
        .update(responseSettings)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(responseSettings.id, settingId),
            eq(responseSettings.userId, userId)
          )
        );

      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating monitoring settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Process Gmail history manually (for testing)
  app.post("/api/response-intelligence/process-gmail/:accountId", requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const userId = req.user!.id;
      const { accessToken } = req.body;

      await responseIntelligence.processGmailHistory(userId, accountId, accessToken);
      res.json({ success: true, message: "Gmail history processed" });
    } catch (error) {
      console.error("Error processing Gmail history:", error);
      res.status(500).json({ error: "Failed to process Gmail history" });
    }
  });

  // Get recent email activity across all campaigns
  app.get("/api/response-intelligence/recent-activity", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const recentActivity = await db
        .select({
          id: emailActivity.id,
          fromEmail: emailActivity.fromEmail,
          subject: emailActivity.subject,
          snippet: emailActivity.snippet,
          receivedAt: emailActivity.receivedAt,
          matchingCriteria: emailActivity.matchingCriteria,
          relatedInviteId: emailActivity.relatedInviteId,
          relatedCampaignId: emailActivity.relatedCampaignId,
        })
        .from(emailActivity)
        .where(eq(emailActivity.userId, userId))
        .orderBy(desc(emailActivity.receivedAt))
        .limit(limit);

      res.json(recentActivity);
    } catch (error) {
      console.error("Error getting recent activity:", error);
      res.status(500).json({ error: "Failed to get recent activity" });
    }
  });

  // Get timeline events for a campaign
  app.get("/api/campaigns/:campaignId/timeline", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = req.user!.id;

      const timeline = await db
        .select()
        .from(inviteTimeline)
        .where(
          and(
            eq(inviteTimeline.campaignId, campaignId),
            eq(inviteTimeline.userId, userId)
          )
        )
        .orderBy(desc(inviteTimeline.timestamp));

      res.json(timeline);
    } catch (error) {
      console.error("Error getting campaign timeline:", error);
      res.status(500).json({ error: "Failed to get campaign timeline" });
    }
  });
}