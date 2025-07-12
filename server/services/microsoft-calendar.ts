import { Client } from "@microsoft/microsoft-graph-client";
import { microsoftAuthService } from "./microsoft-auth";
import type { OutlookAccount } from "@shared/schema";

export class MicrosoftCalendarService {
  /**
   * Create calendar event using Microsoft Graph
   */
  async createCalendarEvent(
    account: OutlookAccount,
    eventData: {
      summary: string;
      description: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees: Array<{ email: string; name?: string }>;
    }
  ): Promise<{ id: string; htmlLink: string }> {
    try {
      const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
      
      const event = {
        subject: eventData.summary,
        body: {
          contentType: "HTML",
          content: eventData.description,
        },
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone,
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone,
        },
        attendees: eventData.attendees.map(attendee => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name || attendee.email,
          },
          type: "required",
        })),
        isOnlineMeeting: false,
        showAs: "busy",
      };

      const createdEvent = await graphClient.api('/me/events').post(event);
      
      return {
        id: createdEvent.id,
        htmlLink: createdEvent.webLink || `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventData.summary)}`,
      };
    } catch (error) {
      console.error("Failed to create Microsoft calendar event:", error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * Check calendar access for an account
   */
  async testCalendarAccess(account: OutlookAccount): Promise<boolean> {
    try {
      const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
      await graphClient.api('/me/calendars').top(1).get();
      return true;
    } catch (error) {
      console.error(`Calendar access test failed for ${account.email}:`, error);
      return false;
    }
  }

  /**
   * Get user's calendars
   */
  async getCalendars(account: OutlookAccount): Promise<any[]> {
    try {
      const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
      const response = await graphClient.api('/me/calendars').get();
      return response.value || [];
    } catch (error) {
      console.error(`Failed to get calendars for ${account.email}:`, error);
      return [];
    }
  }

  /**
   * Get event details by ID
   */
  async getEvent(account: OutlookAccount, eventId: string): Promise<any | null> {
    try {
      const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
      return await graphClient.api(`/me/events/${eventId}`).get();
    } catch (error) {
      console.error(`Failed to get event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Check if event has been responded to
   */
  async checkEventResponse(account: OutlookAccount, eventId: string): Promise<{
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
    responseTime?: Date;
  }> {
    try {
      const event = await this.getEvent(account, eventId);
      if (!event) {
        return { status: 'pending' };
      }

      // Check attendee responses
      const attendee = event.attendees?.find((att: any) => 
        att.emailAddress.address.toLowerCase() === account.email.toLowerCase()
      );

      if (attendee) {
        const responseStatus = attendee.status?.response?.toLowerCase();
        const responseTime = attendee.status?.time ? new Date(attendee.status.time) : undefined;

        switch (responseStatus) {
          case 'accepted':
            return { status: 'accepted', responseTime };
          case 'declined':
            return { status: 'declined', responseTime };
          case 'tentativelyaccepted':
            return { status: 'tentative', responseTime };
          default:
            return { status: 'pending' };
        }
      }

      return { status: 'pending' };
    } catch (error) {
      console.error(`Failed to check event response for ${eventId}:`, error);
      return { status: 'pending' };
    }
  }

  /**
   * Send calendar invite email
   */
  async sendCalendarInvite(
    account: OutlookAccount,
    eventData: {
      to: string;
      toName?: string;
      subject: string;
      htmlBody: string;
      eventDetails: any;
    }
  ): Promise<void> {
    try {
      const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
      
      const message = {
        subject: eventData.subject,
        body: {
          contentType: "HTML",
          content: eventData.htmlBody,
        },
        toRecipients: [{
          emailAddress: {
            address: eventData.to,
            name: eventData.toName || eventData.to,
          },
        }],
        from: {
          emailAddress: {
            address: account.email,
            name: account.name,
          },
        },
      };

      await graphClient.api('/me/sendMail').post({ message });
    } catch (error) {
      console.error("Failed to send calendar invite via Microsoft Graph:", error);
      throw new Error(`Failed to send invite: ${error.message}`);
    }
  }
}

export const microsoftCalendarService = new MicrosoftCalendarService();