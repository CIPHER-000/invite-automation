// Extensions to activity logger for confirmation emails

import { activityLogger } from "./activity-logger";

export const confirmationEmailActivityLogger = {
  async logConfirmationEmailSent(
    userId: string,
    campaignId: number,
    inviteId: number,
    recipientEmail: string,
    recipientName: string,
    senderEmail: string
  ) {
    await activityLogger.log(userId, {
      eventType: 'confirmation_email_sent',
      action: 'Confirmation Email Sent',
      description: `Confirmation email sent to ${recipientName} (${recipientEmail}) from ${senderEmail}`,
      campaignId,
      inviteId,
      recipientEmail,
      recipientName,
      severity: 'success',
      metadata: {
        senderEmail,
        emailType: 'confirmation'
      }
    });
  },

  async logConfirmationEmailSkipped(
    userId: string,
    campaignId: number,
    inviteId: number,
    recipientEmail: string,
    recipientName: string
  ) {
    await activityLogger.log(userId, {
      eventType: 'confirmation_email_skipped',
      action: 'Confirmation Email Skipped',
      description: `Confirmation email skipped for ${recipientName} (${recipientEmail})`,
      campaignId,
      inviteId,
      recipientEmail,
      recipientName,
      severity: 'info',
      metadata: {
        emailType: 'confirmation',
        reason: 'manually_skipped'
      }
    });
  },

  async logConfirmationEmailFailed(
    userId: string,
    campaignId: number,
    inviteId: number,
    recipientEmail: string,
    recipientName: string,
    error: string
  ) {
    await activityLogger.log(userId, {
      eventType: 'confirmation_email_failed',
      action: 'Confirmation Email Failed',
      description: `Confirmation email failed for ${recipientName} (${recipientEmail}): ${error}`,
      campaignId,
      inviteId,
      recipientEmail,
      recipientName,
      severity: 'error',
      metadata: {
        emailType: 'confirmation',
        errorMessage: error
      }
    });
  }
};

// Extend the main activity logger
Object.assign(activityLogger, confirmationEmailActivityLogger);