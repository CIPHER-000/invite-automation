import express from "express";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { activityLogger } from "../services/activity-logger";
import "../services/activity-logger-extensions";
import { multiProviderEmailService } from "../services/multi-provider-email";

const router = express.Router();

// Get pending confirmation emails
router.get("/pending", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Get invites that are accepted but don't have confirmation emails sent
    const pendingInvites = await storage.getPendingConfirmationEmails(userId);
    
    res.json(pendingInvites);
  } catch (error) {
    console.error("Error getting pending confirmation emails:", error);
    res.status(500).json({ error: "Failed to get pending confirmation emails" });
  }
});

// Get default email templates
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // For now, return a default template - this can be expanded later
    const defaultTemplates = [
      {
        id: 1,
        name: "Default Confirmation",
        subject: "Meeting Confirmation - {{meeting_time}}",
        body: `Dear {{name}},

Thank you for accepting our meeting invitation!

Meeting Details:
📅 Date & Time: {{meeting_time}}
🔗 Meeting Link: {{meeting_link}}

We look forward to speaking with you. If you need to reschedule or have any questions, please don't hesitate to reach out.

Best regards,
{{sender_name}}
{{company}}`,
        isDefault: true
      }
    ];
    
    res.json(defaultTemplates);
  } catch (error) {
    console.error("Error getting email templates:", error);
    res.status(500).json({ error: "Failed to get email templates" });
  }
});

// Send confirmation email
router.post("/:inviteId/send", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const inviteId = parseInt(req.params.inviteId);
    const { customTemplate, customSubject } = req.body;
    
    // Get the invite details
    const invite = await storage.getInvite(inviteId, userId);
    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }
    
    // Check if invite is accepted
    if (invite.rsvpStatus !== 'accepted') {
      return res.status(400).json({ error: "Invite is not accepted" });
    }
    
    // Check if already sent
    if (invite.confirmationEmailStatus === 'sent') {
      return res.status(400).json({ error: "Confirmation email already sent" });
    }
    
    // Get the sender account (same as the one used for the original invite)
    let senderAccount = null;
    if (invite.googleAccountId) {
      senderAccount = await storage.getGoogleAccount(invite.googleAccountId, userId);
    } else if (invite.outlookAccountId) {
      senderAccount = await storage.getOutlookAccount(invite.outlookAccountId, userId);
    }
    
    if (!senderAccount) {
      return res.status(400).json({ error: "Sender account not found" });
    }
    
    // Prepare email content
    const defaultSubject = "Meeting Confirmation - {{meeting_time}}";
    const defaultTemplate = `Dear {{name}},

Thank you for accepting our meeting invitation!

Meeting Details:
📅 Date & Time: {{meeting_time}}
🔗 Meeting Link: {{meeting_link}}

We look forward to speaking with you. If you need to reschedule or have any questions, please don't hesitate to reach out.

Best regards,
{{sender_name}}
{{company}}`;
    
    const emailSubject = customSubject || defaultSubject;
    const emailBody = customTemplate || defaultTemplate;
    
    // Replace variables
    const processedSubject = emailSubject
      .replace(/{{name}}/g, invite.recipientName || invite.recipientEmail)
      .replace(/{{meeting_time}}/g, invite.meetingTime ? new Date(invite.meetingTime).toLocaleString() : '[Meeting Time]')
      .replace(/{{meeting_link}}/g, invite.mergeData?.meetingLink || '[Meeting Link]')
      .replace(/{{sender_name}}/g, invite.mergeData?.senderName || senderAccount.name)
      .replace(/{{company}}/g, invite.mergeData?.company || '[Company]');
    
    const processedBody = emailBody
      .replace(/{{name}}/g, invite.recipientName || invite.recipientEmail)
      .replace(/{{meeting_time}}/g, invite.meetingTime ? new Date(invite.meetingTime).toLocaleString() : '[Meeting Time]')
      .replace(/{{meeting_link}}/g, invite.mergeData?.meetingLink || '[Meeting Link]')
      .replace(/{{sender_name}}/g, invite.mergeData?.senderName || senderAccount.name)
      .replace(/{{company}}/g, invite.mergeData?.company || '[Company]');
    
    try {
      // Send the email using the multi-provider email service
      const emailResult = await multiProviderEmailService.sendEmail({
        to: invite.recipientEmail,
        subject: processedSubject,
        text: processedBody,
        html: processedBody.replace(/\n/g, '<br>'), // Simple HTML conversion
        from: senderAccount.email,
        accountId: senderAccount.id,
        accountType: invite.googleAccountId ? 'google' : 'outlook'
      });
      
      if (emailResult.success) {
        // Update invite status
        await storage.updateInvite(inviteId, {
          confirmationEmailStatus: 'sent',
          confirmationEmailSentAt: new Date(),
          confirmationEmailTemplate: customTemplate || undefined
        }, userId);
        
        // Log activity
        await activityLogger.logConfirmationEmailSent(
          userId,
          invite.campaignId,
          inviteId,
          invite.recipientEmail,
          invite.recipientName,
          senderAccount.email
        );
        
        res.json({ success: true, messageId: emailResult.messageId });
      } else {
        // Update status to failed
        await storage.updateInvite(inviteId, {
          confirmationEmailStatus: 'failed'
        }, userId);
        
        res.status(500).json({ error: emailResult.error || "Failed to send email" });
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      
      // Update status to failed
      await storage.updateInvite(inviteId, {
        confirmationEmailStatus: 'failed'
      }, userId);
      
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
});

// Mark confirmation email as skipped
router.post("/:inviteId/skip", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const inviteId = parseInt(req.params.inviteId);
    
    // Get the invite details
    const invite = await storage.getInvite(inviteId, userId);
    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }
    
    // Update invite status
    await storage.updateInvite(inviteId, {
      confirmationEmailStatus: 'skipped'
    }, userId);
    
    // Log activity
    await activityLogger.logConfirmationEmailSkipped(
      userId,
      invite.campaignId,
      inviteId,
      invite.recipientEmail,
      invite.recipientName
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error skipping confirmation email:", error);
    res.status(500).json({ error: "Failed to skip confirmation email" });
  }
});

export default router;