import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Google Accounts for OAuth2 connections
export const googleAccounts = pgTable("google_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Outlook/Office 365 Accounts for OAuth2 connections
export const outlookAccounts = pgTable("outlook_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  microsoftId: text("microsoft_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Email providers for multi-provider email sending
export const emailProviders = pgTable("email_providers", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'gmail' | 'outlook'
  accountId: integer("account_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  lastUsed: timestamp("last_used"),
  emailsSent: integer("emails_sent").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Campaigns for organizing invite sequences
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  csvData: jsonb("csv_data").notNull(), // Store parsed CSV data as JSON
  eventTitleTemplate: text("event_title_template").notNull(),
  eventDescriptionTemplate: text("event_description_template").notNull(),
  confirmationEmailTemplate: text("confirmation_email_template").notNull(),
  eventDuration: integer("event_duration").notNull().default(30), // minutes
  timeZone: text("time_zone").notNull().default("UTC"),
  selectedInboxes: integer("selected_inboxes").array().notNull().default([]), // Array of account IDs
  status: text("status").notNull().default("active"), // active, paused, completed
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Individual invites sent through campaigns
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  googleAccountId: integer("google_account_id").references(() => googleAccounts.id),
  outlookAccountId: integer("outlook_account_id").references(() => outlookAccounts.id),
  calendarProvider: text("calendar_provider").notNull().default("google"), // 'google' | 'outlook'
  prospectEmail: text("prospect_email").notNull(),
  prospectName: text("prospect_name"),
  prospectCompany: text("prospect_company"),
  mergeData: jsonb("merge_data"), // Additional merge fields
  eventId: text("event_id"), // Google Calendar event ID
  csvRowIndex: integer("csv_row_index"), // Changed from sheetRowIndex
  isManualTest: boolean("is_manual_test").notNull().default(false), // New field for manual tests
  status: text("status").notNull().default("pending"), // pending, sent, accepted, declined, error
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  confirmationSent: boolean("confirmation_sent").notNull().default(false),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity log for tracking all system events
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // invite_sent, invite_accepted, confirmation_sent, error, etc.
  campaignId: integer("campaign_id").references(() => campaigns.id),
  inviteId: integer("invite_id").references(() => invites.id),
  googleAccountId: integer("google_account_id").references(() => googleAccounts.id),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System settings and configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  dailyInviteLimit: integer("daily_invite_limit").notNull().default(100),
  inboxCooldownMinutes: integer("inbox_cooldown_minutes").notNull().default(30),
  acceptanceCheckIntervalMinutes: integer("acceptance_check_interval_minutes").notNull().default(60),
  isSystemActive: boolean("is_system_active").notNull().default(true),
  serviceAccountCredentials: jsonb("service_account_credentials"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Queue for processing invites
export const inviteQueue = pgTable("invite_queue", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  prospectData: jsonb("prospect_data").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  attempts: integer("attempts").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertGoogleAccountSchema = createInsertSchema(googleAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertOutlookAccountSchema = createInsertSchema(outlookAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertEmailProviderSchema = createInsertSchema(emailProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertInviteQueueSchema = createInsertSchema(inviteQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type GoogleAccount = typeof googleAccounts.$inferSelect;
export type InsertGoogleAccount = z.infer<typeof insertGoogleAccountSchema>;

export type OutlookAccount = typeof outlookAccounts.$inferSelect;
export type InsertOutlookAccount = z.infer<typeof insertOutlookAccountSchema>;

export type EmailProvider = typeof emailProviders.$inferSelect;
export type InsertEmailProvider = z.infer<typeof insertEmailProviderSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export type InviteQueue = typeof inviteQueue.$inferSelect;
export type InsertInviteQueue = z.infer<typeof insertInviteQueueSchema>;

// API response types
export type DashboardStats = {
  activeCampaigns: number;
  invitesToday: number;
  acceptedInvites: number;
  connectedAccounts: number;
  acceptanceRate: number;
  dailyLimit: number;
  apiUsage: number;
  queueStatus: string;
};

export type CampaignWithStats = Campaign & {
  invitesSent: number;
  accepted: number;
  totalProspects: number;
  progress: number;
};

export type AccountWithStatus = GoogleAccount & {
  nextAvailable: string | null;
  isInCooldown: boolean;
};
