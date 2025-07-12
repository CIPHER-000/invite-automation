import { storage } from '../storage';
import type { InsertActivityLog } from '@shared/schema';

export type EventType = 
  | 'invite_sent' 
  | 'invite_accepted' 
  | 'invite_declined' 
  | 'invite_tentative'
  | 'invite_error'
  | 'inbox_connected' 
  | 'inbox_disconnected' 
  | 'inbox_reconnected'
  | 'inbox_deleted'
  | 'campaign_created' 
  | 'campaign_updated'
  | 'campaign_deleted'
  | 'campaign_paused'
  | 'campaign_resumed'
  | 'user_login'
  | 'user_logout'
  | 'connection_test'
  | 'queue_processed'
  | 'system_error';

export type Severity = 'info' | 'warning' | 'error' | 'success';

interface BaseLogParams {
  userId: string;
  eventType: EventType;
  action: string;
  description: string;
  severity?: Severity;
  metadata?: Record<string, any>;
}

interface InviteLogParams extends BaseLogParams {
  campaignId?: number;
  inviteId?: number;
  recipientEmail?: string;
  recipientName?: string;
  inboxId?: number;
  inboxType?: 'google' | 'microsoft';
}

interface InboxLogParams extends BaseLogParams {
  inboxId: number;
  inboxType: 'google' | 'microsoft';
  inboxEmail?: string;
}

interface CampaignLogParams extends BaseLogParams {
  campaignId: number;
  campaignName?: string;
}

class ActivityLoggerService {
  /**
   * Log an invite-related event
   */
  async logInviteEvent(params: InviteLogParams): Promise<void> {
    try {
      const logData: InsertActivityLog = {
        userId: params.userId,
        eventType: params.eventType,
        action: params.action,
        description: params.description,
        campaignId: params.campaignId,
        inviteId: params.inviteId,
        inboxId: params.inboxId,
        inboxType: params.inboxType,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        severity: params.severity || 'info',
        metadata: params.metadata || {},
      };

      await storage.createActivityLog(logData);
    } catch (error) {
      console.error('Failed to log invite event:', error);
    }
  }

  /**
   * Log an inbox-related event
   */
  async logInboxEvent(params: InboxLogParams): Promise<void> {
    try {
      const logData: InsertActivityLog = {
        userId: params.userId,
        eventType: params.eventType,
        action: params.action,
        description: params.description,
        inboxId: params.inboxId,
        inboxType: params.inboxType,
        severity: params.severity || 'info',
        metadata: {
          ...params.metadata,
          inboxEmail: params.inboxEmail,
        },
      };

      await storage.createActivityLog(logData);
    } catch (error) {
      console.error('Failed to log inbox event:', error);
    }
  }

  /**
   * Log a campaign-related event
   */
  async logCampaignEvent(params: CampaignLogParams): Promise<void> {
    try {
      const logData: InsertActivityLog = {
        userId: params.userId,
        eventType: params.eventType,
        action: params.action,
        description: params.description,
        campaignId: params.campaignId,
        severity: params.severity || 'info',
        metadata: {
          ...params.metadata,
          campaignName: params.campaignName,
        },
      };

      await storage.createActivityLog(logData);
    } catch (error) {
      console.error('Failed to log campaign event:', error);
    }
  }

  /**
   * Log a general system event
   */
  async logSystemEvent(params: BaseLogParams): Promise<void> {
    try {
      const logData: InsertActivityLog = {
        userId: params.userId,
        eventType: params.eventType,
        action: params.action,
        description: params.description,
        severity: params.severity || 'info',
        metadata: params.metadata || {},
      };

      await storage.createActivityLog(logData);
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

  /**
   * Convenience methods for common events
   */
  
  async logInviteSent(userId: string, {
    campaignId,
    inviteId,
    recipientEmail,
    recipientName,
    inboxId,
    inboxType,
    meetingLink,
    timeSlot
  }: {
    campaignId: number;
    inviteId: number;
    recipientEmail: string;
    recipientName?: string;
    inboxId: number;
    inboxType: 'google' | 'microsoft';
    meetingLink?: string;
    timeSlot?: string;
  }): Promise<void> {
    await this.logInviteEvent({
      userId,
      eventType: 'invite_sent',
      action: 'Invite Sent',
      description: `Calendar invite sent to ${recipientEmail}${recipientName ? ` (${recipientName})` : ''}`,
      campaignId,
      inviteId,
      recipientEmail,
      recipientName,
      inboxId,
      inboxType,
      severity: 'success',
      metadata: {
        meetingLink,
        timeSlot,
      },
    });
  }

  async logInviteResponse(userId: string, {
    inviteId,
    recipientEmail,
    recipientName,
    response,
    campaignId
  }: {
    inviteId: number;
    recipientEmail: string;
    recipientName?: string;
    response: 'accepted' | 'declined' | 'tentative';
    campaignId?: number;
  }): Promise<void> {
    const eventType = `invite_${response}` as EventType;
    const action = response.charAt(0).toUpperCase() + response.slice(1);
    
    await this.logInviteEvent({
      userId,
      eventType,
      action,
      description: `${recipientEmail}${recipientName ? ` (${recipientName})` : ''} ${response} the invite`,
      inviteId,
      recipientEmail,
      recipientName,
      campaignId,
      severity: response === 'accepted' ? 'success' : 'info',
    });
  }

  async logInboxConnected(userId: string, {
    inboxId,
    inboxType,
    inboxEmail
  }: {
    inboxId: number;
    inboxType: 'google' | 'microsoft';
    inboxEmail: string;
  }): Promise<void> {
    await this.logInboxEvent({
      userId,
      eventType: 'inbox_connected',
      action: 'Inbox Connected',
      description: `${inboxType === 'google' ? 'Google' : 'Microsoft'} account ${inboxEmail} connected successfully`,
      inboxId,
      inboxType,
      inboxEmail,
      severity: 'success',
    });
  }

  async logInboxDisconnected(userId: string, {
    inboxId,
    inboxType,
    inboxEmail,
    reason
  }: {
    inboxId: number;
    inboxType: 'google' | 'microsoft';
    inboxEmail: string;
    reason?: string;
  }): Promise<void> {
    await this.logInboxEvent({
      userId,
      eventType: 'inbox_disconnected',
      action: 'Inbox Disconnected',
      description: `${inboxType === 'google' ? 'Google' : 'Microsoft'} account ${inboxEmail} disconnected${reason ? `: ${reason}` : ''}`,
      inboxId,
      inboxType,
      inboxEmail,
      severity: 'warning',
      metadata: { reason },
    });
  }

  async logCampaignCreated(userId: string, {
    campaignId,
    campaignName
  }: {
    campaignId: number;
    campaignName: string;
  }): Promise<void> {
    await this.logCampaignEvent({
      userId,
      eventType: 'campaign_created',
      action: 'Campaign Created',
      description: `New campaign "${campaignName}" created`,
      campaignId,
      campaignName,
      severity: 'success',
    });
  }

  async logError(userId: string, {
    action,
    description,
    error,
    campaignId,
    inviteId
  }: {
    action: string;
    description: string;
    error: any;
    campaignId?: number;
    inviteId?: number;
  }): Promise<void> {
    await this.logSystemEvent({
      userId,
      eventType: 'system_error',
      action,
      description,
      severity: 'error',
      metadata: {
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack,
        campaignId,
        inviteId,
      },
    });
  }
}

export const activityLogger = new ActivityLoggerService();