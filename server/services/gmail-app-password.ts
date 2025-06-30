import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { storage } from '../storage';
import type { GoogleAccount } from '@shared/schema';

interface AppPasswordAccount {
  email: string;
  appPassword: string;
  name?: string;
}

export class GmailAppPasswordService {
  private accounts: Map<string, AppPasswordAccount> = new Map();

  async addAccount(email: string, appPassword: string, name?: string): Promise<GoogleAccount> {
    try {
      // Test the credentials first
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: email,
          pass: appPassword
        }
      });

      // Verify the connection
      await transporter.verify();

      // Create OAuth2 client for Google APIs using app password
      const auth = new google.auth.GoogleAuth({
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/spreadsheets'
        ],
        credentials: {
          type: 'authorized_user',
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: appPassword // We'll use app password as a pseudo-refresh token
        }
      });

      // Store the account
      const accountData: AppPasswordAccount = {
        email,
        appPassword,
        name: name || email.split('@')[0]
      };
      
      this.accounts.set(email, accountData);

      // Create Google account record
      const googleAccount = await storage.createGoogleAccount({
        email,
        name: accountData.name,
        accessToken: 'APP_PASSWORD_TOKEN',
        refreshToken: appPassword,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: true
      });

      console.log(`Gmail app password account added: ${email}`);
      return googleAccount;

    } catch (error) {
      console.error('Failed to add Gmail app password account:', error);
      throw new Error(`Failed to authenticate with Gmail using app password: ${error.message}`);
    }
  }

  async createCalendarEvent(account: GoogleAccount, eventDetails: any): Promise<string> {
    try {
      const accountData = this.accounts.get(account.email);
      if (!accountData) {
        throw new Error('Account not found in app password service');
      }

      // For app passwords, we need to use SMTP authentication for email
      // and OAuth2 for Calendar API access. Since app passwords don't work with Calendar API,
      // we'll need to use a different approach or require OAuth2 for calendar functionality.
      
      // For now, let's create a mock calendar event and send via email
      const eventId = `app_password_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send calendar invitation via email instead
      await this.sendCalendarInviteEmail(accountData, eventDetails, eventId);
      
      return eventId;

    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  private async sendCalendarInviteEmail(accountData: AppPasswordAccount, eventDetails: any, eventId: string): Promise<void> {
    const startTime = new Date(eventDetails.startTime);
    const endTime = new Date(eventDetails.endTime);
    
    // Create ICS calendar data
    const icsContent = this.generateICSContent(eventDetails, eventId, startTime, endTime);
    
    const subject = `Meeting Invitation: ${eventDetails.title}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${eventDetails.title}</h2>
        <p>${eventDetails.description}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Meeting Details</h3>
          <p><strong>Date:</strong> ${startTime.toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}</p>
          <p><strong>Duration:</strong> ${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} minutes</p>
        </div>
        
        <p>Please find the calendar invitation attached.</p>
        <p>Looking forward to our meeting!</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: accountData.email,
        pass: accountData.appPassword
      }
    });

    await transporter.sendMail({
      from: accountData.email,
      to: eventDetails.attendeeEmail,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: 'meeting.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
    });

    console.log(`Calendar invitation sent via email to ${eventDetails.attendeeEmail}`);
  }

  private generateICSContent(eventDetails: any, eventId: string, startTime: Date, endTime: Date): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Shady 5.0//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${eventId}@shady5.app
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${eventDetails.title}
DESCRIPTION:${eventDetails.description.replace(/\n/g, '\\n')}
ORGANIZER:mailto:${eventDetails.organizerEmail || 'noreply@shady5.app'}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${eventDetails.attendeeEmail}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  }

  private async getAccessTokenForAccount(email: string): Promise<string> {
    // For app passwords, we'll use a simple token that represents the app password
    return `app_password_token_${Buffer.from(email).toString('base64')}`;
  }

  async sendEmail(fromEmail: string, toEmail: string, subject: string, body: string): Promise<void> {
    try {
      const accountData = this.accounts.get(fromEmail);
      if (!accountData) {
        throw new Error('Account not found');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: accountData.email,
          pass: accountData.appPassword
        }
      });

      await transporter.sendMail({
        from: accountData.email,
        to: toEmail,
        subject,
        html: body
      });

      console.log(`Email sent from ${fromEmail} to ${toEmail}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  getAccount(email: string): AppPasswordAccount | undefined {
    return this.accounts.get(email);
  }

  getAllAccounts(): AppPasswordAccount[] {
    return Array.from(this.accounts.values());
  }

  removeAccount(email: string): boolean {
    return this.accounts.delete(email);
  }
}

export const gmailAppPasswordService = new GmailAppPasswordService();