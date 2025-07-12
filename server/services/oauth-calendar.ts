import { google } from "googleapis";
import { googleAuthService } from "./google-auth";
import { storage } from "../storage";
import type { GoogleAccount } from "@shared/schema";

export interface OAuthEventDetails {
  title: string;
  description: string;
  attendeeEmail: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
  subjectLine?: string;
  sdrEmail?: string;
}

export class OAuthCalendarService {
  /**
   * Create calendar event using OAuth-authenticated Google account
   */
  async createEventWithOAuth(account: GoogleAccount, eventDetails: OAuthEventDetails): Promise<string> {
    // Get valid access token (refreshes if needed)
    const accessToken = await googleAuthService.getValidAccessToken(account);
    
    // Create OAuth client with fresh token
    const auth = googleAuthService.createAuthClient(accessToken);
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: eventDetails.subjectLine || eventDetails.title,
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
        ...(eventDetails.sdrEmail ? [{ email: eventDetails.sdrEmail }] : []),
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 10 },
          { method: 'popup', minutes: 10 },
        ],
      },
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
    };

    try {
      console.log(`Creating OAuth calendar event for ${eventDetails.attendeeEmail} using account ${account.email}`);
      
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        sendNotifications: true,
      });

      if (!response.data.id) {
        throw new Error("Failed to create calendar event");
      }

      // Update account last used timestamp
      await storage.updateGoogleAccount(account.id, {
        lastUsed: new Date()
      });

      console.log(`✅ OAuth calendar event created successfully: ${response.data.id}`);
      return response.data.id;
      
    } catch (error: any) {
      console.error('Failed to create OAuth calendar event:', error.message);
      
      // Check for authorization errors
      if (error.message && (error.message.includes('invalid_grant') || error.message.includes('unauthorized'))) {
        // Mark account as inactive if authorization fails
        await storage.updateGoogleAccount(account.id, {
          isActive: false
        });
        throw new Error(`Calendar access expired for ${account.email}. Please reconnect the account.`);
      }
      
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Get calendar event status using OAuth account
   */
  async getEventStatus(account: GoogleAccount, eventId: string): Promise<{
    status: string;
    attendeeResponse?: string;
  }> {
    const accessToken = await googleAuthService.getValidAccessToken(account);
    const auth = googleAuthService.createAuthClient(accessToken);
    const calendar = google.calendar({ version: "v3", auth });

    try {
      const response = await calendar.events.get({
        calendarId: "primary",
        eventId,
      });

      const event = response.data;
      let attendeeResponse = "needsAction";

      // Find the attendee response
      if (event.attendees && event.attendees.length > 0) {
        const attendee = event.attendees.find(a => a.email !== account.email);
        if (attendee) {
          attendeeResponse = attendee.responseStatus || "needsAction";
        }
      }

      return {
        status: event.status || "unknown",
        attendeeResponse,
      };
    } catch (error: any) {
      console.error('Failed to get OAuth event status:', error.message);
      return {
        status: "error",
        attendeeResponse: "unknown",
      };
    }
  }

  /**
   * Process merge fields in templates
   */
  processMergeFields(template: string, prospectData: Record<string, any>): string {
    let processed = template;
    
    // Replace all merge fields with actual data
    Object.keys(prospectData).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = prospectData[key] || '';
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return processed;
  }

  /**
   * Test OAuth calendar access for an account
   */
  async testCalendarAccess(account: GoogleAccount): Promise<{
    success: boolean;
    message: string;
    calendarName?: string;
  }> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(account);
      const auth = googleAuthService.createAuthClient(accessToken);
      const calendar = google.calendar({ version: "v3", auth });

      // Test by getting calendar info
      const response = await calendar.calendars.get({
        calendarId: "primary"
      });

      return {
        success: true,
        message: "Calendar access verified",
        calendarName: response.data.summary || account.email
      };
    } catch (error: any) {
      console.error(`Calendar access test failed for ${account.email}:`, error.message);
      return {
        success: false,
        message: `Calendar access failed: ${error.message}`
      };
    }
  }
}

export const oauthCalendarService = new OAuthCalendarService();