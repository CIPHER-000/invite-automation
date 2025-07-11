import { storage } from "../storage";
import { googleCalendarService } from "./google-calendar";
import { outlookCalendarService } from "./outlook-calendar";

export interface RsvpStatusUpdate {
  eventId: string;
  prospectEmail: string;
  rsvpStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  responseAt: Date;
  source: 'webhook' | 'polling' | 'manual';
  webhookPayload?: any;
}

export class RsvpTracker {
  /**
   * Process an RSVP status update from any source
   */
  async processRsvpUpdate(update: RsvpStatusUpdate): Promise<void> {
    try {
      // Find the invite by event ID
      const invite = await storage.getInviteByEventId(update.eventId);
      if (!invite) {
        console.warn(`No invite found for event ID: ${update.eventId}`);
        return;
      }

      // Check if this is actually a status change
      if (invite.rsvpStatus === update.rsvpStatus) {
        console.log(`RSVP status unchanged for invite ${invite.id}: ${update.rsvpStatus}`);
        return;
      }

      console.log(`Processing RSVP update for invite ${invite.id}: ${invite.rsvpStatus} -> ${update.rsvpStatus}`);

      // Update the invite status
      await storage.updateInviteRsvpStatus(
        invite.id,
        update.rsvpStatus,
        update.source,
        update.webhookPayload
      );

      console.log(`Successfully updated RSVP status for invite ${invite.id}`);
    } catch (error) {
      console.error('Error processing RSVP update:', error);
      throw error;
    }
  }

  /**
   * Poll all pending invites for status updates
   */
  async pollPendingInvites(): Promise<void> {
    try {
      console.log('Polling pending invites for RSVP updates...');
      
      // Get all sent invites that haven't been responded to yet
      const pendingInvites = await storage.getInvitesByStatus('sent');
      
      for (const invite of pendingInvites) {
        try {
          if (!invite.eventId) continue;

          let rsvpStatus: string | undefined;
          
          // Check status based on calendar provider
          if (invite.calendarProvider === 'google' && invite.googleAccountId) {
            const account = await storage.getGoogleAccount(invite.googleAccountId);
            if (account) {
              const { attendeeResponse } = await googleCalendarService.getEventStatus(account, invite.eventId);
              rsvpStatus = this.mapGoogleResponseStatus(attendeeResponse);
            }
          } else if (invite.calendarProvider === 'outlook' && invite.outlookAccountId) {
            const account = await storage.getOutlookAccount(invite.outlookAccountId);
            if (account) {
              const { status } = await outlookCalendarService.getEventStatus(account, invite.eventId);
              rsvpStatus = status;
            }
          }

          // Process the update if status changed
          if (rsvpStatus && rsvpStatus !== 'pending' && rsvpStatus !== invite.rsvpStatus) {
            await this.processRsvpUpdate({
              eventId: invite.eventId,
              prospectEmail: invite.prospectEmail,
              rsvpStatus: rsvpStatus as any,
              responseAt: new Date(),
              source: 'polling'
            });
          }

          // Update last status check
          await storage.updateInvite(invite.id, { lastStatusCheck: new Date() });
          
        } catch (error) {
          console.error(`Error checking invite ${invite.id}:`, error);
        }
      }
      
      console.log(`Completed polling ${pendingInvites.length} pending invites`);
    } catch (error) {
      console.error('Error polling pending invites:', error);
    }
  }

  /**
   * Process webhook events for real-time RSVP updates
   */
  async processWebhookEvent(eventType: string, payload: any): Promise<void> {
    try {
      console.log(`Processing webhook event: ${eventType}`);
      
      // Store the webhook event for audit
      const webhookEvent = await storage.createWebhookEvent({
        eventType,
        rawPayload: payload,
        processed: false
      });

      let eventId: string | undefined;
      let rsvpStatus: string | undefined;
      let prospectEmail: string | undefined;

      // Parse webhook payload based on provider
      if (eventType === 'google_calendar_event_updated') {
        eventId = payload.resourceId || payload.eventId;
        // Parse Google Calendar webhook payload
        if (payload.attendees && payload.attendees.length > 0) {
          const attendee = payload.attendees.find((a: any) => a.responseStatus !== 'organizer');
          if (attendee) {
            rsvpStatus = this.mapGoogleResponseStatus(attendee.responseStatus);
            prospectEmail = attendee.email;
          }
        }
      } else if (eventType === 'outlook_event_updated') {
        eventId = payload.eventId;
        // Parse Outlook webhook payload
        if (payload.attendees && payload.attendees.length > 0) {
          const attendee = payload.attendees.find((a: any) => a.type === 'required');
          if (attendee) {
            rsvpStatus = this.mapOutlookResponseStatus(attendee.status?.response);
            prospectEmail = attendee.emailAddress?.address;
          }
        }
      }

      if (eventId && rsvpStatus && prospectEmail) {
        await this.processRsvpUpdate({
          eventId,
          prospectEmail,
          rsvpStatus: rsvpStatus as any,
          responseAt: new Date(),
          source: 'webhook',
          webhookPayload: payload
        });

        // Link the webhook event to the invite
        const invite = await storage.getInviteByEventId(eventId);
        if (invite) {
          await storage.markWebhookProcessed(webhookEvent.id, true);
        }
      } else {
        await storage.markWebhookProcessed(webhookEvent.id, false, 'Could not extract required fields from webhook payload');
      }

    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  /**
   * Force re-sync RSVP status for specific invite
   */
  async forceSyncInvite(inviteId: number): Promise<void> {
    const invite = await storage.getInvite(inviteId);
    if (!invite || !invite.eventId) {
      throw new Error(`Invite ${inviteId} not found or has no event ID`);
    }

    try {
      let rsvpStatus: string | undefined;

      if (invite.calendarProvider === 'google' && invite.googleAccountId) {
        const account = await storage.getGoogleAccount(invite.googleAccountId);
        if (account) {
          const { attendeeResponse } = await googleCalendarService.getEventStatus(account, invite.eventId);
          rsvpStatus = this.mapGoogleResponseStatus(attendeeResponse);
        }
      } else if (invite.calendarProvider === 'outlook' && invite.outlookAccountId) {
        const account = await storage.getOutlookAccount(invite.outlookAccountId);
        if (account) {
          const { status } = await outlookCalendarService.getEventStatus(account, invite.eventId);
          rsvpStatus = status;
        }
      }

      if (rsvpStatus && rsvpStatus !== 'pending') {
        await this.processRsvpUpdate({
          eventId: invite.eventId,
          prospectEmail: invite.prospectEmail,
          rsvpStatus: rsvpStatus as any,
          responseAt: new Date(),
          source: 'manual'
        });
      }

      // Update last status check
      await storage.updateInvite(inviteId, { lastStatusCheck: new Date() });
      
    } catch (error) {
      console.error(`Error force syncing invite ${inviteId}:`, error);
      throw error;
    }
  }

  /**
   * Get RSVP statistics for a campaign
   */
  async getCampaignRsvpStats(campaignId: number) {
    const invites = await storage.getInvites(campaignId);
    
    const stats = {
      total: invites.length,
      sent: invites.filter(i => i.status === 'sent' || i.rsvpStatus).length,
      accepted: invites.filter(i => i.rsvpStatus === 'accepted').length,
      declined: invites.filter(i => i.rsvpStatus === 'declined').length,
      tentative: invites.filter(i => i.rsvpStatus === 'tentative').length,
      noResponse: invites.filter(i => i.status === 'sent' && !i.rsvpStatus).length,
      acceptanceRate: 0,
      responseRate: 0
    };

    if (stats.sent > 0) {
      stats.acceptanceRate = Math.round((stats.accepted / stats.sent) * 100 * 10) / 10;
      stats.responseRate = Math.round(((stats.accepted + stats.declined + stats.tentative) / stats.sent) * 100 * 10) / 10;
    }

    return stats;
  }

  /**
   * Map Google Calendar response status to our standard format
   */
  private mapGoogleResponseStatus(responseStatus?: string): string {
    switch (responseStatus) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentative':
        return 'tentative';
      case 'needsAction':
      default:
        return 'needsAction';
    }
  }

  /**
   * Map Outlook response status to our standard format
   */
  private mapOutlookResponseStatus(responseStatus?: string): string {
    switch (responseStatus?.toLowerCase()) {
      case 'accepted':
        return 'accepted';
      case 'declined':
        return 'declined';
      case 'tentativelyaccepted':
        return 'tentative';
      case 'none':
      default:
        return 'needsAction';
    }
  }
}

export const rsvpTracker = new RsvpTracker();