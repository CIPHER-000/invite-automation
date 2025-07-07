import { google } from "googleapis";
import { freshOAuthService } from "./oauth-fresh";
import { googleServiceAuthService } from "./google-service-auth";
import { storage } from "../storage";
import type { GoogleAccount, Invite } from "@shared/schema";

export interface EventDetails {
  title: string;
  description: string;
  attendeeEmail: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
}

export class GoogleCalendarService {
  async createEvent(account: GoogleAccount, eventDetails: EventDetails): Promise<string> {
    let auth;

    // Check if this is a service account or OAuth account
    if (account.accessToken === "SERVICE_ACCOUNT_TOKEN") {
      // Use service account auth
      auth = googleServiceAuthService.getServiceAccountAuth();
      if (!auth) {
        throw new Error("Service account not configured");
      }
    } else {
      // Use OAuth auth
      const accessToken = await freshOAuthService.getValidAccessToken(account);
      auth = freshOAuthService.createAuthClient(accessToken);
    }

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: eventDetails.title,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: eventDetails.timeZone,
      },
      end: {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: eventDetails.timeZone,
      },
      attendees: [
        { email: eventDetails.attendeeEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 24 hours
          { method: "popup", minutes: 30 }, // 30 minutes
        ],
      },
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
    };

    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        sendNotifications: true,
      });

      if (!response.data.id) {
        throw new Error("Failed to create calendar event");
      }

      return response.data.id;
    } catch (error: any) {
      console.error('Failed to create calendar event:', error.message);
      
      // Check if this is a Domain-Wide Delegation error
      if (error.message && error.message.includes('Domain-Wide Delegation')) {
        throw new Error(`Service accounts cannot invite attendees without Domain-Wide Delegation of Authority. Please configure Domain-Wide Delegation in Google Admin Console. See DOMAIN_DELEGATION_SETUP.md for detailed instructions.`);
      }
      
      // Check for other common authorization errors that indicate missing delegation
      if (error.message && (error.message.includes('insufficient') || error.message.includes('forbidden') || error.message.includes('cannot invite'))) {
        throw new Error(`Calendar access denied. If using Service Account, ensure Domain-Wide Delegation is configured with these scopes: https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/spreadsheets. See DOMAIN_DELEGATION_SETUP.md for setup instructions.`);
      }
      
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  async getEventStatus(account: GoogleAccount, eventId: string): Promise<{
    status: string;
    attendeeResponse?: string;
  }> {
    const accessToken = await freshOAuthService.getValidAccessToken(account);
    const auth = freshOAuthService.createAuthClient(accessToken);
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    const event = response.data;
    const attendee = event.attendees?.find(a => a.email !== account.email);
    
    return {
      status: event.status || "unknown",
      attendeeResponse: attendee?.responseStatus,
    };
  }

  async checkPendingInvites(): Promise<void> {
    const pendingInvites = await storage.getInvitesByStatus("sent");
    
    for (const invite of pendingInvites) {
      try {
        if (!invite.eventId) continue;

        const account = await storage.getGoogleAccount(invite.googleAccountId);
        if (!account) continue;

        const { attendeeResponse } = await this.getEventStatus(account, invite.eventId);
        
        if (attendeeResponse === "accepted" && invite.status !== "accepted") {
          await storage.updateInvite(invite.id, {
            status: "accepted",
            acceptedAt: new Date(),
          });

          await storage.createActivityLog({
            type: "invite_accepted",
            campaignId: invite.campaignId,
            inviteId: invite.id,
            googleAccountId: invite.googleAccountId,
            message: `${invite.prospectEmail} accepted calendar invite`,
            metadata: { prospectEmail: invite.prospectEmail },
          });

          // Trigger confirmation email sending
          // This will be handled by the email service
        }
      } catch (error) {
        console.error(`Error checking invite ${invite.id}:`, error);
      }
    }
  }

  processMergeFields(template: string, mergeData: Record<string, any>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(mergeData)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      processed = processed.replace(regex, String(value || ""));
    }
    
    return processed;
  }
}

export const googleCalendarService = new GoogleCalendarService();
