import { storage } from "../storage";
import { campaignProcessor } from "./campaign-processor";
import { googleCalendarService } from "./google-calendar";
import { emailService } from "./email";
import { rsvpTracker } from "./rsvp-tracker";

export class QueueManager {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.processingInterval) {
      return; // Already running
    }

    console.log("Starting queue manager...");
    
    // Process queue every minute
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 60000);

    // Check for accepted invites every 5 minutes
    setInterval(() => {
      this.checkAcceptedInvites();
    }, 5 * 60000);

    // Process confirmation emails every 2 minutes
    setInterval(() => {
      this.processConfirmations();
    }, 2 * 60000);

    // Poll RSVP status updates every 3 minutes
    setInterval(() => {
      this.pollRsvpUpdates();
    }, 3 * 60000);

    // Initial processing
    this.processQueue();
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("Queue manager stopped");
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;

    try {
      const settings = await storage.getSystemSettings();
      
      if (!settings.isSystemActive) {
        return;
      }

      // Check global daily limit
      const invitesToday = await storage.getInvitesToday();
      if (invitesToday >= settings.dailyInviteLimit) {
        console.log(`Daily global limit reached: ${invitesToday}/${settings.dailyInviteLimit}`);
        return;
      }

      // Get next item from queue
      const nextItem = await storage.getNextQueueItem();
      if (!nextItem) {
        return;
      }

      // CRITICAL: Check per-inbox daily limits and cooldown before processing
      const prospectData = nextItem.prospectData as any;
      if (prospectData.assignedInboxId) {
        const account = await storage.getGoogleAccount(prospectData.assignedInboxId);
        if (!account) {
          await storage.updateQueueItem(nextItem.id, {
            status: "failed",
            errorMessage: "Assigned inbox no longer exists"
          });
          return;
        }

        // Check if inbox has exceeded daily limit (20 invites per day)
        const inboxInvitesToday = await this.getInboxInvitesToday(prospectData.assignedInboxId);
        if (inboxInvitesToday >= 20) {
          console.log(`Inbox ${account.email} has reached daily limit: ${inboxInvitesToday}/20`);
          // Reschedule for tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
          
          await storage.updateQueueItem(nextItem.id, {
            scheduledFor: tomorrow
          });
          return;
        }

        // Check if inbox is in cooldown (minimum 30 minutes between sends)
        const lastUsed = account.lastUsed;
        if (lastUsed) {
          const cooldownUntil = new Date(lastUsed.getTime() + (30 * 60 * 1000)); // 30 minutes
          if (new Date() < cooldownUntil) {
            console.log(`Inbox ${account.email} is in cooldown until ${cooldownUntil.toISOString()}`);
            // Reschedule for after cooldown
            await storage.updateQueueItem(nextItem.id, {
              scheduledFor: cooldownUntil
            });
            return;
          }
        }
      }

      // Check if it's time to process this item
      if (nextItem.scheduledFor > new Date()) {
        return;
      }

      // Mark as processing
      await storage.updateQueueItem(nextItem.id, {
        status: "processing",
      });

      // Process the invite
      await campaignProcessor.createInviteFromQueue(nextItem);
      
    } catch (error) {
      console.error("Error processing queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get number of invites sent today for a specific inbox
   */
  private async getInboxInvitesToday(inboxId: number): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const invites = await storage.getInvites();
    return invites.filter(invite => 
      invite.googleAccountId === inboxId &&
      invite.sentAt &&
      invite.sentAt >= startOfDay
    ).length;
  }

  private async checkAcceptedInvites(): Promise<void> {
    try {
      await googleCalendarService.checkPendingInvites();
    } catch (error) {
      console.error("Error checking accepted invites:", error);
    }
  }

  private async pollRsvpUpdates(): Promise<void> {
    try {
      await rsvpTracker.pollPendingInvites();
    } catch (error) {
      console.error("Error polling RSVP updates:", error);
    }
  }

  private async processConfirmations(): Promise<void> {
    try {
      await emailService.processConfirmationQueue();
    } catch (error) {
      console.error("Error processing confirmations:", error);
    }
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [pending, processing, completed, failed] = await Promise.all([
      storage.getQueueItems("pending"),
      storage.getQueueItems("processing"),
      storage.getQueueItems("completed"),
      storage.getQueueItems("failed"),
    ]);

    return {
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}

export const queueManager = new QueueManager();
