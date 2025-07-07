import { google } from "googleapis";
import { googleAuthService } from "./google-auth";
import type { GoogleAccount, Campaign } from "@shared/schema";

export interface ProspectData {
  email: string;
  name?: string;
  company?: string;
  [key: string]: any;
}

export interface SheetUpdateData {
  status: string;
  timestamp: string;
  senderInbox: string;
  confirmationSent: string;
}

export class GoogleSheetsService {
  async readProspectData(account: GoogleAccount, campaign: Campaign): Promise<ProspectData[]> {
    const accessToken = await googleAuthService.getValidAccessToken(account);
    const auth = googleAuthService.createAuthClient(accessToken);
    const sheets = google.sheets({ version: "v4", auth });

    // Extract spreadsheet ID from URL
    const spreadsheetId = this.extractSpreadsheetId(campaign.sheetUrl);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: campaign.sheetRange || "A:Z",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // First row contains headers
    const headers = rows[0].map(h => String(h).toLowerCase());
    const emailColumnIndex = headers.findIndex(h => 
      h.includes("email") || h.includes("e-mail")
    );
    
    if (emailColumnIndex === -1) {
      throw new Error("No email column found in spreadsheet");
    }

    const prospects: ProspectData[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const email = row[emailColumnIndex];
      
      if (!email || !this.isValidEmail(email)) {
        continue;
      }

      const prospect: ProspectData = { email };
      
      // Map other columns to prospect data
      headers.forEach((header, index) => {
        if (index !== emailColumnIndex && row[index]) {
          prospect[header] = row[index];
        }
      });

      // Standard field mappings
      if (prospect.name === undefined) {
        prospect.name = prospect.firstname || prospect["first name"] || prospect.fullname || prospect["full name"];
      }
      
      if (prospect.company === undefined) {
        prospect.company = prospect.organization || prospect.org || prospect["company name"];
      }

      prospects.push(prospect);
    }

    return prospects;
  }

  async updateSheetRow(
    account: GoogleAccount, 
    campaign: Campaign, 
    rowIndex: number, 
    updateData: SheetUpdateData
  ): Promise<void> {
    const accessToken = await googleAuthService.getValidAccessToken(account);
    const auth = googleAuthService.createAuthClient(accessToken);
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = this.extractSpreadsheetId(campaign.sheetUrl);
    
    // First, get the current headers to know where to place updates
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "1:1",
    });

    const headers = headersResponse.data.values?.[0] || [];
    const updates: any[] = [];

    // Find or create columns for status tracking
    const statusColumnIndex = this.findOrCreateColumn(headers, "status");
    const timestampColumnIndex = this.findOrCreateColumn(headers, "timestamp");
    const senderColumnIndex = this.findOrCreateColumn(headers, "sender_inbox");
    const confirmationColumnIndex = this.findOrCreateColumn(headers, "confirmation_sent");

    // Prepare the update values
    const rowNumber = rowIndex + 2; // +1 for header, +1 for 0-based index
    
    if (statusColumnIndex !== -1) {
      updates.push({
        range: this.getColumnLetter(statusColumnIndex) + rowNumber,
        values: [[updateData.status]],
      });
    }

    if (timestampColumnIndex !== -1) {
      updates.push({
        range: this.getColumnLetter(timestampColumnIndex) + rowNumber,
        values: [[updateData.timestamp]],
      });
    }

    if (senderColumnIndex !== -1) {
      updates.push({
        range: this.getColumnLetter(senderColumnIndex) + rowNumber,
        values: [[updateData.senderInbox]],
      });
    }

    if (confirmationColumnIndex !== -1) {
      updates.push({
        range: this.getColumnLetter(confirmationColumnIndex) + rowNumber,
        values: [[updateData.confirmationSent]],
      });
    }

    // Batch update
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: updates,
        },
      });
    }
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error("Invalid Google Sheets URL");
    }
    return match[1];
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private findOrCreateColumn(headers: any[], columnName: string): number {
    const index = headers.findIndex(h => 
      String(h).toLowerCase() === columnName.toLowerCase()
    );
    return index;
  }

  private getColumnLetter(index: number): string {
    let result = "";
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  }
}

export const googleSheetsService = new GoogleSheetsService();
