import { outlookAuthService } from "./outlook-auth";
import type { EventDetails } from "./google-calendar";

export class OutlookCalendarService {
  async createEvent(account: any, eventDetails: EventDetails): Promise<string> {
    try {
      const accessToken = await outlookAuthService.getValidAccessToken(account);
      const graphClient = outlookAuthService.createGraphClient(accessToken);

      // Convert to Outlook event format
      const outlookEvent = {
        subject: eventDetails.title,
        body: {
          contentType: "HTML",
          content: eventDetails.description,
        },
        start: {
          dateTime: eventDetails.startTime.toISOString(),
          timeZone: eventDetails.timeZone || "UTC",
        },
        end: {
          dateTime: eventDetails.endTime.toISOString(),
          timeZone: eventDetails.timeZone || "UTC",
        },
        attendees: [
          {
            emailAddress: {
              address: eventDetails.attendeeEmail,
              name: eventDetails.attendeeEmail.split("@")[0],
            },
            type: "required",
          },
        ],
        isOnlineMeeting: false,
        responseRequested: true,
        allowNewTimeProposals: false,
      };

      const response = await graphClient.post("/me/events", outlookEvent);
      
      return response.id;
    } catch (error) {
      console.error("Failed to create Outlook calendar event:", error);
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getEventStatus(account: any, eventId: string): Promise<{
    status: "pending" | "accepted" | "declined" | "tentative";
    attendeeResponse?: string;
  }> {
    try {
      const accessToken = await outlookAuthService.getValidAccessToken(account);
      const graphClient = outlookAuthService.createGraphClient(accessToken);

      const event = await graphClient.get(`/me/events/${eventId}`);
      
      // Check attendee responses
      const attendees = event.attendees || [];
      const primaryAttendee = attendees.find((att: any) => att.type === "required");
      
      if (!primaryAttendee) {
        return { status: "pending" };
      }

      // Map Outlook response status to our status
      const responseStatus = primaryAttendee.status?.response?.toLowerCase();
      let status: "pending" | "accepted" | "declined" | "tentative" = "pending";
      
      switch (responseStatus) {
        case "accepted":
          status = "accepted";
          break;
        case "declined":
          status = "declined";
          break;
        case "tentativelyaccepted":
          status = "tentative";
          break;
        default:
          status = "pending";
      }

      return {
        status,
        attendeeResponse: responseStatus,
      };
    } catch (error) {
      console.error("Failed to get Outlook event status:", error);
      return { status: "pending" };
    }
  }

  async checkPendingInvites(): Promise<void> {
    // Implementation for checking all pending Outlook invites
    // This would be called periodically by the queue manager
    console.log("Checking pending Outlook invites...");
  }

  processMergeFields(template: string, mergeData: Record<string, any>): string {
    let result = template;
    
    // Replace merge fields like {{name}}, {{company}}, etc.
    Object.entries(mergeData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, String(value || ''));
    });
    
    return result;
  }

  async updateEvent(account: any, eventId: string, updates: Partial<EventDetails>): Promise<void> {
    try {
      const accessToken = await outlookAuthService.getValidAccessToken(account);
      const graphClient = outlookAuthService.createGraphClient(accessToken);

      const updateData: any = {};

      if (updates.title) {
        updateData.subject = updates.title;
      }

      if (updates.description) {
        updateData.body = {
          contentType: "HTML",
          content: updates.description,
        };
      }

      if (updates.startTime) {
        updateData.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: updates.timeZone || "UTC",
        };
      }

      if (updates.endTime) {
        updateData.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: updates.timeZone || "UTC",
        };
      }

      await graphClient.patch(`/me/events/${eventId}`, updateData);
    } catch (error) {
      console.error("Failed to update Outlook event:", error);
      throw error;
    }
  }

  async deleteEvent(account: any, eventId: string): Promise<void> {
    try {
      const accessToken = await outlookAuthService.getValidAccessToken(account);
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to delete Outlook event:", error);
      throw error;
    }
  }

  async listEvents(account: any, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const accessToken = await outlookAuthService.getValidAccessToken(account);
      const graphClient = outlookAuthService.createGraphClient(accessToken);

      let endpoint = "/me/events";
      const params = new URLSearchParams();

      if (startDate && endDate) {
        params.append("$filter", `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`);
      }

      params.append("$select", "id,subject,start,end,attendees,responseStatus");
      params.append("$orderby", "start/dateTime");

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await graphClient.get(endpoint);
      return response.value || [];
    } catch (error) {
      console.error("Failed to list Outlook events:", error);
      return [];
    }
  }
}

export const outlookCalendarService = new OutlookCalendarService();