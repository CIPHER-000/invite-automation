import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Google Accounts for OAuth2 connections
export const googleAccounts = pgTable("google_accounts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("active"), // 'active', 'disconnected', 'revoked'
  disconnectedAt: timestamp("disconnected_at"),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Outlook/Office 365 Accounts for OAuth2 connections
export const outlookAccounts = pgTable("outlook_accounts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  csvData: jsonb("csv_data").notNull(), // Store parsed CSV data as JSON
  eventTitleTemplate: text("event_title_template").notNull(),
  eventDescriptionTemplate: text("event_description_template").notNull(),
  confirmationEmailTemplate: text("confirmation_email_template").notNull(),
  subjectLine: text("subject_line").default("Hi from {{sender_name}}"),
  senderName: text("sender_name"), // Sender name variable for personalized messaging
  eventDuration: integer("event_duration").notNull().default(30), // minutes
  timeZone: text("time_zone").notNull().default("UTC"),
  selectedInboxes: integer("selected_inboxes").array().notNull().default([]), // Array of account IDs
  
  // Campaign Rate Limiting Controls
  maxInvitesPerInbox: integer("max_invites_per_inbox").notNull().default(20), // Max invites per inbox per day for this campaign
  maxDailyCampaignInvites: integer("max_daily_campaign_invites").notNull().default(100), // Max total invites this campaign can send per day
  
  // Advanced Scheduling Configuration
  schedulingMode: text("scheduling_mode").notNull().default("immediate"), // 'immediate' | 'advanced'
  dateRangeStart: timestamp("date_range_start"), // Start date for advanced scheduling
  dateRangeEnd: timestamp("date_range_end"), // End date for advanced scheduling
  selectedDaysOfWeek: integer("selected_days_of_week").array().default([]), // 0=Sunday, 1=Monday, ..., 6=Saturday
  timeWindowStart: text("time_window_start"), // e.g., "09:00"
  timeWindowEnd: text("time_window_end"), // e.g., "17:00"
  schedulingTimezone: text("scheduling_timezone").notNull().default("UTC"), // Timezone for scheduling logic
  randomizedSlots: jsonb("randomized_slots"), // Pre-calculated random time slots for this campaign
  
  status: text("status").notNull().default("active"), // active, paused, completed
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Individual invites sent through campaigns
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  status: text("status").notNull().default("pending"), // pending, sent, accepted, declined, tentative, error
  rsvpStatus: text("rsvp_status"), // accepted, declined, tentative, needsAction
  rsvpResponseAt: timestamp("rsvp_response_at"), // When the RSVP was received
  rsvpHistory: jsonb("rsvp_history"), // Array of status changes with timestamps
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"), // Legacy field, kept for compatibility
  declinedAt: timestamp("declined_at"), // When declined
  tentativeAt: timestamp("tentative_at"), // When marked tentative
  lastStatusCheck: timestamp("last_status_check"), // Last time we checked the status
  webhookReceived: boolean("webhook_received").notNull().default(false), // True if status came from webhook
  confirmationSent: boolean("confirmation_sent").notNull().default(false),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity log for tracking all system events
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // invite_sent, invite_accepted, invite_declined, invite_tentative, rsvp_changed, confirmation_sent, error, etc.
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
  dailyInviteLimit: integer("daily_invite_limit").notNull().default(400), // 20 inboxes × 20 invites per day
  inboxCooldownMinutes: integer("inbox_cooldown_minutes").notNull().default(30),
  acceptanceCheckIntervalMinutes: integer("acceptance_check_interval_minutes").notNull().default(60),
  isSystemActive: boolean("is_system_active").notNull().default(true),
  serviceAccountCredentials: jsonb("service_account_credentials"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// RSVP Events for comprehensive tracking
export const rsvpEvents = pgTable("rsvp_events", {
  id: serial("id").primaryKey(),
  inviteId: integer("invite_id").references(() => invites.id).notNull(),
  eventId: text("event_id").notNull(), // Calendar event ID
  prospectEmail: text("prospect_email").notNull(),
  rsvpStatus: text("rsvp_status").notNull(), // accepted, declined, tentative, needsAction
  previousStatus: text("previous_status"), // Previous status for tracking changes
  source: text("source").notNull().default("polling"), // webhook, polling, manual
  webhookPayload: jsonb("webhook_payload"), // Raw webhook data for debugging
  responseAt: timestamp("response_at").notNull(), // When the response was given
  detectedAt: timestamp("detected_at").notNull().defaultNow(), // When we detected the response
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Webhook Events for audit and debugging
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // google_calendar_event_updated, outlook_event_updated
  eventId: text("event_id"), // Calendar event ID if available
  rawPayload: jsonb("raw_payload").notNull(), // Complete webhook payload
  processed: boolean("processed").notNull().default(false),
  processingError: text("processing_error"),
  inviteId: integer("invite_id").references(() => invites.id), // Linked invite if found
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const insertRsvpEventSchema = createInsertSchema(rsvpEvents).omit({
  id: true,
  detectedAt: true,
  createdAt: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
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

export type RsvpEvent = typeof rsvpEvents.$inferSelect;
export type InsertRsvpEvent = z.infer<typeof insertRsvpEventSchema>;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;

// User authentication types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

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
  declined: number;
  tentative: number;
  noResponse: number;
  totalProspects: number;
  progress: number;
  pendingInvites: number;
  processingInvites: number;
  acceptanceRate: number;
  responseRate: number;
};

export type AccountWithStatus = GoogleAccount & {
  nextAvailable: string | null;
  isInCooldown: boolean;
};
