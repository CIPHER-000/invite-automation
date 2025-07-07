import { google } from "googleapis";
import { storage } from "../storage";
import type { GoogleAccount } from "@shared/schema";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "378868803078-50gj80qdtcji129idk73mb5kjtski9da.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "https://6a2391b4-c08c-4318-89e8-f4587ae39044-00-3u78hq3a9p26b.worf.replit.dev/api/auth/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export class GoogleAuthService {
  private oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  getAuthUrl(): string {
    console.log("OAuth Client Configuration:", {
      clientId: CLIENT_ID ? "SET" : "MISSING",
      clientSecret: CLIENT_SECRET ? "SET" : "MISSING", 
      redirectUri: REDIRECT_URI
    });
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("Google OAuth credentials not configured properly");
    }
    
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
    const tokenResponse = await this.oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    
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

    const expiresAt = new Date(Date.now() + ((tokens.expiry_date || Date.now() + 3600000) - Date.now()));

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

    const expiresAt = new Date(credentials.expiry_date || Date.now() + 3600000);

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
