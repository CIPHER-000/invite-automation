import { google } from "googleapis";

const CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || process.env.AZURE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/outlook/callback`;
const TENANT_ID = process.env.AZURE_TENANT_ID || "common";

export interface OutlookTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface OutlookUserInfo {
  email: string;
  name: string;
  id: string;
}

export class OutlookAuthService {
  private authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;
  private tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  private scopes = [
    "https://graph.microsoft.com/User.Read",
    "https://graph.microsoft.com/Calendars.ReadWrite",
    "https://graph.microsoft.com/Mail.Send",
    "offline_access"
  ].join(" ");

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: this.scopes,
      response_mode: "query",
      state: "outlook_auth"
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    userInfo: OutlookUserInfo;
  }> {
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokenData = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Get user info
      const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userData = await userResponse.json();

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        userInfo: {
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          id: userData.id,
        },
      };
    } catch (error) {
      console.error("Outlook auth error:", error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    try {
      const response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Sometimes refresh token is not returned
        expiresAt,
      };
    } catch (error) {
      console.error("Outlook token refresh error:", error);
      throw error;
    }
  }

  async getValidAccessToken(account: any): Promise<string> {
    // Check if current token is still valid (with 5-minute buffer)
    const now = new Date();
    const expiryBuffer = new Date(account.expiresAt.getTime() - 5 * 60 * 1000);

    if (now < expiryBuffer) {
      return account.accessToken;
    }

    // Refresh the token
    const { accessToken } = await this.refreshAccessToken(account.refreshToken);
    return accessToken;
  }

  createGraphClient(accessToken: string) {
    return {
      async get(endpoint: string) {
        const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Graph API error: ${response.statusText}`);
        }

        return response.json();
      },

      async post(endpoint: string, data: any) {
        const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Graph API error: ${error}`);
        }

        return response.json();
      },

      async patch(endpoint: string, data: any) {
        const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Graph API error: ${error}`);
        }

        return response.json();
      }
    };
  }
}

export const outlookAuthService = new OutlookAuthService();