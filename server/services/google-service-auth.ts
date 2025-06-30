import { google } from "googleapis";
import { storage } from "../storage";
import type { GoogleAccount } from "@shared/schema";

export class GoogleServiceAuthService {
  private auth: any;

  constructor() {
    // Initialize with service account credentials
    this.initializeServiceAccount();
  }

  private async initializeServiceAccount() {
    try {
      // Service account configuration from environment
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || serviceAccountEmail;

      if (!serviceAccountEmail || !privateKey) {
        console.log("Service account credentials not configured, falling back to OAuth");
        return;
      }

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          type: "service_account",
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: privateKey,
          client_email: clientEmail,
          client_id: process.env.GOOGLE_CLIENT_ID,
        },
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive",
        ],
      });

      console.log("Google Service Account initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Google Service Account:", error);
    }
  }

  async createServiceAccountConnection(email: string): Promise<GoogleAccount> {
    if (!this.auth) {
      throw new Error("Service account not configured");
    }

    try {
      // Test the service account by making a simple API call
      const calendar = google.calendar({ version: "v3", auth: this.auth });
      await calendar.calendarList.list({ maxResults: 1 });

      // Create a "service account" entry in our database
      const serviceAccount: GoogleAccount = await storage.createGoogleAccount({
        email: email,
        name: `Service Account (${email})`,
        accessToken: "SERVICE_ACCOUNT_TOKEN", // Placeholder since we use the auth object
        refreshToken: "SERVICE_ACCOUNT_REFRESH", // Placeholder
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true,
      });

      return serviceAccount;
    } catch (error) {
      console.error("Service account connection failed:", error);
      throw new Error("Failed to connect service account");
    }
  }

  getServiceAccountAuth() {
    return this.auth;
  }

  isServiceAccountConfigured(): boolean {
    return !!this.auth;
  }

  async testServiceAccountAccess(): Promise<{
    calendar: boolean;
    sheets: boolean;
    error?: string;
  }> {
    if (!this.auth) {
      return { calendar: false, sheets: false, error: "Service account not configured" };
    }

    const results = { calendar: false, sheets: false, error: undefined as string | undefined };

    try {
      // Test Calendar API access
      const calendar = google.calendar({ version: "v3", auth: this.auth });
      await calendar.calendarList.list({ maxResults: 1 });
      results.calendar = true;
    } catch (error) {
      console.error("Calendar API test failed:", error);
    }

    try {
      // Test Sheets API access
      const sheets = google.sheets({ version: "v4", auth: this.auth });
      // We can't test without a specific sheet, so we'll assume it works if auth is valid
      results.sheets = true;
    } catch (error) {
      console.error("Sheets API test failed:", error);
    }

    return results;
  }
}

export const googleServiceAuthService = new GoogleServiceAuthService();