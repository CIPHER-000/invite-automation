import { ConfidentialClientApplication, AuthenticationResult } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import type { OutlookAccount, InsertOutlookAccount } from "@shared/schema";

interface MicrosoftAuthConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export class MicrosoftAuthService {
  private msalApp: ConfidentialClientApplication;
  private config: MicrosoftAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/auth/microsoft/callback`,
    };

    this.msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
      },
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(state?: string): string {
    const authCodeUrlRequest = {
      scopes: ["openid", "profile", "email", "Calendars.ReadWrite", "Mail.Send", "offline_access"],
      redirectUri: this.config.redirectUri,
      state: state,
    };

    return this.msalApp.getAuthCodeUrl(authCodeUrlRequest);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, state?: string): Promise<AuthenticationResult> {
    const tokenRequest = {
      code: code,
      scopes: ["openid", "profile", "email", "Calendars.ReadWrite", "Mail.Send", "offline_access"],
      redirectUri: this.config.redirectUri,
    };

    return await this.msalApp.acquireTokenByCode(tokenRequest);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthenticationResult> {
    const refreshTokenRequest = {
      refreshToken: refreshToken,
      scopes: ["Calendars.ReadWrite", "Mail.Send"],
    };

    return await this.msalApp.acquireTokenByRefreshToken(refreshTokenRequest);
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    return await graphClient.api('/me').get();
  }

  /**
   * Create Microsoft Graph client with access token
   */
  createGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Test calendar access
   */
  async testCalendarAccess(accessToken: string): Promise<boolean> {
    try {
      const graphClient = this.createGraphClient(accessToken);
      await graphClient.api('/me/calendars').top(1).get();
      return true;
    } catch (error) {
      console.error("Failed to test calendar access:", error);
      return false;
    }
  }

  /**
   * Create calendar event
   */
  async createCalendarEvent(accessToken: string, eventData: any): Promise<any> {
    const graphClient = this.createGraphClient(accessToken);
    
    const event = {
      subject: eventData.summary || eventData.subject,
      body: {
        contentType: "HTML",
        content: eventData.description || "",
      },
      start: {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || "UTC",
      },
      end: {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || "UTC",
      },
      attendees: eventData.attendees?.map((attendee: any) => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name || attendee.email,
        },
        type: "required",
      })) || [],
      isOnlineMeeting: false,
      showAs: "busy",
    };

    return await graphClient.api('/me/events').post(event);
  }

  /**
   * Send email via Microsoft Graph
   */
  async sendEmail(accessToken: string, emailData: any): Promise<any> {
    const graphClient = this.createGraphClient(accessToken);
    
    const message = {
      subject: emailData.subject,
      body: {
        contentType: "HTML",
        content: emailData.body,
      },
      toRecipients: [{
        emailAddress: {
          address: emailData.to,
          name: emailData.toName || emailData.to,
        },
      }],
      from: {
        emailAddress: {
          address: emailData.from,
          name: emailData.fromName || emailData.from,
        },
      },
    };

    return await graphClient.api('/me/sendMail').post({ message });
  }

  /**
   * Revoke tokens (sign out)
   */
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      // Microsoft Graph doesn't have a direct revoke endpoint like Google
      // Instead, we can sign out the user from all sessions
      const graphClient = this.createGraphClient(accessToken);
      await graphClient.api('/me/revokeSignInSessions').post({});
    } catch (error) {
      console.error("Failed to revoke Microsoft tokens:", error);
      // Don't throw here as the tokens might already be invalid
    }
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Format account data for database storage
   */
  formatAccountData(authResult: AuthenticationResult, userProfile: any, userId: string): InsertOutlookAccount {
    return {
      userId,
      email: userProfile.mail || userProfile.userPrincipalName,
      name: userProfile.displayName || userProfile.mail,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken || "",
      expiresAt: new Date(authResult.expiresOn || Date.now() + 3600000),
      microsoftId: userProfile.id,
    };
  }
}

export const microsoftAuthService = new MicrosoftAuthService();