import { storage } from "../storage";
import { googleAuthService } from "./google-auth";
import type { GoogleAccount, OutlookAccount } from "@shared/schema";

export class ConnectionMonitorService {
  private checkInterval: number = 15 * 60 * 1000; // 15 minutes
  private intervalId?: NodeJS.Timeout;

  /**
   * Start the connection monitoring service
   */
  startMonitoring() {
    console.log("Starting connection monitor service...");
    this.intervalId = setInterval(() => {
      this.checkAllConnections();
    }, this.checkInterval);
    
    // Run initial check after 30 seconds
    setTimeout(() => {
      this.checkAllConnections();
    }, 30000);
  }

  /**
   * Stop the connection monitoring service
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log("Connection monitor service stopped");
    }
  }

  /**
   * Check all account connections
   */
  private async checkAllConnections() {
    try {
      console.log("Running connection health checks...");
      
      // Get all active accounts from all users
      const allUsers = await storage.getAllUsers?.() || [];
      
      for (const user of allUsers) {
        await this.checkUserConnections(user.id);
      }
    } catch (error) {
      console.error("Error in connection monitoring:", error);
    }
  }

  /**
   * Check connections for a specific user
   */
  async checkUserConnections(userId: string) {
    try {
      // Check Google accounts
      const googleAccounts = await storage.getGoogleAccounts(userId);
      for (const account of googleAccounts) {
        if (account.isActive && account.status === "active") {
          await this.checkGoogleConnection(account, userId);
        }
      }

      // Check Microsoft accounts
      const outlookAccounts = await storage.getOutlookAccounts(userId);
      for (const account of outlookAccounts) {
        if (account.isActive && account.status === "active") {
          await this.checkMicrosoftConnection(account, userId);
        }
      }
    } catch (error) {
      console.error(`Error checking connections for user ${userId}:`, error);
    }
  }

  /**
   * Check a single Google account connection
   */
  async checkGoogleConnection(account: GoogleAccount, userId: string): Promise<boolean> {
    try {
      // Test Google Calendar API access
      const isHealthy = await googleAuthService.testCalendarAccess(account.accessToken);
      
      await storage.updateGoogleAccount(account.id, {
        lastConnectionCheck: new Date(),
        ...(isHealthy ? {
          status: "active",
          connectionError: null
        } : {
          status: "disconnected",
          connectionError: "Calendar API access failed",
          disconnectedAt: new Date()
        })
      }, userId);

      if (!isHealthy) {
        await this.handleDisconnection(account, "google", userId, "Calendar API access failed");
      }

      return isHealthy;
    } catch (error: any) {
      console.error(`Google connection check failed for ${account.email}:`, error);
      
      await storage.updateGoogleAccount(account.id, {
        status: "disconnected",
        lastConnectionCheck: new Date(),
        connectionError: error.message || "Connection test failed",
        disconnectedAt: new Date()
      }, userId);

      await this.handleDisconnection(account, "google", userId, error.message || "Connection test failed");
      return false;
    }
  }

  /**
   * Check a single Microsoft account connection
   */
  async checkMicrosoftConnection(account: OutlookAccount, userId: string): Promise<boolean> {
    try {
      const { microsoftCalendarService } = await import("./microsoft-calendar");
      const isHealthy = await microsoftCalendarService.testCalendarAccess(account);
      
      await storage.updateOutlookAccount(account.id, {
        lastConnectionCheck: new Date(),
        ...(isHealthy ? {
          status: "active",
          connectionError: null
        } : {
          status: "disconnected",
          connectionError: "Calendar API access failed",
          disconnectedAt: new Date()
        })
      }, userId);

      if (!isHealthy) {
        await this.handleDisconnection(account, "microsoft", userId, "Calendar API access failed");
      }

      return isHealthy;
    } catch (error: any) {
      console.error(`Microsoft connection check failed for ${account.email}:`, error);
      
      await storage.updateOutlookAccount(account.id, {
        status: "disconnected",
        lastConnectionCheck: new Date(),
        connectionError: error.message || "Connection test failed",
        disconnectedAt: new Date()
      }, userId);

      await this.handleDisconnection(account, "microsoft", userId, error.message || "Connection test failed");
      return false;
    }
  }

  /**
   * Handle account disconnection
   */
  private async handleDisconnection(
    account: GoogleAccount | OutlookAccount, 
    provider: "google" | "microsoft",
    userId: string,
    errorReason: string
  ) {
    try {
      // Pause all campaigns using this account
      const campaigns = await storage.getCampaignsUsingInbox(account.id, userId);
      
      for (const campaign of campaigns) {
        if (campaign.status === "active") {
          await storage.updateCampaign(campaign.id, {
            status: "paused"
          }, userId);
          
          // Log campaign pause
          await storage.createActivityLog({
            type: "campaign_paused",
            campaignId: campaign.id,
            userId: userId,
            message: `Campaign "${campaign.name}" paused due to ${provider} inbox disconnection: ${account.email}`,
            metadata: {
              reason: "inbox_disconnected",
              provider: provider,
              inboxEmail: account.email,
              errorReason: errorReason,
              pausedAt: new Date().toISOString()
            }
          });
        }
      }

      // Cancel pending queue items for this inbox
      const queueItems = await storage.getQueueItems("pending");
      const itemsToCancel = queueItems.filter(item => {
        const prospectData = item.prospectData as any;
        return provider === "google" 
          ? prospectData.assignedInboxId === account.id
          : prospectData.assignedOutlookInboxId === account.id;
      });

      for (const item of itemsToCancel) {
        await storage.updateQueueItem(item.id, {
          status: "cancelled",
          errorMessage: `Inbox disconnected: ${errorReason}`
        });
      }

      // Log the disconnection event
      await storage.createActivityLog({
        type: "account_disconnected",
        ...(provider === "google" 
          ? { googleAccountId: account.id } 
          : { outlookAccountId: account.id }
        ),
        userId: userId,
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account ${account.email} disconnected`,
        metadata: {
          provider: provider,
          email: account.email,
          errorReason: errorReason,
          campaignsPaused: campaigns.length,
          queueItemsCancelled: itemsToCancel.length,
          disconnectedAt: new Date().toISOString()
        }
      });

      console.log(`${provider} account ${account.email} disconnected. Paused ${campaigns.length} campaigns and cancelled ${itemsToCancel.length} queue items.`);
    } catch (error) {
      console.error("Error handling disconnection:", error);
    }
  }

  /**
   * Test connection for a specific account
   */
  async testAccountConnection(accountId: number, provider: "google" | "microsoft", userId: string): Promise<{
    isHealthy: boolean;
    error?: string;
  }> {
    try {
      if (provider === "google") {
        const account = await storage.getGoogleAccount(accountId, userId);
        if (!account) {
          return { isHealthy: false, error: "Account not found" };
        }
        const isHealthy = await this.checkGoogleConnection(account, userId);
        return { isHealthy };
      } else {
        const account = await storage.getOutlookAccount(accountId, userId);
        if (!account) {
          return { isHealthy: false, error: "Account not found" };
        }
        const isHealthy = await this.checkMicrosoftConnection(account, userId);
        return { isHealthy };
      }
    } catch (error: any) {
      return { isHealthy: false, error: error.message };
    }
  }

  /**
   * Get reconnection URL for an account
   */
  async getReconnectionUrl(accountId: number, provider: "google" | "microsoft", userId: string): Promise<string> {
    if (provider === "google") {
      return googleAuthService.getAuthUrl();
    } else {
      const { microsoftAuthService } = await import("./microsoft-auth");
      return microsoftAuthService.getAuthUrl();
    }
  }
}

export const connectionMonitorService = new ConnectionMonitorService();