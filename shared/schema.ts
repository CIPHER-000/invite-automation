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
  lastConnectionCheck: timestamp("last_connection_check"),
  connectionError: text("connection_error"),
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
  status: text("status").notNull().default("active"), // 'active', 'disconnected', 'revoked'
  lastConnectionCheck: timestamp("last_connection_check"),
  connectionError: text("connection_error"),
  disconnectedAt: timestamp("disconnected_at"),
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
  sdrEmail: text("sdr_email"), // Optional SDR email to CC on all invites
  
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
  confirmationEmailStatus: text("confirmation_email_status").default("pending"), // 'pending', 'sent', 'skipped', 'failed'
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
  confirmationEmailTemplate: text("confirmation_email_template"), // Custom template for this invite
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity log for tracking all system events
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // invite_sent, invite_accepted, inbox_connected, campaign_created, etc.
  action: text("action").notNull(), // Human readable action description
  description: text("description").notNull(), // Detailed description
  campaignId: integer("campaign_id").references(() => campaigns.id),
  inviteId: integer("invite_id").references(() => invites.id),
  inboxId: integer("inbox_id"), // Generic inbox reference (google or outlook)
  inboxType: text("inbox_type"), // 'google' or 'microsoft'
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  severity: text("severity").notNull().default('info'), // info, warning, error, success
  metadata: jsonb("metadata").$type<{
    inviteDetails?: any;
    errorMessage?: string;
    beforeState?: any;
    afterState?: any;
    meetingLink?: string;
    timeSlot?: string;
    authUrl?: string;
    [key: string]: any;
  }>(),
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

export const insertActivityLogSchemaOld = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
  eventType: true,
  action: true,
  description: true,
  severity: true,
  inboxId: true,
  inboxType: true,
  recipientEmail: true,
  recipientName: true
}).extend({
  type: z.string(),
  message: z.string(),
  googleAccountId: z.number().optional(),
});


export const scheduledInvites = pgTable("scheduled_invites", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  recipientTimezone: text("recipient_timezone").notNull().default("America/New_York"),
  scheduledTimeUtc: timestamp("scheduled_time_utc").notNull(),
  scheduledTimeLocal: timestamp("scheduled_time_local").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'accepted', 'declined', 'canceled', 'failed'
  senderAccountId: integer("sender_account_id").notNull(),
  senderAccountType: text("sender_account_type").notNull().default("google"), // 'google', 'microsoft'
  senderCalendarEventId: text("sender_calendar_event_id"),
  wasDoubleBooked: boolean("was_double_booked").notNull().default(false),
  leadTimeDays: integer("lead_time_days").notNull().default(2),
  originalScheduledTime: timestamp("original_scheduled_time"),
  rescheduledCount: integer("rescheduled_count").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Scheduling Settings table for per-campaign and global settings
export const schedulingSettings = pgTable("scheduling_settings", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  isGlobal: boolean("is_global").notNull().default(false),
  minLeadTimeDays: integer("min_lead_time_days").notNull().default(2),
  maxLeadTimeDays: integer("max_lead_time_days").notNull().default(6),
  preferredStartHour: integer("preferred_start_hour").notNull().default(12), // 12 PM
  preferredEndHour: integer("preferred_end_hour").notNull().default(16), // 4 PM
  allowDoubleBooking: boolean("allow_double_booking").notNull().default(false),
  maxDoubleBookingsPerSlot: integer("max_double_bookings_per_slot").notNull().default(1),
  excludeWeekends: boolean("exclude_weekends").notNull().default(true),
  businessHoursOnly: boolean("business_hours_only").notNull().default(true),
  fallbackPolicy: text("fallback_policy").notNull().default("skip"), // 'skip', 'double_book', 'manual'
  enableTimezoneDetection: boolean("enable_timezone_detection").notNull().default(true),
  retryAttempts: integer("retry_attempts").notNull().default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Calendar Slots table for tracking availability
export const calendarSlots = pgTable("calendar_slots", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  accountType: text("account_type").notNull().default("google"), // 'google', 'microsoft'
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  isBusy: boolean("is_busy").notNull().default(false),
  eventTitle: text("event_title"),
  eventId: text("event_id"),
  scheduledInviteId: integer("scheduled_invite_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Prospect Validation Tables for Industry Classification and Competitor Discovery

// Prospect validation batches (upload sessions)
export const prospectBatches = pgTable("prospect_batches", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  targetIndustry: text("target_industry").notNull(),
  totalRecords: integer("total_records").notNull().default(0),
  processedRecords: integer("processed_records").notNull().default(0),
  confirmedRecords: integer("confirmed_records").notNull().default(0),
  rejectedRecords: integer("rejected_records").notNull().default(0),
  greyAreaRecords: integer("grey_area_records").notNull().default(0),
  status: text("status").notNull().default("processing"), // 'uploading', 'processing', 'completed', 'failed'
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Individual prospect records
export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => prospectBatches.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  originalCompanyName: text("original_company_name").notNull(),
  websiteDomain: text("website_domain"),
  cleanedCompanyName: text("cleaned_company_name"),
  companyDescription: text("company_description"),
  scrapingStatus: text("scraping_status").default("pending"), // 'pending', 'success', 'failed', 'skipped'
  scrapingError: text("scraping_error"),
  classificationStatus: text("classification_status").default("pending"), // 'pending', 'completed', 'failed'
  industryMatch: text("industry_match"), // 'confirmed', 'rejected', 'grey_area'
  confidence: integer("confidence"), // 1-100 percentage
  competitors: jsonb("competitors").default([]), // Array of competitor names
  classificationReasoning: text("classification_reasoning"),
  openaiPrompt: text("openai_prompt"),
  openaiResponse: jsonb("openai_response"),
  manualOverride: boolean("manual_override").notNull().default(false),
  manualStatus: text("manual_status"), // User can override AI classification
  manualCompetitors: jsonb("manual_competitors"), // User can edit competitors
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Industry templates for reusable prompts
export const industryTemplates = pgTable("industry_templates", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  industryKeywords: jsonb("industry_keywords").default([]), // Array of keywords
  classificationPrompt: text("classification_prompt").notNull(),
  competitorPrompt: text("competitor_prompt"),
  isDefault: boolean("is_default").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Processing logs for debugging and monitoring
export const prospectProcessingLogs = pgTable("prospect_processing_logs", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
  batchId: integer("batch_id").references(() => prospectBatches.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  step: text("step").notNull(), // 'upload', 'scraping', 'classification', 'completion'
  status: text("status").notNull(), // 'started', 'completed', 'failed'
  message: text("message"),
  metadata: jsonb("metadata").default({}),
  executionTime: integer("execution_time"), // milliseconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Indexes will be added later after tables are created

// Type definitions
export type ScheduledInvite = typeof scheduledInvites.$inferSelect;
export type InsertScheduledInvite = typeof scheduledInvites.$inferInsert;
export type SchedulingSettings = typeof schedulingSettings.$inferSelect;
export type InsertSchedulingSettings = typeof schedulingSettings.$inferInsert;
export type CalendarSlot = typeof calendarSlots.$inferSelect;
export type InsertCalendarSlot = typeof calendarSlots.$inferInsert;

// Prospect validation types
export type ProspectBatch = typeof prospectBatches.$inferSelect;
export type InsertProspectBatch = typeof prospectBatches.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;
export type IndustryTemplate = typeof industryTemplates.$inferSelect;
export type InsertIndustryTemplate = typeof industryTemplates.$inferInsert;
export type ProspectProcessingLog = typeof prospectProcessingLogs.$inferSelect;
export type InsertProspectProcessingLog = typeof prospectProcessingLogs.$inferInsert;

// Schema validation
export const insertScheduledInviteSchema = createInsertSchema(scheduledInvites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchedulingSettingsSchema = createInsertSchema(schedulingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarSlotSchema = createInsertSchema(calendarSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Prospect validation schemas
export const insertProspectBatchSchema = createInsertSchema(prospectBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndustryTemplateSchema = createInsertSchema(industryTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProspectProcessingLogSchema = createInsertSchema(prospectProcessingLogs).omit({
  id: true,
  createdAt: true,
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

// Invite Timeline for tracking all post-invite interactions
export const inviteTimeline = pgTable("invite_timeline", {
  id: serial("id").primaryKey(),
  inviteId: integer("invite_id").notNull().references(() => invites.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'invite_sent', 'rsvp_response', 'email_received', 'time_proposal', 'domain_activity'
  source: text("source").notNull(), // 'gmail', 'outlook', 'calendar_api', 'webhook'
  action: text("action"), // 'accepted', 'declined', 'tentative', 'reply', 'forward', 'reschedule'
  summary: text("summary").notNull(), // Human-readable description
  details: jsonb("details"), // Structured data: email content, response details, etc.
  recipientEmail: text("recipient_email"),
  recipientDomain: text("recipient_domain"),
  senderEmail: text("sender_email"),
  subject: text("subject"),
  messageId: text("message_id"), // For email tracking
  threadId: text("thread_id"), // For conversation tracking
  severity: text("severity").notNull().default("info"), // 'info', 'warning', 'error', 'success'
  metadata: jsonb("metadata"), // Additional tracking data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Email Activity Monitoring for inbound email tracking
export const emailActivity = pgTable("email_activity", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountType: text("account_type").notNull(), // 'google', 'outlook'
  accountId: integer("account_id").notNull(),
  messageId: text("message_id").notNull().unique(),
  threadId: text("thread_id"),
  historyId: text("history_id"), // For Gmail API tracking
  deltaToken: text("delta_token"), // For Microsoft Graph API tracking
  fromEmail: text("from_email").notNull(),
  fromDomain: text("from_domain").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject"),
  snippet: text("snippet"), // Email preview
  labels: jsonb("labels"), // Gmail labels or Outlook categories
  isProcessed: boolean("is_processed").notNull().default(false),
  relatedInviteId: integer("related_invite_id").references(() => invites.id),
  relatedCampaignId: integer("related_campaign_id").references(() => campaigns.id),
  matchingCriteria: text("matching_criteria"), // How it was matched to invite/campaign
  receivedAt: timestamp("received_at").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Response Intelligence Settings for monitoring configuration
export const responseSettings = pgTable("response_settings", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountType: text("account_type").notNull(), // 'google', 'outlook'
  accountId: integer("account_id").notNull(),
  isMonitoringEnabled: boolean("is_monitoring_enabled").notNull().default(true),
  watchLabels: jsonb("watch_labels"), // Gmail labels to monitor
  watchCategories: jsonb("watch_categories"), // Outlook categories to monitor
  domainMatching: boolean("domain_matching").notNull().default(true),
  subjectMatching: boolean("subject_matching").notNull().default(true),
  historyId: text("history_id"), // Last processed Gmail history ID
  deltaToken: text("delta_token"), // Last processed Microsoft Graph delta token
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").notNull().default("active"), // 'active', 'paused', 'error'
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Type definitions for new tables
export type InsertInviteTimeline = typeof inviteTimeline.$inferInsert;
export type InviteTimeline = typeof inviteTimeline.$inferSelect;

export type InsertEmailActivity = typeof emailActivity.$inferInsert;
export type EmailActivity = typeof emailActivity.$inferSelect;

export type InsertResponseSettings = typeof responseSettings.$inferInsert;
export type ResponseSettings = typeof responseSettings.$inferSelect;
