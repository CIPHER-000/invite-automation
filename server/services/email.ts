import nodemailer from "nodemailer";
import { storage } from "../storage";
import { googleCalendarService } from "./google-calendar";
import type { GoogleAccount, Invite, Campaign } from "@shared/schema";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        clientId: process.env.GOOGLE_CLIENT_ID || "571943054804-92fbh828cm03laha4j5o44bk887ubm0s.apps.googleusercontent.com",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
      },
    });
  }

  async sendConfirmationEmail(invite: Invite): Promise<void> {
    const account = await storage.getGoogleAccount(invite.googleAccountId);
    const campaign = await storage.getCampaign(invite.campaignId);
    
    if (!account || !campaign) {
      throw new Error("Account or campaign not found");
    }

    const mergeData = {
      name: invite.prospectName || invite.prospectEmail,
      email: invite.prospectEmail,
      company: invite.prospectCompany || "",
      ...(invite.mergeData as Record<string, any> || {}),
    };

    const emailContent = googleCalendarService.processMergeFields(
      campaign.confirmationEmailTemplate,
      mergeData
    );

    const mailOptions = {
      from: account.email,
      to: invite.prospectEmail,
      subject: "Calendar Invitation Confirmed",
      html: emailContent,
      auth: {
        user: account.email,
        refreshToken: account.refreshToken,
        accessToken: account.accessToken,
      },
    };

    try {
      await this.transporter.sendMail(mailOptions);
      
      await storage.updateInvite(invite.id, {
        confirmationSent: true,
        confirmationSentAt: new Date(),
      });

      await storage.createActivityLog({
        type: "confirmation_sent",
        campaignId: invite.campaignId,
        inviteId: invite.id,
        googleAccountId: invite.googleAccountId,
        message: `Confirmation email sent to ${invite.prospectEmail}`,
        metadata: { prospectEmail: invite.prospectEmail },
      });
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      
      await storage.createActivityLog({
        type: "confirmation_error",
        campaignId: invite.campaignId,
        inviteId: invite.id,
        googleAccountId: invite.googleAccountId,
        message: `Failed to send confirmation email to ${invite.prospectEmail}`,
        metadata: { 
          prospectEmail: invite.prospectEmail,
          error: error instanceof Error ? error.message : "Unknown error"
        },
      });
      
      throw error;
    }
  }

  async processConfirmationQueue(): Promise<void> {
    const acceptedInvites = await storage.getInvitesByStatus("accepted");
    
    for (const invite of acceptedInvites) {
      if (!invite.confirmationSent) {
        try {
          await this.sendConfirmationEmail(invite);
        } catch (error) {
          console.error(`Failed to send confirmation for invite ${invite.id}:`, error);
        }
      }
    }
  }
}

export const emailService = new EmailService();
