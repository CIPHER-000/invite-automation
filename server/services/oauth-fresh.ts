import { google } from "googleapis";
import { storage } from "../storage";
import type { GoogleAccount } from "@shared/schema";

// NEW PROJECT CREDENTIALS - kally-465213
const CLIENT_ID = "378868803078-50gj80qdtcji129idk73mb5kjtski9da.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://6a2391b4-c08c-4318-89e8-f4587ae39044-00-3u78hq3a9p26b.worf.replit.dev/api/auth/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export class FreshOAuthService {
  private oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  getAuthUrl(): string {
    console.log("Fresh OAuth Client Configuration:", {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: SCOPES
    });

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to get tokens");
    }

    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000));
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
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

    const expiresAt = new Date(Date.now() + (credentials.expiry_date || 3600000));
    
    return {
      accessToken: credentials.access_token,
      expiresAt,
    };
  }

  async getValidAccessToken(account: GoogleAccount): Promise<string> {
    const now = new Date();
    const expiresAt = new Date(account.expiresAt);
    
    if (now < expiresAt) {
      return account.accessToken;
    }
    
    const { accessToken, expiresAt: newExpiresAt } = await this.refreshAccessToken(account);
    
    await storage.updateGoogleAccount(account.id, {
      accessToken,
      expiresAt: newExpiresAt,
    });
    
    return accessToken;
  }

  createAuthClient(accessToken: string) {
    const authClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    authClient.setCredentials({
      access_token: accessToken,
    });
    return authClient;
  }
}

export const freshOAuthService = new FreshOAuthService();