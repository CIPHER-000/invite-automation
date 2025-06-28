import { google } from "googleapis";
import { storage } from "../storage";
import type { GoogleAccount } from "@shared/schema";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export class GoogleAuthService {
  private oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    userInfo: { email: string; name: string };
  }> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to get tokens from Google");
    }

    this.oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email || !userInfo.name) {
      throw new Error("Failed to get user info from Google");
    }

    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
      },
    };
  }

  async refreshAccessToken(account: GoogleAccount): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    this.oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }

    const expiresAt = new Date(Date.now() + (credentials.expires_in || 3600) * 1000);

    return {
      accessToken: credentials.access_token,
      expiresAt,
    };
  }

  async getValidAccessToken(account: GoogleAccount): Promise<string> {
    if (account.expiresAt > new Date()) {
      return account.accessToken;
    }

    const { accessToken, expiresAt } = await this.refreshAccessToken(account);
    
    await storage.updateGoogleAccount(account.id, {
      accessToken,
      expiresAt,
    });

    return accessToken;
  }

  createAuthClient(accessToken: string) {
    const client = new google.auth.OAuth2();
    client.setCredentials({ access_token: accessToken });
    return client;
  }
}

export const googleAuthService = new GoogleAuthService();
