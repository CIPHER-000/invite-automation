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

      // Check daily limit
      const invitesToday = await storage.getInvitesToday();
      if (invitesToday >= settings.dailyInviteLimit) {
        return;
      }

      // Get next item from queue
      const nextItem = await storage.getNextQueueItem();
      if (!nextItem) {
        return;
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
