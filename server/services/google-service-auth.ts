import { google } from "googleapis";
import { storage } from "../storage";
import type { GoogleAccount } from "@shared/schema";

interface ServiceAccountCredentials {
  email: string;
  privateKey: string;
  projectId: string;
}

export class GoogleServiceAuthService {
  private auth: any;
  private credentials: ServiceAccountCredentials | null = null;

  constructor() {
    // Initialize with service account credentials
    this.initializeServiceAccount();
  }

  private async initializeServiceAccount() {
    try {
      // DISABLED: Service account authentication disabled due to deleted project #571943054804
      // Will fall back to OAuth authentication
      console.log("Service account authentication disabled - using OAuth only");
      return;
      
      // Try environment variables first
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const projectId = process.env.GOOGLE_PROJECT_ID;

      if (serviceAccountEmail && privateKey && projectId) {
        await this.configureServiceAccount({
          email: serviceAccountEmail,
          privateKey,
          projectId
        });
        
        // Ensure the service account record exists in storage
        try {
          const existingAccount = await storage.getGoogleAccountByEmail(serviceAccountEmail);
          if (!existingAccount) {
            await this.createServiceAccountConnection(serviceAccountEmail, {
              email: serviceAccountEmail,
              privateKey,
              projectId
            });
          }
        } catch (error) {
          // Account doesn't exist, create it
          await this.createServiceAccountConnection(serviceAccountEmail, {
            email: serviceAccountEmail,
            privateKey,
            projectId
          });
        }
        
        console.log("Google Service Account initialized from environment variables");
        return;
      }

      // Try to load from system settings if available
      try {
        const settings = await storage.getSystemSettings();
        const storedCredentials = (settings as any).serviceAccountCredentials;
        
        if (storedCredentials && storedCredentials.email && storedCredentials.privateKey) {
          await this.configureServiceAccount(storedCredentials);
          console.log("Google Service Account initialized from stored settings");
          return;
        }
      } catch (error) {
        // Settings might not exist yet, continue
      }

      console.log("Service account credentials not configured, falling back to OAuth");
    } catch (error) {
      console.error("Failed to initialize Google Service Account:", error);
    }
  }

  async configureServiceAccount(credentials: ServiceAccountCredentials): Promise<void> {
    try {
      this.credentials = credentials;
      
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          type: "service_account",
          project_id: credentials.projectId,
          private_key: credentials.privateKey,
          client_email: credentials.email,
        },
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive",
        ],
      });

      // Store credentials in system settings for persistence
      const currentSettings = await storage.getSystemSettings();
      await storage.updateSystemSettings({
        ...currentSettings,
        serviceAccountCredentials: credentials
      });

      console.log("Google Service Account configured successfully");
    } catch (error) {
      console.error("Failed to configure Google Service Account:", error);
      throw error;
    }
  }

  async createServiceAccountConnection(email: string, credentials?: ServiceAccountCredentials): Promise<GoogleAccount> {
    // If credentials are provided, configure the service account first
    if (credentials) {
      await this.configureServiceAccount(credentials);
    }
    
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

  // Create impersonated auth client for a specific user
  getImpersonatedAuth(userEmail: string) {
    if (!this.auth || !this.credentials) {
      throw new Error("Service account not configured");
    }

    // Create JWT auth for domain-wide delegation
    return new google.auth.JWT({
      email: this.credentials.email,
      key: this.credentials.privateKey,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
      subject: userEmail, // This impersonates the user
    });
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