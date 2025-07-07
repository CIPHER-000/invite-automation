import nodemailer from "nodemailer";
import { outlookAuthService } from "./outlook-auth";
import { googleAuthService } from "./google-auth";
import { storage } from "../storage";

export interface EmailProvider {
  type: "gmail" | "outlook";
  name: string;
  accountId: number;
  email: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class MultiProviderEmailService {
  private gmailTransporter: nodemailer.Transporter;

  constructor() {
    this.gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        clientId: process.env.GOOGLE_CLIENT_ID || "571943054804-92fbh828cm03laha4j5o44bk887ubm0s.apps.googleusercontent.com",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
      },
    });
  }

  async getAvailableProviders(): Promise<EmailProvider[]> {
    const accounts = await storage.getGoogleAccounts();
    const providers: EmailProvider[] = [];

    // Add Google accounts
    for (const account of accounts) {
      if (account.isActive) {
        providers.push({
          type: "gmail",
          name: `Gmail (${account.email})`,
          accountId: account.id,
          email: account.email,
        });
      }
    }

    // Add Outlook accounts (when we add Outlook account management)
    // This would be similar to Google accounts but for Outlook/Office 365

    return providers;
  }

  async sendEmail(provider: EmailProvider, options: EmailOptions): Promise<void> {
    try {
      switch (provider.type) {
        case "gmail":
          await this.sendViaGmail(provider, options);
          break;
        case "outlook":
          await this.sendViaOutlook(provider, options);
          break;
        default:
          throw new Error(`Unsupported email provider: ${provider.type}`);
      }
    } catch (error) {
      console.error(`Failed to send email via ${provider.type}:`, error);
      throw error;
    }
  }

  private async sendViaGmail(provider: EmailProvider, options: EmailOptions): Promise<void> {
    const account = await storage.getGoogleAccount(provider.accountId);
    if (!account) {
      throw new Error("Gmail account not found");
    }

    const accessToken = await googleAuthService.getValidAccessToken(account);

    const mailOptions = {
      from: `"${account.name}" <${account.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || account.email,
      auth: {
        user: account.email,
        accessToken: accessToken,
      },
    };

    await this.gmailTransporter.sendMail(mailOptions);
  }

  private async sendViaOutlook(provider: EmailProvider, options: EmailOptions): Promise<void> {
    const account = await storage.getGoogleAccount(provider.accountId); // We'll need an Outlook accounts table
    if (!account) {
      throw new Error("Outlook account not found");
    }

    const accessToken = await outlookAuthService.getValidAccessToken(account);
    const graphClient = outlookAuthService.createGraphClient(accessToken);

    const message = {
      message: {
        subject: options.subject,
        body: {
          contentType: "HTML",
          content: options.html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: options.to,
            },
          },
        ],
        from: {
          emailAddress: {
            address: provider.email,
          },
        },
        replyTo: options.replyTo ? [
          {
            emailAddress: {
              address: options.replyTo,
            },
          },
        ] : undefined,
      },
      saveToSentItems: true,
    };

    await graphClient.post("/me/sendMail", message);
  }

  async sendConfirmationEmail(
    invite: any,
    provider?: EmailProvider
  ): Promise<void> {
    try {
      const campaign = await storage.getCampaign(invite.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Use specified provider or get best available
      const emailProvider = provider || await this.getBestEmailProvider();
      if (!emailProvider) {
        throw new Error("No email provider available");
      }

      // Process merge fields in confirmation template
      const mergeData = {
        name: invite.prospectName || invite.prospectEmail,
        email: invite.prospectEmail,
        company: invite.prospectCompany || "",
        eventTitle: campaign.eventTitleTemplate,
        senderName: emailProvider.email.split("@")[0],
        senderEmail: emailProvider.email,
        ...invite.mergeData,
      };

      const emailContent = this.processMergeFields(
        campaign.confirmationEmailTemplate,
        mergeData
      );

      const emailOptions: EmailOptions = {
        to: invite.prospectEmail,
        subject: `Calendar Invite Confirmed - ${campaign.eventTitleTemplate}`,
        html: emailContent,
        text: emailContent.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };

      await this.sendEmail(emailProvider, emailOptions);

      // Update invite record
      await storage.updateInvite(invite.id, {
        confirmationSent: true,
        confirmationSentAt: new Date(),
      });

      await storage.createActivityLog({
        type: "confirmation_sent",
        campaignId: campaign.id,
        inviteId: invite.id,
        message: `Confirmation email sent to ${invite.prospectEmail} via ${emailProvider.type}`,
        metadata: { 
          provider: emailProvider.type,
          senderEmail: emailProvider.email,
        },
      });
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      throw error;
    }
  }

  async processConfirmationQueue(): Promise<void> {
    try {
      // Get accepted invites that haven't had confirmation emails sent
      const invites = await storage.getInvitesByStatus("accepted");
      const pendingConfirmations = invites.filter(
        (invite) => !invite.confirmationSent
      );

      for (const invite of pendingConfirmations) {
        try {
          await this.sendConfirmationEmail(invite);
        } catch (error) {
          console.error(`Failed to send confirmation for invite ${invite.id}:`, error);
          
          await storage.createActivityLog({
            type: "confirmation_error",
            inviteId: invite.id,
            message: `Failed to send confirmation email: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }
    } catch (error) {
      console.error("Error processing confirmation queue:", error);
    }
  }

  private async getBestEmailProvider(): Promise<EmailProvider | null> {
    const providers = await this.getAvailableProviders();
    
    if (providers.length === 0) {
      return null;
    }

    // Simple round-robin selection for now
    // Could be enhanced with load balancing logic
    return providers[Math.floor(Math.random() * providers.length)];
  }

  private processMergeFields(template: string, mergeData: Record<string, any>): string {
    let result = template;
    
    // Replace merge fields like {{name}}, {{company}}, etc.
    Object.entries(mergeData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, String(value || ''));
    });
    
    return result;
  }

  async testEmailProvider(provider: EmailProvider): Promise<boolean> {
    try {
      const testOptions: EmailOptions = {
        to: provider.email, // Send test email to self
        subject: "Email Provider Test",
        html: "<p>This is a test email to verify the email provider is working correctly.</p>",
        text: "This is a test email to verify the email provider is working correctly.",
      };

      await this.sendEmail(provider, testOptions);
      return true;
    } catch (error) {
      console.error(`Email provider test failed for ${provider.type}:`, error);
      return false;
    }
  }

  async getProviderStats(): Promise<Array<EmailProvider & { 
    lastUsed?: Date; 
    emailsSent: number; 
    successRate: number; 
  }>> {
    const providers = await this.getAvailableProviders();
    const stats = [];

    for (const provider of providers) {
      // Get usage statistics from activity logs
      const logs = await storage.getActivityLogs(1000);
      const providerLogs = logs.filter(log => 
        log.type === "confirmation_sent" && 
        log.metadata?.senderEmail === provider.email
      );

      const errorLogs = logs.filter(log => 
        log.type === "confirmation_error" && 
        log.metadata?.senderEmail === provider.email
      );

      const emailsSent = providerLogs.length;
      const errors = errorLogs.length;
      const successRate = emailsSent > 0 ? ((emailsSent - errors) / emailsSent) * 100 : 100;
      const lastUsed = providerLogs.length > 0 ? 
        new Date(Math.max(...providerLogs.map(log => log.createdAt.getTime()))) : undefined;

      stats.push({
        ...provider,
        lastUsed,
        emailsSent,
        successRate,
      });
    }

    return stats;
  }
}

export const multiProviderEmailService = new MultiProviderEmailService();