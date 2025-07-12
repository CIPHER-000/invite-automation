import { db } from '../db';
import { inviteTimeline, emailActivity, responseSettings, invites, campaigns } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { GoogleAuth } from 'google-auth-library';
import { gmail_v1, google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

export interface TimelineEvent {
  id: number;
  type: 'invite_sent' | 'rsvp_response' | 'email_received' | 'time_proposal' | 'domain_activity';
  source: 'gmail' | 'outlook' | 'calendar_api' | 'webhook';
  action?: string;
  summary: string;
  details?: any;
  recipientEmail?: string;
  senderEmail?: string;
  subject?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export class ResponseIntelligenceService {
  private gmail: gmail_v1.Gmail | null = null;
  private graphClient: Client | null = null;

  constructor() {
    this.initializeClients();
  }

  private async initializeClients() {
    try {
      // Initialize Gmail client (will be configured per account)
      const auth = new GoogleAuth({
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify'
        ]
      });
      
      this.gmail = google.gmail({ version: 'v1', auth });
    } catch (error) {
      console.error('Failed to initialize Gmail client:', error);
    }
  }

  // Log timeline event for an invite
  async logTimelineEvent(
    inviteId: number,
    userId: string,
    campaignId: number,
    event: Omit<TimelineEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      // Extract domain from recipient email
      const recipientDomain = event.recipientEmail 
        ? event.recipientEmail.split('@')[1] 
        : null;

      await db.insert(inviteTimeline).values({
        inviteId,
        userId,
        campaignId,
        type: event.type,
        source: event.source,
        action: event.action,
        summary: event.summary,
        details: event.details,
        recipientEmail: event.recipientEmail,
        recipientDomain,
        senderEmail: event.senderEmail,
        subject: event.subject,
        severity: event.severity,
        metadata: {},
        timestamp: new Date(),
      });

      console.log(`Timeline event logged: ${event.summary} for invite ${inviteId}`);
    } catch (error) {
      console.error('Failed to log timeline event:', error);
    }
  }

  // Get timeline for a specific invite
  async getInviteTimeline(inviteId: number): Promise<TimelineEvent[]> {
    try {
      const events = await db
        .select()
        .from(inviteTimeline)
        .where(eq(inviteTimeline.inviteId, inviteId))
        .orderBy(desc(inviteTimeline.timestamp));

      return events.map(event => ({
        id: event.id,
        type: event.type as TimelineEvent['type'],
        source: event.source as TimelineEvent['source'],
        action: event.action || undefined,
        summary: event.summary,
        details: event.details,
        recipientEmail: event.recipientEmail || undefined,
        senderEmail: event.senderEmail || undefined,
        subject: event.subject || undefined,
        timestamp: new Date(event.timestamp),
        severity: event.severity as TimelineEvent['severity'],
      }));
    } catch (error) {
      console.error('Failed to get invite timeline:', error);
      return [];
    }
  }

  // Set up Gmail API monitoring for an account
  async setupGmailMonitoring(
    userId: string,
    accountId: number,
    accessToken: string
  ): Promise<void> {
    try {
      // Configure OAuth2 client with the account's access token
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth });

      // Get current history ID
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const historyId = profile.data.historyId;

      // Store settings
      await db.insert(responseSettings).values({
        userId,
        accountType: 'google',
        accountId,
        isMonitoringEnabled: true,
        domainMatching: true,
        subjectMatching: true,
        historyId,
        syncStatus: 'active',
      }).onConflictDoUpdate({
        target: [responseSettings.userId, responseSettings.accountType, responseSettings.accountId],
        set: {
          historyId,
          isMonitoringEnabled: true,
          syncStatus: 'active',
          updatedAt: new Date(),
        }
      });

      console.log(`Gmail monitoring setup for account ${accountId}`);
    } catch (error) {
      console.error('Failed to setup Gmail monitoring:', error);
    }
  }

  // Process Gmail history for new emails
  async processGmailHistory(
    userId: string,
    accountId: number,
    accessToken: string
  ): Promise<void> {
    try {
      // Get current settings
      const settings = await db
        .select()
        .from(responseSettings)
        .where(
          and(
            eq(responseSettings.userId, userId),
            eq(responseSettings.accountType, 'google'),
            eq(responseSettings.accountId, accountId)
          )
        )
        .limit(1);

      if (!settings.length || !settings[0].historyId) {
        console.log('No Gmail monitoring settings found');
        return;
      }

      const currentSettings = settings[0];
      
      // Configure OAuth2 client
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth });

      // Get history since last check
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: currentSettings.historyId,
        historyTypes: ['messageAdded'],
      });

      if (!historyResponse.data.history) {
        console.log('No new Gmail history');
        return;
      }

      // Process each history record
      for (const historyRecord of historyResponse.data.history) {
        if (historyRecord.messagesAdded) {
          for (const messageAdded of historyRecord.messagesAdded) {
            await this.processGmailMessage(
              userId,
              accountId,
              messageAdded.message?.id!,
              gmail
            );
          }
        }
      }

      // Update history ID
      await db
        .update(responseSettings)
        .set({
          historyId: historyResponse.data.historyId,
          lastSync: new Date(),
        })
        .where(
          and(
            eq(responseSettings.userId, userId),
            eq(responseSettings.accountType, 'google'),
            eq(responseSettings.accountId, accountId)
          )
        );

    } catch (error) {
      console.error('Failed to process Gmail history:', error);
    }
  }

  // Process individual Gmail message
  private async processGmailMessage(
    userId: string,
    accountId: number,
    messageId: string,
    gmail: gmail_v1.Gmail
  ): Promise<void> {
    try {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = messageResponse.data;
      if (!message.payload?.headers) return;

      // Extract email details
      const headers = message.payload.headers;
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
      const toHeader = headers.find(h => h.name?.toLowerCase() === 'to');
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');

      const fromEmail = fromHeader?.value || '';
      const toEmail = toHeader?.value || '';
      const subject = subjectHeader?.value || '';
      const fromDomain = fromEmail.includes('@') ? fromEmail.split('@')[1].toLowerCase() : '';

      // Store email activity
      await db.insert(emailActivity).values({
        userId,
        accountType: 'google',
        accountId,
        messageId: message.id!,
        threadId: message.threadId,
        fromEmail,
        fromDomain,
        toEmail,
        subject,
        snippet: message.snippet || '',
        labels: message.labelIds || [],
        receivedAt: new Date(parseInt(message.internalDate || '0')),
      }).onConflictDoNothing();

      // Try to match with existing invites
      await this.matchEmailToInvites(userId, {
        messageId: message.id!,
        fromEmail,
        fromDomain,
        subject,
        snippet: message.snippet || '',
      });

    } catch (error) {
      console.error('Failed to process Gmail message:', error);
    }
  }

  // Match incoming email to existing invites
  private async matchEmailToInvites(
    userId: string,
    emailData: {
      messageId: string;
      fromEmail: string;
      fromDomain: string;
      subject: string;
      snippet: string;
    }
  ): Promise<void> {
    try {
      // Find invites that match this email
      const matchingInvites = await db
        .select({
          id: invites.id,
          campaignId: invites.campaignId,
          prospectEmail: invites.prospectEmail,
          prospectName: invites.prospectName,
        })
        .from(invites)
        .where(
          and(
            eq(invites.userId, userId),
            sql`LOWER(${invites.prospectEmail}) = LOWER(${emailData.fromEmail})`
          )
        );

      // Also check domain-level matching
      const domainMatches = await db
        .select({
          id: invites.id,
          campaignId: invites.campaignId,
          prospectEmail: invites.prospectEmail,
          prospectName: invites.prospectName,
        })
        .from(invites)
        .where(
          and(
            eq(invites.userId, userId),
            sql`LOWER(SPLIT_PART(${invites.prospectEmail}, '@', 2)) = LOWER(${emailData.fromDomain})`
          )
        );

      const allMatches = [...matchingInvites, ...domainMatches];

      // Log timeline events for matches
      for (const invite of allMatches) {
        const isDirect = invite.prospectEmail.toLowerCase() === emailData.fromEmail.toLowerCase();
        const matchType = isDirect ? 'direct_reply' : 'domain_activity';

        await this.logTimelineEvent(
          invite.id,
          userId,
          invite.campaignId,
          {
            type: 'email_received',
            source: 'gmail',
            action: matchType,
            summary: isDirect 
              ? `Reply received from ${emailData.fromEmail}`
              : `Email from ${emailData.fromEmail} (same domain as prospect)`,
            details: {
              messageId: emailData.messageId,
              subject: emailData.subject,
              snippet: emailData.snippet,
              matchType,
            },
            recipientEmail: invite.prospectEmail,
            senderEmail: emailData.fromEmail,
            subject: emailData.subject,
            severity: 'info',
          }
        );

        // Update email activity with relationship
        await db
          .update(emailActivity)
          .set({
            relatedInviteId: invite.id,
            relatedCampaignId: invite.campaignId,
            matchingCriteria: matchType,
            isProcessed: true,
            processedAt: new Date(),
          })
          .where(eq(emailActivity.messageId, emailData.messageId));
      }

    } catch (error) {
      console.error('Failed to match email to invites:', error);
    }
  }

  // Log RSVP response
  async logRsvpResponse(
    inviteId: number,
    userId: string,
    campaignId: number,
    response: 'accepted' | 'declined' | 'tentative',
    details?: any
  ): Promise<void> {
    await this.logTimelineEvent(inviteId, userId, campaignId, {
      type: 'rsvp_response',
      source: 'calendar_api',
      action: response,
      summary: `Meeting ${response}`,
      details,
      severity: response === 'accepted' ? 'success' : 'info',
    });
  }

  // Log invite sent
  async logInviteSent(
    inviteId: number,
    userId: string,
    campaignId: number,
    recipientEmail: string,
    eventId: string
  ): Promise<void> {
    await this.logTimelineEvent(inviteId, userId, campaignId, {
      type: 'invite_sent',
      source: 'calendar_api',
      summary: `Calendar invite sent to ${recipientEmail}`,
      details: { eventId },
      recipientEmail,
      severity: 'info',
    });
  }

  // Get campaign activity summary
  async getCampaignActivitySummary(campaignId: number): Promise<{
    totalEvents: number;
    rsvpResponses: number;
    emailsReceived: number;
    domainActivity: number;
  }> {
    try {
      const stats = await db
        .select({
          type: inviteTimeline.type,
          count: sql<number>`count(*)`,
        })
        .from(inviteTimeline)
        .where(eq(inviteTimeline.campaignId, campaignId))
        .groupBy(inviteTimeline.type);

      const summary = {
        totalEvents: 0,
        rsvpResponses: 0,
        emailsReceived: 0,
        domainActivity: 0,
      };

      for (const stat of stats) {
        summary.totalEvents += stat.count;
        if (stat.type === 'rsvp_response') {
          summary.rsvpResponses += stat.count;
        } else if (stat.type === 'email_received') {
          summary.emailsReceived += stat.count;
        } else if (stat.type === 'domain_activity') {
          summary.domainActivity += stat.count;
        }
      }

      return summary;
    } catch (error) {
      console.error('Failed to get campaign activity summary:', error);
      return {
        totalEvents: 0,
        rsvpResponses: 0,
        emailsReceived: 0,
        domainActivity: 0,
      };
    }
  }

  // Start monitoring for all enabled accounts
  async startMonitoring(): Promise<void> {
    console.log('Starting Response Intelligence monitoring...');
    
    // Set up periodic check every 5 minutes
    setInterval(async () => {
      try {
        await this.checkAllAccounts();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async checkAllAccounts(): Promise<void> {
    try {
      // Get all active monitoring settings
      const activeSettings = await db
        .select()
        .from(responseSettings)
        .where(eq(responseSettings.isMonitoringEnabled, true));

      for (const setting of activeSettings) {
        if (setting.accountType === 'google') {
          // TODO: Get account access token and process
          console.log(`Checking Gmail account ${setting.accountId}`);
        } else if (setting.accountType === 'outlook') {
          // TODO: Implement Outlook monitoring
          console.log(`Checking Outlook account ${setting.accountId}`);
        }
      }
    } catch (error) {
      console.error('Failed to check accounts:', error);
    }
  }
}

export const responseIntelligence = new ResponseIntelligenceService();