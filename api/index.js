var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc5) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc5 = __getOwnPropDesc(from, key)) || desc5.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  calendarSlots: () => calendarSlots,
  campaigns: () => campaigns,
  emailActivity: () => emailActivity,
  emailProviders: () => emailProviders,
  googleAccounts: () => googleAccounts,
  industryTemplates: () => industryTemplates,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertActivityLogSchemaOld: () => insertActivityLogSchemaOld,
  insertCalendarSlotSchema: () => insertCalendarSlotSchema,
  insertCampaignSchema: () => insertCampaignSchema,
  insertEmailProviderSchema: () => insertEmailProviderSchema,
  insertGoogleAccountSchema: () => insertGoogleAccountSchema,
  insertIndustryTemplateSchema: () => insertIndustryTemplateSchema,
  insertInviteQueueSchema: () => insertInviteQueueSchema,
  insertInviteSchema: () => insertInviteSchema,
  insertOutlookAccountSchema: () => insertOutlookAccountSchema,
  insertProspectBatchSchema: () => insertProspectBatchSchema,
  insertProspectProcessingLogSchema: () => insertProspectProcessingLogSchema,
  insertProspectSchema: () => insertProspectSchema,
  insertRsvpEventSchema: () => insertRsvpEventSchema,
  insertScheduledInviteSchema: () => insertScheduledInviteSchema,
  insertSchedulingSettingsSchema: () => insertSchedulingSettingsSchema,
  insertSystemSettingsSchema: () => insertSystemSettingsSchema,
  insertUserSchema: () => insertUserSchema,
  insertWebhookEventSchema: () => insertWebhookEventSchema,
  inviteQueue: () => inviteQueue,
  inviteTimeline: () => inviteTimeline,
  invites: () => invites,
  outlookAccounts: () => outlookAccounts,
  prospectBatches: () => prospectBatches,
  prospectProcessingLogs: () => prospectProcessingLogs,
  prospects: () => prospects,
  responseSettings: () => responseSettings,
  rsvpEvents: () => rsvpEvents,
  scheduledInvites: () => scheduledInvites,
  schedulingSettings: () => schedulingSettings,
  sessions: () => sessions,
  systemSettings: () => systemSettings,
  users: () => users,
  webhookEvents: () => webhookEvents
});
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, sessions, googleAccounts, outlookAccounts, emailProviders, campaigns, invites, activityLogs, systemSettings, rsvpEvents, webhookEvents, inviteQueue, insertGoogleAccountSchema, insertOutlookAccountSchema, insertEmailProviderSchema, insertCampaignSchema, insertInviteSchema, insertActivityLogSchema, insertActivityLogSchemaOld, scheduledInvites, schedulingSettings, calendarSlots, prospectBatches, prospects, industryTemplates, prospectProcessingLogs, insertScheduledInviteSchema, insertSchedulingSettingsSchema, insertCalendarSlotSchema, insertSystemSettingsSchema, insertInviteQueueSchema, insertProspectBatchSchema, insertProspectSchema, insertIndustryTemplateSchema, insertProspectProcessingLogSchema, insertRsvpEventSchema, insertWebhookEventSchema, insertUserSchema, inviteTimeline, emailActivity, responseSettings;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: uuid("id").primaryKey().defaultRandom(),
      email: text("email").notNull().unique(),
      passwordHash: text("password_hash").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    googleAccounts = pgTable("google_accounts", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      email: text("email").notNull().unique(),
      name: text("name").notNull(),
      accessToken: text("access_token").notNull(),
      refreshToken: text("refresh_token").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      status: text("status").notNull().default("active"),
      // 'active', 'disconnected', 'revoked'
      lastConnectionCheck: timestamp("last_connection_check"),
      connectionError: text("connection_error"),
      disconnectedAt: timestamp("disconnected_at"),
      lastUsed: timestamp("last_used"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    outlookAccounts = pgTable("outlook_accounts", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      email: text("email").notNull().unique(),
      name: text("name").notNull(),
      accessToken: text("access_token").notNull(),
      refreshToken: text("refresh_token").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      microsoftId: text("microsoft_id").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      status: text("status").notNull().default("active"),
      // 'active', 'disconnected', 'revoked'
      lastConnectionCheck: timestamp("last_connection_check"),
      connectionError: text("connection_error"),
      disconnectedAt: timestamp("disconnected_at"),
      lastUsed: timestamp("last_used"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    emailProviders = pgTable("email_providers", {
      id: serial("id").primaryKey(),
      type: text("type").notNull(),
      // 'gmail' | 'outlook'
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
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    campaigns = pgTable("campaigns", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      csvData: jsonb("csv_data").notNull(),
      // Store parsed CSV data as JSON
      eventTitleTemplate: text("event_title_template").notNull(),
      eventDescriptionTemplate: text("event_description_template").notNull(),
      confirmationEmailTemplate: text("confirmation_email_template").notNull(),
      subjectLine: text("subject_line").default("Hi from {{sender_name}}"),
      senderName: text("sender_name"),
      // Sender name variable for personalized messaging
      eventDuration: integer("event_duration").notNull().default(30),
      // minutes
      timeZone: text("time_zone").notNull().default("UTC"),
      selectedInboxes: integer("selected_inboxes").array().notNull().default([]),
      // Array of account IDs
      // Campaign Rate Limiting Controls
      maxInvitesPerInbox: integer("max_invites_per_inbox").notNull().default(20),
      // Max invites per inbox per day for this campaign
      maxDailyCampaignInvites: integer("max_daily_campaign_invites").notNull().default(100),
      // Max total invites this campaign can send per day
      // Advanced Scheduling Configuration
      schedulingMode: text("scheduling_mode").notNull().default("immediate"),
      // 'immediate' | 'advanced'
      dateRangeStart: timestamp("date_range_start"),
      // Start date for advanced scheduling
      dateRangeEnd: timestamp("date_range_end"),
      // End date for advanced scheduling
      selectedDaysOfWeek: integer("selected_days_of_week").array().default([]),
      // 0=Sunday, 1=Monday, ..., 6=Saturday
      timeWindowStart: text("time_window_start"),
      // e.g., "09:00"
      timeWindowEnd: text("time_window_end"),
      // e.g., "17:00"
      schedulingTimezone: text("scheduling_timezone").notNull().default("UTC"),
      // Timezone for scheduling logic
      randomizedSlots: jsonb("randomized_slots"),
      // Pre-calculated random time slots for this campaign
      sdrEmail: text("sdr_email"),
      // Optional SDR email to CC on all invites
      status: text("status").notNull().default("active"),
      // active, paused, completed
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    invites = pgTable("invites", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      campaignId: integer("campaign_id").references(() => campaigns.id),
      googleAccountId: integer("google_account_id").references(() => googleAccounts.id),
      outlookAccountId: integer("outlook_account_id").references(() => outlookAccounts.id),
      calendarProvider: text("calendar_provider").notNull().default("google"),
      // 'google' | 'outlook'
      prospectEmail: text("prospect_email").notNull(),
      prospectName: text("prospect_name"),
      prospectCompany: text("prospect_company"),
      mergeData: jsonb("merge_data"),
      // Additional merge fields
      eventId: text("event_id"),
      // Google Calendar event ID
      csvRowIndex: integer("csv_row_index"),
      // Changed from sheetRowIndex
      isManualTest: boolean("is_manual_test").notNull().default(false),
      // New field for manual tests
      status: text("status").notNull().default("pending"),
      // pending, sent, accepted, declined, tentative, error
      rsvpStatus: text("rsvp_status"),
      // accepted, declined, tentative, needsAction
      rsvpResponseAt: timestamp("rsvp_response_at"),
      // When the RSVP was received
      rsvpHistory: jsonb("rsvp_history"),
      // Array of status changes with timestamps
      errorMessage: text("error_message"),
      sentAt: timestamp("sent_at"),
      acceptedAt: timestamp("accepted_at"),
      // Legacy field, kept for compatibility
      declinedAt: timestamp("declined_at"),
      // When declined
      tentativeAt: timestamp("tentative_at"),
      // When marked tentative
      lastStatusCheck: timestamp("last_status_check"),
      // Last time we checked the status
      webhookReceived: boolean("webhook_received").notNull().default(false),
      // True if status came from webhook
      confirmationSent: boolean("confirmation_sent").notNull().default(false),
      confirmationSentAt: timestamp("confirmation_sent_at"),
      confirmationEmailStatus: text("confirmation_email_status").default("pending"),
      // 'pending', 'sent', 'skipped', 'failed'
      confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
      confirmationEmailTemplate: text("confirmation_email_template"),
      // Custom template for this invite
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    activityLogs = pgTable("activity_logs", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
      eventType: text("event_type").notNull(),
      // invite_sent, invite_accepted, inbox_connected, campaign_created, etc.
      action: text("action").notNull(),
      // Human readable action description
      description: text("description").notNull(),
      // Detailed description
      campaignId: integer("campaign_id").references(() => campaigns.id),
      inviteId: integer("invite_id").references(() => invites.id),
      inboxId: integer("inbox_id"),
      // Generic inbox reference (google or outlook)
      inboxType: text("inbox_type"),
      // 'google' or 'microsoft'
      recipientEmail: text("recipient_email"),
      recipientName: text("recipient_name"),
      severity: text("severity").notNull().default("info"),
      // info, warning, error, success
      metadata: jsonb("metadata").$type(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    systemSettings = pgTable("system_settings", {
      id: serial("id").primaryKey(),
      dailyInviteLimit: integer("daily_invite_limit").notNull().default(400),
      // 20 inboxes × 20 invites per day
      inboxCooldownMinutes: integer("inbox_cooldown_minutes").notNull().default(30),
      acceptanceCheckIntervalMinutes: integer("acceptance_check_interval_minutes").notNull().default(60),
      isSystemActive: boolean("is_system_active").notNull().default(true),
      serviceAccountCredentials: jsonb("service_account_credentials"),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    rsvpEvents = pgTable("rsvp_events", {
      id: serial("id").primaryKey(),
      inviteId: integer("invite_id").references(() => invites.id).notNull(),
      eventId: text("event_id").notNull(),
      // Calendar event ID
      prospectEmail: text("prospect_email").notNull(),
      rsvpStatus: text("rsvp_status").notNull(),
      // accepted, declined, tentative, needsAction
      previousStatus: text("previous_status"),
      // Previous status for tracking changes
      source: text("source").notNull().default("polling"),
      // webhook, polling, manual
      webhookPayload: jsonb("webhook_payload"),
      // Raw webhook data for debugging
      responseAt: timestamp("response_at").notNull(),
      // When the response was given
      detectedAt: timestamp("detected_at").notNull().defaultNow(),
      // When we detected the response
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    webhookEvents = pgTable("webhook_events", {
      id: serial("id").primaryKey(),
      eventType: text("event_type").notNull(),
      // google_calendar_event_updated, outlook_event_updated
      eventId: text("event_id"),
      // Calendar event ID if available
      rawPayload: jsonb("raw_payload").notNull(),
      // Complete webhook payload
      processed: boolean("processed").notNull().default(false),
      processingError: text("processing_error"),
      inviteId: integer("invite_id").references(() => invites.id),
      // Linked invite if found
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    inviteQueue = pgTable("invite_queue", {
      id: serial("id").primaryKey(),
      campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
      prospectData: jsonb("prospect_data").notNull(),
      scheduledFor: timestamp("scheduled_for").notNull(),
      status: text("status").notNull().default("pending"),
      // pending, processing, completed, failed
      attempts: integer("attempts").notNull().default(0),
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertGoogleAccountSchema = createInsertSchema(googleAccounts).omit({
      id: true,
      createdAt: true
    });
    insertOutlookAccountSchema = createInsertSchema(outlookAccounts).omit({
      id: true,
      createdAt: true
    });
    insertEmailProviderSchema = createInsertSchema(emailProviders).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCampaignSchema = createInsertSchema(campaigns).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertInviteSchema = createInsertSchema(invites).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertActivityLogSchema = createInsertSchema(activityLogs).omit({
      id: true,
      createdAt: true
    });
    insertActivityLogSchemaOld = createInsertSchema(activityLogs).omit({
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
      googleAccountId: z.number().optional()
    });
    scheduledInvites = pgTable("scheduled_invites", {
      id: serial("id").primaryKey(),
      campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      recipientEmail: text("recipient_email").notNull(),
      recipientName: text("recipient_name"),
      recipientTimezone: text("recipient_timezone").notNull().default("America/New_York"),
      scheduledTimeUtc: timestamp("scheduled_time_utc").notNull(),
      scheduledTimeLocal: timestamp("scheduled_time_local").notNull(),
      status: text("status").notNull().default("pending"),
      // 'pending', 'sent', 'accepted', 'declined', 'canceled', 'failed'
      senderAccountId: integer("sender_account_id").notNull(),
      senderAccountType: text("sender_account_type").notNull().default("google"),
      // 'google', 'microsoft'
      senderCalendarEventId: text("sender_calendar_event_id"),
      wasDoubleBooked: boolean("was_double_booked").notNull().default(false),
      leadTimeDays: integer("lead_time_days").notNull().default(2),
      originalScheduledTime: timestamp("original_scheduled_time"),
      rescheduledCount: integer("rescheduled_count").notNull().default(0),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    schedulingSettings = pgTable("scheduling_settings", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
      isGlobal: boolean("is_global").notNull().default(false),
      minLeadTimeDays: integer("min_lead_time_days").notNull().default(2),
      maxLeadTimeDays: integer("max_lead_time_days").notNull().default(6),
      preferredStartHour: integer("preferred_start_hour").notNull().default(12),
      // 12 PM
      preferredEndHour: integer("preferred_end_hour").notNull().default(16),
      // 4 PM
      allowDoubleBooking: boolean("allow_double_booking").notNull().default(false),
      maxDoubleBookingsPerSlot: integer("max_double_bookings_per_slot").notNull().default(1),
      excludeWeekends: boolean("exclude_weekends").notNull().default(true),
      businessHoursOnly: boolean("business_hours_only").notNull().default(true),
      fallbackPolicy: text("fallback_policy").notNull().default("skip"),
      // 'skip', 'double_book', 'manual'
      enableTimezoneDetection: boolean("enable_timezone_detection").notNull().default(true),
      retryAttempts: integer("retry_attempts").notNull().default(3),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    calendarSlots = pgTable("calendar_slots", {
      id: serial("id").primaryKey(),
      accountId: integer("account_id").notNull(),
      accountType: text("account_type").notNull().default("google"),
      // 'google', 'microsoft'
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
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    prospectBatches = pgTable("prospect_batches", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      fileName: text("file_name").notNull(),
      targetIndustry: text("target_industry").notNull(),
      totalRecords: integer("total_records").notNull().default(0),
      processedRecords: integer("processed_records").notNull().default(0),
      confirmedRecords: integer("confirmed_records").notNull().default(0),
      rejectedRecords: integer("rejected_records").notNull().default(0),
      greyAreaRecords: integer("grey_area_records").notNull().default(0),
      status: text("status").notNull().default("processing"),
      // 'uploading', 'processing', 'completed', 'failed'
      error: text("error"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    prospects = pgTable("prospects", {
      id: serial("id").primaryKey(),
      batchId: integer("batch_id").notNull().references(() => prospectBatches.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      originalCompanyName: text("original_company_name").notNull(),
      websiteDomain: text("website_domain"),
      cleanedCompanyName: text("cleaned_company_name"),
      companyDescription: text("company_description"),
      scrapingStatus: text("scraping_status").default("pending"),
      // 'pending', 'success', 'failed', 'skipped'
      scrapingError: text("scraping_error"),
      classificationStatus: text("classification_status").default("pending"),
      // 'pending', 'completed', 'failed'
      industryMatch: text("industry_match"),
      // 'confirmed', 'rejected', 'grey_area'
      confidence: integer("confidence"),
      // 1-100 percentage
      competitors: jsonb("competitors").default([]),
      // Array of competitor names
      classificationReasoning: text("classification_reasoning"),
      openaiPrompt: text("openai_prompt"),
      openaiResponse: jsonb("openai_response"),
      manualOverride: boolean("manual_override").notNull().default(false),
      manualStatus: text("manual_status"),
      // User can override AI classification
      manualCompetitors: jsonb("manual_competitors"),
      // User can edit competitors
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    industryTemplates = pgTable("industry_templates", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      industryKeywords: jsonb("industry_keywords").default([]),
      // Array of keywords
      classificationPrompt: text("classification_prompt").notNull(),
      competitorPrompt: text("competitor_prompt"),
      isDefault: boolean("is_default").notNull().default(false),
      usageCount: integer("usage_count").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    prospectProcessingLogs = pgTable("prospect_processing_logs", {
      id: serial("id").primaryKey(),
      prospectId: integer("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
      batchId: integer("batch_id").references(() => prospectBatches.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      step: text("step").notNull(),
      // 'upload', 'scraping', 'classification', 'completion'
      status: text("status").notNull(),
      // 'started', 'completed', 'failed'
      message: text("message"),
      metadata: jsonb("metadata").default({}),
      executionTime: integer("execution_time"),
      // milliseconds
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertScheduledInviteSchema = createInsertSchema(scheduledInvites).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSchedulingSettingsSchema = createInsertSchema(schedulingSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCalendarSlotSchema = createInsertSchema(calendarSlots).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
      id: true,
      updatedAt: true
    });
    insertInviteQueueSchema = createInsertSchema(inviteQueue).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertProspectBatchSchema = createInsertSchema(prospectBatches).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertProspectSchema = createInsertSchema(prospects).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertIndustryTemplateSchema = createInsertSchema(industryTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertProspectProcessingLogSchema = createInsertSchema(prospectProcessingLogs).omit({
      id: true,
      createdAt: true
    });
    insertRsvpEventSchema = createInsertSchema(rsvpEvents).omit({
      id: true,
      detectedAt: true,
      createdAt: true
    });
    insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
      id: true,
      createdAt: true
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true
    });
    inviteTimeline = pgTable("invite_timeline", {
      id: serial("id").primaryKey(),
      inviteId: integer("invite_id").notNull().references(() => invites.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
      type: text("type").notNull(),
      // 'invite_sent', 'rsvp_response', 'email_received', 'time_proposal', 'domain_activity'
      source: text("source").notNull(),
      // 'gmail', 'outlook', 'calendar_api', 'webhook'
      action: text("action"),
      // 'accepted', 'declined', 'tentative', 'reply', 'forward', 'reschedule'
      summary: text("summary").notNull(),
      // Human-readable description
      details: jsonb("details"),
      // Structured data: email content, response details, etc.
      recipientEmail: text("recipient_email"),
      recipientDomain: text("recipient_domain"),
      senderEmail: text("sender_email"),
      subject: text("subject"),
      messageId: text("message_id"),
      // For email tracking
      threadId: text("thread_id"),
      // For conversation tracking
      severity: text("severity").notNull().default("info"),
      // 'info', 'warning', 'error', 'success'
      metadata: jsonb("metadata"),
      // Additional tracking data
      timestamp: timestamp("timestamp").notNull().defaultNow(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    emailActivity = pgTable("email_activity", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      accountType: text("account_type").notNull(),
      // 'google', 'outlook'
      accountId: integer("account_id").notNull(),
      messageId: text("message_id").notNull().unique(),
      threadId: text("thread_id"),
      historyId: text("history_id"),
      // For Gmail API tracking
      deltaToken: text("delta_token"),
      // For Microsoft Graph API tracking
      fromEmail: text("from_email").notNull(),
      fromDomain: text("from_domain").notNull(),
      toEmail: text("to_email").notNull(),
      subject: text("subject"),
      snippet: text("snippet"),
      // Email preview
      labels: jsonb("labels"),
      // Gmail labels or Outlook categories
      isProcessed: boolean("is_processed").notNull().default(false),
      relatedInviteId: integer("related_invite_id").references(() => invites.id),
      relatedCampaignId: integer("related_campaign_id").references(() => campaigns.id),
      matchingCriteria: text("matching_criteria"),
      // How it was matched to invite/campaign
      receivedAt: timestamp("received_at").notNull(),
      processedAt: timestamp("processed_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    responseSettings = pgTable("response_settings", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      accountType: text("account_type").notNull(),
      // 'google', 'outlook'
      accountId: integer("account_id").notNull(),
      isMonitoringEnabled: boolean("is_monitoring_enabled").notNull().default(true),
      watchLabels: jsonb("watch_labels"),
      // Gmail labels to monitor
      watchCategories: jsonb("watch_categories"),
      // Outlook categories to monitor
      domainMatching: boolean("domain_matching").notNull().default(true),
      subjectMatching: boolean("subject_matching").notNull().default(true),
      historyId: text("history_id"),
      // Last processed Gmail history ID
      deltaToken: text("delta_token"),
      // Last processed Microsoft Graph delta token
      lastSync: timestamp("last_sync"),
      syncStatus: text("sync_status").notNull().default("active"),
      // 'active', 'paused', 'error'
      syncError: text("sync_error"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { eq, desc, and, sql, count, isNull, gte, lte, or, ilike } from "drizzle-orm";
var PostgresStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_schema();
    PostgresStorage = class {
      db;
      constructor() {
        this.db = db;
      }
      // Google Accounts
      async getGoogleAccounts(userId) {
        return await this.db.select().from(googleAccounts).where(
          and(
            eq(googleAccounts.userId, userId),
            eq(googleAccounts.isActive, true)
          )
        );
      }
      async getGoogleAccount(id, userId) {
        const result = await this.db.select().from(googleAccounts).where(
          and(
            eq(googleAccounts.id, id),
            eq(googleAccounts.userId, userId)
          )
        );
        return result[0];
      }
      async getGoogleAccountByEmail(email, userId) {
        const result = await this.db.select().from(googleAccounts).where(
          and(
            eq(googleAccounts.email, email),
            eq(googleAccounts.userId, userId)
          )
        );
        return result[0];
      }
      async createGoogleAccount(account) {
        const result = await this.db.insert(googleAccounts).values(account).returning();
        return result[0];
      }
      async updateGoogleAccount(id, updates, userId) {
        const result = await this.db.update(googleAccounts).set(updates).where(
          and(
            eq(googleAccounts.id, id),
            eq(googleAccounts.userId, userId)
          )
        ).returning();
        return result[0];
      }
      async deleteGoogleAccount(id, userId) {
        await this.db.delete(googleAccounts).where(
          and(
            eq(googleAccounts.id, id),
            eq(googleAccounts.userId, userId)
          )
        );
      }
      async disconnectGoogleAccount(id, userId) {
        await this.db.delete(googleAccounts).where(
          and(
            eq(googleAccounts.id, id),
            eq(googleAccounts.userId, userId)
          )
        );
      }
      async getCampaignsUsingInbox(inboxId, userId) {
        try {
          const campaigns4 = await this.db.select().from(campaigns).where(eq(campaigns.userId, userId));
          return campaigns4.filter((campaign) => {
            if (!campaign.selectedInboxes) return false;
            const inboxes = Array.isArray(campaign.selectedInboxes) ? campaign.selectedInboxes : JSON.parse(campaign.selectedInboxes);
            return inboxes.includes(inboxId);
          }).map((campaign) => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status
          }));
        } catch (error) {
          console.error("Error in getCampaignsUsingInbox:", error);
          return [];
        }
      }
      async getAccountsWithStatus(userId) {
        const accounts = await this.getGoogleAccounts(userId);
        return accounts.map((account) => ({
          ...account,
          nextAvailable: null,
          isInCooldown: false
        }));
      }
      // Outlook Accounts
      async getOutlookAccounts(userId) {
        return await this.db.select().from(outlookAccounts).where(eq(outlookAccounts.userId, userId)).orderBy(desc(outlookAccounts.createdAt));
      }
      async getOutlookAccount(id, userId) {
        const result = await this.db.select().from(outlookAccounts).where(and(
          eq(outlookAccounts.id, id),
          eq(outlookAccounts.userId, userId)
        ));
        return result[0];
      }
      async getOutlookAccountByEmail(email, userId) {
        const result = await this.db.select().from(outlookAccounts).where(and(
          eq(outlookAccounts.email, email),
          eq(outlookAccounts.userId, userId)
        ));
        return result[0];
      }
      async createOutlookAccount(account) {
        const result = await this.db.insert(outlookAccounts).values(account).returning();
        return result[0];
      }
      async updateOutlookAccount(id, updates, userId) {
        const result = await this.db.update(outlookAccounts).set(updates).where(and(
          eq(outlookAccounts.id, id),
          eq(outlookAccounts.userId, userId)
        )).returning();
        return result[0];
      }
      async deleteOutlookAccount(id, userId) {
        await this.cleanupActivityLogsForOutlookAccount(id);
        await this.cleanupInvitesForOutlookAccount(id);
        await this.db.delete(outlookAccounts).where(and(
          eq(outlookAccounts.id, id),
          eq(outlookAccounts.userId, userId)
        ));
      }
      async disconnectOutlookAccount(id, userId) {
        await this.updateOutlookAccount(id, {
          isActive: false,
          accessToken: "revoked",
          refreshToken: "revoked"
        }, userId);
      }
      async cleanupActivityLogsForOutlookAccount(accountId) {
        await this.db.delete(activityLogs).where(and(
          eq(activityLogs.outlookAccountId, accountId)
        ));
      }
      async cleanupInvitesForOutlookAccount(accountId) {
        const invites3 = await this.db.select({ id: invites.id }).from(invites).where(eq(invites.outlookAccountId, accountId));
        for (const invite of invites3) {
          await this.db.delete(rsvpEvents).where(eq(rsvpEvents.inviteId, invite.id));
        }
        await this.db.delete(invites).where(eq(invites.outlookAccountId, accountId));
      }
      // Campaigns
      async getCampaigns(userId) {
        return await this.db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
      }
      async getCampaign(id, userId) {
        const result = await this.db.select().from(campaigns).where(
          and(
            eq(campaigns.id, id),
            eq(campaigns.userId, userId)
          )
        );
        return result[0];
      }
      async createCampaign(campaign) {
        const result = await this.db.insert(campaigns).values(campaign).returning();
        return result[0];
      }
      async updateCampaign(id, updates, userId) {
        const result = await this.db.update(campaigns).set(updates).where(
          and(
            eq(campaigns.id, id),
            eq(campaigns.userId, userId)
          )
        ).returning();
        return result[0];
      }
      async deleteCampaign(id, userId) {
        try {
          console.log(`Starting deletion of campaign ${id} for user ${userId}`);
          const processingItems = await this.db.select().from(inviteQueue).where(and(
            eq(inviteQueue.campaignId, id),
            eq(inviteQueue.status, "processing")
          ));
          console.log(`Found ${processingItems.length} processing items for campaign ${id}`);
          if (processingItems.length > 0) {
            throw new Error("Cannot delete campaign while invites are being processed. Please wait and try again.");
          }
          console.log(`Setting campaign ${id} as inactive...`);
          await this.db.update(campaigns).set({ isActive: false, status: "deleted" }).where(and(
            eq(campaigns.id, id),
            eq(campaigns.userId, userId)
          ));
          console.log(`Deleting related records for campaign ${id}...`);
          const deletedQueue = await this.db.delete(inviteQueue).where(eq(inviteQueue.campaignId, id)).returning();
          console.log(`Deleted ${deletedQueue.length} queue items`);
          const campaignInvites = await this.db.select({ id: invites.id }).from(invites).where(and(
            eq(invites.campaignId, id),
            eq(invites.userId, userId)
          ));
          if (campaignInvites.length > 0) {
            const inviteIds = campaignInvites.map((invite) => invite.id);
            let deletedRsvpEventsCount = 0;
            let deletedActivityLogsCount = 0;
            for (const inviteId of inviteIds) {
              const deletedRsvpEvents = await this.db.delete(rsvpEvents).where(eq(rsvpEvents.inviteId, inviteId)).returning();
              deletedRsvpEventsCount += deletedRsvpEvents.length;
              const deletedActivityLogs = await this.db.delete(activityLogs).where(and(
                eq(activityLogs.inviteId, inviteId),
                eq(activityLogs.userId, userId)
              )).returning();
              deletedActivityLogsCount += deletedActivityLogs.length;
            }
            console.log(`Deleted ${deletedRsvpEventsCount} RSVP events`);
            console.log(`Deleted ${deletedActivityLogsCount} activity logs linked to invites`);
          }
          const deletedInvites = await this.db.delete(invites).where(and(
            eq(invites.campaignId, id),
            eq(invites.userId, userId)
          )).returning();
          console.log(`Deleted ${deletedInvites.length} invites`);
          const deletedLogs = await this.db.delete(activityLogs).where(and(
            eq(activityLogs.campaignId, id),
            eq(activityLogs.userId, userId),
            isNull(activityLogs.inviteId)
            // Only delete logs without invite references
          )).returning();
          console.log(`Deleted ${deletedLogs.length} remaining activity logs`);
          console.log(`Deleting campaign ${id}...`);
          const deletedCampaigns = await this.db.delete(campaigns).where(and(
            eq(campaigns.id, id),
            eq(campaigns.userId, userId)
          )).returning();
          if (deletedCampaigns.length === 0) {
            throw new Error("Campaign not found or does not belong to user");
          }
          console.log(`Successfully deleted campaign ${id}`);
        } catch (error) {
          console.error(`Error deleting campaign ${id}:`, error);
          throw error;
        }
      }
      async getCampaignsWithStats(userId) {
        const campaigns4 = await this.getCampaigns(userId);
        const campaignsWithStats = [];
        for (const campaign of campaigns4) {
          const invites3 = await this.db.select().from(invites).where(eq(invites.campaignId, campaign.id));
          const sentInvites = invites3.filter((invite) => invite.status === "sent" || invite.status === "accepted");
          const accepted = invites3.filter((invite) => invite.status === "accepted").length;
          const queueItems = await this.db.select().from(inviteQueue).where(eq(inviteQueue.campaignId, campaign.id));
          const pendingInvites = queueItems.filter((item) => item.status === "pending").length;
          const processingInvites = queueItems.filter((item) => item.status === "processing").length;
          const csvData = campaign.csvData || [];
          const totalProspects = csvData.length;
          const progress = totalProspects > 0 ? sentInvites.length / totalProspects * 100 : 0;
          const declined = invites3.filter((invite) => invite.rsvpStatus === "declined").length;
          const tentative = invites3.filter((invite) => invite.rsvpStatus === "tentative").length;
          const noResponse = invites3.filter((invite) => invite.status === "sent" && !invite.rsvpStatus).length;
          const acceptanceRate = sentInvites.length > 0 ? Math.round(accepted / sentInvites.length * 100 * 10) / 10 : 0;
          const responseRate = sentInvites.length > 0 ? Math.round((accepted + declined + tentative) / sentInvites.length * 100 * 10) / 10 : 0;
          campaignsWithStats.push({
            ...campaign,
            invitesSent: sentInvites.length,
            accepted,
            declined,
            tentative,
            noResponse,
            totalProspects,
            progress: Math.round(progress * 10) / 10,
            pendingInvites,
            processingInvites,
            acceptanceRate,
            responseRate
          });
        }
        return campaignsWithStats;
      }
      // Invites
      async getInvites(userId, campaignId) {
        if (campaignId) {
          return await this.db.select().from(invites).where(
            and(
              eq(invites.campaignId, campaignId),
              eq(invites.userId, userId)
            )
          );
        }
        return await this.db.select().from(invites).where(eq(invites.userId, userId)).orderBy(desc(invites.createdAt));
      }
      async getInvite(id, userId) {
        const result = await this.db.select().from(invites).where(
          and(
            eq(invites.id, id),
            eq(invites.userId, userId)
          )
        );
        return result[0];
      }
      async createInvite(invite) {
        const result = await this.db.insert(invites).values(invite).returning();
        return result[0];
      }
      async updateInvite(id, updates, userId) {
        const result = await this.db.update(invites).set(updates).where(
          and(
            eq(invites.id, id),
            eq(invites.userId, userId)
          )
        ).returning();
        return result[0];
      }
      async getInvitesByStatus(status, userId) {
        return await this.db.select().from(invites).where(
          and(
            eq(invites.status, status),
            eq(invites.userId, userId)
          )
        );
      }
      async getInvitesToday(userId) {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.db.select({ count: count() }).from(invites).where(and(
          eq(invites.userId, userId),
          sql`${invites.createdAt} >= ${today}`
        ));
        return result[0]?.count || 0;
      }
      async getAcceptedInvites(userId) {
        const result = await this.db.select({ count: count() }).from(invites).where(and(
          eq(invites.userId, userId),
          eq(invites.status, "accepted")
        ));
        return result[0]?.count || 0;
      }
      async getInvitesTodayByAccount(accountId, userId) {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.db.select({ count: count() }).from(invites).where(and(
          eq(invites.userId, userId),
          eq(invites.googleAccountId, accountId),
          sql`${invites.sentAt} >= ${today}`
        ));
        return result[0]?.count || 0;
      }
      async getInvitesByRsvpStatus(rsvpStatus, userId) {
        return await this.db.select().from(invites).where(
          and(
            eq(invites.rsvpStatus, rsvpStatus),
            eq(invites.userId, userId)
          )
        );
      }
      async updateInviteRsvpStatus(inviteId, rsvpStatus, source, webhookPayload) {
        const invite = await this.getInvite(inviteId);
        if (!invite) throw new Error(`Invite ${inviteId} not found`);
        const now = /* @__PURE__ */ new Date();
        const previousStatus = invite.rsvpStatus;
        const updates = {
          rsvpStatus,
          rsvpResponseAt: now,
          lastStatusCheck: now,
          webhookReceived: source === "webhook",
          updatedAt: now
        };
        if (rsvpStatus === "accepted") {
          updates.acceptedAt = now;
          updates.status = "accepted";
        } else if (rsvpStatus === "declined") {
          updates.declinedAt = now;
          updates.status = "declined";
        } else if (rsvpStatus === "tentative") {
          updates.tentativeAt = now;
          updates.status = "tentative";
        }
        await this.updateInvite(inviteId, updates);
        if (invite.eventId) {
          await this.createRsvpEvent({
            inviteId,
            eventId: invite.eventId,
            prospectEmail: invite.prospectEmail,
            rsvpStatus,
            previousStatus,
            source,
            webhookPayload,
            responseAt: now
          });
        }
        await this.createActivityLog({
          type: `invite_${rsvpStatus}`,
          campaignId: invite.campaignId,
          inviteId,
          googleAccountId: invite.googleAccountId,
          message: `${invite.prospectEmail} ${rsvpStatus} calendar invite`,
          metadata: {
            prospectEmail: invite.prospectEmail,
            rsvpStatus,
            previousStatus,
            source
          }
        });
      }
      async getInviteByEventId(eventId) {
        const result = await this.db.select().from(invites).where(eq(invites.eventId, eventId));
        return result[0];
      }
      // RSVP Events
      async getRsvpEvents(inviteId, userId) {
        const conditions = [];
        if (inviteId) {
          conditions.push(eq(rsvpEvents.inviteId, inviteId));
        }
        if (userId) {
          conditions.push(eq(rsvpEvents.userId, userId));
        }
        let query = this.db.select().from(rsvpEvents);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        return await query.orderBy(desc(rsvpEvents.createdAt));
      }
      async createRsvpEvent(event) {
        const result = await this.db.insert(rsvpEvents).values(event).returning();
        return result[0];
      }
      async getRsvpHistory(inviteId, userId) {
        const conditions = [eq(rsvpEvents.inviteId, inviteId)];
        if (userId) {
          conditions.push(eq(rsvpEvents.userId, userId));
        }
        return await this.db.select().from(rsvpEvents).where(and(...conditions)).orderBy(rsvpEvents.responseAt);
      }
      // Webhook Events
      async getWebhookEvents(processed) {
        if (processed !== void 0) {
          return await this.db.select().from(webhookEvents).where(eq(webhookEvents.processed, processed)).orderBy(desc(webhookEvents.createdAt));
        }
        return await this.db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt));
      }
      async createWebhookEvent(event) {
        const result = await this.db.insert(webhookEvents).values(event).returning();
        return result[0];
      }
      async markWebhookProcessed(id, success, error) {
        const updates = {
          processed: true
        };
        if (error) {
          updates.processingError = error;
        }
        await this.db.update(webhookEvents).set(updates).where(eq(webhookEvents.id, id));
      }
      // Activity Logs
      async getActivityLogs(userId, options) {
        const {
          limit = 50,
          offset = 0,
          eventType,
          campaignId,
          inboxId,
          inboxType,
          recipientEmail,
          severity,
          startDate,
          endDate,
          search
        } = options || {};
        let conditions = [eq(activityLogs.userId, userId)];
        if (eventType) {
          conditions.push(eq(activityLogs.eventType, eventType));
        }
        if (campaignId) {
          conditions.push(eq(activityLogs.campaignId, campaignId));
        }
        if (inboxId) {
          conditions.push(eq(activityLogs.inboxId, inboxId));
        }
        if (inboxType) {
          conditions.push(eq(activityLogs.inboxType, inboxType));
        }
        if (recipientEmail) {
          conditions.push(eq(activityLogs.recipientEmail, recipientEmail));
        }
        if (severity) {
          conditions.push(eq(activityLogs.severity, severity));
        }
        if (startDate) {
          conditions.push(gte(activityLogs.createdAt, startDate));
        }
        if (endDate) {
          conditions.push(lte(activityLogs.createdAt, endDate));
        }
        if (search) {
          conditions.push(
            or(
              ilike(activityLogs.description, `%${search}%`),
              ilike(activityLogs.action, `%${search}%`),
              ilike(activityLogs.recipientEmail, `%${search}%`)
            )
          );
        }
        return await this.db.select().from(activityLogs).where(and(...conditions)).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);
      }
      async getActivityLogCount(userId, options) {
        const {
          eventType,
          campaignId,
          inboxId,
          inboxType,
          recipientEmail,
          severity,
          startDate,
          endDate,
          search
        } = options || {};
        let conditions = [eq(activityLogs.userId, userId)];
        if (eventType) {
          conditions.push(eq(activityLogs.eventType, eventType));
        }
        if (campaignId) {
          conditions.push(eq(activityLogs.campaignId, campaignId));
        }
        if (inboxId) {
          conditions.push(eq(activityLogs.inboxId, inboxId));
        }
        if (inboxType) {
          conditions.push(eq(activityLogs.inboxType, inboxType));
        }
        if (recipientEmail) {
          conditions.push(eq(activityLogs.recipientEmail, recipientEmail));
        }
        if (severity) {
          conditions.push(eq(activityLogs.severity, severity));
        }
        if (startDate) {
          conditions.push(gte(activityLogs.createdAt, startDate));
        }
        if (endDate) {
          conditions.push(lte(activityLogs.createdAt, endDate));
        }
        if (search) {
          conditions.push(
            or(
              ilike(activityLogs.description, `%${search}%`),
              ilike(activityLogs.action, `%${search}%`),
              ilike(activityLogs.recipientEmail, `%${search}%`)
            )
          );
        }
        const result = await this.db.select({ count: count() }).from(activityLogs).where(and(...conditions));
        return result[0]?.count || 0;
      }
      async createActivityLog(log2) {
        const result = await this.db.insert(activityLogs).values(log2).returning();
        return result[0];
      }
      async cleanupActivityLogsForAccount(accountId) {
        const { activityLogs: activityLogs3 } = schema_exports;
        await this.db.update(activityLogs3).set({ googleAccountId: null }).where(eq(activityLogs3.googleAccountId, accountId));
      }
      async cleanupInvitesForAccount(accountId) {
        const { invites: invites3 } = schema_exports;
        await this.db.update(invites3).set({ googleAccountId: null }).where(eq(invites3.googleAccountId, accountId));
      }
      // System Settings
      async getSystemSettings() {
        const result = await this.db.select().from(systemSettings).limit(1);
        if (result.length === 0) {
          const defaultSettings = {
            dailyInviteLimit: 100,
            inboxCooldownMinutes: 30,
            inviteIntervalMinutes: 5,
            enableEmailConfirmations: true,
            enableTimeSlotScheduling: true
          };
          const created = await this.db.insert(systemSettings).values(defaultSettings).returning();
          return created[0];
        }
        return result[0];
      }
      async updateSystemSettings(updates) {
        const settings = await this.getSystemSettings();
        const result = await this.db.update(systemSettings).set(updates).where(eq(systemSettings.id, settings.id)).returning();
        return result[0];
      }
      // Queue
      async getQueueItems(status) {
        if (status) {
          return await this.db.select().from(inviteQueue).where(eq(inviteQueue.status, status));
        }
        return await this.db.select().from(inviteQueue).orderBy(inviteQueue.scheduledFor);
      }
      async createQueueItem(item) {
        const result = await this.db.insert(inviteQueue).values(item).returning();
        return result[0];
      }
      async updateQueueItem(id, updates) {
        const result = await this.db.update(inviteQueue).set(updates).where(eq(inviteQueue.id, id)).returning();
        return result[0];
      }
      async getNextQueueItem() {
        const result = await this.db.select().from(inviteQueue).where(eq(inviteQueue.status, "pending")).orderBy(inviteQueue.scheduledFor).limit(1);
        return result[0];
      }
      // Dashboard
      async getDashboardStats(userId, timeRange) {
        const campaigns4 = await this.db.select({ count: count() }).from(campaigns).where(and(
          eq(campaigns.userId, userId),
          sql`status != 'deleted'`
        ));
        const activeCampaigns = campaigns4[0]?.count || 0;
        let invitesToday;
        let acceptedInvites;
        if (timeRange) {
          const inviteConditions = [
            eq(invites.userId, userId),
            gte(invites.sentAt, timeRange.start),
            lte(invites.sentAt, timeRange.end)
          ];
          const invitesInRange = await this.db.select({ count: count() }).from(invites).where(and(...inviteConditions));
          invitesToday = invitesInRange[0]?.count || 0;
          const acceptedConditions = [
            eq(invites.userId, userId),
            eq(invites.rsvpStatus, "accepted"),
            gte(invites.rsvpResponseAt, timeRange.start),
            lte(invites.rsvpResponseAt, timeRange.end)
          ];
          const acceptedInRange = await this.db.select({ count: count() }).from(invites).where(and(...acceptedConditions));
          acceptedInvites = acceptedInRange[0]?.count || 0;
        } else {
          const totalInvites = await this.db.select({ count: count() }).from(invites).where(and(
            eq(invites.userId, userId),
            eq(invites.status, "sent")
          ));
          invitesToday = totalInvites[0]?.count || 0;
          const totalAccepted = await this.db.select({ count: count() }).from(invites).where(and(
            eq(invites.userId, userId),
            eq(invites.rsvpStatus, "accepted")
          ));
          acceptedInvites = totalAccepted[0]?.count || 0;
        }
        const accounts = await this.db.select({ count: count() }).from(googleAccounts).where(eq(googleAccounts.userId, userId));
        const outlookAccounts3 = await this.db.select({ count: count() }).from(outlookAccounts);
        const connectedAccounts = (accounts[0]?.count || 0) + (outlookAccounts3[0]?.count || 0);
        const acceptanceRate = invitesToday > 0 ? acceptedInvites / invitesToday * 100 : 0;
        const pendingQueue = await this.db.select({ count: count() }).from(inviteQueue).where(eq(inviteQueue.status, "pending"));
        const queueCount = pendingQueue[0]?.count || 0;
        const settings = await this.getSystemSettings();
        return {
          activeCampaigns,
          invitesToday,
          acceptedInvites,
          connectedAccounts,
          acceptanceRate: Math.round(acceptanceRate * 10) / 10,
          dailyLimit: settings.dailyInviteLimit,
          apiUsage: Math.round(invitesToday / settings.dailyInviteLimit * 100),
          queueStatus: queueCount > 0 ? `Processing ${queueCount} items` : "Idle"
        };
      }
      async getCampaignInboxStats(campaignId, userId) {
        const campaign = await this.getCampaign(campaignId, userId);
        if (!campaign) return [];
        const stats = [];
        for (const inboxId of campaign.selectedInboxes) {
          const inbox = await this.getGoogleAccount(inboxId, userId);
          if (!inbox) continue;
          const campaignInvites = await this.db.select().from(invites).where(and(
            eq(invites.campaignId, campaignId),
            eq(invites.googleAccountId, inboxId),
            eq(invites.userId, userId)
          ));
          const dailyUsed = await this.getInvitesTodayByAccount(inboxId, userId);
          stats.push({
            inboxId: inbox.id,
            email: inbox.email,
            name: inbox.name,
            invitesSent: campaignInvites.filter((i) => i.status === "sent" || i.sentAt).length,
            accepted: campaignInvites.filter((i) => i.rsvpStatus === "accepted").length,
            declined: campaignInvites.filter((i) => i.rsvpStatus === "declined").length,
            tentative: campaignInvites.filter((i) => i.rsvpStatus === "tentative").length,
            pending: campaignInvites.filter((i) => i.status === "pending").length,
            lastUsed: inbox.lastUsed ? inbox.lastUsed.toISOString() : null,
            dailyLimit: campaign.maxInvitesPerInbox || 20,
            dailyUsed
          });
        }
        return stats;
      }
      async getCampaignDetailedStats(campaignId, userId) {
        const campaignInvites = await this.db.select().from(invites).where(and(
          eq(invites.campaignId, campaignId),
          eq(invites.userId, userId)
        ));
        const campaign = await this.getCampaign(campaignId, userId);
        const csvData = campaign?.csvData;
        const stats = {
          totalProspects: csvData?.length || 0,
          invitesSent: campaignInvites.filter((i) => i.status === "sent" || i.sentAt).length,
          pending: campaignInvites.filter((i) => i.status === "pending").length,
          accepted: campaignInvites.filter((i) => i.rsvpStatus === "accepted").length,
          declined: campaignInvites.filter((i) => i.rsvpStatus === "declined").length,
          tentative: campaignInvites.filter((i) => i.rsvpStatus === "tentative").length,
          errors: campaignInvites.filter((i) => i.status === "error").length,
          dailyProgress: [],
          inboxUsage: []
        };
        for (let i = 6; i >= 0; i--) {
          const date = /* @__PURE__ */ new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const daySent = campaignInvites.filter(
            (invite) => invite.sentAt && invite.sentAt.toISOString().split("T")[0] === dateStr
          ).length;
          const dayAccepted = campaignInvites.filter(
            (invite) => invite.rsvpResponseAt && invite.rsvpResponseAt.toISOString().split("T")[0] === dateStr && invite.rsvpStatus === "accepted"
          ).length;
          stats.dailyProgress.push({ date: dateStr, sent: daySent, accepted: dayAccepted });
        }
        if (campaign) {
          for (const inboxId of campaign.selectedInboxes) {
            const inbox = await this.getGoogleAccount(inboxId, userId);
            if (inbox) {
              const dailyUsed = await this.getInvitesTodayByAccount(inboxId, userId);
              stats.inboxUsage.push({
                inboxId: inbox.id,
                email: inbox.email,
                usage: dailyUsed,
                limit: campaign.maxInvitesPerInbox || 20
              });
            }
          }
        }
        return stats;
      }
      async getAllUsers() {
        const result = await this.db.select({
          id: users.id,
          email: users.email
        }).from(users);
        return result;
      }
      // Advanced Scheduling Methods
      async getScheduledInvites(userId, campaignId) {
        const whereClause = campaignId ? and(eq(scheduledInvites.userId, userId), eq(scheduledInvites.campaignId, campaignId)) : eq(scheduledInvites.userId, userId);
        return await this.db.select().from(scheduledInvites).where(whereClause).orderBy(scheduledInvites.scheduledTimeUtc);
      }
      async getScheduledInvite(id, userId) {
        const result = await this.db.select().from(scheduledInvites).where(and(eq(scheduledInvites.id, id), eq(scheduledInvites.userId, userId))).limit(1);
        return result[0];
      }
      async createScheduledInvite(invite) {
        const result = await this.db.insert(scheduledInvites).values(invite).returning();
        return result[0];
      }
      async updateScheduledInvite(id, updates, userId) {
        const result = await this.db.update(scheduledInvites).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(scheduledInvites.id, id), eq(scheduledInvites.userId, userId))).returning();
        return result[0];
      }
      async getScheduledInvitesByTimeRange(accountId, accountType, startTime, endTime) {
        return await this.db.select().from(scheduledInvites).where(and(
          eq(scheduledInvites.senderAccountId, accountId),
          eq(scheduledInvites.senderAccountType, accountType),
          gte(scheduledInvites.scheduledTimeUtc, startTime),
          lte(scheduledInvites.scheduledTimeUtc, endTime)
        ));
      }
      async getScheduledInvitesByAccount(accountId, accountType, statuses) {
        return await this.db.select().from(scheduledInvites).where(and(
          eq(scheduledInvites.senderAccountId, accountId),
          eq(scheduledInvites.senderAccountType, accountType),
          sql`${scheduledInvites.status} = ANY(${statuses})`
        ));
      }
      async getDoubleBookingCount(accountId, accountType, startTime, endTime) {
        const result = await this.db.select({ count: sql`cast(count(*) as integer)` }).from(scheduledInvites).where(and(
          eq(scheduledInvites.senderAccountId, accountId),
          eq(scheduledInvites.senderAccountType, accountType),
          gte(scheduledInvites.scheduledTimeUtc, startTime),
          lte(scheduledInvites.scheduledTimeUtc, endTime)
        ));
        return result[0]?.count || 0;
      }
      // Scheduling Settings Methods
      async getSchedulingSettings(userId, campaignId) {
        const whereClause = campaignId ? and(eq(schedulingSettings.userId, userId), eq(schedulingSettings.campaignId, campaignId)) : and(eq(schedulingSettings.userId, userId), eq(schedulingSettings.isGlobal, false));
        const result = await this.db.select().from(schedulingSettings).where(whereClause).limit(1);
        return result[0];
      }
      async getGlobalSchedulingSettings(userId) {
        const result = await this.db.select().from(schedulingSettings).where(and(eq(schedulingSettings.userId, userId), eq(schedulingSettings.isGlobal, true))).limit(1);
        return result[0];
      }
      async createSchedulingSettings(settings) {
        const result = await this.db.insert(schedulingSettings).values(settings).returning();
        return result[0];
      }
      async updateSchedulingSettings(id, updates, userId) {
        const result = await this.db.update(schedulingSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(schedulingSettings.id, id), eq(schedulingSettings.userId, userId))).returning();
        return result[0];
      }
      // Calendar Slots Methods
      async getCalendarSlots(accountId, accountType, startDate, endDate) {
        return await this.db.select().from(calendarSlots).where(and(
          eq(calendarSlots.accountId, accountId),
          eq(calendarSlots.accountType, accountType),
          gte(calendarSlots.date, startDate),
          lte(calendarSlots.date, endDate)
        )).orderBy(calendarSlots.startTime);
      }
      async createCalendarSlot(slot) {
        const result = await this.db.insert(calendarSlots).values(slot).returning();
        return result[0];
      }
      async updateCalendarSlot(id, updates) {
        const result = await this.db.update(calendarSlots).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(calendarSlots.id, id)).returning();
        return result[0];
      }
      async deleteCalendarSlot(id) {
        await this.db.delete(calendarSlots).where(eq(calendarSlots.id, id));
      }
      // Prospect Validation Methods
      async getProspectBatches(userId) {
        return await this.db.select().from(prospectBatches).where(eq(prospectBatches.userId, userId)).orderBy(desc(prospectBatches.createdAt));
      }
      async getProspectBatch(id, userId) {
        const result = await this.db.select().from(prospectBatches).where(and(eq(prospectBatches.id, id), eq(prospectBatches.userId, userId))).limit(1);
        return result[0];
      }
      async createProspectBatch(batch) {
        const result = await this.db.insert(prospectBatches).values(batch).returning();
        return result[0];
      }
      async updateProspectBatch(id, updates) {
        const result = await this.db.update(prospectBatches).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(prospectBatches.id, id)).returning();
        return result[0];
      }
      async deleteProspectBatch(id, userId) {
        await this.db.delete(prospectBatches).where(and(eq(prospectBatches.id, id), eq(prospectBatches.userId, userId)));
      }
      async getProspectsByBatch(batchId, userId) {
        return await this.db.select().from(prospects).where(and(eq(prospects.batchId, batchId), eq(prospects.userId, userId))).orderBy(prospects.order);
      }
      async getProspect(id, userId) {
        const result = await this.db.select().from(prospects).where(and(eq(prospects.id, id), eq(prospects.userId, userId))).limit(1);
        return result[0];
      }
      async createProspect(prospect) {
        const result = await this.db.insert(prospects).values(prospect).returning();
        return result[0];
      }
      async updateProspect(id, updates) {
        const result = await this.db.update(prospects).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(prospects.id, id)).returning();
        return result[0];
      }
      async getIndustryTemplates(userId) {
        return await this.db.select().from(industryTemplates).where(eq(industryTemplates.userId, userId)).orderBy(industryTemplates.name);
      }
      async getIndustryTemplate(id, userId) {
        const result = await this.db.select().from(industryTemplates).where(and(eq(industryTemplates.id, id), eq(industryTemplates.userId, userId))).limit(1);
        return result[0];
      }
      async createIndustryTemplate(template) {
        const result = await this.db.insert(industryTemplates).values(template).returning();
        return result[0];
      }
      async updateIndustryTemplate(id, updates, userId) {
        const result = await this.db.update(industryTemplates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(industryTemplates.id, id), eq(industryTemplates.userId, userId))).returning();
        return result[0];
      }
      async deleteIndustryTemplate(id, userId) {
        await this.db.delete(industryTemplates).where(and(eq(industryTemplates.id, id), eq(industryTemplates.userId, userId)));
      }
      async createProspectProcessingLog(log2) {
        const result = await this.db.insert(prospectProcessingLogs).values(log2).returning();
        return result[0];
      }
      async getProspectProcessingLogs(batchId, userId) {
        let whereConditions = [];
        if (batchId) {
          whereConditions.push(eq(prospectProcessingLogs.batchId, batchId));
        }
        if (userId) {
          whereConditions.push(eq(prospectProcessingLogs.userId, userId));
        }
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : void 0;
        return await this.db.select().from(prospectProcessingLogs).where(whereClause).orderBy(desc(prospectProcessingLogs.createdAt));
      }
      // Confirmation Email Methods
      async getPendingConfirmationEmails(userId) {
        try {
          return [];
        } catch (error) {
          console.error("Error getting pending confirmation emails:", error);
          return [];
        }
      }
      // Response Intelligence Methods
      async getInviteTimeline(inviteId) {
        try {
          const timeline = await db.select().from(inviteTimeline).where(eq(inviteTimeline.inviteId, inviteId)).orderBy(desc(inviteTimeline.timestamp));
          return timeline;
        } catch (error) {
          console.error("Error getting invite timeline:", error);
          return [];
        }
      }
      async getEmailActivity(userId, campaignId) {
        try {
          let query = db.select().from(emailActivity).where(eq(emailActivity.userId, userId));
          if (campaignId) {
            query = query.where(eq(emailActivity.relatedCampaignId, campaignId));
          }
          const activity = await query.orderBy(desc(emailActivity.receivedAt));
          return activity;
        } catch (error) {
          console.error("Error getting email activity:", error);
          return [];
        }
      }
      async getResponseSettings(userId) {
        try {
          const settings = await db.select().from(responseSettings).where(eq(responseSettings.userId, userId));
          return settings;
        } catch (error) {
          console.error("Error getting response settings:", error);
          return [];
        }
      }
      async createResponseSettings(data) {
        try {
          const [setting] = await db.insert(responseSettings).values(data).returning();
          return setting;
        } catch (error) {
          console.error("Error creating response settings:", error);
          throw error;
        }
      }
      async updateResponseSettings(settingId, userId, updates) {
        try {
          await db.update(responseSettings).set({
            ...updates,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(
            and(
              eq(responseSettings.id, settingId),
              eq(responseSettings.userId, userId)
            )
          );
        } catch (error) {
          console.error("Error updating response settings:", error);
          throw error;
        }
      }
    };
    storage = new PostgresStorage();
  }
});

// server/services/gmail-app-password.ts
import nodemailer from "nodemailer";
import { google } from "googleapis";
var GmailAppPasswordService, gmailAppPasswordService;
var init_gmail_app_password = __esm({
  "server/services/gmail-app-password.ts"() {
    "use strict";
    init_storage();
    GmailAppPasswordService = class {
      accounts = /* @__PURE__ */ new Map();
      initialized = false;
      async initialize() {
        if (this.initialized) return;
        const googleAccounts3 = await storage.getGoogleAccounts();
        for (const account of googleAccounts3) {
          if (account.accessToken === "APP_PASSWORD_TOKEN" && account.refreshToken) {
            this.accounts.set(account.email, {
              email: account.email,
              appPassword: account.refreshToken,
              name: account.name
            });
          }
        }
        this.initialized = true;
        console.log(`Loaded ${this.accounts.size} Gmail app password accounts from database`);
      }
      async addAccount(email, appPassword, name) {
        await this.initialize();
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: email,
              pass: appPassword
            }
          });
          await transporter.verify();
          const auth = new google.auth.GoogleAuth({
            scopes: [
              "https://www.googleapis.com/auth/calendar",
              "https://www.googleapis.com/auth/spreadsheets"
            ],
            credentials: {
              type: "authorized_user",
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: appPassword
              // We'll use app password as a pseudo-refresh token
            }
          });
          const accountData = {
            email,
            appPassword,
            name: name || email.split("@")[0]
          };
          this.accounts.set(email, accountData);
          const googleAccount = await storage.createGoogleAccount({
            email,
            name: accountData.name,
            accessToken: "APP_PASSWORD_TOKEN",
            refreshToken: appPassword,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3),
            // 1 year from now
            isActive: true
          });
          console.log(`Gmail app password account added: ${email}`);
          return googleAccount;
        } catch (error) {
          console.error("Failed to add Gmail app password account:", error);
          throw new Error(`Failed to authenticate with Gmail using app password: ${error.message}`);
        }
      }
      async createCalendarEvent(account, eventDetails) {
        try {
          const accountData = this.accounts.get(account.email);
          if (!accountData) {
            throw new Error("Account not found in app password service");
          }
          const eventId = `app_password_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await this.sendCalendarInviteEmail(accountData, eventDetails, eventId);
          return eventId;
        } catch (error) {
          console.error("Failed to create calendar event:", error);
          throw new Error(`Failed to create calendar event: ${error.message}`);
        }
      }
      async sendCalendarInviteEmail(accountData, eventDetails, eventId) {
        const startTime = new Date(eventDetails.startTime);
        const endTime = new Date(eventDetails.endTime);
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
          <p><strong>Duration:</strong> ${Math.round((endTime.getTime() - startTime.getTime()) / (1e3 * 60))} minutes</p>
        </div>
        
        <p>Please find the calendar invitation attached.</p>
        <p>Looking forward to our meeting!</p>
      </div>
    `;
        const transporter = nodemailer.createTransport({
          service: "gmail",
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
              filename: "meeting.ics",
              content: icsContent,
              contentType: "text/calendar; charset=utf-8; method=REQUEST"
            }
          ]
        });
        console.log(`Calendar invitation sent via email to ${eventDetails.attendeeEmail}`);
      }
      generateICSContent(eventDetails, eventId, startTime, endTime) {
        const formatDate = (date) => {
          return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
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
DESCRIPTION:${eventDetails.description.replace(/\n/g, "\\n")}
ORGANIZER:mailto:${eventDetails.organizerEmail || "noreply@shady5.app"}
ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${eventDetails.attendeeEmail}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
      }
      async getAccessTokenForAccount(email) {
        return `app_password_token_${Buffer.from(email).toString("base64")}`;
      }
      async sendEmail(fromEmail, toEmail, subject, body) {
        try {
          const accountData = this.accounts.get(fromEmail);
          if (!accountData) {
            throw new Error("Account not found");
          }
          const transporter = nodemailer.createTransport({
            service: "gmail",
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
          console.error("Failed to send email:", error);
          throw error;
        }
      }
      async getAccount(email) {
        await this.initialize();
        return this.accounts.get(email);
      }
      async getAllAccounts() {
        await this.initialize();
        return Array.from(this.accounts.values());
      }
      removeAccount(email) {
        return this.accounts.delete(email);
      }
    };
    gmailAppPasswordService = new GmailAppPasswordService();
  }
});

// server/services/google-auth.ts
import { google as google2 } from "googleapis";
var CLIENT_ID, CLIENT_SECRET, getRedirectUri, REDIRECT_URI, SCOPES, GoogleAuthService, googleAuthService;
var init_google_auth = __esm({
  "server/services/google-auth.ts"() {
    "use strict";
    init_storage();
    CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "571943054804-92fbh828cm03laha4j5o44bk887ubm0s.apps.googleusercontent.com";
    CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
    getRedirectUri = () => {
      if (process.env.GOOGLE_REDIRECT_URI) {
        return process.env.GOOGLE_REDIRECT_URI;
      }
      if (process.env.REPLIT_DOMAINS?.includes("invite.deploy2030.com")) {
        return "https://invite.deploy2030.com/api/auth/google/callback";
      }
      return `https://${process.env.REPL_SLUG || "6a2391b4-c08c-4318-89e8-f4587ae39044-00-3u78hq3a9p26b"}.${process.env.REPL_OWNER || "worf"}.replit.dev/api/auth/google/callback`;
    };
    REDIRECT_URI = getRedirectUri();
    SCOPES = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ];
    GoogleAuthService = class {
      oauth2Client = new google2.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
      constructor() {
        console.log("Google OAuth Configuration:", {
          clientId: CLIENT_ID ? "SET" : "MISSING",
          clientSecret: CLIENT_SECRET ? "SET" : "MISSING",
          redirectUri: REDIRECT_URI
        });
      }
      getAuthUrl() {
        console.log("OAuth Client Configuration:", {
          clientId: CLIENT_ID ? "SET" : "MISSING",
          clientSecret: CLIENT_SECRET ? "SET" : "MISSING",
          redirectUri: REDIRECT_URI
        });
        if (!CLIENT_ID || !CLIENT_SECRET) {
          throw new Error("Google OAuth credentials not configured properly");
        }
        return this.oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: SCOPES,
          prompt: "consent"
        });
      }
      async exchangeCodeForTokens(code) {
        console.log("Attempting token exchange with:", {
          clientId: CLIENT_ID,
          redirectUri: REDIRECT_URI,
          code: code.substring(0, 20) + "..."
        });
        try {
          const tokenResponse = await this.oauth2Client.getToken(code);
          const tokens = tokenResponse.tokens;
          if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error("Failed to get tokens from Google");
          }
          this.oauth2Client.setCredentials(tokens);
          const oauth2 = google2.oauth2({ version: "v2", auth: this.oauth2Client });
          const { data: userInfo } = await oauth2.userinfo.get();
          if (!userInfo.email || !userInfo.name) {
            throw new Error("Failed to get user info from Google");
          }
          const expiresAt = new Date(Date.now() + ((tokens.expiry_date || Date.now() + 36e5) - Date.now()));
          return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt,
            userInfo: {
              email: userInfo.email,
              name: userInfo.name
            }
          };
        } catch (error) {
          console.error("OAuth token exchange failed:", error);
          throw error;
        }
      }
      async refreshAccessToken(account) {
        this.oauth2Client.setCredentials({
          refresh_token: account.refreshToken
        });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        if (!credentials.access_token) {
          throw new Error("Failed to refresh access token");
        }
        const expiresAt = new Date(credentials.expiry_date || Date.now() + 36e5);
        return {
          accessToken: credentials.access_token,
          expiresAt
        };
      }
      async getValidAccessToken(account) {
        if (account.expiresAt > /* @__PURE__ */ new Date()) {
          return account.accessToken;
        }
        const { accessToken, expiresAt } = await this.refreshAccessToken(account);
        await storage.updateGoogleAccount(account.id, {
          accessToken,
          expiresAt
        });
        return accessToken;
      }
      createAuthClient(accessToken) {
        const client = new google2.auth.OAuth2();
        client.setCredentials({ access_token: accessToken });
        return client;
      }
      /**
       * Test calendar access for connection monitoring
       */
      async testCalendarAccess(accessToken) {
        try {
          const auth = new google2.auth.OAuth2();
          auth.setCredentials({ access_token: accessToken });
          const calendar = google2.calendar({ version: "v3", auth });
          await calendar.calendarList.list({ maxResults: 1 });
          return true;
        } catch (error) {
          console.error("Calendar access test failed:", error);
          return false;
        }
      }
    };
    googleAuthService = new GoogleAuthService();
  }
});

// server/services/microsoft-auth.ts
var microsoft_auth_exports = {};
__export(microsoft_auth_exports, {
  MicrosoftAuthService: () => MicrosoftAuthService,
  microsoftAuthService: () => microsoftAuthService
});
import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
var MicrosoftAuthService, microsoftAuthService;
var init_microsoft_auth = __esm({
  "server/services/microsoft-auth.ts"() {
    "use strict";
    MicrosoftAuthService = class {
      msalApp;
      config;
      constructor() {
        this.config = {
          clientId: process.env.MICROSOFT_CLIENT_ID || "",
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
          tenantId: process.env.MICROSOFT_TENANT_ID || "common",
          redirectUri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/api/auth/microsoft/callback`
        };
        this.msalApp = new ConfidentialClientApplication({
          auth: {
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            authority: `https://login.microsoftonline.com/${this.config.tenantId}`
          }
        });
      }
      /**
       * Get authorization URL for OAuth flow
       */
      getAuthUrl(state) {
        const authCodeUrlRequest = {
          scopes: ["openid", "profile", "email", "Calendars.ReadWrite", "Mail.Send", "offline_access"],
          redirectUri: this.config.redirectUri,
          state
        };
        return this.msalApp.getAuthCodeUrl(authCodeUrlRequest);
      }
      /**
       * Exchange authorization code for tokens
       */
      async exchangeCodeForTokens(code, state) {
        const tokenRequest = {
          code,
          scopes: ["openid", "profile", "email", "Calendars.ReadWrite", "Mail.Send", "offline_access"],
          redirectUri: this.config.redirectUri
        };
        return await this.msalApp.acquireTokenByCode(tokenRequest);
      }
      /**
       * Refresh access token using refresh token
       */
      async refreshAccessToken(refreshToken) {
        const refreshTokenRequest = {
          refreshToken,
          scopes: ["Calendars.ReadWrite", "Mail.Send"]
        };
        return await this.msalApp.acquireTokenByRefreshToken(refreshTokenRequest);
      }
      /**
       * Get user profile information
       */
      async getUserProfile(accessToken) {
        const graphClient = Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          }
        });
        return await graphClient.api("/me").get();
      }
      /**
       * Create Microsoft Graph client with access token
       */
      createGraphClient(accessToken) {
        return Client.init({
          authProvider: (done) => {
            done(null, accessToken);
          }
        });
      }
      /**
       * Test calendar access
       */
      async testCalendarAccess(accessToken) {
        try {
          const graphClient = this.createGraphClient(accessToken);
          await graphClient.api("/me/calendars").top(1).get();
          return true;
        } catch (error) {
          console.error("Failed to test calendar access:", error);
          return false;
        }
      }
      /**
       * Create calendar event
       */
      async createCalendarEvent(accessToken, eventData) {
        const graphClient = this.createGraphClient(accessToken);
        const event = {
          subject: eventData.summary || eventData.subject,
          body: {
            contentType: "HTML",
            content: eventData.description || ""
          },
          start: {
            dateTime: eventData.start.dateTime,
            timeZone: eventData.start.timeZone || "UTC"
          },
          end: {
            dateTime: eventData.end.dateTime,
            timeZone: eventData.end.timeZone || "UTC"
          },
          attendees: eventData.attendees?.map((attendee) => ({
            emailAddress: {
              address: attendee.email,
              name: attendee.name || attendee.email
            },
            type: "required"
          })) || [],
          isOnlineMeeting: false,
          showAs: "busy"
        };
        return await graphClient.api("/me/events").post(event);
      }
      /**
       * Send email via Microsoft Graph
       */
      async sendEmail(accessToken, emailData) {
        const graphClient = this.createGraphClient(accessToken);
        const message = {
          subject: emailData.subject,
          body: {
            contentType: "HTML",
            content: emailData.body
          },
          toRecipients: [{
            emailAddress: {
              address: emailData.to,
              name: emailData.toName || emailData.to
            }
          }],
          from: {
            emailAddress: {
              address: emailData.from,
              name: emailData.fromName || emailData.from
            }
          }
        };
        return await graphClient.api("/me/sendMail").post({ message });
      }
      /**
       * Revoke tokens (sign out)
       */
      async revokeTokens(accessToken) {
        try {
          const graphClient = this.createGraphClient(accessToken);
          await graphClient.api("/me/revokeSignInSessions").post({});
        } catch (error) {
          console.error("Failed to revoke Microsoft tokens:", error);
        }
      }
      /**
       * Check if credentials are configured
       */
      isConfigured() {
        return !!(this.config.clientId && this.config.clientSecret);
      }
      /**
       * Format account data for database storage
       */
      formatAccountData(authResult, userProfile, userId) {
        return {
          userId,
          email: userProfile.mail || userProfile.userPrincipalName,
          name: userProfile.displayName || userProfile.mail,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken || "",
          expiresAt: new Date(authResult.expiresOn || Date.now() + 36e5),
          microsoftId: userProfile.id
        };
      }
    };
    microsoftAuthService = new MicrosoftAuthService();
  }
});

// server/services/microsoft-calendar.ts
var microsoft_calendar_exports = {};
__export(microsoft_calendar_exports, {
  MicrosoftCalendarService: () => MicrosoftCalendarService,
  microsoftCalendarService: () => microsoftCalendarService
});
var MicrosoftCalendarService, microsoftCalendarService;
var init_microsoft_calendar = __esm({
  "server/services/microsoft-calendar.ts"() {
    "use strict";
    init_microsoft_auth();
    MicrosoftCalendarService = class {
      /**
       * Create calendar event using Microsoft Graph
       */
      async createCalendarEvent(account, eventData) {
        try {
          const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
          const event = {
            subject: eventData.summary,
            body: {
              contentType: "HTML",
              content: eventData.description
            },
            start: {
              dateTime: eventData.start.dateTime,
              timeZone: eventData.start.timeZone
            },
            end: {
              dateTime: eventData.end.dateTime,
              timeZone: eventData.end.timeZone
            },
            attendees: eventData.attendees.map((attendee) => ({
              emailAddress: {
                address: attendee.email,
                name: attendee.name || attendee.email
              },
              type: "required"
            })),
            isOnlineMeeting: false,
            showAs: "busy"
          };
          const createdEvent = await graphClient.api("/me/events").post(event);
          return {
            id: createdEvent.id,
            htmlLink: createdEvent.webLink || `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventData.summary)}`
          };
        } catch (error) {
          console.error("Failed to create Microsoft calendar event:", error);
          throw new Error(`Failed to create calendar event: ${error.message}`);
        }
      }
      /**
       * Check calendar access for an account
       */
      async testCalendarAccess(account) {
        try {
          const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
          await graphClient.api("/me/calendars").top(1).get();
          return true;
        } catch (error) {
          console.error(`Calendar access test failed for ${account.email}:`, error);
          return false;
        }
      }
      /**
       * Get user's calendars
       */
      async getCalendars(account) {
        try {
          const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
          const response = await graphClient.api("/me/calendars").get();
          return response.value || [];
        } catch (error) {
          console.error(`Failed to get calendars for ${account.email}:`, error);
          return [];
        }
      }
      /**
       * Get event details by ID
       */
      async getEvent(account, eventId) {
        try {
          const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
          return await graphClient.api(`/me/events/${eventId}`).get();
        } catch (error) {
          console.error(`Failed to get event ${eventId}:`, error);
          return null;
        }
      }
      /**
       * Check if event has been responded to
       */
      async checkEventResponse(account, eventId) {
        try {
          const event = await this.getEvent(account, eventId);
          if (!event) {
            return { status: "pending" };
          }
          const attendee = event.attendees?.find(
            (att) => att.emailAddress.address.toLowerCase() === account.email.toLowerCase()
          );
          if (attendee) {
            const responseStatus = attendee.status?.response?.toLowerCase();
            const responseTime = attendee.status?.time ? new Date(attendee.status.time) : void 0;
            switch (responseStatus) {
              case "accepted":
                return { status: "accepted", responseTime };
              case "declined":
                return { status: "declined", responseTime };
              case "tentativelyaccepted":
                return { status: "tentative", responseTime };
              default:
                return { status: "pending" };
            }
          }
          return { status: "pending" };
        } catch (error) {
          console.error(`Failed to check event response for ${eventId}:`, error);
          return { status: "pending" };
        }
      }
      /**
       * Send calendar invite email
       */
      async sendCalendarInvite(account, eventData) {
        try {
          const graphClient = microsoftAuthService.createGraphClient(account.accessToken);
          const message = {
            subject: eventData.subject,
            body: {
              contentType: "HTML",
              content: eventData.htmlBody
            },
            toRecipients: [{
              emailAddress: {
                address: eventData.to,
                name: eventData.toName || eventData.to
              }
            }],
            from: {
              emailAddress: {
                address: account.email,
                name: account.name
              }
            }
          };
          await graphClient.api("/me/sendMail").post({ message });
        } catch (error) {
          console.error("Failed to send calendar invite via Microsoft Graph:", error);
          throw new Error(`Failed to send invite: ${error.message}`);
        }
      }
    };
    microsoftCalendarService = new MicrosoftCalendarService();
  }
});

// server/services/connection-monitor.ts
var connection_monitor_exports = {};
__export(connection_monitor_exports, {
  ConnectionMonitorService: () => ConnectionMonitorService,
  connectionMonitorService: () => connectionMonitorService
});
var ConnectionMonitorService, connectionMonitorService;
var init_connection_monitor = __esm({
  "server/services/connection-monitor.ts"() {
    "use strict";
    init_storage();
    init_google_auth();
    ConnectionMonitorService = class {
      checkInterval = 15 * 60 * 1e3;
      // 15 minutes
      intervalId;
      /**
       * Start the connection monitoring service
       */
      startMonitoring() {
        console.log("Starting connection monitor service...");
        this.intervalId = setInterval(() => {
          this.checkAllConnections();
        }, this.checkInterval);
        setTimeout(() => {
          this.checkAllConnections();
        }, 3e4);
      }
      /**
       * Stop the connection monitoring service
       */
      stopMonitoring() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = void 0;
          console.log("Connection monitor service stopped");
        }
      }
      /**
       * Check all account connections
       */
      async checkAllConnections() {
        try {
          console.log("Running connection health checks...");
          const allUsers = await storage.getAllUsers?.() || [];
          for (const user of allUsers) {
            await this.checkUserConnections(user.id);
          }
        } catch (error) {
          console.error("Error in connection monitoring:", error);
        }
      }
      /**
       * Check connections for a specific user
       */
      async checkUserConnections(userId) {
        try {
          const googleAccounts3 = await storage.getGoogleAccounts(userId);
          for (const account of googleAccounts3) {
            if (account.isActive && account.status === "active") {
              await this.checkGoogleConnection(account, userId);
            }
          }
          const outlookAccounts3 = await storage.getOutlookAccounts(userId);
          for (const account of outlookAccounts3) {
            if (account.isActive && account.status === "active") {
              await this.checkMicrosoftConnection(account, userId);
            }
          }
        } catch (error) {
          console.error(`Error checking connections for user ${userId}:`, error);
        }
      }
      /**
       * Check a single Google account connection
       */
      async checkGoogleConnection(account, userId) {
        try {
          const isHealthy = await googleAuthService.testCalendarAccess(account.accessToken);
          await storage.updateGoogleAccount(account.id, {
            lastConnectionCheck: /* @__PURE__ */ new Date(),
            ...isHealthy ? {
              status: "active",
              connectionError: null
            } : {
              status: "disconnected",
              connectionError: "Calendar API access failed",
              disconnectedAt: /* @__PURE__ */ new Date()
            }
          }, userId);
          if (!isHealthy) {
            await this.handleDisconnection(account, "google", userId, "Calendar API access failed");
          }
          return isHealthy;
        } catch (error) {
          console.error(`Google connection check failed for ${account.email}:`, error);
          await storage.updateGoogleAccount(account.id, {
            status: "disconnected",
            lastConnectionCheck: /* @__PURE__ */ new Date(),
            connectionError: error.message || "Connection test failed",
            disconnectedAt: /* @__PURE__ */ new Date()
          }, userId);
          await this.handleDisconnection(account, "google", userId, error.message || "Connection test failed");
          return false;
        }
      }
      /**
       * Check a single Microsoft account connection
       */
      async checkMicrosoftConnection(account, userId) {
        try {
          const { microsoftCalendarService: microsoftCalendarService2 } = await Promise.resolve().then(() => (init_microsoft_calendar(), microsoft_calendar_exports));
          const isHealthy = await microsoftCalendarService2.testCalendarAccess(account);
          await storage.updateOutlookAccount(account.id, {
            lastConnectionCheck: /* @__PURE__ */ new Date(),
            ...isHealthy ? {
              status: "active",
              connectionError: null
            } : {
              status: "disconnected",
              connectionError: "Calendar API access failed",
              disconnectedAt: /* @__PURE__ */ new Date()
            }
          }, userId);
          if (!isHealthy) {
            await this.handleDisconnection(account, "microsoft", userId, "Calendar API access failed");
          }
          return isHealthy;
        } catch (error) {
          console.error(`Microsoft connection check failed for ${account.email}:`, error);
          await storage.updateOutlookAccount(account.id, {
            status: "disconnected",
            lastConnectionCheck: /* @__PURE__ */ new Date(),
            connectionError: error.message || "Connection test failed",
            disconnectedAt: /* @__PURE__ */ new Date()
          }, userId);
          await this.handleDisconnection(account, "microsoft", userId, error.message || "Connection test failed");
          return false;
        }
      }
      /**
       * Handle account disconnection
       */
      async handleDisconnection(account, provider, userId, errorReason) {
        try {
          const campaigns4 = await storage.getCampaignsUsingInbox(account.id, userId);
          for (const campaign of campaigns4) {
            if (campaign.status === "active") {
              await storage.updateCampaign(campaign.id, {
                status: "paused"
              }, userId);
              await storage.createActivityLog({
                type: "campaign_paused",
                campaignId: campaign.id,
                userId,
                message: `Campaign "${campaign.name}" paused due to ${provider} inbox disconnection: ${account.email}`,
                metadata: {
                  reason: "inbox_disconnected",
                  provider,
                  inboxEmail: account.email,
                  errorReason,
                  pausedAt: (/* @__PURE__ */ new Date()).toISOString()
                }
              });
            }
          }
          const queueItems = await storage.getQueueItems("pending");
          const itemsToCancel = queueItems.filter((item) => {
            const prospectData = item.prospectData;
            return provider === "google" ? prospectData.assignedInboxId === account.id : prospectData.assignedOutlookInboxId === account.id;
          });
          for (const item of itemsToCancel) {
            await storage.updateQueueItem(item.id, {
              status: "cancelled",
              errorMessage: `Inbox disconnected: ${errorReason}`
            });
          }
          await storage.createActivityLog({
            type: "account_disconnected",
            ...provider === "google" ? { googleAccountId: account.id } : { outlookAccountId: account.id },
            userId,
            message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account ${account.email} disconnected`,
            metadata: {
              provider,
              email: account.email,
              errorReason,
              campaignsPaused: campaigns4.length,
              queueItemsCancelled: itemsToCancel.length,
              disconnectedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          console.log(`${provider} account ${account.email} disconnected. Paused ${campaigns4.length} campaigns and cancelled ${itemsToCancel.length} queue items.`);
        } catch (error) {
          console.error("Error handling disconnection:", error);
        }
      }
      /**
       * Test connection for a specific account
       */
      async testAccountConnection(accountId, provider, userId) {
        try {
          if (provider === "google") {
            const account = await storage.getGoogleAccount(accountId, userId);
            if (!account) {
              return { isHealthy: false, error: "Account not found" };
            }
            const isHealthy = await this.checkGoogleConnection(account, userId);
            return { isHealthy };
          } else {
            const account = await storage.getOutlookAccount(accountId, userId);
            if (!account) {
              return { isHealthy: false, error: "Account not found" };
            }
            const isHealthy = await this.checkMicrosoftConnection(account, userId);
            return { isHealthy };
          }
        } catch (error) {
          return { isHealthy: false, error: error.message };
        }
      }
      /**
       * Get reconnection URL for an account
       */
      async getReconnectionUrl(accountId, provider, userId) {
        if (provider === "google") {
          return googleAuthService.getAuthUrl();
        } else {
          const { microsoftAuthService: microsoftAuthService2 } = await Promise.resolve().then(() => (init_microsoft_auth(), microsoft_auth_exports));
          return microsoftAuthService2.getAuthUrl();
        }
      }
    };
    connectionMonitorService = new ConnectionMonitorService();
  }
});

// server/services/google-service-auth.ts
import { google as google3 } from "googleapis";
var GoogleServiceAuthService, googleServiceAuthService;
var init_google_service_auth = __esm({
  "server/services/google-service-auth.ts"() {
    "use strict";
    init_storage();
    GoogleServiceAuthService = class {
      auth;
      credentials = null;
      constructor() {
        this.initializeServiceAccount();
      }
      async initializeServiceAccount() {
        try {
          console.log("Service account authentication disabled - using OAuth only");
          return;
          const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
          const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
          const projectId = process.env.GOOGLE_PROJECT_ID;
          if (serviceAccountEmail && privateKey && projectId) {
            await this.configureServiceAccount({
              email: serviceAccountEmail,
              privateKey,
              projectId
            });
            try {
              const existingAccount = await storage.getGoogleAccountByEmail(serviceAccountEmail);
              if (!existingAccount) {
                await this.createServiceAccountConnection(serviceAccountEmail, {
                  email: serviceAccountEmail,
                  privateKey,
                  projectId
                });
              }
            } catch (error) {
              await this.createServiceAccountConnection(serviceAccountEmail, {
                email: serviceAccountEmail,
                privateKey,
                projectId
              });
            }
            console.log("Google Service Account initialized from environment variables");
            return;
          }
          try {
            const settings = await storage.getSystemSettings();
            const storedCredentials = settings.serviceAccountCredentials;
            if (storedCredentials && storedCredentials.email && storedCredentials.privateKey) {
              await this.configureServiceAccount(storedCredentials);
              console.log("Google Service Account initialized from stored settings");
              return;
            }
          } catch (error) {
          }
          console.log("Service account credentials not configured, falling back to OAuth");
        } catch (error) {
          console.error("Failed to initialize Google Service Account:", error);
        }
      }
      async configureServiceAccount(credentials) {
        try {
          this.credentials = credentials;
          this.auth = new google3.auth.GoogleAuth({
            credentials: {
              type: "service_account",
              project_id: credentials.projectId,
              private_key: credentials.privateKey,
              client_email: credentials.email
            },
            scopes: [
              "https://www.googleapis.com/auth/calendar",
              "https://www.googleapis.com/auth/spreadsheets",
              "https://www.googleapis.com/auth/drive"
            ]
          });
          const currentSettings = await storage.getSystemSettings();
          await storage.updateSystemSettings({
            ...currentSettings,
            serviceAccountCredentials: credentials
          });
          console.log("Google Service Account configured successfully");
        } catch (error) {
          console.error("Failed to configure Google Service Account:", error);
          throw error;
        }
      }
      async createServiceAccountConnection(email, credentials) {
        if (credentials) {
          await this.configureServiceAccount(credentials);
        }
        if (!this.auth) {
          throw new Error("Service account not configured");
        }
        try {
          const calendar = google3.calendar({ version: "v3", auth: this.auth });
          await calendar.calendarList.list({ maxResults: 1 });
          const serviceAccount = await storage.createGoogleAccount({
            email,
            name: `Service Account (${email})`,
            accessToken: "SERVICE_ACCOUNT_TOKEN",
            // Placeholder since we use the auth object
            refreshToken: "SERVICE_ACCOUNT_REFRESH",
            // Placeholder
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3),
            // 1 year from now
            isActive: true
          });
          return serviceAccount;
        } catch (error) {
          console.error("Service account connection failed:", error);
          throw new Error("Failed to connect service account");
        }
      }
      getServiceAccountAuth() {
        return this.auth;
      }
      // Create impersonated auth client for a specific user
      getImpersonatedAuth(userEmail) {
        if (!this.auth || !this.credentials) {
          throw new Error("Service account not configured");
        }
        return new google3.auth.JWT({
          email: this.credentials.email,
          key: this.credentials.privateKey,
          scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
          ],
          subject: userEmail
          // This impersonates the user
        });
      }
      isServiceAccountConfigured() {
        return !!this.auth;
      }
      async testServiceAccountAccess() {
        if (!this.auth) {
          return { calendar: false, sheets: false, error: "Service account not configured" };
        }
        const results = { calendar: false, sheets: false, error: void 0 };
        try {
          const calendar = google3.calendar({ version: "v3", auth: this.auth });
          await calendar.calendarList.list({ maxResults: 1 });
          results.calendar = true;
        } catch (error) {
          console.error("Calendar API test failed:", error);
        }
        try {
          const sheets = google3.sheets({ version: "v4", auth: this.auth });
          results.sheets = true;
        } catch (error) {
          console.error("Sheets API test failed:", error);
        }
        return results;
      }
    };
    googleServiceAuthService = new GoogleServiceAuthService();
  }
});

// server/services/outlook-auth.ts
var CLIENT_ID2, CLIENT_SECRET2, REDIRECT_URI2, TENANT_ID, OutlookAuthService, outlookAuthService;
var init_outlook_auth = __esm({
  "server/services/outlook-auth.ts"() {
    "use strict";
    CLIENT_ID2 = process.env.OUTLOOK_CLIENT_ID || process.env.AZURE_CLIENT_ID || "";
    CLIENT_SECRET2 = process.env.OUTLOOK_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET || "";
    REDIRECT_URI2 = process.env.OUTLOOK_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/api/auth/outlook/callback`;
    TENANT_ID = process.env.AZURE_TENANT_ID || "common";
    OutlookAuthService = class {
      authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;
      tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
      scopes = [
        "https://graph.microsoft.com/User.Read",
        "https://graph.microsoft.com/Calendars.ReadWrite",
        "https://graph.microsoft.com/Mail.Send",
        "offline_access"
      ].join(" ");
      getAuthUrl() {
        const params = new URLSearchParams({
          client_id: CLIENT_ID2,
          response_type: "code",
          redirect_uri: REDIRECT_URI2,
          scope: this.scopes,
          response_mode: "query",
          state: "outlook_auth"
        });
        return `${this.authUrl}?${params.toString()}`;
      }
      async exchangeCodeForTokens(code) {
        try {
          const tokenResponse = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID2,
              client_secret: CLIENT_SECRET2,
              code,
              redirect_uri: REDIRECT_URI2,
              grant_type: "authorization_code"
            })
          });
          if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${error}`);
          }
          const tokenData = await tokenResponse.json();
          const expiresAt = new Date(Date.now() + tokenData.expires_in * 1e3);
          const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          });
          if (!userResponse.ok) {
            throw new Error("Failed to get user info");
          }
          const userData = await userResponse.json();
          return {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
            userInfo: {
              email: userData.mail || userData.userPrincipalName,
              name: userData.displayName,
              id: userData.id
            }
          };
        } catch (error) {
          console.error("Outlook auth error:", error);
          throw error;
        }
      }
      async refreshAccessToken(refreshToken) {
        try {
          const response = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID2,
              client_secret: CLIENT_SECRET2,
              refresh_token: refreshToken,
              grant_type: "refresh_token"
            })
          });
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token refresh failed: ${error}`);
          }
          const data = await response.json();
          const expiresAt = new Date(Date.now() + data.expires_in * 1e3);
          return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,
            // Sometimes refresh token is not returned
            expiresAt
          };
        } catch (error) {
          console.error("Outlook token refresh error:", error);
          throw error;
        }
      }
      async getValidAccessToken(account) {
        const now = /* @__PURE__ */ new Date();
        const expiryBuffer = new Date(account.expiresAt.getTime() - 5 * 60 * 1e3);
        if (now < expiryBuffer) {
          return account.accessToken;
        }
        const { accessToken } = await this.refreshAccessToken(account.refreshToken);
        return accessToken;
      }
      createGraphClient(accessToken) {
        return {
          async get(endpoint) {
            const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              }
            });
            if (!response.ok) {
              throw new Error(`Graph API error: ${response.statusText}`);
            }
            return response.json();
          },
          async post(endpoint, data) {
            const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(data)
            });
            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Graph API error: ${error}`);
            }
            return response.json();
          },
          async patch(endpoint, data) {
            const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(data)
            });
            if (!response.ok) {
              const error = await response.text();
              throw new Error(`Graph API error: ${error}`);
            }
            return response.json();
          }
        };
      }
    };
    outlookAuthService = new OutlookAuthService();
  }
});

// server/services/oauth-calendar.ts
import { google as google4 } from "googleapis";
var OAuthCalendarService, oauthCalendarService;
var init_oauth_calendar = __esm({
  "server/services/oauth-calendar.ts"() {
    "use strict";
    init_google_auth();
    init_storage();
    OAuthCalendarService = class {
      /**
       * Create calendar event using OAuth-authenticated Google account
       */
      async createEventWithOAuth(account, eventDetails) {
        const accessToken = await googleAuthService.getValidAccessToken(account);
        const auth = googleAuthService.createAuthClient(accessToken);
        const calendar = google4.calendar({ version: "v3", auth });
        const event = {
          summary: eventDetails.subjectLine || eventDetails.title,
          description: eventDetails.description,
          start: {
            dateTime: eventDetails.startTime.toISOString(),
            timeZone: eventDetails.timeZone
          },
          end: {
            dateTime: eventDetails.endTime.toISOString(),
            timeZone: eventDetails.timeZone
          },
          attendees: [
            { email: eventDetails.attendeeEmail },
            ...eventDetails.sdrEmail ? [{ email: eventDetails.sdrEmail }] : []
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 10 },
              { method: "popup", minutes: 10 }
            ]
          },
          guestsCanInviteOthers: false,
          guestsCanModify: false,
          guestsCanSeeOtherGuests: false
        };
        try {
          console.log(`Creating OAuth calendar event for ${eventDetails.attendeeEmail} using account ${account.email}`);
          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
            sendNotifications: true
          });
          if (!response.data.id) {
            throw new Error("Failed to create calendar event");
          }
          await storage.updateGoogleAccount(account.id, {
            lastUsed: /* @__PURE__ */ new Date()
          });
          console.log(`\u2705 OAuth calendar event created successfully: ${response.data.id}`);
          return response.data.id;
        } catch (error) {
          console.error("Failed to create OAuth calendar event:", error.message);
          if (error.message && (error.message.includes("invalid_grant") || error.message.includes("unauthorized"))) {
            await storage.updateGoogleAccount(account.id, {
              isActive: false
            });
            throw new Error(`Calendar access expired for ${account.email}. Please reconnect the account.`);
          }
          throw new Error(`Failed to create calendar event: ${error.message}`);
        }
      }
      /**
       * Get calendar event status using OAuth account
       */
      async getEventStatus(account, eventId) {
        const accessToken = await googleAuthService.getValidAccessToken(account);
        const auth = googleAuthService.createAuthClient(accessToken);
        const calendar = google4.calendar({ version: "v3", auth });
        try {
          const response = await calendar.events.get({
            calendarId: "primary",
            eventId
          });
          const event = response.data;
          let attendeeResponse = "needsAction";
          if (event.attendees && event.attendees.length > 0) {
            const attendee = event.attendees.find((a) => a.email !== account.email);
            if (attendee) {
              attendeeResponse = attendee.responseStatus || "needsAction";
            }
          }
          return {
            status: event.status || "unknown",
            attendeeResponse
          };
        } catch (error) {
          console.error("Failed to get OAuth event status:", error.message);
          return {
            status: "error",
            attendeeResponse: "unknown"
          };
        }
      }
      /**
       * Process merge fields in templates
       */
      processMergeFields(template, prospectData) {
        let processed = template;
        Object.keys(prospectData).forEach((key) => {
          const placeholder = `{{${key}}}`;
          const value = prospectData[key] || "";
          processed = processed.replace(new RegExp(placeholder, "g"), String(value));
        });
        return processed;
      }
      /**
       * Test OAuth calendar access for an account
       */
      async testCalendarAccess(account) {
        try {
          const accessToken = await googleAuthService.getValidAccessToken(account);
          const auth = googleAuthService.createAuthClient(accessToken);
          const calendar = google4.calendar({ version: "v3", auth });
          const response = await calendar.calendars.get({
            calendarId: "primary"
          });
          return {
            success: true,
            message: "Calendar access verified",
            calendarName: response.data.summary || account.email
          };
        } catch (error) {
          console.error(`Calendar access test failed for ${account.email}:`, error.message);
          return {
            success: false,
            message: `Calendar access failed: ${error.message}`
          };
        }
      }
    };
    oauthCalendarService = new OAuthCalendarService();
  }
});

// server/services/inbox-load-balancer.ts
var InboxLoadBalancer, inboxLoadBalancer;
var init_inbox_load_balancer = __esm({
  "server/services/inbox-load-balancer.ts"() {
    "use strict";
    init_storage();
    InboxLoadBalancer = class {
      config;
      usageStats = /* @__PURE__ */ new Map();
      errorCounts = /* @__PURE__ */ new Map();
      lastUsageTimes = /* @__PURE__ */ new Map();
      constructor(config) {
        this.config = {
          dailyQuotaPerInbox: 100,
          // NOTE: Now controlled per campaign - this is fallback for legacy code
          weeklyQuotaPerInbox: 700,
          // 100 * 7 days
          cooldownMinutes: 30,
          // CRITICAL: Minimum 30-minute gap between sends per inbox - 100% ENFORCED
          maxErrorsBeforePause: 3,
          healthThreshold: 70,
          ...config
        };
      }
      /**
       * Get the best available inbox for sending
       */
      async getBestAvailableInbox() {
        const accounts = await storage.getGoogleAccounts();
        const activeAccounts = accounts.filter((acc) => acc.isActive);
        if (activeAccounts.length === 0) {
          return null;
        }
        await this.updateUsageStats(activeAccounts);
        const availableAccounts = activeAccounts.filter((account) => {
          const stats = this.usageStats.get(account.id);
          return stats?.isAvailable && stats.healthScore >= this.config.healthThreshold;
        });
        if (availableAccounts.length === 0) {
          return this.getNextAvailableInbox(activeAccounts);
        }
        availableAccounts.sort((a, b) => {
          const statsA = this.usageStats.get(a.id);
          const statsB = this.usageStats.get(b.id);
          if (statsA.healthScore !== statsB.healthScore) {
            return statsB.healthScore - statsA.healthScore;
          }
          if (statsA.invitesToday !== statsB.invitesToday) {
            return statsA.invitesToday - statsB.invitesToday;
          }
          const lastUsedA = statsA.lastUsed?.getTime() || 0;
          const lastUsedB = statsB.lastUsed?.getTime() || 0;
          return lastUsedA - lastUsedB;
        });
        return availableAccounts[0];
      }
      /**
       * Record usage for an inbox
       */
      async recordUsage(accountId, success = true) {
        const now = /* @__PURE__ */ new Date();
        this.lastUsageTimes.set(accountId, now);
        if (success) {
          this.errorCounts.set(accountId, 0);
          await storage.updateGoogleAccount(accountId, { lastUsed: now });
          await storage.createActivityLog({
            type: "inbox_usage",
            message: `Invite sent successfully from inbox ${accountId}`,
            googleAccountId: accountId
          });
        } else {
          const currentErrors = this.errorCounts.get(accountId) || 0;
          this.errorCounts.set(accountId, currentErrors + 1);
          await storage.createActivityLog({
            type: "inbox_error",
            message: `Error sending invite from inbox ${accountId}`,
            googleAccountId: accountId
          });
          if (currentErrors + 1 >= this.config.maxErrorsBeforePause) {
            await this.pauseInbox(accountId, `Too many consecutive errors (${currentErrors + 1})`);
          }
        }
        const accounts = await storage.getGoogleAccounts();
        await this.updateUsageStats(accounts);
      }
      /**
       * Update usage statistics for all accounts
       */
      async updateUsageStats(accounts) {
        const now = /* @__PURE__ */ new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1e3);
        for (const account of accounts) {
          const allInvites = await storage.getInvites();
          const accountInvites = allInvites.filter((invite) => invite.googleAccountId === account.id);
          const invitesToday = accountInvites.filter(
            (invite) => invite.createdAt >= todayStart
          ).length;
          const invitesThisWeek = accountInvites.filter(
            (invite) => invite.createdAt >= weekStart
          ).length;
          const recentInvites = accountInvites.filter(
            (invite) => invite.createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3)
          );
          const successfulInvites = recentInvites.filter(
            (invite) => invite.status === "sent" || invite.status === "accepted"
          );
          const successRate = recentInvites.length > 0 ? successfulInvites.length / recentInvites.length * 100 : 100;
          const lastUsed = this.lastUsageTimes.get(account.id) || account.lastUsed;
          const cooldownUntil = lastUsed ? new Date(lastUsed.getTime() + this.config.cooldownMinutes * 60 * 1e3) : null;
          const isInCooldown = cooldownUntil ? now < cooldownUntil : false;
          const dailyQuotaExceeded = invitesToday >= this.config.dailyQuotaPerInbox;
          const weeklyQuotaExceeded = invitesThisWeek >= this.config.weeklyQuotaPerInbox;
          const errorCount = this.errorCounts.get(account.id) || 0;
          const tooManyErrors = errorCount >= this.config.maxErrorsBeforePause;
          const healthScore = this.calculateHealthScore({
            successRate,
            dailyUsageRatio: invitesToday / this.config.dailyQuotaPerInbox,
            weeklyUsageRatio: invitesThisWeek / this.config.weeklyQuotaPerInbox,
            errorCount,
            isActive: account.isActive
          });
          const isAvailable = account.isActive && !isInCooldown && !dailyQuotaExceeded && !weeklyQuotaExceeded && !tooManyErrors;
          const stats = {
            accountId: account.id,
            accountEmail: account.email,
            invitesToday,
            invitesThisWeek,
            lastUsed,
            healthScore,
            isAvailable,
            cooldownUntil: isInCooldown ? cooldownUntil : null,
            errorCount,
            successRate
          };
          this.usageStats.set(account.id, stats);
        }
      }
      /**
       * Calculate health score for an inbox
       */
      calculateHealthScore(factors) {
        if (!factors.isActive) return 0;
        let score = 100;
        score = Math.min(score, factors.successRate * 0.4 + 60);
        const avgUsageRatio = (factors.dailyUsageRatio + factors.weeklyUsageRatio) / 2;
        score -= avgUsageRatio * 30;
        score -= factors.errorCount * 10;
        return Math.max(0, Math.min(100, score));
      }
      /**
       * Get the next available inbox (when none are currently available)
       */
      getNextAvailableInbox(accounts) {
        let nextAvailable = null;
        for (const account of accounts) {
          const stats = this.usageStats.get(account.id);
          if (!stats || !account.isActive) continue;
          let availableAt = /* @__PURE__ */ new Date();
          if (stats.cooldownUntil && stats.cooldownUntil > availableAt) {
            availableAt = stats.cooldownUntil;
          }
          if (stats.invitesToday >= this.config.dailyQuotaPerInbox) {
            const tomorrow = /* @__PURE__ */ new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            if (tomorrow > availableAt) {
              availableAt = tomorrow;
            }
          }
          if (!nextAvailable || availableAt < nextAvailable.availableAt) {
            nextAvailable = { account, availableAt };
          }
        }
        return nextAvailable?.account || null;
      }
      /**
       * Pause an inbox temporarily
       */
      async pauseInbox(accountId, reason) {
        await storage.updateGoogleAccount(accountId, { isActive: false });
        await storage.createActivityLog({
          type: "inbox_paused",
          message: `Inbox ${accountId} paused: ${reason}`,
          googleAccountId: accountId
        });
      }
      /**
       * Resume a paused inbox
       */
      async resumeInbox(accountId) {
        await storage.updateGoogleAccount(accountId, { isActive: true });
        this.errorCounts.set(accountId, 0);
        await storage.createActivityLog({
          type: "inbox_resumed",
          message: `Inbox ${accountId} resumed`,
          googleAccountId: accountId
        });
      }
      /**
       * Get usage statistics for all inboxes
       */
      async getAllUsageStats() {
        const accounts = await storage.getGoogleAccounts();
        await this.updateUsageStats(accounts);
        return Array.from(this.usageStats.values());
      }
      /**
       * Get usage statistics for a specific inbox
       */
      async getInboxStats(accountId) {
        const accounts = await storage.getGoogleAccounts();
        await this.updateUsageStats(accounts);
        return this.usageStats.get(accountId) || null;
      }
      /**
       * Reset daily usage counters (call this daily)
       */
      async resetDailyCounters() {
        const accounts = await storage.getGoogleAccounts();
        for (const account of accounts) {
          if (!account.isActive) {
            const stats = this.usageStats.get(account.id);
            if (stats && stats.errorCount < this.config.maxErrorsBeforePause) {
              await this.resumeInbox(account.id);
            }
          }
        }
        await storage.createActivityLog({
          type: "system",
          message: "Daily usage counters reset"
        });
      }
      /**
       * Get load balancing configuration
       */
      getConfig() {
        return { ...this.config };
      }
      /**
       * Update load balancing configuration
       */
      updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
      }
    };
    inboxLoadBalancer = new InboxLoadBalancer();
  }
});

// server/services/time-slot-manager.ts
var time_slot_manager_exports = {};
__export(time_slot_manager_exports, {
  TimeSlotManager: () => TimeSlotManager,
  timeSlotManager: () => timeSlotManager
});
var TimeSlotManager, timeSlotManager;
var init_time_slot_manager = __esm({
  "server/services/time-slot-manager.ts"() {
    "use strict";
    init_storage();
    TimeSlotManager = class {
      bookedSlots = /* @__PURE__ */ new Map();
      // account -> set of datetime strings
      globalBookedSlots = /* @__PURE__ */ new Set();
      // All slots across all accounts/campaigns
      /**
       * Generate an optimal time slot for a prospect based on their preferences
       */
      async generateTimeSlot(prospect, campaign, accountEmail, baseDate) {
        const preferences = this.parseProspectPreferences(prospect, campaign);
        const targetDate = baseDate || /* @__PURE__ */ new Date();
        await this.refreshGlobalBookedSlots();
        let scheduleDate = new Date(targetDate);
        scheduleDate = this.findNextBusinessDay(scheduleDate, preferences);
        const timeSlot = this.generateRandomTimeSlot(scheduleDate, preferences);
        const finalSlot = this.ensureNoDoubleBookingGlobally(timeSlot, accountEmail, preferences);
        await this.markSlotAsBooked(accountEmail, finalSlot);
        return finalSlot;
      }
      /**
       * Parse prospect preferences from data or use campaign defaults
       */
      parseProspectPreferences(prospect, campaign) {
        let preferences = {
          startHour: 12,
          endHour: 16,
          timezone: campaign.timeZone || "UTC",
          daysOfWeek: [1, 2, 3, 4, 5]
          // Mon-Fri
        };
        if (prospect.timezone) {
          preferences.timezone = prospect.timezone;
        }
        if (prospect.preferredHours) {
          const hours = this.parseTimeRange(prospect.preferredHours);
          if (hours) {
            preferences.startHour = hours.start;
            preferences.endHour = hours.end;
          }
        }
        if (prospect.preferredDays) {
          const days = this.parseDaysOfWeek(prospect.preferredDays);
          if (days.length > 0) {
            preferences.daysOfWeek = days;
          }
        }
        return preferences;
      }
      /**
       * Parse time range from string like "9-17" or "9AM-5PM"
       */
      parseTimeRange(timeRange) {
        const patterns = [
          /(\d{1,2})-(\d{1,2})/,
          // "9-17"
          /(\d{1,2})AM-(\d{1,2})PM/,
          // "9AM-5PM"
          /(\d{1,2}):00-(\d{1,2}):00/
          // "09:00-17:00"
        ];
        for (const pattern of patterns) {
          const match = timeRange.match(pattern);
          if (match) {
            return {
              start: parseInt(match[1]),
              end: parseInt(match[2])
            };
          }
        }
        return null;
      }
      /**
       * Parse days of week from string like "Mon-Fri" or "1,2,3,4,5"
       */
      parseDaysOfWeek(daysStr) {
        if (daysStr.includes(",")) {
          return daysStr.split(",").map((d) => parseInt(d.trim())).filter((d) => d >= 0 && d <= 6);
        }
        if (daysStr.toLowerCase().includes("mon-fri")) {
          return [1, 2, 3, 4, 5];
        }
        if (daysStr.toLowerCase().includes("weekdays")) {
          return [1, 2, 3, 4, 5];
        }
        return [1, 2, 3, 4, 5];
      }
      /**
       * Find the next available time slot with minimum 2-day gap enforcement
       */
      findNextBusinessDay(startDate, preferences) {
        const now = /* @__PURE__ */ new Date();
        const minimumDate = new Date(now);
        minimumDate.setDate(minimumDate.getDate() + 2);
        let date = new Date(Math.max(startDate.getTime(), minimumDate.getTime()));
        let attempts = 0;
        while (attempts < 14) {
          const dayOfWeek = date.getDay();
          if (preferences.daysOfWeek.includes(dayOfWeek)) {
            if (!preferences.excludeDates?.some(
              (excluded) => excluded.toDateString() === date.toDateString()
            )) {
              return date;
            }
          }
          date.setDate(date.getDate() + 1);
          attempts++;
        }
        return minimumDate;
      }
      /**
       * Generate a random time slot within preferred hours
       */
      generateRandomTimeSlot(date, preferences) {
        const slot = new Date(date);
        const hourRange = preferences.endHour - preferences.startHour;
        const randomHour = preferences.startHour + Math.floor(Math.random() * hourRange);
        const possibleMinutes = [0, 15, 30, 45];
        const randomMinute = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
        slot.setHours(randomHour, randomMinute, 0, 0);
        return slot;
      }
      /**
       * Ensure no double booking by checking against already booked slots (globally and per account)
       */
      ensureNoDoubleBookingGlobally(proposedSlot, accountEmail, preferences) {
        const slotKey = this.getSlotKey(proposedSlot);
        const bookedSlotsForAccount = this.bookedSlots.get(accountEmail) || /* @__PURE__ */ new Set();
        if (!bookedSlotsForAccount.has(slotKey) && !this.globalBookedSlots.has(slotKey)) {
          return proposedSlot;
        }
        let attempts = 0;
        let alternativeSlot = new Date(proposedSlot);
        while (attempts < 50) {
          alternativeSlot.setMinutes(alternativeSlot.getMinutes() + 15);
          if (alternativeSlot.getHours() >= preferences.endHour) {
            alternativeSlot = this.findNextBusinessDay(
              new Date(alternativeSlot.getTime() + 24 * 60 * 60 * 1e3),
              preferences
            );
            alternativeSlot = this.generateRandomTimeSlot(alternativeSlot, preferences);
          }
          const altSlotKey = this.getSlotKey(alternativeSlot);
          const altBookedForAccount = this.bookedSlots.get(accountEmail) || /* @__PURE__ */ new Set();
          if (!altBookedForAccount.has(altSlotKey) && !this.globalBookedSlots.has(altSlotKey)) {
            return alternativeSlot;
          }
          attempts++;
        }
        console.warn(`Warning: All time slots are saturated. Allowing overlap for slot ${proposedSlot.toISOString()}`);
        return proposedSlot;
      }
      /**
       * Mark a time slot as booked for an account (both locally and globally)
       */
      async markSlotAsBooked(accountEmail, slot) {
        const slotKey = this.getSlotKey(slot);
        if (!this.bookedSlots.has(accountEmail)) {
          this.bookedSlots.set(accountEmail, /* @__PURE__ */ new Set());
        }
        this.bookedSlots.get(accountEmail).add(slotKey);
        this.globalBookedSlots.add(slotKey);
        console.log(`Booked time slot: ${slot.toISOString()} for account ${accountEmail}`);
      }
      /**
       * Refresh global booked slots from database to get latest state
       */
      async refreshGlobalBookedSlots() {
        try {
          const allInvites = await storage.getInvites("");
          const now = /* @__PURE__ */ new Date();
          const cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          this.globalBookedSlots.clear();
          for (const invite of allInvites) {
            if (invite.eventId && invite.createdAt && invite.createdAt > cutoffTime) {
              const estimatedMeetingTime = new Date(invite.createdAt.getTime() + 24 * 60 * 60 * 1e3);
              this.globalBookedSlots.add(this.getSlotKey(estimatedMeetingTime));
            }
          }
          console.log(`Refreshed global booked slots: ${this.globalBookedSlots.size} slots currently booked`);
        } catch (error) {
          console.error("Failed to refresh global booked slots:", error);
        }
      }
      /**
       * Generate a unique key for a time slot
       */
      getSlotKey(slot) {
        return slot.toISOString();
      }
      /**
       * Clear old booked slots (older than 24 hours)
       */
      clearOldBookedSlots() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
        this.bookedSlots.forEach((slots, accountEmail) => {
          const validSlots = /* @__PURE__ */ new Set();
          for (const slotKey of slots) {
            const slotDate = new Date(slotKey);
            if (slotDate > oneDayAgo) {
              validSlots.add(slotKey);
            }
          }
          this.bookedSlots.set(accountEmail, validSlots);
        });
      }
      /**
       * Get all booked slots for an account
       */
      getBookedSlots(accountEmail) {
        const slots = this.bookedSlots.get(accountEmail) || /* @__PURE__ */ new Set();
        return Array.from(slots).map((slotKey) => new Date(slotKey));
      }
      /**
       * Convert time to prospect's timezone
       */
      convertToProspectTimezone(date, prospectTimezone) {
        try {
          return new Date(date.toLocaleString("en-US", { timeZone: prospectTimezone }));
        } catch (error) {
          console.warn(`Invalid timezone ${prospectTimezone}, using original date`);
          return date;
        }
      }
    };
    timeSlotManager = new TimeSlotManager();
  }
});

// server/services/campaign-processor.ts
var CampaignProcessor, campaignProcessor;
var init_campaign_processor = __esm({
  "server/services/campaign-processor.ts"() {
    "use strict";
    init_storage();
    init_oauth_calendar();
    init_inbox_load_balancer();
    CampaignProcessor = class {
      async processCampaign(campaign) {
        if (campaign.status !== "active" || !campaign.isActive) {
          return;
        }
        try {
          const prospects3 = this.parseCSVProspects(campaign.csvData);
          if (prospects3.length === 0) {
            return;
          }
          const selectedInboxes = campaign.selectedInboxes || [];
          if (selectedInboxes.length === 0) {
            console.warn(`Campaign ${campaign.id} has no selected inboxes, skipping`);
            return;
          }
          const selectedAccounts = [];
          for (const inboxId of selectedInboxes) {
            const account = await storage.getGoogleAccount(inboxId);
            if (account && account.isActive && account.status === "active") {
              selectedAccounts.push(account);
            }
          }
          if (selectedAccounts.length === 0) {
            console.warn(`Campaign ${campaign.id} has no active selected inboxes available`);
            return;
          }
          const existingInvites = await storage.getInvites(campaign.id);
          const existingEmails = new Set(existingInvites.map((invite) => invite.prospectEmail));
          let scheduleSlots = [];
          if (campaign.schedulingMode === "advanced" && campaign.randomizedSlots) {
            const slots = campaign.randomizedSlots;
            scheduleSlots = slots.map((slot) => new Date(slot.utcDateTime));
          } else {
            scheduleSlots = prospects3.map((_, index2) => this.calculateScheduleTimeWithProperGaps(index2));
          }
          for (let index2 = 0; index2 < prospects3.length; index2++) {
            const prospect = prospects3[index2];
            if (existingEmails.has(prospect.email)) {
              continue;
            }
            const scheduledFor = scheduleSlots[index2] || this.calculateScheduleTimeWithProperGaps(index2);
            const selectedAccount = selectedAccounts[index2 % selectedAccounts.length];
            await storage.createQueueItem({
              campaignId: campaign.id,
              prospectData: {
                ...prospect,
                assignedInboxId: selectedAccount.id,
                assignedInboxEmail: selectedAccount.email
              },
              scheduledFor,
              status: "pending",
              attempts: 0
            });
            await storage.createActivityLog({
              type: "prospect_scheduled",
              message: `Prospect ${prospect.email} scheduled for ${scheduledFor.toLocaleString()} via ${selectedAccount.email}`,
              campaignId: campaign.id,
              googleAccountId: selectedAccount.id
            });
          }
          await storage.createActivityLog({
            type: "campaign_processed",
            campaignId: campaign.id,
            message: `Processed ${prospects3.length} prospects for campaign ${campaign.name}`,
            metadata: { prospectCount: prospects3.length }
          });
        } catch (error) {
          console.error(`Error processing campaign ${campaign.id}:`, error);
          await storage.createActivityLog({
            type: "campaign_error",
            campaignId: campaign.id,
            message: `Error processing campaign ${campaign.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
            metadata: { error: error instanceof Error ? error.message : "Unknown error" }
          });
        }
      }
      parseCSVProspects(csvData) {
        return csvData.map((row) => {
          const cleanRow = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.replace(/^\{\{|\}\}$/g, "");
            cleanRow[cleanKey] = row[key];
            cleanRow[key] = row[key];
          });
          const prospectData = {
            email: cleanRow.email || cleanRow.Email || cleanRow["{{email}}"] || "",
            name: cleanRow.firstname || cleanRow.name || cleanRow.Name || cleanRow.first_name || cleanRow.firstName || cleanRow["{{firstname}}"] || "",
            company: cleanRow.company || cleanRow.Company || cleanRow.organization || cleanRow["{{company}}"] || "",
            timezone: cleanRow.timezone || cleanRow.time_zone || cleanRow.Timezone || "",
            preferred_hours: cleanRow.preferred_hours || cleanRow.preferredHours || "",
            preferred_days: cleanRow.preferred_days || cleanRow.preferredDays || "",
            title: cleanRow.title || cleanRow.Title || cleanRow["{{title}}"] || "",
            website: cleanRow.website || cleanRow.Website || cleanRow["{{website}}"] || "",
            competitors: cleanRow.competitors || cleanRow.Competitors || cleanRow["{{competitors}}"] || "",
            ...cleanRow
            // Include all fields as merge data for templates
          };
          return prospectData;
        }).filter((prospect) => prospect.email);
      }
      async processAllCampaigns() {
        const campaigns4 = await storage.getCampaigns();
        for (const campaign of campaigns4) {
          if (campaign.status === "active" && campaign.isActive) {
            await this.processCampaign(campaign);
          }
        }
      }
      calculateScheduleTime(index2) {
        const now = /* @__PURE__ */ new Date();
        const minutesDelay = 1 + index2 * 0.5;
        return new Date(now.getTime() + minutesDelay * 6e4);
      }
      calculateScheduleTimeWithProperGaps(index2) {
        const now = /* @__PURE__ */ new Date();
        const minutesDelay = 2 + index2 * 30;
        return new Date(now.getTime() + minutesDelay * 6e4);
      }
      processMergeFields(template, data) {
        let processed = template;
        Object.keys(data).forEach((key) => {
          const value = data[key] || "";
          processed = processed.replace(new RegExp(`{{${key}}}`, "g"), value);
        });
        return processed;
      }
      processSubjectLine(campaign, prospectData) {
        const subjectTemplate = campaign.subjectLine || "Hi from {{sender_name}}";
        const mergeData = {
          name: prospectData.name || prospectData.first_name || prospectData.firstName || "",
          company: prospectData.company || prospectData.company_name || prospectData.companyName || "",
          sender_name: campaign.senderName || "Your Team",
          email: prospectData.email || ""
        };
        return this.processMergeFields(subjectTemplate, mergeData);
      }
      async createInviteFromQueue(queueItem) {
        const campaign = await storage.getCampaign(queueItem.campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        if (campaign.status !== "active" || !campaign.isActive) {
          console.log(`Skipping queue item for paused/inactive campaign ${campaign.id}`);
          await storage.updateQueueItem(queueItem.id, {
            status: "cancelled"
          });
          return;
        }
        let availableAccount = null;
        const prospectData = queueItem.prospectData;
        if (prospectData.assignedInboxId) {
          const assignedAccount = await storage.getGoogleAccount(prospectData.assignedInboxId);
          if (assignedAccount && assignedAccount.isActive) {
            const selectedInboxes = campaign.selectedInboxes || [];
            if (selectedInboxes.includes(assignedAccount.id)) {
              availableAccount = assignedAccount;
            }
          }
        }
        if (!availableAccount) {
          const selectedInboxes = campaign.selectedInboxes || [];
          for (const inboxId of selectedInboxes) {
            const account = await storage.getGoogleAccount(inboxId);
            if (account && account.isActive) {
              availableAccount = account;
              break;
            }
          }
        }
        if (!availableAccount) {
          throw new Error("No available Google account from campaign's selected inboxes");
        }
        if (availableAccount.status !== "active" || !availableAccount.isActive) {
          throw new Error(`Account ${availableAccount.email} is not active (status: ${availableAccount.status})`);
        }
        const prospect = prospectData;
        const invite = await storage.createInvite({
          campaignId: campaign.id,
          googleAccountId: availableAccount.id,
          prospectEmail: prospect.email,
          prospectName: prospect.name,
          prospectCompany: prospect.company,
          mergeData: prospect,
          status: "pending"
        });
        try {
          const mergeData = {
            name: prospect.name || prospect.email,
            company: prospect.company || "",
            sender_name: campaign.senderName || availableAccount.name || "Sales Team",
            sender_email: availableAccount.email,
            ...prospect
          };
          const eventTitle = this.processMergeFields(
            campaign.eventTitleTemplate,
            mergeData
          );
          const eventDescription = this.processMergeFields(
            campaign.eventDescriptionTemplate,
            mergeData
          );
          const subjectLine = this.processSubjectLine(campaign, mergeData);
          const { timeSlotManager: timeSlotManager2 } = (init_time_slot_manager(), __toCommonJS(time_slot_manager_exports));
          const prospectData2 = {
            email: mergeData.email || "unknown@example.com",
            timezone: campaign.timeZone
          };
          const startTime = await timeSlotManager2.generateTimeSlot(
            prospectData2,
            campaign,
            availableAccount.email
          );
          const endTime = new Date(startTime.getTime() + campaign.eventDuration * 6e4);
          const eventId = await oauthCalendarService.createEventWithOAuth(availableAccount, {
            title: eventTitle,
            description: eventDescription,
            attendeeEmail: prospect.email,
            startTime,
            endTime,
            timeZone: campaign.timeZone,
            subjectLine,
            sdrEmail: campaign.sdrEmail || void 0
          });
          await storage.updateInvite(invite.id, {
            eventId,
            status: "sent",
            sentAt: /* @__PURE__ */ new Date()
          });
          await inboxLoadBalancer.recordUsage(availableAccount.id, true);
          console.log(`Calendar invite sent successfully to ${prospect.email}, Event ID: ${eventId}`);
          await storage.updateQueueItem(queueItem.id, {
            status: "completed"
          });
          await storage.createActivityLog({
            type: "invite_sent",
            campaignId: campaign.id,
            inviteId: invite.id,
            googleAccountId: availableAccount.id,
            message: `Invite sent to ${prospect.email}`,
            metadata: {
              prospectEmail: prospect.email,
              eventId,
              senderEmail: availableAccount.email
            }
          });
        } catch (error) {
          console.error(`Failed to send invite:`, error);
          await storage.updateInvite(invite.id, {
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
          await inboxLoadBalancer.recordUsage(availableAccount.id, false);
          await storage.updateQueueItem(queueItem.id, {
            status: "failed",
            attempts: queueItem.attempts + 1,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
          await storage.createActivityLog({
            type: "invite_error",
            campaignId: campaign.id,
            inviteId: invite.id,
            googleAccountId: availableAccount.id,
            message: `Failed to send invite to ${queueItem.prospectData.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
            metadata: {
              prospectEmail: queueItem.prospectData.email,
              error: error instanceof Error ? error.message : "Unknown error"
            }
          });
          throw error;
        }
      }
      async findAvailableAccount() {
        const accounts = await storage.getAccountsWithStatus();
        const settings = await storage.getSystemSettings();
        const availableAccounts = accounts.filter(
          (account) => account.isActive && !account.isInCooldown
        );
        if (availableAccounts.length === 0) {
          return null;
        }
        return availableAccounts.sort((a, b) => {
          const aLastUsed = a.lastUsed?.getTime() || 0;
          const bLastUsed = b.lastUsed?.getTime() || 0;
          return aLastUsed - bLastUsed;
        })[0];
      }
      // Cancel all pending queue items for a campaign when it's paused/stopped
      async cancelCampaignQueue(campaignId) {
        try {
          const pendingItems = await storage.getQueueItems("pending");
          const campaignItems = pendingItems.filter((item) => item.campaignId === campaignId);
          for (const item of campaignItems) {
            await storage.updateQueueItem(item.id, {
              status: "cancelled"
            });
          }
          await storage.createActivityLog({
            type: "campaign_queue_cancelled",
            campaignId,
            message: `Cancelled ${campaignItems.length} pending queue items for campaign`,
            metadata: { cancelledItems: campaignItems.length }
          });
          console.log(`Cancelled ${campaignItems.length} pending queue items for campaign ${campaignId}`);
        } catch (error) {
          console.error(`Error cancelling queue for campaign ${campaignId}:`, error);
        }
      }
    };
    campaignProcessor = new CampaignProcessor();
  }
});

// server/services/google-calendar.ts
import { google as google5 } from "googleapis";
var GoogleCalendarService, googleCalendarService;
var init_google_calendar = __esm({
  "server/services/google-calendar.ts"() {
    "use strict";
    init_google_auth();
    init_google_service_auth();
    init_storage();
    GoogleCalendarService = class {
      async createEvent(account, eventDetails) {
        let auth;
        if (account.accessToken === "SERVICE_ACCOUNT_TOKEN") {
          auth = googleServiceAuthService.getServiceAccountAuth();
          if (!auth) {
            throw new Error("Service account not configured");
          }
        } else {
          const accessToken = await googleAuthService.getValidAccessToken(account);
          auth = googleAuthService.createAuthClient(accessToken);
        }
        const calendar = google5.calendar({ version: "v3", auth });
        const event = {
          summary: eventDetails.title,
          description: eventDetails.description,
          start: {
            dateTime: eventDetails.startTime.toISOString(),
            timeZone: eventDetails.timeZone
          },
          end: {
            dateTime: eventDetails.endTime.toISOString(),
            timeZone: eventDetails.timeZone
          },
          attendees: [
            { email: eventDetails.attendeeEmail }
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 24 * 60 },
              // 24 hours
              { method: "popup", minutes: 30 }
              // 30 minutes
            ]
          },
          guestsCanInviteOthers: false,
          guestsCanModify: false,
          guestsCanSeeOtherGuests: false
        };
        try {
          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
            sendNotifications: true
          });
          if (!response.data.id) {
            throw new Error("Failed to create calendar event");
          }
          return response.data.id;
        } catch (error) {
          console.error("Failed to create calendar event:", error.message);
          if (error.message && error.message.includes("Domain-Wide Delegation")) {
            throw new Error(`Service accounts cannot invite attendees without Domain-Wide Delegation of Authority. Please configure Domain-Wide Delegation in Google Admin Console. See DOMAIN_DELEGATION_SETUP.md for detailed instructions.`);
          }
          if (error.message && (error.message.includes("insufficient") || error.message.includes("forbidden") || error.message.includes("cannot invite"))) {
            throw new Error(`Calendar access denied. If using Service Account, ensure Domain-Wide Delegation is configured with these scopes: https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/spreadsheets. See DOMAIN_DELEGATION_SETUP.md for setup instructions.`);
          }
          throw new Error(`Failed to create calendar event: ${error.message}`);
        }
      }
      async getEventStatus(account, eventId) {
        const accessToken = await googleAuthService.getValidAccessToken(account);
        const auth = googleAuthService.createAuthClient(accessToken);
        const calendar = google5.calendar({ version: "v3", auth });
        const response = await calendar.events.get({
          calendarId: "primary",
          eventId
        });
        const event = response.data;
        const attendee = event.attendees?.find((a) => a.email !== account.email);
        return {
          status: event.status || "unknown",
          attendeeResponse: attendee?.responseStatus
        };
      }
      async checkPendingInvites() {
        const pendingInvites = await storage.getInvitesByStatus("sent");
        for (const invite of pendingInvites) {
          try {
            if (!invite.eventId) continue;
            const account = await storage.getGoogleAccount(invite.googleAccountId);
            if (!account) continue;
            const { attendeeResponse } = await this.getEventStatus(account, invite.eventId);
            if (attendeeResponse === "accepted" && invite.status !== "accepted") {
              await storage.updateInvite(invite.id, {
                status: "accepted",
                acceptedAt: /* @__PURE__ */ new Date()
              });
              await storage.createActivityLog({
                type: "invite_accepted",
                campaignId: invite.campaignId,
                inviteId: invite.id,
                googleAccountId: invite.googleAccountId,
                message: `${invite.prospectEmail} accepted calendar invite`,
                metadata: { prospectEmail: invite.prospectEmail }
              });
            }
          } catch (error) {
            console.error(`Error checking invite ${invite.id}:`, error);
          }
        }
      }
      processMergeFields(template, mergeData) {
        let processed = template;
        for (const [key, value] of Object.entries(mergeData)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          processed = processed.replace(regex, String(value || ""));
        }
        return processed;
      }
    };
    googleCalendarService = new GoogleCalendarService();
  }
});

// server/services/email.ts
import nodemailer2 from "nodemailer";
var EmailService, emailService;
var init_email = __esm({
  "server/services/email.ts"() {
    "use strict";
    init_storage();
    init_google_calendar();
    EmailService = class {
      transporter;
      constructor() {
        this.transporter = nodemailer2.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            clientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || ""
          }
        });
      }
      async sendConfirmationEmail(invite) {
        const account = await storage.getGoogleAccount(invite.googleAccountId);
        const campaign = await storage.getCampaign(invite.campaignId);
        if (!account || !campaign) {
          throw new Error("Account or campaign not found");
        }
        const mergeData = {
          name: invite.prospectName || invite.prospectEmail,
          email: invite.prospectEmail,
          company: invite.prospectCompany || "",
          ...invite.mergeData || {}
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
            accessToken: account.accessToken
          }
        };
        try {
          await this.transporter.sendMail(mailOptions);
          await storage.updateInvite(invite.id, {
            confirmationSent: true,
            confirmationSentAt: /* @__PURE__ */ new Date()
          });
          await storage.createActivityLog({
            type: "confirmation_sent",
            campaignId: invite.campaignId,
            inviteId: invite.id,
            googleAccountId: invite.googleAccountId,
            message: `Confirmation email sent to ${invite.prospectEmail}`,
            metadata: { prospectEmail: invite.prospectEmail }
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
            }
          });
          throw error;
        }
      }
      async processConfirmationQueue() {
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
    };
    emailService = new EmailService();
  }
});

// server/services/outlook-calendar.ts
var OutlookCalendarService, outlookCalendarService;
var init_outlook_calendar = __esm({
  "server/services/outlook-calendar.ts"() {
    "use strict";
    init_outlook_auth();
    OutlookCalendarService = class {
      async createEvent(account, eventDetails) {
        try {
          const accessToken = await outlookAuthService.getValidAccessToken(account);
          const graphClient = outlookAuthService.createGraphClient(accessToken);
          const outlookEvent = {
            subject: eventDetails.title,
            body: {
              contentType: "HTML",
              content: eventDetails.description
            },
            start: {
              dateTime: eventDetails.startTime.toISOString(),
              timeZone: eventDetails.timeZone || "UTC"
            },
            end: {
              dateTime: eventDetails.endTime.toISOString(),
              timeZone: eventDetails.timeZone || "UTC"
            },
            attendees: [
              {
                emailAddress: {
                  address: eventDetails.attendeeEmail,
                  name: eventDetails.attendeeEmail.split("@")[0]
                },
                type: "required"
              }
            ],
            isOnlineMeeting: false,
            responseRequested: true,
            allowNewTimeProposals: false
          };
          const response = await graphClient.post("/me/events", outlookEvent);
          return response.id;
        } catch (error) {
          console.error("Failed to create Outlook calendar event:", error);
          throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      async getEventStatus(account, eventId) {
        try {
          const accessToken = await outlookAuthService.getValidAccessToken(account);
          const graphClient = outlookAuthService.createGraphClient(accessToken);
          const event = await graphClient.get(`/me/events/${eventId}`);
          const attendees = event.attendees || [];
          const primaryAttendee = attendees.find((att) => att.type === "required");
          if (!primaryAttendee) {
            return { status: "pending" };
          }
          const responseStatus = primaryAttendee.status?.response?.toLowerCase();
          let status = "pending";
          switch (responseStatus) {
            case "accepted":
              status = "accepted";
              break;
            case "declined":
              status = "declined";
              break;
            case "tentativelyaccepted":
              status = "tentative";
              break;
            default:
              status = "pending";
          }
          return {
            status,
            attendeeResponse: responseStatus
          };
        } catch (error) {
          console.error("Failed to get Outlook event status:", error);
          return { status: "pending" };
        }
      }
      async checkPendingInvites() {
        console.log("Checking pending Outlook invites...");
      }
      processMergeFields(template, mergeData) {
        let result = template;
        Object.entries(mergeData).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
          result = result.replace(regex, String(value || ""));
        });
        return result;
      }
      async updateEvent(account, eventId, updates) {
        try {
          const accessToken = await outlookAuthService.getValidAccessToken(account);
          const graphClient = outlookAuthService.createGraphClient(accessToken);
          const updateData = {};
          if (updates.title) {
            updateData.subject = updates.title;
          }
          if (updates.description) {
            updateData.body = {
              contentType: "HTML",
              content: updates.description
            };
          }
          if (updates.startTime) {
            updateData.start = {
              dateTime: updates.startTime.toISOString(),
              timeZone: updates.timeZone || "UTC"
            };
          }
          if (updates.endTime) {
            updateData.end = {
              dateTime: updates.endTime.toISOString(),
              timeZone: updates.timeZone || "UTC"
            };
          }
          await graphClient.patch(`/me/events/${eventId}`, updateData);
        } catch (error) {
          console.error("Failed to update Outlook event:", error);
          throw error;
        }
      }
      async deleteEvent(account, eventId) {
        try {
          const accessToken = await outlookAuthService.getValidAccessToken(account);
          const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to delete event: ${response.statusText}`);
          }
        } catch (error) {
          console.error("Failed to delete Outlook event:", error);
          throw error;
        }
      }
      async listEvents(account, startDate, endDate) {
        try {
          const accessToken = await outlookAuthService.getValidAccessToken(account);
          const graphClient = outlookAuthService.createGraphClient(accessToken);
          let endpoint = "/me/events";
          const params = new URLSearchParams();
          if (startDate && endDate) {
            params.append("$filter", `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`);
          }
          params.append("$select", "id,subject,start,end,attendees,responseStatus");
          params.append("$orderby", "start/dateTime");
          if (params.toString()) {
            endpoint += `?${params.toString()}`;
          }
          const response = await graphClient.get(endpoint);
          return response.value || [];
        } catch (error) {
          console.error("Failed to list Outlook events:", error);
          return [];
        }
      }
    };
    outlookCalendarService = new OutlookCalendarService();
  }
});

// server/services/rsvp-tracker.ts
var RsvpTracker, rsvpTracker;
var init_rsvp_tracker = __esm({
  "server/services/rsvp-tracker.ts"() {
    "use strict";
    init_storage();
    init_google_calendar();
    init_outlook_calendar();
    RsvpTracker = class {
      /**
       * Process an RSVP status update from any source
       */
      async processRsvpUpdate(update) {
        try {
          const invite = await storage.getInviteByEventId(update.eventId);
          if (!invite) {
            console.warn(`No invite found for event ID: ${update.eventId}`);
            return;
          }
          if (invite.rsvpStatus === update.rsvpStatus) {
            console.log(`RSVP status unchanged for invite ${invite.id}: ${update.rsvpStatus}`);
            return;
          }
          console.log(`Processing RSVP update for invite ${invite.id}: ${invite.rsvpStatus} -> ${update.rsvpStatus}`);
          await storage.updateInviteRsvpStatus(
            invite.id,
            update.rsvpStatus,
            update.source,
            update.webhookPayload
          );
          console.log(`Successfully updated RSVP status for invite ${invite.id}`);
        } catch (error) {
          console.error("Error processing RSVP update:", error);
          throw error;
        }
      }
      /**
       * Poll all pending invites for status updates
       */
      async pollPendingInvites() {
        try {
          console.log("Polling pending invites for RSVP updates...");
          const pendingInvites = await storage.getInvitesByStatus("sent");
          for (const invite of pendingInvites) {
            try {
              if (!invite.eventId) continue;
              let rsvpStatus;
              if (invite.calendarProvider === "google" && invite.googleAccountId) {
                const account = await storage.getGoogleAccount(invite.googleAccountId);
                if (account) {
                  const { attendeeResponse } = await googleCalendarService.getEventStatus(account, invite.eventId);
                  rsvpStatus = this.mapGoogleResponseStatus(attendeeResponse);
                }
              } else if (invite.calendarProvider === "outlook" && invite.outlookAccountId) {
                const account = await storage.getOutlookAccount(invite.outlookAccountId);
                if (account) {
                  const { status } = await outlookCalendarService.getEventStatus(account, invite.eventId);
                  rsvpStatus = status;
                }
              }
              if (rsvpStatus && rsvpStatus !== "pending" && rsvpStatus !== invite.rsvpStatus) {
                await this.processRsvpUpdate({
                  eventId: invite.eventId,
                  prospectEmail: invite.prospectEmail,
                  rsvpStatus,
                  responseAt: /* @__PURE__ */ new Date(),
                  source: "polling"
                });
              }
              await storage.updateInvite(invite.id, { lastStatusCheck: /* @__PURE__ */ new Date() });
            } catch (error) {
              console.error(`Error checking invite ${invite.id}:`, error);
            }
          }
          console.log(`Completed polling ${pendingInvites.length} pending invites`);
        } catch (error) {
          console.error("Error polling pending invites:", error);
        }
      }
      /**
       * Process webhook events for real-time RSVP updates
       */
      async processWebhookEvent(eventType, payload) {
        try {
          console.log(`Processing webhook event: ${eventType}`);
          const webhookEvent = await storage.createWebhookEvent({
            eventType,
            rawPayload: payload,
            processed: false
          });
          let eventId;
          let rsvpStatus;
          let prospectEmail;
          if (eventType === "google_calendar_event_updated") {
            eventId = payload.resourceId || payload.eventId;
            if (payload.attendees && payload.attendees.length > 0) {
              const attendee = payload.attendees.find((a) => a.responseStatus !== "organizer");
              if (attendee) {
                rsvpStatus = this.mapGoogleResponseStatus(attendee.responseStatus);
                prospectEmail = attendee.email;
              }
            }
          } else if (eventType === "outlook_event_updated") {
            eventId = payload.eventId;
            if (payload.attendees && payload.attendees.length > 0) {
              const attendee = payload.attendees.find((a) => a.type === "required");
              if (attendee) {
                rsvpStatus = this.mapOutlookResponseStatus(attendee.status?.response);
                prospectEmail = attendee.emailAddress?.address;
              }
            }
          }
          if (eventId && rsvpStatus && prospectEmail) {
            await this.processRsvpUpdate({
              eventId,
              prospectEmail,
              rsvpStatus,
              responseAt: /* @__PURE__ */ new Date(),
              source: "webhook",
              webhookPayload: payload
            });
            const invite = await storage.getInviteByEventId(eventId);
            if (invite) {
              await storage.markWebhookProcessed(webhookEvent.id, true);
            }
          } else {
            await storage.markWebhookProcessed(webhookEvent.id, false, "Could not extract required fields from webhook payload");
          }
        } catch (error) {
          console.error("Error processing webhook event:", error);
          throw error;
        }
      }
      /**
       * Force re-sync RSVP status for specific invite
       */
      async forceSyncInvite(inviteId) {
        const invite = await storage.getInvite(inviteId);
        if (!invite || !invite.eventId) {
          throw new Error(`Invite ${inviteId} not found or has no event ID`);
        }
        try {
          let rsvpStatus;
          if (invite.calendarProvider === "google" && invite.googleAccountId) {
            const account = await storage.getGoogleAccount(invite.googleAccountId);
            if (account) {
              const { attendeeResponse } = await googleCalendarService.getEventStatus(account, invite.eventId);
              rsvpStatus = this.mapGoogleResponseStatus(attendeeResponse);
            }
          } else if (invite.calendarProvider === "outlook" && invite.outlookAccountId) {
            const account = await storage.getOutlookAccount(invite.outlookAccountId);
            if (account) {
              const { status } = await outlookCalendarService.getEventStatus(account, invite.eventId);
              rsvpStatus = status;
            }
          }
          if (rsvpStatus && rsvpStatus !== "pending") {
            await this.processRsvpUpdate({
              eventId: invite.eventId,
              prospectEmail: invite.prospectEmail,
              rsvpStatus,
              responseAt: /* @__PURE__ */ new Date(),
              source: "manual"
            });
          }
          await storage.updateInvite(inviteId, { lastStatusCheck: /* @__PURE__ */ new Date() });
        } catch (error) {
          console.error(`Error force syncing invite ${inviteId}:`, error);
          throw error;
        }
      }
      /**
       * Get RSVP statistics for a campaign
       */
      async getCampaignRsvpStats(campaignId) {
        const invites3 = await storage.getInvites(campaignId);
        const stats = {
          total: invites3.length,
          sent: invites3.filter((i) => i.status === "sent" || i.rsvpStatus).length,
          accepted: invites3.filter((i) => i.rsvpStatus === "accepted").length,
          declined: invites3.filter((i) => i.rsvpStatus === "declined").length,
          tentative: invites3.filter((i) => i.rsvpStatus === "tentative").length,
          noResponse: invites3.filter((i) => i.status === "sent" && !i.rsvpStatus).length,
          acceptanceRate: 0,
          responseRate: 0
        };
        if (stats.sent > 0) {
          stats.acceptanceRate = Math.round(stats.accepted / stats.sent * 100 * 10) / 10;
          stats.responseRate = Math.round((stats.accepted + stats.declined + stats.tentative) / stats.sent * 100 * 10) / 10;
        }
        return stats;
      }
      /**
       * Map Google Calendar response status to our standard format
       */
      mapGoogleResponseStatus(responseStatus) {
        switch (responseStatus) {
          case "accepted":
            return "accepted";
          case "declined":
            return "declined";
          case "tentative":
            return "tentative";
          case "needsAction":
          default:
            return "needsAction";
        }
      }
      /**
       * Map Outlook response status to our standard format
       */
      mapOutlookResponseStatus(responseStatus) {
        switch (responseStatus?.toLowerCase()) {
          case "accepted":
            return "accepted";
          case "declined":
            return "declined";
          case "tentativelyaccepted":
            return "tentative";
          case "none":
          default:
            return "needsAction";
        }
      }
    };
    rsvpTracker = new RsvpTracker();
  }
});

// server/services/queue-manager.ts
var QueueManager, queueManager;
var init_queue_manager = __esm({
  "server/services/queue-manager.ts"() {
    "use strict";
    init_storage();
    init_campaign_processor();
    init_google_calendar();
    init_email();
    init_rsvp_tracker();
    QueueManager = class {
      isProcessing = false;
      processingInterval = null;
      start() {
        if (this.processingInterval) {
          return;
        }
        console.log("Starting queue manager...");
        this.processingInterval = setInterval(() => {
          this.processQueue();
        }, 6e4);
        setInterval(() => {
          this.checkAcceptedInvites();
        }, 5 * 6e4);
        setInterval(() => {
          this.processConfirmations();
        }, 2 * 6e4);
        setInterval(() => {
          this.pollRsvpUpdates();
        }, 3 * 6e4);
        this.processQueue();
      }
      stop() {
        if (this.processingInterval) {
          clearInterval(this.processingInterval);
          this.processingInterval = null;
          console.log("Queue manager stopped");
        }
      }
      async processQueue() {
        if (this.isProcessing) {
          return;
        }
        this.isProcessing = true;
        try {
          const settings = await storage.getSystemSettings();
          if (!settings.isSystemActive) {
            return;
          }
          const nextItem = await storage.getNextQueueItem();
          if (!nextItem) {
            return;
          }
          const campaign = await storage.getCampaign(nextItem.campaignId);
          if (!campaign) {
            await storage.updateQueueItem(nextItem.id, {
              status: "failed",
              errorMessage: "Campaign not found"
            });
            return;
          }
          const campaignInvitesToday = await this.getCampaignInvitesToday(nextItem.campaignId);
          if (campaignInvitesToday >= campaign.maxDailyCampaignInvites) {
            console.log(`Campaign ${campaign.name} has reached daily limit: ${campaignInvitesToday}/${campaign.maxDailyCampaignInvites}`);
            const tomorrow = /* @__PURE__ */ new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            await storage.updateQueueItem(nextItem.id, {
              scheduledFor: tomorrow
            });
            return;
          }
          const prospectData = nextItem.prospectData;
          if (prospectData.assignedInboxId) {
            const account = await storage.getGoogleAccount(prospectData.assignedInboxId);
            if (!account) {
              await storage.updateQueueItem(nextItem.id, {
                status: "failed",
                errorMessage: "Assigned inbox no longer exists"
              });
              return;
            }
            const inboxInvitesToday = await this.getInboxInvitesToday(prospectData.assignedInboxId);
            if (inboxInvitesToday >= campaign.maxInvitesPerInbox) {
              console.log(`Inbox ${account.email} has reached campaign limit: ${inboxInvitesToday}/${campaign.maxInvitesPerInbox}`);
              const tomorrow = /* @__PURE__ */ new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              await storage.updateQueueItem(nextItem.id, {
                scheduledFor: tomorrow
              });
              return;
            }
            const lastUsed = account.lastUsed;
            if (lastUsed) {
              const cooldownUntil = new Date(lastUsed.getTime() + 30 * 60 * 1e3);
              if (/* @__PURE__ */ new Date() < cooldownUntil) {
                const remainingMs = cooldownUntil.getTime() - (/* @__PURE__ */ new Date()).getTime();
                const remainingMinutes = Math.ceil(remainingMs / (60 * 1e3));
                console.log(`ENFORCING 30-MIN GAP: Inbox ${account.email} is in cooldown for ${remainingMinutes} more minutes`);
                const rescheduleTime = new Date(cooldownUntil.getTime() + 1 * 60 * 1e3);
                await storage.updateQueueItem(nextItem.id, {
                  scheduledFor: rescheduleTime
                });
                return;
              }
            }
          }
          if (nextItem.scheduledFor > /* @__PURE__ */ new Date()) {
            return;
          }
          await storage.updateQueueItem(nextItem.id, {
            status: "processing"
          });
          await campaignProcessor.createInviteFromQueue(nextItem);
        } catch (error) {
          console.error("Error processing queue:", error);
        } finally {
          this.isProcessing = false;
        }
      }
      /**
       * Get number of invites sent today for a specific inbox
       */
      async getInboxInvitesToday(inboxId) {
        const startOfDay2 = /* @__PURE__ */ new Date();
        startOfDay2.setHours(0, 0, 0, 0);
        const invites3 = await storage.getInvites();
        return invites3.filter(
          (invite) => invite.googleAccountId === inboxId && invite.sentAt && invite.sentAt >= startOfDay2
        ).length;
      }
      /**
       * Get number of invites sent today for a specific campaign
       */
      async getCampaignInvitesToday(campaignId) {
        const startOfDay2 = /* @__PURE__ */ new Date();
        startOfDay2.setHours(0, 0, 0, 0);
        const invites3 = await storage.getInvites();
        return invites3.filter(
          (invite) => invite.campaignId === campaignId && invite.sentAt && invite.sentAt >= startOfDay2
        ).length;
      }
      async checkAcceptedInvites() {
        try {
          await googleCalendarService.checkPendingInvites();
        } catch (error) {
          console.error("Error checking accepted invites:", error);
        }
      }
      async pollRsvpUpdates() {
        try {
          await rsvpTracker.pollPendingInvites();
        } catch (error) {
          console.error("Error polling RSVP updates:", error);
        }
      }
      async processConfirmations() {
        try {
          await emailService.processConfirmationQueue();
        } catch (error) {
          console.error("Error processing confirmations:", error);
        }
      }
      async getQueueStatus() {
        const [pending, processing, completed, failed] = await Promise.all([
          storage.getQueueItems("pending"),
          storage.getQueueItems("processing"),
          storage.getQueueItems("completed"),
          storage.getQueueItems("failed")
        ]);
        return {
          pending: pending.length,
          processing: processing.length,
          completed: completed.length,
          failed: failed.length
        };
      }
    };
    queueManager = new QueueManager();
  }
});

// server/services/multi-provider-email.ts
import nodemailer3 from "nodemailer";
var MultiProviderEmailService, multiProviderEmailService;
var init_multi_provider_email = __esm({
  "server/services/multi-provider-email.ts"() {
    "use strict";
    init_outlook_auth();
    init_google_auth();
    init_storage();
    MultiProviderEmailService = class {
      gmailTransporter;
      constructor() {
        this.gmailTransporter = nodemailer3.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
          }
        });
      }
      async getAvailableProviders() {
        const accounts = await storage.getGoogleAccounts();
        const providers = [];
        for (const account of accounts) {
          if (account.isActive) {
            providers.push({
              type: "gmail",
              name: `Gmail (${account.email})`,
              accountId: account.id,
              email: account.email
            });
          }
        }
        return providers;
      }
      async sendEmail(provider, options) {
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
      async sendViaGmail(provider, options) {
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
            accessToken
          }
        };
        await this.gmailTransporter.sendMail(mailOptions);
      }
      async sendViaOutlook(provider, options) {
        const account = await storage.getGoogleAccount(provider.accountId);
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
              content: options.html
            },
            toRecipients: [
              {
                emailAddress: {
                  address: options.to
                }
              }
            ],
            from: {
              emailAddress: {
                address: provider.email
              }
            },
            replyTo: options.replyTo ? [
              {
                emailAddress: {
                  address: options.replyTo
                }
              }
            ] : void 0
          },
          saveToSentItems: true
        };
        await graphClient.post("/me/sendMail", message);
      }
      async sendConfirmationEmail(invite, provider) {
        try {
          const campaign = await storage.getCampaign(invite.campaignId);
          if (!campaign) {
            throw new Error("Campaign not found");
          }
          const emailProvider = provider || await this.getBestEmailProvider();
          if (!emailProvider) {
            throw new Error("No email provider available");
          }
          const mergeData = {
            name: invite.prospectName || invite.prospectEmail,
            email: invite.prospectEmail,
            company: invite.prospectCompany || "",
            eventTitle: campaign.eventTitleTemplate,
            senderName: emailProvider.email.split("@")[0],
            senderEmail: emailProvider.email,
            ...invite.mergeData
          };
          const emailContent = this.processMergeFields(
            campaign.confirmationEmailTemplate,
            mergeData
          );
          const emailOptions = {
            to: invite.prospectEmail,
            subject: `Calendar Invite Confirmed - ${campaign.eventTitleTemplate}`,
            html: emailContent,
            text: emailContent.replace(/<[^>]*>/g, "")
            // Strip HTML for text version
          };
          await this.sendEmail(emailProvider, emailOptions);
          await storage.updateInvite(invite.id, {
            confirmationSent: true,
            confirmationSentAt: /* @__PURE__ */ new Date()
          });
          await storage.createActivityLog({
            type: "confirmation_sent",
            campaignId: campaign.id,
            inviteId: invite.id,
            message: `Confirmation email sent to ${invite.prospectEmail} via ${emailProvider.type}`,
            metadata: {
              provider: emailProvider.type,
              senderEmail: emailProvider.email
            }
          });
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
          throw error;
        }
      }
      async processConfirmationQueue() {
        try {
          const invites3 = await storage.getInvitesByStatus("accepted");
          const pendingConfirmations = invites3.filter(
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
                message: `Failed to send confirmation email: ${error instanceof Error ? error.message : "Unknown error"}`
              });
            }
          }
        } catch (error) {
          console.error("Error processing confirmation queue:", error);
        }
      }
      async getBestEmailProvider() {
        const providers = await this.getAvailableProviders();
        if (providers.length === 0) {
          return null;
        }
        return providers[Math.floor(Math.random() * providers.length)];
      }
      processMergeFields(template, mergeData) {
        let result = template;
        Object.entries(mergeData).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
          result = result.replace(regex, String(value || ""));
        });
        return result;
      }
      async testEmailProvider(provider) {
        try {
          const testOptions = {
            to: provider.email,
            // Send test email to self
            subject: "Email Provider Test",
            html: "<p>This is a test email to verify the email provider is working correctly.</p>",
            text: "This is a test email to verify the email provider is working correctly."
          };
          await this.sendEmail(provider, testOptions);
          return true;
        } catch (error) {
          console.error(`Email provider test failed for ${provider.type}:`, error);
          return false;
        }
      }
      async getProviderStats() {
        const providers = await this.getAvailableProviders();
        const stats = [];
        for (const provider of providers) {
          const logs = await storage.getActivityLogs(1e3);
          const providerLogs = logs.filter(
            (log2) => log2.type === "confirmation_sent" && log2.metadata?.senderEmail === provider.email
          );
          const errorLogs = logs.filter(
            (log2) => log2.type === "confirmation_error" && log2.metadata?.senderEmail === provider.email
          );
          const emailsSent = providerLogs.length;
          const errors = errorLogs.length;
          const successRate = emailsSent > 0 ? (emailsSent - errors) / emailsSent * 100 : 100;
          const lastUsed = providerLogs.length > 0 ? new Date(Math.max(...providerLogs.map((log2) => log2.createdAt.getTime()))) : void 0;
          stats.push({
            ...provider,
            lastUsed,
            emailsSent,
            successRate
          });
        }
        return stats;
      }
    };
    multiProviderEmailService = new MultiProviderEmailService();
  }
});

// server/services/scheduling-service.ts
import { eq as eq2, and as and2, gte as gte2, lte as lte2, asc } from "drizzle-orm";
import { addBusinessDays, isWeekend, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
var SchedulingService, schedulingService;
var init_scheduling_service = __esm({
  "server/services/scheduling-service.ts"() {
    "use strict";
    init_db();
    init_schema();
    SchedulingService = class {
      /**
       * Get scheduling settings for a user (global) or campaign
       */
      async getSchedulingSettings(userId, campaignId) {
        const settings = await db.select().from(schedulingSettings).where(
          and2(
            eq2(schedulingSettings.userId, userId),
            campaignId ? eq2(schedulingSettings.campaignId, campaignId) : eq2(schedulingSettings.isGlobal, true)
          )
        ).limit(1);
        if (settings.length === 0) {
          return {
            minLeadTimeDays: 2,
            maxLeadTimeDays: 6,
            preferredStartHour: 12,
            preferredEndHour: 16,
            allowDoubleBooking: false,
            excludeWeekends: true,
            businessHoursOnly: true,
            fallbackPolicy: "skip",
            enableTimezoneDetection: true,
            retryAttempts: 3
          };
        }
        return settings[0];
      }
      /**
       * Update scheduling settings
       */
      async updateSchedulingSettings(userId, settingsData) {
        const existingSettings = await db.select().from(schedulingSettings).where(
          and2(
            eq2(schedulingSettings.userId, userId),
            eq2(schedulingSettings.isGlobal, true)
          )
        ).limit(1);
        if (existingSettings.length === 0) {
          await db.insert(schedulingSettings).values({
            userId,
            isGlobal: true,
            ...settingsData
          });
        } else {
          await db.update(schedulingSettings).set({
            ...settingsData,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(schedulingSettings.id, existingSettings[0].id));
        }
      }
      /**
       * Calculate next available time slot
       */
      calculateNextAvailableSlot(options, timezone = "UTC") {
        const {
          minLeadTimeDays = 2,
          maxLeadTimeDays = 6,
          preferredStartHour = 12,
          preferredEndHour = 16,
          excludeWeekends = true
        } = options;
        const now = /* @__PURE__ */ new Date();
        let targetDate = addBusinessDays(now, minLeadTimeDays);
        if (excludeWeekends && isWeekend(targetDate)) {
          targetDate = addBusinessDays(targetDate, 1);
        }
        const randomHour = Math.floor(Math.random() * (preferredEndHour - preferredStartHour)) + preferredStartHour;
        const randomMinute = Math.floor(Math.random() * 4) * 15;
        const localTime = new Date(targetDate);
        localTime.setHours(randomHour, randomMinute, 0, 0);
        const utcTime = fromZonedTime(localTime, timezone);
        return utcTime;
      }
      /**
       * Schedule a new invite
       */
      async scheduleInvite(inviteData, options) {
        const settings = await this.getSchedulingSettings(inviteData.userId, inviteData.campaignId);
        const finalOptions = { ...settings, ...options };
        const recipientTz = inviteData.recipientTimezone || "America/New_York";
        const scheduledTime = this.calculateNextAvailableSlot(finalOptions, recipientTz);
        const [result] = await db.insert(scheduledInvites).values({
          ...inviteData,
          scheduledTimeUtc: scheduledTime,
          recipientTimezone: recipientTz,
          leadTimeDays: finalOptions.minLeadTimeDays
        }).returning();
        return result;
      }
      /**
       * Get all scheduled invites for a campaign
       */
      async getScheduledInvites(campaignId, userId) {
        return await db.select({
          id: scheduledInvites.id,
          campaignId: scheduledInvites.campaignId,
          recipientEmail: scheduledInvites.recipientEmail,
          recipientName: scheduledInvites.recipientName,
          scheduledTimeUtc: scheduledInvites.scheduledTimeUtc,
          recipientTimezone: scheduledInvites.recipientTimezone,
          status: scheduledInvites.status,
          senderCalendarEventId: scheduledInvites.senderCalendarEventId,
          wasDoubleBooked: scheduledInvites.wasDoubleBooked,
          createdAt: scheduledInvites.createdAt,
          updatedAt: scheduledInvites.updatedAt,
          campaignName: campaigns.name,
          senderEmail: users.email
        }).from(scheduledInvites).leftJoin(campaigns, eq2(scheduledInvites.campaignId, campaigns.id)).leftJoin(users, eq2(scheduledInvites.userId, users.id)).where(
          and2(
            eq2(scheduledInvites.campaignId, campaignId),
            eq2(scheduledInvites.userId, userId)
          )
        ).orderBy(asc(scheduledInvites.scheduledTimeUtc));
      }
      /**
       * Get all scheduled invites for a user
       */
      async getAllScheduledInvites(userId, filters) {
        let query = db.select({
          id: scheduledInvites.id,
          campaignId: scheduledInvites.campaignId,
          recipientEmail: scheduledInvites.recipientEmail,
          recipientName: scheduledInvites.recipientName,
          scheduledTimeUtc: scheduledInvites.scheduledTimeUtc,
          recipientTimezone: scheduledInvites.recipientTimezone,
          status: scheduledInvites.status,
          senderCalendarEventId: scheduledInvites.senderCalendarEventId,
          wasDoubleBooked: scheduledInvites.wasDoubleBooked,
          createdAt: scheduledInvites.createdAt,
          updatedAt: scheduledInvites.updatedAt,
          campaignName: campaigns.name,
          senderEmail: users.email
        }).from(scheduledInvites).leftJoin(campaigns, eq2(scheduledInvites.campaignId, campaigns.id)).leftJoin(users, eq2(scheduledInvites.userId, users.id)).where(eq2(scheduledInvites.userId, userId));
        if (filters?.campaignId) {
          query = query.where(eq2(scheduledInvites.campaignId, filters.campaignId));
        }
        if (filters?.status) {
          query = query.where(eq2(scheduledInvites.status, filters.status));
        }
        if (filters?.startDate) {
          query = query.where(gte2(scheduledInvites.scheduledTimeUtc, parseISO(filters.startDate)));
        }
        if (filters?.endDate) {
          query = query.where(lte2(scheduledInvites.scheduledTimeUtc, parseISO(filters.endDate)));
        }
        return await query.orderBy(asc(scheduledInvites.scheduledTimeUtc));
      }
      /**
       * Get scheduling statistics
       */
      async getSchedulingStats(userId, campaignId) {
        let baseQuery = db.select().from(scheduledInvites).where(eq2(scheduledInvites.userId, userId));
        if (campaignId) {
          baseQuery = baseQuery.where(eq2(scheduledInvites.campaignId, campaignId));
        }
        const allInvites = await baseQuery;
        const stats = {
          totalScheduled: allInvites.length,
          pendingInvites: allInvites.filter((i) => i.status === "pending").length,
          acceptedInvites: allInvites.filter((i) => i.status === "accepted").length,
          declinedInvites: allInvites.filter((i) => i.status === "declined").length,
          canceledInvites: allInvites.filter((i) => i.status === "canceled").length,
          doubleBookedSlots: allInvites.filter((i) => i.wasDoubleBooked).length,
          needsAttention: allInvites.filter((i) => i.status === "needs_attention").length,
          upcomingInvites: allInvites.filter(
            (i) => i.status === "pending" && new Date(i.scheduledTimeUtc) > /* @__PURE__ */ new Date()
          ).length,
          conflictingSlots: allInvites.filter(
            (i) => i.status === "needs_attention" && i.errorMessage?.includes("conflict")
          ).length
        };
        if (campaignId) {
          const avgLeadTime = allInvites.reduce((sum, invite) => {
            const leadTime = Math.floor(
              (new Date(invite.scheduledTimeUtc).getTime() - new Date(invite.createdAt).getTime()) / (1e3 * 60 * 60 * 24)
            );
            return sum + leadTime;
          }, 0) / allInvites.length || 0;
          return {
            ...stats,
            averageLeadTime: Math.round(avgLeadTime)
          };
        }
        return stats;
      }
      /**
       * Reschedule an invite
       */
      async rescheduleInvite(inviteId, newTime, userId) {
        const newTimeUtc = parseISO(newTime);
        const [result] = await db.update(scheduledInvites).set({
          scheduledTimeUtc: newTimeUtc,
          rescheduledCount: db.sql`${scheduledInvites.rescheduledCount} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(
          and2(
            eq2(scheduledInvites.id, inviteId),
            eq2(scheduledInvites.userId, userId)
          )
        ).returning();
        return result;
      }
      /**
       * Cancel an invite
       */
      async cancelInvite(inviteId, userId) {
        const [result] = await db.update(scheduledInvites).set({
          status: "canceled",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(
          and2(
            eq2(scheduledInvites.id, inviteId),
            eq2(scheduledInvites.userId, userId)
          )
        ).returning();
        return result;
      }
      /**
       * Update invite status (e.g., when RSVP is received)
       */
      async updateInviteStatus(inviteId, status, eventId) {
        const updateData = {
          status,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (eventId) {
          updateData.senderCalendarEventId = eventId;
        }
        const [result] = await db.update(scheduledInvites).set(updateData).where(eq2(scheduledInvites.id, inviteId)).returning();
        return result;
      }
    };
    schedulingService = new SchedulingService();
  }
});

// server/services/advanced-scheduler.ts
import {
  addDays,
  isWeekend as isWeekend2,
  format as format2,
  addHours,
  addBusinessDays as addBusinessDays2,
  setHours,
  setMinutes
} from "date-fns";
import { toZonedTime as toZonedTime2, fromZonedTime as fromZonedTime2 } from "date-fns-tz";
var AdvancedSchedulerService, advancedScheduler;
var init_advanced_scheduler = __esm({
  "server/services/advanced-scheduler.ts"() {
    "use strict";
    init_storage();
    AdvancedSchedulerService = class {
      BUSINESS_HOURS = { start: 9, end: 17 };
      // 9 AM - 5 PM
      MEETING_DURATION_MINUTES = 30;
      TIMEZONE_MAPPING = {
        "gmail.com": "America/New_York",
        "outlook.com": "America/New_York",
        "hotmail.com": "America/New_York"
        // Add more domain-to-timezone mappings as needed
      };
      /**
       * Main scheduling method that handles all the advanced logic
       */
      async scheduleInvite(request) {
        try {
          const campaign = await storage.getCampaign(request.campaignId, request.userId);
          if (!campaign) {
            return { success: false, error: "Campaign not found" };
          }
          const settings = await this.getSchedulingSettings(request.userId, request.campaignId);
          const recipientTimezone = this.determineRecipientTimezone(
            request.recipientTimezone,
            request.recipientEmail,
            settings.enableTimezoneDetection
          );
          const schedulingRange = this.calculateSchedulingRange(settings);
          const senderAccounts = await this.getAvailableSenderAccounts(
            request.userId,
            request.preferredSenderAccountId,
            request.preferredSenderAccountType
          );
          if (senderAccounts.length === 0) {
            return { success: false, error: "No available sender accounts" };
          }
          const availableSlots = await this.findAvailableTimeSlots(
            senderAccounts,
            schedulingRange,
            recipientTimezone,
            settings
          );
          if (availableSlots.length === 0) {
            if (settings.allowDoubleBooking) {
              const doubleBookingSlots = await this.findDoubleBookingSlots(
                senderAccounts,
                schedulingRange,
                recipientTimezone,
                settings
              );
              if (doubleBookingSlots.length > 0) {
                return this.createScheduledInvite(request, doubleBookingSlots[0], settings, true);
              }
            }
            return {
              success: false,
              error: "No available time slots found",
              needsManualScheduling: true,
              suggestedSlots: []
            };
          }
          const selectedSlot = this.selectOptimalSlot(availableSlots, settings);
          return this.createScheduledInvite(request, selectedSlot, settings, false);
        } catch (error) {
          console.error("Advanced scheduler error:", error);
          return { success: false, error: "Internal scheduling error" };
        }
      }
      /**
       * Get scheduling settings for user/campaign
       */
      async getSchedulingSettings(userId, campaignId) {
        if (campaignId) {
          const campaignSettings = await storage.getSchedulingSettings(userId, campaignId);
          if (campaignSettings) {
            return campaignSettings;
          }
        }
        const globalSettings = await storage.getGlobalSchedulingSettings(userId);
        if (globalSettings) {
          return globalSettings;
        }
        return {
          id: 0,
          userId,
          campaignId: null,
          isGlobal: true,
          minLeadTimeDays: 2,
          maxLeadTimeDays: 6,
          preferredStartHour: 12,
          preferredEndHour: 16,
          allowDoubleBooking: false,
          maxDoubleBookingsPerSlot: 1,
          excludeWeekends: true,
          businessHoursOnly: true,
          fallbackPolicy: "skip",
          enableTimezoneDetection: true,
          retryAttempts: 3,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      /**
       * Determine recipient timezone from various sources
       */
      determineRecipientTimezone(explicitTimezone, email, enableDetection = true) {
        if (explicitTimezone) {
          return explicitTimezone;
        }
        if (enableDetection && email) {
          const domain = email.split("@")[1]?.toLowerCase();
          if (domain && this.TIMEZONE_MAPPING[domain]) {
            return this.TIMEZONE_MAPPING[domain];
          }
        }
        return "America/New_York";
      }
      /**
       * Calculate the scheduling range based on business days
       */
      calculateSchedulingRange(settings) {
        const today = /* @__PURE__ */ new Date();
        const startDate = addBusinessDays2(today, settings.minLeadTimeDays);
        const endDate = addBusinessDays2(today, settings.maxLeadTimeDays);
        return { startDate, endDate };
      }
      /**
       * Get available sender accounts for the user
       */
      async getAvailableSenderAccounts(userId, preferredAccountId, preferredAccountType) {
        const accounts = [];
        const googleAccounts3 = await storage.getGoogleAccounts(userId);
        accounts.push(...googleAccounts3.filter((acc) => acc.isActive));
        const outlookAccounts3 = await storage.getOutlookAccounts(userId);
        accounts.push(...outlookAccounts3.filter((acc) => acc.isActive));
        if (preferredAccountId && preferredAccountType) {
          const preferredAccount = accounts.find(
            (acc) => acc.id === preferredAccountId && (preferredAccountType === "google" ? "accessToken" in acc : "microsoftId" in acc)
          );
          if (preferredAccount) {
            return [preferredAccount];
          }
        }
        return accounts;
      }
      /**
       * Find available time slots across all sender accounts
       */
      async findAvailableTimeSlots(senderAccounts, schedulingRange, recipientTimezone, settings) {
        const availableSlots = [];
        for (const account of senderAccounts) {
          const accountType = "microsoftId" in account ? "microsoft" : "google";
          const accountSlots = await this.getAccountAvailableSlots(
            account,
            accountType,
            schedulingRange,
            recipientTimezone,
            settings
          );
          availableSlots.push(...accountSlots);
        }
        return this.sortAndDeduplicateSlots(availableSlots);
      }
      /**
       * Get available slots for a specific account
       */
      async getAccountAvailableSlots(account, accountType, schedulingRange, recipientTimezone, settings) {
        const slots = [];
        let currentDate = new Date(schedulingRange.startDate);
        while (currentDate <= schedulingRange.endDate) {
          if (settings.excludeWeekends && isWeekend2(currentDate)) {
            currentDate = addDays(currentDate, 1);
            continue;
          }
          const daySlots = await this.generateDaySlots(
            currentDate,
            account,
            accountType,
            recipientTimezone,
            settings
          );
          slots.push(...daySlots);
          currentDate = addDays(currentDate, 1);
        }
        return slots;
      }
      /**
       * Generate time slots for a specific day
       */
      async generateDaySlots(date, account, accountType, recipientTimezone, settings) {
        const slots = [];
        const recipientStartHour = settings.preferredStartHour;
        const recipientEndHour = settings.preferredEndHour;
        for (let hour = recipientStartHour; hour < recipientEndHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const recipientTime = setMinutes(setHours(date, hour), minute);
            const utcTime = fromZonedTime2(recipientTime, recipientTimezone);
            const slotEnd = addHours(utcTime, 0.5);
            const isAvailable = await this.checkSlotAvailability(
              account,
              accountType,
              utcTime,
              slotEnd
            );
            slots.push({
              startTime: utcTime,
              endTime: slotEnd,
              isAvailable,
              isDoubleBooking: false,
              accountId: account.id,
              accountType,
              timezone: recipientTimezone
            });
          }
        }
        return slots.filter((slot) => slot.isAvailable);
      }
      /**
       * Check if a specific time slot is available for an account
       */
      async checkSlotAvailability(account, accountType, startTime, endTime) {
        try {
          const existingInvites = await storage.getScheduledInvitesByTimeRange(
            account.id,
            accountType,
            startTime,
            endTime
          );
          if (existingInvites.length > 0) {
            return false;
          }
          const busyTimes = await this.getCalendarBusyTimes(account, accountType, startTime, endTime);
          for (const busyTime of busyTimes) {
            if (this.timesOverlap(startTime, endTime, busyTime.startTime, busyTime.endTime)) {
              return false;
            }
          }
          return true;
        } catch (error) {
          console.error("Error checking slot availability:", error);
          return false;
        }
      }
      /**
       * Get busy times from calendar API
       */
      async getCalendarBusyTimes(account, accountType, startTime, endTime) {
        try {
          if (accountType === "google") {
            return await this.getGoogleCalendarBusyTimes(account, startTime, endTime);
          } else {
            return await this.getMicrosoftCalendarBusyTimes(account, startTime, endTime);
          }
        } catch (error) {
          console.error("Error fetching calendar busy times:", error);
          return [];
        }
      }
      /**
       * Get busy times from Google Calendar
       */
      async getGoogleCalendarBusyTimes(account, startTime, endTime) {
        return [];
      }
      /**
       * Get busy times from Microsoft Calendar
       */
      async getMicrosoftCalendarBusyTimes(account, startTime, endTime) {
        return [];
      }
      /**
       * Check if two time ranges overlap
       */
      timesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && end1 > start2;
      }
      /**
       * Find slots that could be double-booked
       */
      async findDoubleBookingSlots(senderAccounts, schedulingRange, recipientTimezone, settings) {
        const doubleBookingSlots = [];
        for (const account of senderAccounts) {
          const accountType = "microsoftId" in account ? "microsoft" : "google";
          const existingInvites = await storage.getScheduledInvitesByAccount(
            account.id,
            accountType,
            ["pending", "sent"]
          );
          for (const invite of existingInvites) {
            if (invite.wasDoubleBooked) continue;
            const slotEnd = addHours(invite.scheduledTimeUtc, 0.5);
            const doubleBookingCount = await storage.getDoubleBookingCount(
              account.id,
              accountType,
              invite.scheduledTimeUtc,
              slotEnd
            );
            if (doubleBookingCount < settings.maxDoubleBookingsPerSlot) {
              doubleBookingSlots.push({
                startTime: invite.scheduledTimeUtc,
                endTime: slotEnd,
                isAvailable: true,
                isDoubleBooking: true,
                accountId: account.id,
                accountType,
                timezone: recipientTimezone
              });
            }
          }
        }
        return doubleBookingSlots;
      }
      /**
       * Select the optimal slot from available options
       */
      selectOptimalSlot(slots, settings) {
        const sortedSlots = slots.sort((a, b) => {
          if (a.isDoubleBooking !== b.isDoubleBooking) {
            return a.isDoubleBooking ? 1 : -1;
          }
          return a.startTime.getTime() - b.startTime.getTime();
        });
        const topSlots = sortedSlots.slice(0, Math.min(3, sortedSlots.length));
        return topSlots[Math.floor(Math.random() * topSlots.length)];
      }
      /**
       * Create a scheduled invite record
       */
      async createScheduledInvite(request, slot, settings, isDoubleBooking) {
        try {
          const recipientTimezone = this.determineRecipientTimezone(
            request.recipientTimezone,
            request.recipientEmail,
            settings.enableTimezoneDetection
          );
          const scheduledInvite = {
            campaignId: request.campaignId,
            userId: request.userId,
            recipientEmail: request.recipientEmail,
            recipientName: request.recipientName,
            recipientTimezone,
            scheduledTimeUtc: slot.startTime,
            scheduledTimeLocal: toZonedTime2(slot.startTime, recipientTimezone),
            status: "pending",
            senderAccountId: slot.accountId,
            senderAccountType: slot.accountType,
            wasDoubleBooked: isDoubleBooking,
            leadTimeDays: settings.minLeadTimeDays,
            metadata: {
              selectedFromSlots: 1,
              schedulingMethod: "automatic",
              fallbackUsed: false
            }
          };
          const created = await storage.createScheduledInvite(scheduledInvite);
          await storage.createActivityLog({
            eventType: "invite_scheduled",
            action: "schedule",
            description: `Scheduled invite for ${request.recipientEmail} at ${format2(slot.startTime, "PPpp")}`,
            severity: "info",
            userId: request.userId,
            campaignId: request.campaignId,
            recipientEmail: request.recipientEmail,
            recipientName: request.recipientName,
            inboxId: slot.accountId,
            inboxType: slot.accountType,
            metadata: {
              scheduledTime: slot.startTime.toISOString(),
              timezone: recipientTimezone,
              wasDoubleBooked: isDoubleBooking
            }
          });
          return { success: true, scheduledInvite: created };
        } catch (error) {
          console.error("Error creating scheduled invite:", error);
          return { success: false, error: "Failed to create scheduled invite" };
        }
      }
      /**
       * Sort and deduplicate time slots
       */
      sortAndDeduplicateSlots(slots) {
        const uniqueSlots = /* @__PURE__ */ new Map();
        for (const slot of slots) {
          const key = `${slot.startTime.toISOString()}-${slot.accountId}-${slot.accountType}`;
          if (!uniqueSlots.has(key)) {
            uniqueSlots.set(key, slot);
          }
        }
        return Array.from(uniqueSlots.values()).sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime()
        );
      }
      /**
       * Reschedule an existing invite
       */
      async rescheduleInvite(inviteId, newTimeSlot, userId) {
        try {
          const existingInvite = await storage.getScheduledInvite(inviteId, userId);
          if (!existingInvite) {
            return { success: false, error: "Invite not found" };
          }
          const updates = {
            scheduledTimeUtc: newTimeSlot.startTime,
            scheduledTimeLocal: toZonedTime2(newTimeSlot.startTime, existingInvite.recipientTimezone),
            senderAccountId: newTimeSlot.accountId,
            senderAccountType: newTimeSlot.accountType,
            wasDoubleBooked: newTimeSlot.isDoubleBooking,
            originalScheduledTime: existingInvite.originalScheduledTime || existingInvite.scheduledTimeUtc,
            rescheduledCount: existingInvite.rescheduledCount + 1,
            status: "pending",
            updatedAt: /* @__PURE__ */ new Date()
          };
          const updated = await storage.updateScheduledInvite(inviteId, updates, userId);
          await storage.createActivityLog({
            eventType: "invite_rescheduled",
            action: "reschedule",
            description: `Rescheduled invite for ${existingInvite.recipientEmail} from ${format2(existingInvite.scheduledTimeUtc, "PPpp")} to ${format2(newTimeSlot.startTime, "PPpp")}`,
            severity: "info",
            userId,
            campaignId: existingInvite.campaignId,
            recipientEmail: existingInvite.recipientEmail,
            recipientName: existingInvite.recipientName,
            inboxId: newTimeSlot.accountId,
            inboxType: newTimeSlot.accountType,
            metadata: {
              originalTime: existingInvite.scheduledTimeUtc.toISOString(),
              newTime: newTimeSlot.startTime.toISOString(),
              rescheduledCount: updates.rescheduledCount
            }
          });
          return { success: true, scheduledInvite: updated };
        } catch (error) {
          console.error("Error rescheduling invite:", error);
          return { success: false, error: "Failed to reschedule invite" };
        }
      }
      /**
       * Get available slots for manual scheduling
       */
      async getAvailableSlots(userId, campaignId, dateRange, recipientTimezone = "America/New_York") {
        try {
          const settings = await this.getSchedulingSettings(userId, campaignId);
          const senderAccounts = await this.getAvailableSenderAccounts(userId);
          return await this.findAvailableTimeSlots(
            senderAccounts,
            dateRange,
            recipientTimezone,
            settings
          );
        } catch (error) {
          console.error("Error getting available slots:", error);
          return [];
        }
      }
    };
    advancedScheduler = new AdvancedSchedulerService();
  }
});

// server/auth.ts
import bcrypt from "bcryptjs";
import { eq as eq3 } from "drizzle-orm";
async function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const [user] = await db.select().from(users).where(eq3(users.id, req.session.userId));
    if (!user) {
      req.session.userId = void 0;
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }
  return { valid: true };
}
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/services/prospect-scraper.ts
import * as cheerio from "cheerio";
import { chromium } from "playwright";
var ProspectScraper, prospectScraper;
var init_prospect_scraper = __esm({
  "server/services/prospect-scraper.ts"() {
    "use strict";
    ProspectScraper = class _ProspectScraper {
      static instance;
      userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
      static getInstance() {
        if (!_ProspectScraper.instance) {
          _ProspectScraper.instance = new _ProspectScraper();
        }
        return _ProspectScraper.instance;
      }
      /**
       * Extract company description from website
       */
      async scrapeCompanyDescription(domain) {
        const cleanDomain = this.cleanDomain(domain);
        const url = `https://${cleanDomain}`;
        try {
          const cheerioResult = await this.scrapeWithCheerio(url);
          if (cheerioResult.success && cheerioResult.description.length > 100) {
            return cheerioResult;
          }
        } catch (error) {
          console.log(`Cheerio failed for ${domain}:`, error);
        }
        try {
          const playwrightResult = await this.scrapeWithPlaywright(url);
          if (playwrightResult.success) {
            return playwrightResult;
          }
        } catch (error) {
          console.log(`Playwright failed for ${domain}:`, error);
        }
        return {
          success: false,
          description: "",
          error: "Unable to scrape website content",
          method: "fallback"
        };
      }
      /**
       * Fast scraping with Cheerio for static content
       */
      async scrapeWithCheerio(url) {
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
          },
          signal: AbortSignal.timeout(1e4)
          // 10 second timeout
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const descriptions = [];
        const metaDesc = $('meta[name="description"]').attr("content");
        if (metaDesc && metaDesc.length > 20) {
          descriptions.push(metaDesc.trim());
        }
        const heroSelectors = [
          ".hero h1, .hero h2, .hero p",
          ".banner h1, .banner h2, .banner p",
          ".jumbotron h1, .jumbotron h2, .jumbotron p",
          "section:first-of-type h1, section:first-of-type h2, section:first-of-type p"
        ];
        for (const selector of heroSelectors) {
          $(selector).each((_, el) => {
            const text2 = $(el).text().trim();
            if (text2.length > 30 && text2.length < 500) {
              descriptions.push(text2);
            }
          });
        }
        const aboutSelectors = [
          '[class*="about"] p',
          '[id*="about"] p',
          '[class*="company"] p',
          '[class*="description"] p',
          ".intro p, .overview p"
        ];
        for (const selector of aboutSelectors) {
          $(selector).each((_, el) => {
            const text2 = $(el).text().trim();
            if (text2.length > 50 && text2.length < 800) {
              descriptions.push(text2);
            }
          });
        }
        const combinedDescription = descriptions.slice(0, 5).join(" ").substring(0, 2e3);
        return {
          success: combinedDescription.length > 50,
          description: this.cleanDescription(combinedDescription),
          method: "cheerio"
        };
      }
      /**
       * Advanced scraping with Playwright for dynamic content
       */
      async scrapeWithPlaywright(url) {
        const browser = await chromium.launch({ headless: true });
        try {
          const context = await browser.newContext({
            userAgent: this.userAgent,
            viewport: { width: 1920, height: 1080 }
          });
          const page = await context.newPage();
          await page.setDefaultTimeout(15e3);
          await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot}", (route) => route.abort());
          await page.goto(url, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(2e3);
          const content = await page.evaluate(() => {
            const descriptions = [];
            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
            if (metaDesc && metaDesc.length > 20) {
              descriptions.push(metaDesc.trim());
            }
            const heroSelectors = [
              ".hero",
              ".banner",
              ".jumbotron",
              "section:first-of-type",
              '[class*="hero"]',
              '[class*="banner"]',
              '[class*="intro"]'
            ];
            for (const selector of heroSelectors) {
              const elements = document.querySelectorAll(`${selector} h1, ${selector} h2, ${selector} p`);
              elements.forEach((el) => {
                const text2 = el.textContent?.trim() || "";
                if (text2.length > 30 && text2.length < 500) {
                  descriptions.push(text2);
                }
              });
            }
            const aboutSelectors = [
              '[class*="about"]',
              '[id*="about"]',
              '[class*="company"]',
              '[class*="description"]',
              ".intro",
              ".overview"
            ];
            for (const selector of aboutSelectors) {
              const elements = document.querySelectorAll(`${selector} p`);
              elements.forEach((el) => {
                const text2 = el.textContent?.trim() || "";
                if (text2.length > 50 && text2.length < 800) {
                  descriptions.push(text2);
                }
              });
            }
            return descriptions.slice(0, 5).join(" ").substring(0, 2e3);
          });
          await context.close();
          return {
            success: content.length > 50,
            description: this.cleanDescription(content),
            method: "playwright"
          };
        } finally {
          await browser.close();
        }
      }
      /**
       * Clean and normalize domain
       */
      cleanDomain(domain) {
        return domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim().toLowerCase();
      }
      /**
       * Clean and format description text
       */
      cleanDescription(text2) {
        return text2.replace(/\s+/g, " ").replace(/[^\w\s.,!?;:()\-'"]/g, "").trim().substring(0, 1500);
      }
      /**
       * Extract domain from company name using heuristics
       */
      extractDomainFromCompanyName(companyName) {
        const suggestions = [];
        const cleaned = companyName.toLowerCase().replace(/\b(inc|corp|corporation|company|co|ltd|limited|llc|llp)\b/g, "").replace(/[^a-z0-9\s]/g, "").trim();
        const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
        if (words.length === 1) {
          suggestions.push(`${words[0]}.com`);
          suggestions.push(`${words[0]}.io`);
        } else if (words.length === 2) {
          suggestions.push(`${words.join("")}.com`);
          suggestions.push(`${words[0]}${words[1]}.com`);
          suggestions.push(`${words[0]}.com`);
        } else {
          suggestions.push(`${words.slice(0, 2).join("")}.com`);
          suggestions.push(`${words[0]}.com`);
        }
        return suggestions;
      }
    };
    prospectScraper = ProspectScraper.getInstance();
  }
});

// server/services/openai-classifier.ts
import OpenAI from "openai";
var OpenAIClassifier, openaiClassifier;
var init_openai_classifier = __esm({
  "server/services/openai-classifier.ts"() {
    "use strict";
    OpenAIClassifier = class _OpenAIClassifier {
      static instance;
      openai;
      constructor() {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY environment variable is required");
        }
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      }
      static getInstance() {
        if (!_OpenAIClassifier.instance) {
          _OpenAIClassifier.instance = new _OpenAIClassifier();
        }
        return _OpenAIClassifier.instance;
      }
      /**
       * Classify company and find competitors using GPT-4
       */
      async classifyCompany(input) {
        const prompt = this.buildClassificationPrompt(input);
        try {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-4o",
            // Using latest GPT-4o model
            messages: [
              {
                role: "system",
                content: "You are an expert business analyst specializing in industry classification and competitive analysis. Provide accurate, data-driven assessments."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3,
            // Lower temperature for more consistent results
            max_tokens: 1e3,
            response_format: { type: "json_object" }
          });
          const response = completion.choices[0]?.message?.content;
          if (!response) {
            throw new Error("No response from OpenAI");
          }
          const parsedResponse = JSON.parse(response);
          return {
            status: parsedResponse.status || "grey_area",
            confidence: Math.min(100, Math.max(1, parsedResponse.confidence || 50)),
            competitors: Array.isArray(parsedResponse.competitors) ? parsedResponse.competitors.slice(0, 5) : [],
            reasoning: parsedResponse.reasoning || "No reasoning provided",
            rawResponse: parsedResponse
          };
        } catch (error) {
          console.error("OpenAI classification error:", error);
          throw new Error(`Classification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      /**
       * Build structured prompt for classification
       */
      buildClassificationPrompt(input) {
        const keywordsSection = input.industryKeywords && input.industryKeywords.length > 0 ? `Industry Keywords: ${input.industryKeywords.join(", ")}` : "";
        return `
Analyze the following company and determine if it belongs to the target industry:

**Company Name:** ${input.companyName}
**Company Description:** ${input.companyDescription}
**Target Industry:** ${input.targetIndustry}
${keywordsSection}

**Task:**
1. Determine if this company belongs to the target industry
2. Provide a confidence level (1-100)
3. Identify 2-3 closest competitors in the same space
4. Explain your reasoning

**Classification Options:**
- "confirmed": Clear match with target industry
- "rejected": Clearly not in target industry  
- "grey_area": Uncertain, borderline case, or insufficient information

**Response Format (JSON only):**
{
  "status": "confirmed|rejected|grey_area",
  "confidence": 85,
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "reasoning": "Detailed explanation of why this company fits/doesn't fit the target industry, including specific evidence from the description."
}

**Guidelines:**
- Be conservative: when uncertain, use "grey_area"
- Competitors should be real, well-known companies in the same specific niche
- Confidence should reflect certainty level (confirmed: 70-100, grey_area: 30-70, rejected: 1-30)
- Reasoning should cite specific evidence from the company description
- If description is too vague or generic, lean towards "grey_area"
`.trim();
      }
      /**
       * Build industry template with reusable prompt
       */
      buildIndustryTemplate(industry, keywords, description) {
        const classificationPrompt = `
You are analyzing companies to determine if they belong to the "${industry}" industry.

Key characteristics of ${industry} companies:
${keywords.map((k) => `- ${k}`).join("\n")}

${description ? `Additional context: ${description}` : ""}

Classify each company as:
- "confirmed": Clear ${industry} company with strong indicators
- "rejected": Clearly not ${industry} related
- "grey_area": Uncertain or borderline case

Focus on core business activities, not just technology used or services offered.
`.trim();
        const competitorPrompt = `
When identifying competitors for ${industry} companies, focus on:
- Companies with similar target markets
- Similar service/product offerings
- Similar business models
- Direct competitive relationships

Provide 2-3 well-known, relevant competitors when possible.
`.trim();
        return { classificationPrompt, competitorPrompt };
      }
      /**
       * Test OpenAI connection
       */
      async testConnection() {
        try {
          const completion = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Test connection. Respond with 'OK'." }],
            max_tokens: 10
          });
          return { success: !!completion.choices[0]?.message?.content };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }
    };
    openaiClassifier = OpenAIClassifier.getInstance();
  }
});

// server/services/prospect-processor.ts
var ProspectProcessor, prospectProcessor;
var init_prospect_processor = __esm({
  "server/services/prospect-processor.ts"() {
    "use strict";
    init_prospect_scraper();
    init_openai_classifier();
    init_storage();
    ProspectProcessor = class _ProspectProcessor {
      static instance;
      processingJobs = /* @__PURE__ */ new Map();
      activeProcessing = /* @__PURE__ */ new Set();
      static getInstance() {
        if (!_ProspectProcessor.instance) {
          _ProspectProcessor.instance = new _ProspectProcessor();
        }
        return _ProspectProcessor.instance;
      }
      /**
       * Start processing a batch of prospects
       */
      async startProcessing(job) {
        const { batchId, userId, prospects: prospects3, targetIndustry, industryKeywords } = job;
        if (this.activeProcessing.has(batchId)) {
          throw new Error(`Batch ${batchId} is already being processed`);
        }
        this.activeProcessing.add(batchId);
        this.processingJobs.set(batchId, {
          batchId,
          totalRecords: prospects3.length,
          processedRecords: 0,
          confirmedRecords: 0,
          rejectedRecords: 0,
          greyAreaRecords: 0,
          status: "processing"
        });
        await this.logProcessingStep(
          batchId,
          userId,
          "processing",
          "started",
          `Started processing batch ${batchId} with ${prospects3.length} prospects`
        );
        this.processProspectsAsync(job).catch(async (error) => {
          console.error(`Processing failed for batch ${batchId}:`, error);
          await this.handleProcessingError(batchId, userId, error);
        });
      }
      /**
       * Get processing progress for a batch
       */
      getProgress(batchId) {
        return this.processingJobs.get(batchId);
      }
      /**
       * Process all prospects in a batch
       */
      async processProspectsAsync(job) {
        const { batchId, userId, prospects: prospects3, targetIndustry, industryKeywords } = job;
        const progress = this.processingJobs.get(batchId);
        try {
          const batchSize = 3;
          for (let i = 0; i < prospects3.length; i += batchSize) {
            const batch = prospects3.slice(i, i + batchSize);
            await Promise.all(
              batch.map((prospect) => this.processIndividualProspect({
                batchId,
                userId,
                prospect,
                targetIndustry,
                industryKeywords
              }))
            );
            progress.processedRecords = Math.min(i + batchSize, prospects3.length);
            if (i + batchSize < prospects3.length) {
              await new Promise((resolve) => setTimeout(resolve, 1e3));
            }
          }
          progress.status = "completed";
          await storage.updateProspectBatch(batchId, {
            status: "completed",
            processedRecords: progress.processedRecords,
            confirmedRecords: progress.confirmedRecords,
            rejectedRecords: progress.rejectedRecords,
            greyAreaRecords: progress.greyAreaRecords,
            updatedAt: /* @__PURE__ */ new Date()
          });
          await this.logProcessingStep(
            batchId,
            userId,
            "completion",
            "completed",
            `Completed processing batch ${batchId}. Results: ${progress.confirmedRecords} confirmed, ${progress.rejectedRecords} rejected, ${progress.greyAreaRecords} grey area`
          );
        } catch (error) {
          await this.handleProcessingError(batchId, userId, error);
        } finally {
          this.activeProcessing.delete(batchId);
        }
      }
      /**
       * Process a single prospect
       */
      async processIndividualProspect({
        batchId,
        userId,
        prospect,
        targetIndustry,
        industryKeywords
      }) {
        const startTime = Date.now();
        try {
          const prospectRecord = await storage.createProspect({
            batchId,
            userId,
            originalCompanyName: prospect.originalCompanyName,
            websiteDomain: prospect.websiteDomain,
            cleanedCompanyName: this.cleanCompanyName(prospect.originalCompanyName),
            scrapingStatus: "pending",
            classificationStatus: "pending"
          });
          let companyDescription = "";
          let scrapingStatus = "failed";
          let scrapingError;
          if (prospect.websiteDomain) {
            try {
              const scrapingResult = await prospectScraper.scrapeCompanyDescription(prospect.websiteDomain);
              if (scrapingResult.success) {
                companyDescription = scrapingResult.description;
                scrapingStatus = "success";
              } else {
                scrapingError = scrapingResult.error;
              }
            } catch (error) {
              scrapingError = error instanceof Error ? error.message : "Unknown scraping error";
            }
          } else {
            const suggestedDomains = prospectScraper.extractDomainFromCompanyName(prospect.originalCompanyName);
            for (const domain of suggestedDomains) {
              try {
                const scrapingResult = await prospectScraper.scrapeCompanyDescription(domain);
                if (scrapingResult.success && scrapingResult.description.length > 100) {
                  companyDescription = scrapingResult.description;
                  scrapingStatus = "success";
                  await storage.updateProspect(prospectRecord.id, { websiteDomain: domain });
                  break;
                }
              } catch (error) {
              }
            }
            if (scrapingStatus === "failed") {
              scrapingError = "No valid domain found and unable to scrape content";
            }
          }
          await storage.updateProspect(prospectRecord.id, {
            companyDescription,
            scrapingStatus,
            scrapingError
          });
          let classificationStatus = "failed";
          let industryMatch;
          let confidence;
          let competitors = [];
          let reasoning = "";
          let openaiPrompt = "";
          let openaiResponse;
          try {
            const descriptionToAnalyze = companyDescription || `Company name: ${prospect.originalCompanyName}`;
            const classificationResult = await openaiClassifier.classifyCompany({
              companyName: prospect.originalCompanyName,
              companyDescription: descriptionToAnalyze,
              targetIndustry,
              industryKeywords
            });
            industryMatch = classificationResult.status;
            confidence = classificationResult.confidence;
            competitors = classificationResult.competitors;
            reasoning = classificationResult.reasoning;
            openaiResponse = classificationResult.rawResponse;
            classificationStatus = "completed";
            const progress = this.processingJobs.get(batchId);
            if (industryMatch === "confirmed") progress.confirmedRecords++;
            else if (industryMatch === "rejected") progress.rejectedRecords++;
            else progress.greyAreaRecords++;
          } catch (error) {
            reasoning = error instanceof Error ? error.message : "Classification failed";
          }
          await storage.updateProspect(prospectRecord.id, {
            classificationStatus,
            industryMatch,
            confidence,
            competitors,
            classificationReasoning: reasoning,
            openaiPrompt,
            openaiResponse
          });
          const executionTime = Date.now() - startTime;
          await this.logProcessingStep(
            batchId,
            userId,
            "classification",
            "completed",
            `Processed ${prospect.originalCompanyName}: ${industryMatch || "failed"} (${confidence || 0}% confidence)`,
            prospectRecord.id,
            { executionTime, scrapingStatus, classificationStatus }
          );
        } catch (error) {
          const executionTime = Date.now() - startTime;
          await this.logProcessingStep(
            batchId,
            userId,
            "classification",
            "failed",
            `Failed to process ${prospect.originalCompanyName}: ${error instanceof Error ? error.message : "Unknown error"}`,
            void 0,
            { executionTime }
          );
          throw error;
        }
      }
      /**
       * Handle processing errors
       */
      async handleProcessingError(batchId, userId, error) {
        const progress = this.processingJobs.get(batchId);
        if (progress) {
          progress.status = "failed";
          progress.error = error instanceof Error ? error.message : "Unknown processing error";
        }
        await storage.updateProspectBatch(batchId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown processing error"
        });
        await this.logProcessingStep(
          batchId,
          userId,
          "processing",
          "failed",
          `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
      /**
       * Log processing step
       */
      async logProcessingStep(batchId, userId, step, status, message, prospectId, metadata) {
        try {
          await storage.createProspectProcessingLog({
            batchId,
            userId,
            prospectId,
            step,
            status,
            message,
            metadata: metadata || {},
            executionTime: metadata?.executionTime
          });
        } catch (error) {
          console.error("Failed to log processing step:", error);
        }
      }
      /**
       * Clean company name for consistency
       */
      cleanCompanyName(name) {
        return name.replace(/\b(inc|corp|corporation|company|co|ltd|limited|llc|llp)\b\.?/gi, "").replace(/[^\w\s]/g, "").trim().replace(/\s+/g, " ");
      }
      /**
       * Stop processing a batch (if needed)
       */
      async stopProcessing(batchId) {
        this.activeProcessing.delete(batchId);
        const progress = this.processingJobs.get(batchId);
        if (progress && progress.status === "processing") {
          progress.status = "failed";
          progress.error = "Processing stopped by user";
          await storage.updateProspectBatch(batchId, {
            status: "failed",
            error: "Processing stopped by user"
          });
        }
      }
    };
    prospectProcessor = ProspectProcessor.getInstance();
  }
});

// server/services/file-processor.ts
import * as XLSX from "xlsx";
var FileProcessor, fileProcessor;
var init_file_processor = __esm({
  "server/services/file-processor.ts"() {
    "use strict";
    init_prospect_processor();
    init_storage();
    FileProcessor = class _FileProcessor {
      static instance;
      static getInstance() {
        if (!_FileProcessor.instance) {
          _FileProcessor.instance = new _FileProcessor();
        }
        return _FileProcessor.instance;
      }
      /**
       * Process uploaded CSV or Excel file
       */
      async processFile(fileBuffer, fileName, userId, targetIndustry, mimeType) {
        try {
          const prospects3 = await this.parseFile(fileBuffer, fileName, mimeType);
          if (prospects3.length === 0) {
            return { success: false, error: "No valid records found in file" };
          }
          if (prospects3.length > 1e3) {
            return { success: false, error: "File contains too many records. Maximum 1000 prospects per batch." };
          }
          const batch = await storage.createProspectBatch({
            userId,
            fileName,
            targetIndustry,
            totalRecords: prospects3.length,
            status: "processing"
          });
          prospectProcessor.startProcessing({
            batchId: batch.id,
            userId,
            prospects: prospects3,
            targetIndustry,
            industryKeywords: []
            // TODO: Add industry keywords from templates
          });
          return {
            success: true,
            batchId: batch.id,
            totalRecords: prospects3.length,
            preview: prospects3.slice(0, 5)
            // Return first 5 for preview
          };
        } catch (error) {
          console.error("File processing error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown file processing error"
          };
        }
      }
      /**
       * Parse CSV or Excel file
       */
      async parseFile(fileBuffer, fileName, mimeType) {
        let workbook;
        if (fileName.endsWith(".csv") || mimeType.includes("csv")) {
          const csvText = fileBuffer.toString("utf-8");
          workbook = XLSX.read(csvText, { type: "string" });
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || mimeType.includes("spreadsheet")) {
          workbook = XLSX.read(fileBuffer, { type: "buffer" });
        } else {
          throw new Error("Unsupported file format. Please upload a CSV or Excel file.");
        }
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error("File contains no sheets");
        }
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawData.length < 2) {
          throw new Error("File must contain at least a header row and one data row");
        }
        const headers = rawData[0].map((h) => h?.toString().toLowerCase().trim() || "");
        const companyNameIndex = this.findColumnIndex(headers, ["company", "company_name", "company name", "business", "organization", "name"]);
        const domainIndex = this.findColumnIndex(headers, ["domain", "website", "url", "site", "web", "domain_name"]);
        if (companyNameIndex === -1) {
          throw new Error("Could not find company name column. Expected headers: company, company_name, name, business, organization");
        }
        const prospects3 = [];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          const companyName = row[companyNameIndex]?.toString().trim();
          if (!companyName || companyName.length < 2) {
            continue;
          }
          const websiteDomain = domainIndex !== -1 ? row[domainIndex]?.toString().trim() : void 0;
          prospects3.push({
            originalCompanyName: companyName,
            websiteDomain: websiteDomain && websiteDomain.length > 3 ? this.cleanDomain(websiteDomain) : void 0
          });
        }
        return prospects3;
      }
      /**
       * Find column index by possible header names
       */
      findColumnIndex(headers, possibleNames) {
        for (const name of possibleNames) {
          const index2 = headers.findIndex((h) => h.includes(name));
          if (index2 !== -1) return index2;
        }
        return -1;
      }
      /**
       * Clean and normalize domain
       */
      cleanDomain(domain) {
        return domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim().toLowerCase();
      }
      /**
       * Validate file before processing
       */
      validateFile(fileBuffer, fileName, mimeType) {
        if (fileBuffer.length > 10 * 1024 * 1024) {
          return { valid: false, error: "File size exceeds 10MB limit" };
        }
        const validExtensions = [".csv", ".xlsx", ".xls"];
        const validMimeTypes = [
          "text/csv",
          "application/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];
        const hasValidExtension = validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
        const hasValidMimeType = validMimeTypes.some((type) => mimeType.includes(type));
        if (!hasValidExtension && !hasValidMimeType) {
          return { valid: false, error: "Invalid file type. Please upload a CSV or Excel file." };
        }
        return { valid: true };
      }
      /**
       * Generate sample CSV template for download
       */
      generateSampleCSV() {
        const sampleData = [
          ["company_name", "website"],
          ["Acme Corporation", "acme.com"],
          ["TechStart Inc", "techstart.io"],
          ["Global Solutions LLC", "globalsolutions.com"],
          ["Innovation Labs", "innovationlabs.co"]
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
        return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "csv" }));
      }
      /**
       * Export processed results to Excel
       */
      async exportResults(batchId, userId) {
        const prospects3 = await storage.getProspectsByBatch(batchId, userId);
        const exportData = [
          ["Company Name", "Website", "Industry Match", "Confidence", "Competitors", "Notes"]
        ];
        for (const prospect of prospects3) {
          const competitors = Array.isArray(prospect.competitors) ? prospect.competitors.join(", ") : "";
          exportData.push([
            prospect.originalCompanyName,
            prospect.websiteDomain || "",
            prospect.manualStatus || prospect.industryMatch || "",
            prospect.confidence ? `${prospect.confidence}%` : "",
            competitors,
            prospect.notes || ""
          ]);
        }
        const worksheet = XLSX.utils.aoa_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
        return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
      }
    };
    fileProcessor = FileProcessor.getInstance();
  }
});

// server/routes/prospect-validation.ts
import { Router } from "express";
import multer from "multer";
var router, upload;
var init_prospect_validation = __esm({
  "server/routes/prospect-validation.ts"() {
    "use strict";
    init_file_processor();
    init_prospect_processor();
    init_openai_classifier();
    init_storage();
    init_auth();
    router = Router();
    upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          "text/csv",
          "application/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
          cb(null, true);
        } else {
          cb(new Error("Invalid file type. Please upload CSV or Excel files only."));
        }
      }
    });
    router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
      try {
        const { targetIndustry } = req.body;
        const file = req.file;
        const userId = req.user.id;
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        if (!targetIndustry || typeof targetIndustry !== "string") {
          return res.status(400).json({ error: "Target industry is required" });
        }
        const validation = fileProcessor.validateFile(file.buffer, file.originalname, file.mimetype);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
        const result = await fileProcessor.processFile(
          file.buffer,
          file.originalname,
          userId,
          targetIndustry.trim(),
          file.mimetype
        );
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        res.json({
          success: true,
          batchId: result.batchId,
          totalRecords: result.totalRecords,
          preview: result.preview,
          message: `Processing started for ${result.totalRecords} prospects`
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
          error: "Failed to process upload",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    router.get("/batches/:id/progress", requireAuth, async (req, res) => {
      try {
        const batchId = parseInt(req.params.id);
        const userId = req.user.id;
        const batch = await storage.getProspectBatch(batchId, userId);
        if (!batch) {
          return res.status(404).json({ error: "Batch not found" });
        }
        const progress = prospectProcessor.getProgress(batchId);
        res.json({
          batchId,
          ...progress,
          batch: {
            id: batch.id,
            fileName: batch.fileName,
            targetIndustry: batch.targetIndustry,
            status: batch.status,
            error: batch.error,
            createdAt: batch.createdAt
          }
        });
      } catch (error) {
        console.error("Progress check error:", error);
        res.status(500).json({ error: "Failed to get progress" });
      }
    });
    router.get("/batches", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const batches = await storage.getProspectBatches(userId);
        res.json(batches);
      } catch (error) {
        console.error("Get batches error:", error);
        res.status(500).json({ error: "Failed to get batches" });
      }
    });
    router.get("/batches/:id/prospects", requireAuth, async (req, res) => {
      try {
        const batchId = parseInt(req.params.id);
        const userId = req.user.id;
        const batch = await storage.getProspectBatch(batchId, userId);
        if (!batch) {
          return res.status(404).json({ error: "Batch not found" });
        }
        const prospects3 = await storage.getProspectsByBatch(batchId, userId);
        res.json({
          batch,
          prospects: prospects3
        });
      } catch (error) {
        console.error("Get prospects error:", error);
        res.status(500).json({ error: "Failed to get prospects" });
      }
    });
    router.patch("/prospects/:id", requireAuth, async (req, res) => {
      try {
        const prospectId = parseInt(req.params.id);
        const userId = req.user.id;
        const { manualStatus, manualCompetitors, notes } = req.body;
        const prospect = await storage.getProspect(prospectId, userId);
        if (!prospect) {
          return res.status(404).json({ error: "Prospect not found" });
        }
        const updated = await storage.updateProspect(prospectId, {
          manualStatus: manualStatus || prospect.manualStatus,
          manualCompetitors: manualCompetitors || prospect.manualCompetitors,
          notes: notes !== void 0 ? notes : prospect.notes,
          manualOverride: true
        });
        res.json(updated);
      } catch (error) {
        console.error("Update prospect error:", error);
        res.status(500).json({ error: "Failed to update prospect" });
      }
    });
    router.get("/batches/:id/export", requireAuth, async (req, res) => {
      try {
        const batchId = parseInt(req.params.id);
        const userId = req.user.id;
        const batch = await storage.getProspectBatch(batchId, userId);
        if (!batch) {
          return res.status(404).json({ error: "Batch not found" });
        }
        const exportBuffer = await fileProcessor.exportResults(batchId, userId);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="prospect-validation-${batch.fileName}-${Date.now()}.xlsx"`);
        res.send(exportBuffer);
      } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Failed to export results" });
      }
    });
    router.get("/sample-template", (req, res) => {
      try {
        const sampleBuffer = fileProcessor.generateSampleCSV();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="prospect-upload-template.csv"');
        res.send(sampleBuffer);
      } catch (error) {
        console.error("Sample template error:", error);
        res.status(500).json({ error: "Failed to generate sample template" });
      }
    });
    router.delete("/batches/:id", requireAuth, async (req, res) => {
      try {
        const batchId = parseInt(req.params.id);
        const userId = req.user.id;
        const batch = await storage.getProspectBatch(batchId, userId);
        if (!batch) {
          return res.status(404).json({ error: "Batch not found" });
        }
        if (batch.status === "processing") {
          await prospectProcessor.stopProcessing(batchId);
        }
        await storage.deleteProspectBatch(batchId, userId);
        res.json({ success: true, message: "Batch deleted successfully" });
      } catch (error) {
        console.error("Delete batch error:", error);
        res.status(500).json({ error: "Failed to delete batch" });
      }
    });
    router.get("/test-openai", requireAuth, async (req, res) => {
      try {
        const testResult = await openaiClassifier.testConnection();
        res.json(testResult);
      } catch (error) {
        console.error("OpenAI test error:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    router.get("/templates", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const templates = await storage.getIndustryTemplates(userId);
        res.json(templates);
      } catch (error) {
        console.error("Get templates error:", error);
        res.status(500).json({ error: "Failed to get templates" });
      }
    });
    router.post("/templates", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const { name, description, industryKeywords } = req.body;
        if (!name || !Array.isArray(industryKeywords)) {
          return res.status(400).json({ error: "Name and industry keywords are required" });
        }
        const { classificationPrompt, competitorPrompt } = openaiClassifier.buildIndustryTemplate(
          name,
          industryKeywords,
          description
        );
        const template = await storage.createIndustryTemplate({
          userId,
          name,
          description,
          industryKeywords,
          classificationPrompt,
          competitorPrompt
        });
        res.json(template);
      } catch (error) {
        console.error("Create template error:", error);
        res.status(500).json({ error: "Failed to create template" });
      }
    });
  }
});

// server/services/activity-logger.ts
var ActivityLoggerService, activityLogger;
var init_activity_logger = __esm({
  "server/services/activity-logger.ts"() {
    "use strict";
    init_storage();
    ActivityLoggerService = class {
      /**
       * Log an invite-related event
       */
      async logInviteEvent(params) {
        try {
          const logData = {
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
            severity: params.severity || "info",
            metadata: params.metadata || {}
          };
          await storage.createActivityLog(logData);
        } catch (error) {
          console.error("Failed to log invite event:", error);
        }
      }
      /**
       * Log an inbox-related event
       */
      async logInboxEvent(params) {
        try {
          const logData = {
            userId: params.userId,
            eventType: params.eventType,
            action: params.action,
            description: params.description,
            inboxId: params.inboxId,
            inboxType: params.inboxType,
            severity: params.severity || "info",
            metadata: {
              ...params.metadata,
              inboxEmail: params.inboxEmail
            }
          };
          await storage.createActivityLog(logData);
        } catch (error) {
          console.error("Failed to log inbox event:", error);
        }
      }
      /**
       * Log a campaign-related event
       */
      async logCampaignEvent(params) {
        try {
          const logData = {
            userId: params.userId,
            eventType: params.eventType,
            action: params.action,
            description: params.description,
            campaignId: params.campaignId,
            severity: params.severity || "info",
            metadata: {
              ...params.metadata,
              campaignName: params.campaignName
            }
          };
          await storage.createActivityLog(logData);
        } catch (error) {
          console.error("Failed to log campaign event:", error);
        }
      }
      /**
       * Log a general system event
       */
      async logSystemEvent(params) {
        try {
          const logData = {
            userId: params.userId,
            eventType: params.eventType,
            action: params.action,
            description: params.description,
            severity: params.severity || "info",
            metadata: params.metadata || {}
          };
          await storage.createActivityLog(logData);
        } catch (error) {
          console.error("Failed to log system event:", error);
        }
      }
      /**
       * Convenience methods for common events
       */
      async logInviteSent(userId, {
        campaignId,
        inviteId,
        recipientEmail,
        recipientName,
        inboxId,
        inboxType,
        meetingLink,
        timeSlot
      }) {
        await this.logInviteEvent({
          userId,
          eventType: "invite_sent",
          action: "Invite Sent",
          description: `Calendar invite sent to ${recipientEmail}${recipientName ? ` (${recipientName})` : ""}`,
          campaignId,
          inviteId,
          recipientEmail,
          recipientName,
          inboxId,
          inboxType,
          severity: "success",
          metadata: {
            meetingLink,
            timeSlot
          }
        });
      }
      async logInviteResponse(userId, {
        inviteId,
        recipientEmail,
        recipientName,
        response,
        campaignId
      }) {
        const eventType = `invite_${response}`;
        const action = response.charAt(0).toUpperCase() + response.slice(1);
        await this.logInviteEvent({
          userId,
          eventType,
          action,
          description: `${recipientEmail}${recipientName ? ` (${recipientName})` : ""} ${response} the invite`,
          inviteId,
          recipientEmail,
          recipientName,
          campaignId,
          severity: response === "accepted" ? "success" : "info"
        });
      }
      async logInboxConnected(userId, {
        inboxId,
        inboxType,
        inboxEmail
      }) {
        await this.logInboxEvent({
          userId,
          eventType: "inbox_connected",
          action: "Inbox Connected",
          description: `${inboxType === "google" ? "Google" : "Microsoft"} account ${inboxEmail} connected successfully`,
          inboxId,
          inboxType,
          inboxEmail,
          severity: "success"
        });
      }
      async logInboxDisconnected(userId, {
        inboxId,
        inboxType,
        inboxEmail,
        reason
      }) {
        await this.logInboxEvent({
          userId,
          eventType: "inbox_disconnected",
          action: "Inbox Disconnected",
          description: `${inboxType === "google" ? "Google" : "Microsoft"} account ${inboxEmail} disconnected${reason ? `: ${reason}` : ""}`,
          inboxId,
          inboxType,
          inboxEmail,
          severity: "warning",
          metadata: { reason }
        });
      }
      async logCampaignCreated(userId, {
        campaignId,
        campaignName
      }) {
        await this.logCampaignEvent({
          userId,
          eventType: "campaign_created",
          action: "Campaign Created",
          description: `New campaign "${campaignName}" created`,
          campaignId,
          campaignName,
          severity: "success"
        });
      }
      async logError(userId, {
        action,
        description,
        error,
        campaignId,
        inviteId
      }) {
        await this.logSystemEvent({
          userId,
          eventType: "system_error",
          action,
          description,
          severity: "error",
          metadata: {
            errorMessage: error?.message || "Unknown error",
            errorStack: error?.stack,
            campaignId,
            inviteId
          }
        });
      }
    };
    activityLogger = new ActivityLoggerService();
  }
});

// server/services/activity-logger-extensions.ts
var confirmationEmailActivityLogger;
var init_activity_logger_extensions = __esm({
  "server/services/activity-logger-extensions.ts"() {
    "use strict";
    init_activity_logger();
    confirmationEmailActivityLogger = {
      async logConfirmationEmailSent(userId, campaignId, inviteId, recipientEmail, recipientName, senderEmail) {
        await activityLogger.log(userId, {
          eventType: "confirmation_email_sent",
          action: "Confirmation Email Sent",
          description: `Confirmation email sent to ${recipientName} (${recipientEmail}) from ${senderEmail}`,
          campaignId,
          inviteId,
          recipientEmail,
          recipientName,
          severity: "success",
          metadata: {
            senderEmail,
            emailType: "confirmation"
          }
        });
      },
      async logConfirmationEmailSkipped(userId, campaignId, inviteId, recipientEmail, recipientName) {
        await activityLogger.log(userId, {
          eventType: "confirmation_email_skipped",
          action: "Confirmation Email Skipped",
          description: `Confirmation email skipped for ${recipientName} (${recipientEmail})`,
          campaignId,
          inviteId,
          recipientEmail,
          recipientName,
          severity: "info",
          metadata: {
            emailType: "confirmation",
            reason: "manually_skipped"
          }
        });
      },
      async logConfirmationEmailFailed(userId, campaignId, inviteId, recipientEmail, recipientName, error) {
        await activityLogger.log(userId, {
          eventType: "confirmation_email_failed",
          action: "Confirmation Email Failed",
          description: `Confirmation email failed for ${recipientName} (${recipientEmail}): ${error}`,
          campaignId,
          inviteId,
          recipientEmail,
          recipientName,
          severity: "error",
          metadata: {
            emailType: "confirmation",
            errorMessage: error
          }
        });
      }
    };
    Object.assign(activityLogger, confirmationEmailActivityLogger);
  }
});

// server/routes/confirmation-emails.ts
var confirmation_emails_exports = {};
__export(confirmation_emails_exports, {
  default: () => confirmation_emails_default
});
import express2 from "express";
var router2, confirmation_emails_default;
var init_confirmation_emails = __esm({
  "server/routes/confirmation-emails.ts"() {
    "use strict";
    init_auth();
    init_storage();
    init_activity_logger();
    init_activity_logger_extensions();
    init_multi_provider_email();
    router2 = express2.Router();
    router2.get("/pending", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const pendingInvites = await storage.getPendingConfirmationEmails(userId);
        res.json(pendingInvites);
      } catch (error) {
        console.error("Error getting pending confirmation emails:", error);
        res.status(500).json({ error: "Failed to get pending confirmation emails" });
      }
    });
    router2.get("/templates", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const defaultTemplates = [
          {
            id: 1,
            name: "Default Confirmation",
            subject: "Meeting Confirmation - {{meeting_time}}",
            body: `Dear {{name}},

Thank you for accepting our meeting invitation!

Meeting Details:
\u{1F4C5} Date & Time: {{meeting_time}}
\u{1F517} Meeting Link: {{meeting_link}}

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
    router2.post("/:inviteId/send", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const inviteId = parseInt(req.params.inviteId);
        const { customTemplate, customSubject } = req.body;
        const invite = await storage.getInvite(inviteId, userId);
        if (!invite) {
          return res.status(404).json({ error: "Invite not found" });
        }
        if (invite.rsvpStatus !== "accepted") {
          return res.status(400).json({ error: "Invite is not accepted" });
        }
        if (invite.confirmationEmailStatus === "sent") {
          return res.status(400).json({ error: "Confirmation email already sent" });
        }
        let senderAccount = null;
        if (invite.googleAccountId) {
          senderAccount = await storage.getGoogleAccount(invite.googleAccountId, userId);
        } else if (invite.outlookAccountId) {
          senderAccount = await storage.getOutlookAccount(invite.outlookAccountId, userId);
        }
        if (!senderAccount) {
          return res.status(400).json({ error: "Sender account not found" });
        }
        const defaultSubject = "Meeting Confirmation - {{meeting_time}}";
        const defaultTemplate = `Dear {{name}},

Thank you for accepting our meeting invitation!

Meeting Details:
\u{1F4C5} Date & Time: {{meeting_time}}
\u{1F517} Meeting Link: {{meeting_link}}

We look forward to speaking with you. If you need to reschedule or have any questions, please don't hesitate to reach out.

Best regards,
{{sender_name}}
{{company}}`;
        const emailSubject = customSubject || defaultSubject;
        const emailBody = customTemplate || defaultTemplate;
        const processedSubject = emailSubject.replace(/{{name}}/g, invite.recipientName || invite.recipientEmail).replace(/{{meeting_time}}/g, invite.meetingTime ? new Date(invite.meetingTime).toLocaleString() : "[Meeting Time]").replace(/{{meeting_link}}/g, invite.mergeData?.meetingLink || "[Meeting Link]").replace(/{{sender_name}}/g, invite.mergeData?.senderName || senderAccount.name).replace(/{{company}}/g, invite.mergeData?.company || "[Company]");
        const processedBody = emailBody.replace(/{{name}}/g, invite.recipientName || invite.recipientEmail).replace(/{{meeting_time}}/g, invite.meetingTime ? new Date(invite.meetingTime).toLocaleString() : "[Meeting Time]").replace(/{{meeting_link}}/g, invite.mergeData?.meetingLink || "[Meeting Link]").replace(/{{sender_name}}/g, invite.mergeData?.senderName || senderAccount.name).replace(/{{company}}/g, invite.mergeData?.company || "[Company]");
        try {
          const emailResult = await multiProviderEmailService.sendEmail({
            to: invite.recipientEmail,
            subject: processedSubject,
            text: processedBody,
            html: processedBody.replace(/\n/g, "<br>"),
            // Simple HTML conversion
            from: senderAccount.email,
            accountId: senderAccount.id,
            accountType: invite.googleAccountId ? "google" : "outlook"
          });
          if (emailResult.success) {
            await storage.updateInvite(inviteId, {
              confirmationEmailStatus: "sent",
              confirmationEmailSentAt: /* @__PURE__ */ new Date(),
              confirmationEmailTemplate: customTemplate || void 0
            }, userId);
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
            await storage.updateInvite(inviteId, {
              confirmationEmailStatus: "failed"
            }, userId);
            res.status(500).json({ error: emailResult.error || "Failed to send email" });
          }
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          await storage.updateInvite(inviteId, {
            confirmationEmailStatus: "failed"
          }, userId);
          res.status(500).json({ error: "Failed to send confirmation email" });
        }
      } catch (error) {
        console.error("Error sending confirmation email:", error);
        res.status(500).json({ error: "Failed to send confirmation email" });
      }
    });
    router2.post("/:inviteId/skip", requireAuth, async (req, res) => {
      try {
        const userId = req.user.id;
        const inviteId = parseInt(req.params.inviteId);
        const invite = await storage.getInvite(inviteId, userId);
        if (!invite) {
          return res.status(404).json({ error: "Invite not found" });
        }
        await storage.updateInvite(inviteId, {
          confirmationEmailStatus: "skipped"
        }, userId);
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
    confirmation_emails_default = router2;
  }
});

// server/services/response-intelligence.ts
import { eq as eq4, and as and3, desc as desc3, sql as sql2 } from "drizzle-orm";
import { GoogleAuth } from "google-auth-library";
import { google as google6 } from "googleapis";
var ResponseIntelligenceService, responseIntelligence;
var init_response_intelligence = __esm({
  "server/services/response-intelligence.ts"() {
    "use strict";
    init_db();
    init_schema();
    ResponseIntelligenceService = class {
      gmail = null;
      graphClient = null;
      constructor() {
        this.initializeClients();
      }
      async initializeClients() {
        try {
          const auth = new GoogleAuth({
            scopes: [
              "https://www.googleapis.com/auth/gmail.readonly",
              "https://www.googleapis.com/auth/gmail.modify"
            ]
          });
          this.gmail = google6.gmail({ version: "v1", auth });
        } catch (error) {
          console.error("Failed to initialize Gmail client:", error);
        }
      }
      // Log timeline event for an invite
      async logTimelineEvent(inviteId, userId, campaignId, event) {
        try {
          const recipientDomain = event.recipientEmail ? event.recipientEmail.split("@")[1] : null;
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
            timestamp: /* @__PURE__ */ new Date()
          });
          console.log(`Timeline event logged: ${event.summary} for invite ${inviteId}`);
        } catch (error) {
          console.error("Failed to log timeline event:", error);
        }
      }
      // Get timeline for a specific invite
      async getInviteTimeline(inviteId) {
        try {
          const events = await db.select().from(inviteTimeline).where(eq4(inviteTimeline.inviteId, inviteId)).orderBy(desc3(inviteTimeline.timestamp));
          return events.map((event) => ({
            id: event.id,
            type: event.type,
            source: event.source,
            action: event.action || void 0,
            summary: event.summary,
            details: event.details,
            recipientEmail: event.recipientEmail || void 0,
            senderEmail: event.senderEmail || void 0,
            subject: event.subject || void 0,
            timestamp: new Date(event.timestamp),
            severity: event.severity
          }));
        } catch (error) {
          console.error("Failed to get invite timeline:", error);
          return [];
        }
      }
      // Set up Gmail API monitoring for an account
      async setupGmailMonitoring(userId, accountId, accessToken) {
        try {
          const auth = new google6.auth.OAuth2();
          auth.setCredentials({ access_token: accessToken });
          const gmail = google6.gmail({ version: "v1", auth });
          const profile = await gmail.users.getProfile({ userId: "me" });
          const historyId = profile.data.historyId;
          await db.insert(responseSettings).values({
            userId,
            accountType: "google",
            accountId,
            isMonitoringEnabled: true,
            domainMatching: true,
            subjectMatching: true,
            historyId,
            syncStatus: "active"
          }).onConflictDoUpdate({
            target: [responseSettings.userId, responseSettings.accountType, responseSettings.accountId],
            set: {
              historyId,
              isMonitoringEnabled: true,
              syncStatus: "active",
              updatedAt: /* @__PURE__ */ new Date()
            }
          });
          console.log(`Gmail monitoring setup for account ${accountId}`);
        } catch (error) {
          console.error("Failed to setup Gmail monitoring:", error);
        }
      }
      // Process Gmail history for new emails
      async processGmailHistory(userId, accountId, accessToken) {
        try {
          const settings = await db.select().from(responseSettings).where(
            and3(
              eq4(responseSettings.userId, userId),
              eq4(responseSettings.accountType, "google"),
              eq4(responseSettings.accountId, accountId)
            )
          ).limit(1);
          if (!settings.length || !settings[0].historyId) {
            console.log("No Gmail monitoring settings found");
            return;
          }
          const currentSettings = settings[0];
          const auth = new google6.auth.OAuth2();
          auth.setCredentials({ access_token: accessToken });
          const gmail = google6.gmail({ version: "v1", auth });
          const historyResponse = await gmail.users.history.list({
            userId: "me",
            startHistoryId: currentSettings.historyId,
            historyTypes: ["messageAdded"]
          });
          if (!historyResponse.data.history) {
            console.log("No new Gmail history");
            return;
          }
          for (const historyRecord of historyResponse.data.history) {
            if (historyRecord.messagesAdded) {
              for (const messageAdded of historyRecord.messagesAdded) {
                await this.processGmailMessage(
                  userId,
                  accountId,
                  messageAdded.message?.id,
                  gmail
                );
              }
            }
          }
          await db.update(responseSettings).set({
            historyId: historyResponse.data.historyId,
            lastSync: /* @__PURE__ */ new Date()
          }).where(
            and3(
              eq4(responseSettings.userId, userId),
              eq4(responseSettings.accountType, "google"),
              eq4(responseSettings.accountId, accountId)
            )
          );
        } catch (error) {
          console.error("Failed to process Gmail history:", error);
        }
      }
      // Process individual Gmail message
      async processGmailMessage(userId, accountId, messageId, gmail) {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full"
          });
          const message = messageResponse.data;
          if (!message.payload?.headers) return;
          const headers = message.payload.headers;
          const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from");
          const toHeader = headers.find((h) => h.name?.toLowerCase() === "to");
          const subjectHeader = headers.find((h) => h.name?.toLowerCase() === "subject");
          const fromEmail = fromHeader?.value || "";
          const toEmail = toHeader?.value || "";
          const subject = subjectHeader?.value || "";
          const fromDomain = fromEmail.includes("@") ? fromEmail.split("@")[1].toLowerCase() : "";
          await db.insert(emailActivity).values({
            userId,
            accountType: "google",
            accountId,
            messageId: message.id,
            threadId: message.threadId,
            fromEmail,
            fromDomain,
            toEmail,
            subject,
            snippet: message.snippet || "",
            labels: message.labelIds || [],
            receivedAt: new Date(parseInt(message.internalDate || "0"))
          }).onConflictDoNothing();
          await this.matchEmailToInvites(userId, {
            messageId: message.id,
            fromEmail,
            fromDomain,
            subject,
            snippet: message.snippet || ""
          });
        } catch (error) {
          console.error("Failed to process Gmail message:", error);
        }
      }
      // Match incoming email to existing invites
      async matchEmailToInvites(userId, emailData) {
        try {
          const matchingInvites = await db.select({
            id: invites.id,
            campaignId: invites.campaignId,
            prospectEmail: invites.prospectEmail,
            prospectName: invites.prospectName
          }).from(invites).where(
            and3(
              eq4(invites.userId, userId),
              sql2`LOWER(${invites.prospectEmail}) = LOWER(${emailData.fromEmail})`
            )
          );
          const domainMatches = await db.select({
            id: invites.id,
            campaignId: invites.campaignId,
            prospectEmail: invites.prospectEmail,
            prospectName: invites.prospectName
          }).from(invites).where(
            and3(
              eq4(invites.userId, userId),
              sql2`LOWER(SPLIT_PART(${invites.prospectEmail}, '@', 2)) = LOWER(${emailData.fromDomain})`
            )
          );
          const allMatches = [...matchingInvites, ...domainMatches];
          for (const invite of allMatches) {
            const isDirect = invite.prospectEmail.toLowerCase() === emailData.fromEmail.toLowerCase();
            const matchType = isDirect ? "direct_reply" : "domain_activity";
            await this.logTimelineEvent(
              invite.id,
              userId,
              invite.campaignId,
              {
                type: "email_received",
                source: "gmail",
                action: matchType,
                summary: isDirect ? `Reply received from ${emailData.fromEmail}` : `Email from ${emailData.fromEmail} (same domain as prospect)`,
                details: {
                  messageId: emailData.messageId,
                  subject: emailData.subject,
                  snippet: emailData.snippet,
                  matchType
                },
                recipientEmail: invite.prospectEmail,
                senderEmail: emailData.fromEmail,
                subject: emailData.subject,
                severity: "info"
              }
            );
            await db.update(emailActivity).set({
              relatedInviteId: invite.id,
              relatedCampaignId: invite.campaignId,
              matchingCriteria: matchType,
              isProcessed: true,
              processedAt: /* @__PURE__ */ new Date()
            }).where(eq4(emailActivity.messageId, emailData.messageId));
          }
        } catch (error) {
          console.error("Failed to match email to invites:", error);
        }
      }
      // Log RSVP response
      async logRsvpResponse(inviteId, userId, campaignId, response, details) {
        await this.logTimelineEvent(inviteId, userId, campaignId, {
          type: "rsvp_response",
          source: "calendar_api",
          action: response,
          summary: `Meeting ${response}`,
          details,
          severity: response === "accepted" ? "success" : "info"
        });
      }
      // Log invite sent
      async logInviteSent(inviteId, userId, campaignId, recipientEmail, eventId) {
        await this.logTimelineEvent(inviteId, userId, campaignId, {
          type: "invite_sent",
          source: "calendar_api",
          summary: `Calendar invite sent to ${recipientEmail}`,
          details: { eventId },
          recipientEmail,
          severity: "info"
        });
      }
      // Get campaign activity summary
      async getCampaignActivitySummary(campaignId) {
        try {
          const stats = await db.select({
            type: inviteTimeline.type,
            count: sql2`count(*)`
          }).from(inviteTimeline).where(eq4(inviteTimeline.campaignId, campaignId)).groupBy(inviteTimeline.type);
          const summary = {
            totalEvents: 0,
            rsvpResponses: 0,
            emailsReceived: 0,
            domainActivity: 0
          };
          for (const stat of stats) {
            summary.totalEvents += stat.count;
            if (stat.type === "rsvp_response") {
              summary.rsvpResponses += stat.count;
            } else if (stat.type === "email_received") {
              summary.emailsReceived += stat.count;
            } else if (stat.type === "domain_activity") {
              summary.domainActivity += stat.count;
            }
          }
          return summary;
        } catch (error) {
          console.error("Failed to get campaign activity summary:", error);
          return {
            totalEvents: 0,
            rsvpResponses: 0,
            emailsReceived: 0,
            domainActivity: 0
          };
        }
      }
      // Start monitoring for all enabled accounts
      async startMonitoring() {
        console.log("Starting Response Intelligence monitoring...");
        setInterval(async () => {
          try {
            await this.checkAllAccounts();
          } catch (error) {
            console.error("Error in monitoring cycle:", error);
          }
        }, 5 * 60 * 1e3);
      }
      async checkAllAccounts() {
        try {
          const activeSettings = await db.select().from(responseSettings).where(eq4(responseSettings.isMonitoringEnabled, true));
          for (const setting of activeSettings) {
            if (setting.accountType === "google") {
              console.log(`Checking Gmail account ${setting.accountId}`);
            } else if (setting.accountType === "outlook") {
              console.log(`Checking Outlook account ${setting.accountId}`);
            }
          }
        } catch (error) {
          console.error("Failed to check accounts:", error);
        }
      }
    };
    responseIntelligence = new ResponseIntelligenceService();
  }
});

// server/routes/response-intelligence.ts
var response_intelligence_exports = {};
__export(response_intelligence_exports, {
  registerResponseIntelligenceRoutes: () => registerResponseIntelligenceRoutes
});
import { eq as eq5, and as and4, desc as desc4 } from "drizzle-orm";
function registerResponseIntelligenceRoutes(app2) {
  app2.get("/api/invites/:inviteId/timeline", requireAuth, async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const userId = req.user.id;
      const invite = await db.select().from(invites).where(and4(eq5(invites.id, inviteId), eq5(invites.userId, userId))).limit(1);
      if (!invite.length) {
        return res.status(404).json({ error: "Invite not found" });
      }
      const timeline = await responseIntelligence.getInviteTimeline(inviteId);
      res.json(timeline);
    } catch (error) {
      console.error("Error getting invite timeline:", error);
      res.status(500).json({ error: "Failed to get invite timeline" });
    }
  });
  app2.get("/api/campaigns/:campaignId/activity-summary", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const summary = await responseIntelligence.getCampaignActivitySummary(campaignId);
      res.json(summary);
    } catch (error) {
      console.error("Error getting campaign activity summary:", error);
      res.status(500).json({ error: "Failed to get campaign activity summary" });
    }
  });
  app2.get("/api/campaigns/:campaignId/email-activity", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = req.user.id;
      const activity = await db.select().from(emailActivity).where(
        and4(
          eq5(emailActivity.userId, userId),
          eq5(emailActivity.relatedCampaignId, campaignId)
        )
      ).orderBy(desc4(emailActivity.receivedAt));
      res.json(activity);
    } catch (error) {
      console.error("Error getting email activity:", error);
      res.status(500).json({ error: "Failed to get email activity" });
    }
  });
  app2.post("/api/response-intelligence/setup-monitoring", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { accountType, accountId, accessToken } = req.body;
      if (accountType === "google") {
        await responseIntelligence.setupGmailMonitoring(userId, accountId, accessToken);
      } else if (accountType === "outlook") {
        res.status(501).json({ error: "Outlook monitoring not yet implemented" });
        return;
      } else {
        res.status(400).json({ error: "Invalid account type" });
        return;
      }
      res.json({ success: true, message: "Monitoring setup successfully" });
    } catch (error) {
      console.error("Error setting up monitoring:", error);
      res.status(500).json({ error: "Failed to setup monitoring" });
    }
  });
  app2.get("/api/response-intelligence/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const settings = await db.select().from(responseSettings).where(eq5(responseSettings.userId, userId)).orderBy(desc4(responseSettings.createdAt));
      res.json(settings);
    } catch (error) {
      console.error("Error getting monitoring settings:", error);
      res.status(500).json({ error: "Failed to get monitoring settings" });
    }
  });
  app2.patch("/api/response-intelligence/settings/:settingId", requireAuth, async (req, res) => {
    try {
      const settingId = parseInt(req.params.settingId);
      const userId = req.user.id;
      const updates = req.body;
      await db.update(responseSettings).set({
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(
        and4(
          eq5(responseSettings.id, settingId),
          eq5(responseSettings.userId, userId)
        )
      );
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating monitoring settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  app2.post("/api/response-intelligence/process-gmail/:accountId", requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const userId = req.user.id;
      const { accessToken } = req.body;
      await responseIntelligence.processGmailHistory(userId, accountId, accessToken);
      res.json({ success: true, message: "Gmail history processed" });
    } catch (error) {
      console.error("Error processing Gmail history:", error);
      res.status(500).json({ error: "Failed to process Gmail history" });
    }
  });
  app2.get("/api/response-intelligence/recent-activity", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const recentActivity = await db.select({
        id: emailActivity.id,
        fromEmail: emailActivity.fromEmail,
        subject: emailActivity.subject,
        snippet: emailActivity.snippet,
        receivedAt: emailActivity.receivedAt,
        matchingCriteria: emailActivity.matchingCriteria,
        relatedInviteId: emailActivity.relatedInviteId,
        relatedCampaignId: emailActivity.relatedCampaignId
      }).from(emailActivity).where(eq5(emailActivity.userId, userId)).orderBy(desc4(emailActivity.receivedAt)).limit(limit);
      res.json(recentActivity);
    } catch (error) {
      console.error("Error getting recent activity:", error);
      res.status(500).json({ error: "Failed to get recent activity" });
    }
  });
  app2.get("/api/campaigns/:campaignId/timeline", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = req.user.id;
      const timeline = await db.select().from(inviteTimeline).where(
        and4(
          eq5(inviteTimeline.campaignId, campaignId),
          eq5(inviteTimeline.userId, userId)
        )
      ).orderBy(desc4(inviteTimeline.timestamp));
      res.json(timeline);
    } catch (error) {
      console.error("Error getting campaign timeline:", error);
      res.status(500).json({ error: "Failed to get campaign timeline" });
    }
  });
}
var init_response_intelligence2 = __esm({
  "server/routes/response-intelligence.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_response_intelligence();
    init_auth();
  }
});

// server/routes.ts
var routes_exports = {};
__export(routes_exports, {
  registerRoutes: () => registerRoutes
});
import { createServer as createServer2 } from "http";
import { z as z2 } from "zod";
import { eq as eq6 } from "drizzle-orm";
async function registerRoutes(app2) {
  queueManager.start();
  app2.post("/api/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
      const [existingUser] = await db.select().from(users).where(eq6(users.email, email.toLowerCase()));
      if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email" });
      }
      const passwordHash = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash
      }).returning();
      req.session.userId = newUser.id;
      res.status(201).json({
        message: "Account created successfully",
        user: { id: newUser.id, email: newUser.email, createdAt: newUser.createdAt }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const [user] = await db.select().from(users).where(eq6(users.email, email.toLowerCase()));
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, createdAt: user.createdAt }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      res.json({ id: user.id, email: user.email, createdAt: user.createdAt });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });
  app2.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { days } = req.query;
      let timeRange;
      if (days) {
        const daysNum = parseInt(days);
        if (!isNaN(daysNum) && daysNum > 0) {
          const end = /* @__PURE__ */ new Date();
          const start = /* @__PURE__ */ new Date();
          start.setDate(start.getDate() - daysNum);
          timeRange = { start, end };
        }
      }
      const stats = await storage.getDashboardStats(userId, timeRange);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });
  app2.get("/api/auth/google", requireAuth, (req, res) => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      console.log("Generated Google Auth URL for production:", authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google Auth URL:", error);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });
  app2.get("/api/auth/microsoft", requireAuth, async (req, res) => {
    try {
      const { microsoftAuthService: microsoftAuthService2 } = await Promise.resolve().then(() => (init_microsoft_auth(), microsoft_auth_exports));
      if (!microsoftAuthService2.isConfigured()) {
        return res.status(500).json({ error: "Microsoft OAuth not configured" });
      }
      const authUrl = microsoftAuthService2.getAuthUrl();
      console.log("Generated Microsoft Auth URL:", authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Microsoft Auth URL:", error);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });
  app2.post("/api/auth/gmail/app-password", async (req, res) => {
    try {
      const { email, appPassword, name } = req.body;
      if (!email || !appPassword) {
        return res.status(400).json({ error: "Email and app password are required" });
      }
      const account = await gmailAppPasswordService.addAccount(email, appPassword, name);
      res.json({
        success: true,
        message: "Gmail account connected successfully",
        account
      });
    } catch (error) {
      console.error("Gmail app password setup error:", error);
      res.status(500).json({ error: error.message || "Failed to connect Gmail account" });
    }
  });
  app2.post("/api/auth/google/service-account", async (req, res) => {
    try {
      const { email, privateKey, projectId } = req.body;
      if (!email || !privateKey || !projectId) {
        return res.status(400).json({ error: "Email, privateKey, and projectId are required" });
      }
      const credentials = { email, privateKey, projectId };
      const account = await googleServiceAuthService.createServiceAccountConnection(email, credentials);
      res.json({
        success: true,
        account: {
          id: account.id,
          email: account.email,
          name: account.name,
          type: "service_account"
        }
      });
    } catch (error) {
      console.error("Service account connection failed:", error);
      res.status(500).json({ error: "Failed to create service account connection" });
    }
  });
  app2.post("/api/accounts/organization-user", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const orgUser = await storage.createGoogleAccount({
        email,
        name: name || `Organization User (${email})`,
        accessToken: "ORGANIZATION_USER_TOKEN",
        refreshToken: "ORGANIZATION_USER_REFRESH",
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3),
        isActive: true
      });
      await storage.createActivityLog({
        type: "organization_user_added",
        message: `Added organization user: ${email}`,
        googleAccountId: orgUser.id
      });
      res.json({ success: true, account: orgUser });
    } catch (error) {
      console.error("Organization user addition failed:", error);
      res.status(500).json({ error: "Failed to add organization user" });
    }
  });
  app2.get("/api/auth/service-account/status", async (req, res) => {
    try {
      const status = await googleServiceAuthService.testServiceAccountAccess();
      res.json({
        configured: googleServiceAuthService.isServiceAccountConfigured(),
        ...status
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check service account status" });
    }
  });
  app2.get("/api/auth/outlook", (req, res) => {
    const authUrl = outlookAuthService.getAuthUrl();
    res.json({ authUrl });
  });
  app2.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing authorization code" });
      }
      const { accessToken, refreshToken, expiresAt, userInfo } = await googleAuthService.exchangeCodeForTokens(code);
      const userId = req.user.id;
      const existingAccount = await storage.getGoogleAccountByEmail(userInfo.email, userId);
      if (existingAccount) {
        await storage.updateGoogleAccount(existingAccount.id, {
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true
        });
        await storage.createActivityLog({
          type: "account_connected",
          googleAccountId: existingAccount.id,
          message: `Google account ${userInfo.email} reconnected successfully`,
          metadata: { email: userInfo.email, name: userInfo.name, action: "reconnected" }
        });
      } else {
        const newAccount = await storage.createGoogleAccount({
          email: userInfo.email,
          name: userInfo.name,
          accessToken,
          refreshToken,
          expiresAt,
          isActive: true,
          userId
        });
        await storage.createActivityLog({
          type: "account_connected",
          googleAccountId: newAccount.id,
          message: `New Google account ${userInfo.email} connected successfully`,
          metadata: { email: userInfo.email, name: userInfo.name, action: "new_connection" }
        });
      }
      res.redirect("/?connected=true");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  app2.get("/api/auth/microsoft/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Missing authorization code" });
      }
      const { microsoftAuthService: microsoftAuthService2 } = await Promise.resolve().then(() => (init_microsoft_auth(), microsoft_auth_exports));
      const authResult = await microsoftAuthService2.exchangeCodeForTokens(code);
      const userProfile = await microsoftAuthService2.getUserProfile(authResult.accessToken);
      const userId = req.user.id;
      const existingAccount = await storage.getOutlookAccountByEmail(userProfile.mail || userProfile.userPrincipalName, userId);
      if (existingAccount) {
        await storage.updateOutlookAccount(existingAccount.id, {
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken || "",
          expiresAt: new Date(authResult.expiresOn || Date.now() + 36e5),
          isActive: true
        }, userId);
        await storage.createActivityLog({
          type: "account_connected",
          outlookAccountId: existingAccount.id,
          userId,
          message: `Microsoft account ${userProfile.mail || userProfile.userPrincipalName} reconnected successfully`,
          metadata: { email: userProfile.mail || userProfile.userPrincipalName, name: userProfile.displayName, action: "reconnected" }
        });
      } else {
        const accountData = microsoftAuthService2.formatAccountData(authResult, userProfile, userId);
        const newAccount = await storage.createOutlookAccount(accountData);
        await storage.createActivityLog({
          type: "account_connected",
          outlookAccountId: newAccount.id,
          userId,
          message: `New Microsoft account ${userProfile.mail || userProfile.userPrincipalName} connected successfully`,
          metadata: { email: userProfile.mail || userProfile.userPrincipalName, name: userProfile.displayName, action: "new_connection" }
        });
      }
      res.redirect("/?connected=microsoft");
    } catch (error) {
      console.error("Microsoft OAuth callback error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
  app2.get("/api/accounts", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const googleAccounts3 = await storage.getAccountsWithStatus(userId);
      const outlookAccounts3 = await storage.getOutlookAccounts(userId);
      const allAccounts = [
        ...googleAccounts3.map((acc) => ({ ...acc, provider: "google" })),
        ...outlookAccounts3.map((acc) => ({
          ...acc,
          provider: "microsoft",
          nextAvailable: null,
          isInCooldown: false
        }))
      ];
      res.json(allAccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get accounts" });
    }
  });
  app2.get("/api/microsoft-accounts", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getOutlookAccounts(userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Microsoft accounts" });
    }
  });
  app2.delete("/api/microsoft-accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const account = await storage.getOutlookAccount(id, userId);
      if (!account) {
        return res.status(404).json({ error: "Microsoft account not found" });
      }
      try {
        const queueItems = await storage.getQueueItems("pending");
        const itemsToCancel = queueItems.filter((item) => {
          const prospectData = item.prospectData;
          return prospectData.assignedOutlookInboxId === id;
        });
        for (const item of itemsToCancel) {
          await storage.updateQueueItem(item.id, {
            status: "cancelled"
          });
        }
      } catch (queueError) {
        console.warn("Failed to cancel queue items for Microsoft account:", queueError);
      }
      try {
        const { microsoftAuthService: microsoftAuthService2 } = await Promise.resolve().then(() => (init_microsoft_auth(), microsoft_auth_exports));
        await microsoftAuthService2.revokeTokens(account.accessToken);
      } catch (revokeError) {
        console.warn("Failed to revoke Microsoft tokens:", revokeError);
      }
      try {
        await storage.createActivityLog({
          type: "account_deleted",
          outlookAccountId: id,
          userId,
          message: `Microsoft account ${account.email} has been deleted from the platform`,
          metadata: {
            email: account.email,
            name: account.name,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
            action: "permanent_deletion"
          }
        });
      } catch (logError) {
        console.warn("Failed to log account deletion:", logError);
      }
      await storage.deleteOutlookAccount(id, userId);
      res.json({
        success: true,
        message: `Microsoft account ${account.email} deleted successfully`
      });
    } catch (error) {
      console.error("Failed to delete Microsoft account:", error);
      res.status(500).json({ error: "Failed to delete Microsoft account" });
    }
  });
  app2.post("/api/accounts/:id/test-connection", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const { provider } = req.body;
      if (!provider || !["google", "microsoft"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider specified" });
      }
      const { connectionMonitorService: connectionMonitorService2 } = await Promise.resolve().then(() => (init_connection_monitor(), connection_monitor_exports));
      const result = await connectionMonitorService2.testAccountConnection(id, provider, userId);
      res.json(result);
    } catch (error) {
      console.error("Connection test failed:", error);
      res.status(500).json({ error: "Connection test failed" });
    }
  });
  app2.post("/api/accounts/:id/reconnect", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const { provider } = req.body;
      if (!provider || !["google", "microsoft"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider specified" });
      }
      const { connectionMonitorService: connectionMonitorService2 } = await Promise.resolve().then(() => (init_connection_monitor(), connection_monitor_exports));
      const authUrl = await connectionMonitorService2.getReconnectionUrl(id, provider, userId);
      res.json({ authUrl });
    } catch (error) {
      console.error("Reconnection URL generation failed:", error);
      res.status(500).json({ error: "Failed to generate reconnection URL" });
    }
  });
  app2.get("/api/connection-health", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { connectionMonitorService: connectionMonitorService2 } = await Promise.resolve().then(() => (init_connection_monitor(), connection_monitor_exports));
      await connectionMonitorService2.checkUserConnections(userId);
      res.json({ message: "Health check completed" });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ error: "Health check failed" });
    }
  });
  app2.delete("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const account = await storage.getGoogleAccount(id, userId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      try {
        const queueItems = await storage.getQueueItems("pending");
        const itemsToCancel = queueItems.filter((item) => {
          const prospectData = item.prospectData;
          return prospectData.assignedInboxId === id;
        });
        for (const item of itemsToCancel) {
          await storage.updateQueueItem(item.id, {
            status: "cancelled"
          });
        }
      } catch (queueError) {
        console.warn("Failed to cancel queue items:", queueError);
      }
      try {
        if (account.refreshToken) {
          const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${account.refreshToken}`;
          await fetch(revokeUrl, { method: "POST" });
        }
      } catch (revokeError) {
        console.warn("Failed to revoke OAuth tokens:", revokeError);
      }
      try {
        await storage.createActivityLog({
          type: "account_deleted",
          googleAccountId: id,
          message: `Account ${account.email} has been deleted from the platform`,
          metadata: {
            email: account.email,
            action: "deletion"
          }
        });
      } catch (logError) {
        console.warn("Failed to log deletion:", logError);
      }
      await storage.deleteGoogleAccount(id, userId);
      res.json({
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
  app2.put("/api/accounts/:id/toggle", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const account = await storage.getGoogleAccount(id, userId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      await storage.updateGoogleAccount(id, {
        isActive: !account.isActive
      }, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle account" });
    }
  });
  app2.get("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const campaigns4 = await storage.getCampaignsWithStats(userId);
      res.json(campaigns4);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });
  app2.get("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const campaign = await storage.getCampaign(id, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });
  app2.post("/api/campaigns", requireAuth, async (req, res) => {
    try {
      const campaignData = req.body;
      if (campaignData.schedulingMode === "advanced" && campaignData.dateRangeStart) {
        const config = {
          dateRangeStart: new Date(campaignData.dateRangeStart),
          dateRangeEnd: new Date(campaignData.dateRangeEnd),
          selectedDaysOfWeek: campaignData.selectedDaysOfWeek,
          timeWindowStart: campaignData.timeWindowStart,
          timeWindowEnd: campaignData.timeWindowEnd,
          timezone: campaignData.schedulingTimezone,
          totalSlots: campaignData.csvData.length
        };
        const slots = advancedScheduler.generateRandomizedSlots(config);
        campaignData.randomizedSlots = slots;
      }
      const userId = req.user.id;
      const validatedData = insertCampaignSchema.parse({
        ...campaignData,
        userId
      });
      const campaign = await storage.createCampaign(validatedData);
      await storage.createActivityLog({
        type: "campaign_processed",
        campaignId: campaign.id,
        message: `Campaign "${campaign.name}" created successfully`,
        metadata: {
          campaignName: campaign.name,
          eventTitle: campaign.eventTitleTemplate,
          selectedInboxes: campaign.selectedInboxes?.length || 0,
          schedulingMode: campaign.schedulingMode,
          action: "created"
        }
      });
      await campaignProcessor.processCampaign(campaign);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      console.error("Campaign creation error:", error);
      res.status(500).json({ error: "Failed to create campaign", details: error.message });
    }
  });
  app2.put("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = req.body;
      if (updates.status && (updates.status === "paused" || updates.status === "completed" || updates.isActive === false)) {
        await campaignProcessor.cancelCampaignQueue(id);
      }
      const campaign = await storage.updateCampaign(id, updates, userId);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });
  app2.delete("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      console.log(`Attempting to delete campaign ${id} for user ${userId}`);
      const campaign = await storage.getCampaign(id, userId);
      if (!campaign) {
        console.log(`Campaign ${id} not found for user ${userId}`);
        return res.status(404).json({ error: "Campaign not found" });
      }
      console.log(`Found campaign: ${campaign.name}, deleting...`);
      await storage.deleteCampaign(id, userId);
      console.log(`Campaign ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error("Campaign deletion error:", error);
      if (error.message && error.message.includes("while invites are being processed")) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || "Failed to delete campaign" });
      }
    }
  });
  app2.post("/api/campaigns/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      await campaignProcessor.processCampaign(campaign);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process campaign" });
    }
  });
  app2.post("/api/invites/manual-test", async (req, res) => {
    try {
      const { prospectEmail, prospectName, prospectCompany, eventTitle, eventDescription, eventDuration, selectedAccountId, startTime, sendNow } = req.body;
      if (!prospectEmail || !prospectName || !eventTitle || !eventDescription || !selectedAccountId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const account = await storage.getGoogleAccount(selectedAccountId);
      if (!account) {
        return res.status(404).json({ error: "Selected account not found" });
      }
      const inviteData = {
        prospectEmail,
        prospectName,
        prospectCompany: prospectCompany || null,
        googleAccountId: selectedAccountId,
        calendarProvider: "google",
        isManualTest: true,
        status: "pending",
        mergeData: {
          name: prospectName,
          email: prospectEmail,
          company: prospectCompany || "",
          eventTitle,
          eventDescription,
          duration: eventDuration,
          startTime
        }
      };
      const invite = await storage.createInvite(inviteData);
      if (sendNow) {
        try {
          const startDateTime = new Date(Date.now() + 60 * 60 * 1e3);
          const duration = eventDuration || 30;
          const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1e3);
          const eventDetails = {
            title: eventTitle,
            description: eventDescription,
            attendeeEmail: prospectEmail,
            attendeeName: prospectName,
            startTime: startDateTime,
            endTime: endDateTime,
            timeZone: "UTC"
          };
          const eventId = await gmailAppPasswordService.createCalendarEvent(account, eventDetails);
          await storage.updateInvite(invite.id, {
            status: "sent",
            eventId,
            sentAt: /* @__PURE__ */ new Date()
          });
          await storage.createActivityLog({
            type: "manual_test_sent",
            inviteId: invite.id,
            googleAccountId: selectedAccountId,
            message: `Manual test invite sent immediately to ${prospectEmail} from ${account.email}`,
            metadata: { eventId, eventTitle, sendNow: true }
          });
          res.json({
            success: true,
            inviteId: invite.id,
            eventId,
            message: `Test invite sent immediately to ${prospectEmail}`,
            sentNow: true
          });
        } catch (error) {
          await storage.updateInvite(invite.id, {
            status: "error",
            errorMessage: error.message
          });
          throw error;
        }
      } else {
        if (!startTime || !eventDuration) {
          return res.status(400).json({ error: "Start time and duration are required for scheduling" });
        }
        const scheduledTime = new Date(startTime);
        await storage.createActivityLog({
          type: "manual_test_scheduled",
          inviteId: invite.id,
          googleAccountId: selectedAccountId,
          message: `Manual test invite scheduled for ${scheduledTime.toLocaleString()} to ${prospectEmail} from ${account.email}`,
          metadata: { scheduledTime: scheduledTime.toISOString(), eventTitle, sendNow: false }
        });
        await storage.createQueueItem({
          campaignId: 0,
          prospectData: {
            email: prospectEmail,
            name: prospectName,
            company: prospectCompany || "",
            eventTitle,
            eventDescription,
            duration: eventDuration,
            startTime: scheduledTime.toISOString(),
            assignedInboxId: selectedAccountId,
            assignedInboxEmail: account.email,
            isManualTest: true
          },
          scheduledFor: scheduledTime,
          status: "pending",
          attempts: 0
        });
        await storage.updateInvite(invite.id, {
          status: "scheduled"
        });
        await storage.createActivityLog({
          type: "manual_test_scheduled",
          inviteId: invite.id,
          googleAccountId: selectedAccountId,
          message: `Manual test invite scheduled for ${scheduledTime.toLocaleString()} to ${prospectEmail} via ${account.email}`,
          metadata: { scheduledTime: scheduledTime.toISOString(), eventTitle, sendNow: false }
        });
        res.json({
          success: true,
          inviteId: invite.id,
          message: `Test invite scheduled for ${scheduledTime.toLocaleString()} to ${prospectEmail}`,
          sentNow: false,
          scheduledFor: scheduledTime.toISOString()
        });
      }
    } catch (error) {
      console.error("Manual test invite error:", error);
      res.status(500).json({
        error: "Failed to send test invite",
        details: error.message
      });
    }
  });
  app2.get("/api/invites", requireAuth, async (req, res) => {
    try {
      const { campaignId } = req.query;
      const userId = req.user.id;
      const invites3 = await storage.getInvites(
        userId,
        campaignId ? parseInt(campaignId) : void 0
      );
      res.json(invites3);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invites" });
    }
  });
  app2.get("/api/auth/google/url", requireAuth, async (req, res) => {
    try {
      const authUrl = await googleAuthService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error getting Google auth URL:", error);
      res.status(500).json({ error: "Failed to get auth URL" });
    }
  });
  app2.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) {
        return res.status(400).send("Authorization code missing");
      }
      const result = await googleAuthService.exchangeCodeForTokens(code);
      const userId = req.user?.id;
      if (!userId) {
        return res.redirect("/?error=login_required");
      }
      const googleAccount = await storage.createGoogleAccount({
        userId,
        email: result.userInfo.email,
        name: result.userInfo.name,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
        isActive: true,
        status: "connected"
      });
      await storage.createActivityLog({
        type: "oauth_connected",
        googleAccountId: googleAccount.id,
        message: `Google account ${result.userInfo.email} connected successfully`,
        metadata: { email: result.userInfo.email, name: result.userInfo.name }
      });
      res.redirect("/?oauth=success&account=" + encodeURIComponent(result.userInfo.email));
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });
  app2.post("/api/oauth-calendar/test-invite", requireAuth, async (req, res) => {
    try {
      const { prospectEmail, eventTitle, eventDescription, accountId } = req.body;
      if (!prospectEmail || !eventTitle || !accountId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const userId = req.user.id;
      const account = await storage.getGoogleAccount(parseInt(accountId), userId);
      if (!account || !account.isActive) {
        return res.status(404).json({ error: "Account not found or inactive" });
      }
      const startTime = new Date(Date.now() + 5 * 60 * 1e3);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1e3);
      const eventDetails = {
        title: eventTitle,
        description: eventDescription || "Test meeting invitation via OAuth Calendar",
        attendeeEmail: prospectEmail,
        startTime,
        endTime,
        timeZone: "America/New_York"
      };
      const eventId = await oauthCalendarService.createEventWithOAuth(account, eventDetails);
      const invite = await storage.createInvite({
        prospectEmail,
        eventId,
        googleAccountId: account.id,
        calendarProvider: "google_oauth",
        eventTitle,
        eventDescription: eventDetails.description,
        eventStartTime: startTime,
        eventEndTime: endTime,
        status: "sent",
        mergeData: { prospectEmail, eventTitle }
      });
      await storage.createActivityLog({
        type: "oauth_test_sent",
        inviteId: invite.id,
        googleAccountId: account.id,
        message: `OAuth test invite sent to ${prospectEmail} via ${account.email}`,
        metadata: { eventId, eventTitle, method: "oauth_calendar" }
      });
      res.json({
        success: true,
        inviteId: invite.id,
        eventId,
        message: `OAuth test invite sent to ${prospectEmail}`,
        account: account.email
      });
    } catch (error) {
      console.error("OAuth test invite error:", error);
      res.status(500).json({
        error: "Failed to send OAuth test invite",
        details: error.message
      });
    }
  });
  app2.post("/api/oauth-calendar/test-access", requireAuth, async (req, res) => {
    try {
      const { accountId } = req.body;
      if (!accountId) {
        return res.status(400).json({ error: "Account ID required" });
      }
      const userId = req.user.id;
      const account = await storage.getGoogleAccount(parseInt(accountId), userId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      const testResult = await oauthCalendarService.testCalendarAccess(account);
      res.json({
        success: testResult.success,
        message: testResult.message,
        calendarName: testResult.calendarName,
        account: {
          id: account.id,
          email: account.email,
          name: account.name
        }
      });
    } catch (error) {
      console.error("OAuth calendar test error:", error);
      res.status(500).json({
        error: "Failed to test calendar access",
        details: error.message
      });
    }
  });
  app2.get("/api/oauth-calendar/accounts", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getGoogleAccounts(userId);
      const oauthAccounts = accounts.filter(
        (account) => account.accessToken !== "SERVICE_ACCOUNT_TOKEN" && account.accessToken !== "ORGANIZATION_USER_TOKEN"
      );
      res.json(oauthAccounts.map((account) => ({
        id: account.id,
        email: account.email,
        name: account.name,
        isActive: account.isActive,
        lastUsed: account.lastUsed,
        createdAt: account.createdAt
      })));
    } catch (error) {
      console.error("Error fetching OAuth accounts:", error);
      res.status(500).json({ error: "Failed to fetch OAuth accounts" });
    }
  });
  app2.get("/api/oauth-calendar/accounts/:id/daily-stats", requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.id;
      const invitesToday = await storage.getInvitesTodayByAccount(accountId, userId);
      const maxDailyLimit = 20;
      res.json({
        invitesToday,
        maxDailyLimit,
        remaining: Math.max(0, maxDailyLimit - invitesToday)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get daily stats" });
    }
  });
  app2.get("/api/campaigns/:id/inbox-stats", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.user.id;
      const stats = await storage.getCampaignInboxStats(campaignId, userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign inbox stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign inbox stats" });
    }
  });
  app2.get("/api/campaigns/:id/detailed-stats", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.user.id;
      const stats = await storage.getCampaignDetailedStats(campaignId, userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign detailed stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign detailed stats" });
    }
  });
  app2.delete("/api/oauth-calendar/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const account = await storage.getGoogleAccount(id, userId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      console.log(`Starting deletion of OAuth account ${id} (${account.email})`);
      try {
        const queueItems = await storage.getQueueItems("pending");
        const itemsToCancel = queueItems.filter((item) => {
          const prospectData = item.prospectData;
          return prospectData.assignedInboxId === id;
        });
        for (const item of itemsToCancel) {
          await storage.updateQueueItem(item.id, {
            status: "cancelled"
          });
        }
        console.log(`Cancelled ${itemsToCancel.length} pending queue items`);
      } catch (queueError) {
        console.warn("Failed to cancel queue items:", queueError);
      }
      try {
        if (account.refreshToken) {
          const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${account.refreshToken}`;
          await fetch(revokeUrl, { method: "POST" });
          console.log("OAuth tokens revoked successfully");
        }
      } catch (revokeError) {
        console.warn("Failed to revoke OAuth tokens:", revokeError);
      }
      try {
        await storage.cleanupActivityLogsForAccount(id);
        console.log(`Cleaned up activity logs for account ${id}`);
      } catch (cleanupError) {
        console.warn("Failed to cleanup activity logs:", cleanupError);
      }
      try {
        await storage.cleanupInvitesForAccount(id);
        console.log(`Cleaned up invites for account ${id}`);
      } catch (cleanupError) {
        console.warn("Failed to cleanup invites:", cleanupError);
      }
      try {
        await storage.createActivityLog({
          type: "account_deleted",
          googleAccountId: null,
          // Don't reference the account being deleted
          message: `OAuth account ${account.email} has been deleted from the platform`,
          metadata: {
            email: account.email,
            action: "deletion",
            deletedAccountId: id
          }
        });
      } catch (logError) {
        console.warn("Failed to log deletion:", logError);
      }
      await storage.deleteGoogleAccount(id, userId);
      console.log(`OAuth account ${account.email} deleted successfully`);
      res.json({
        success: true,
        message: "OAuth account deleted successfully"
      });
    } catch (error) {
      console.error("Delete OAuth account error:", error);
      res.status(500).json({ error: "Failed to delete OAuth account" });
    }
  });
  app2.get("/api/rsvp/events", requireAuth, async (req, res) => {
    try {
      const { inviteId } = req.query;
      const userId = req.user.id;
      const events = await storage.getRsvpEvents(
        inviteId ? parseInt(inviteId) : void 0,
        userId
      );
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP events" });
    }
  });
  app2.get("/api/rsvp/history/:inviteId", requireAuth, async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const userId = req.user.id;
      const history = await storage.getRsvpHistory(inviteId, userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP history" });
    }
  });
  app2.post("/api/rsvp/sync/:inviteId", requireAuth, async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId);
      const userId = req.user.id;
      const invite = await storage.getInvite(inviteId, userId);
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }
      await rsvpTracker.forceSyncInvite(inviteId);
      res.json({ success: true, message: "RSVP status synced successfully" });
    } catch (error) {
      res.status(500).json({
        error: "Failed to sync RSVP status",
        details: error.message
      });
    }
  });
  app2.get("/api/rsvp/stats/:campaignId", requireAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = req.user.id;
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      const stats = await rsvpTracker.getCampaignRsvpStats(campaignId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get RSVP stats" });
    }
  });
  app2.get("/api/invites/by-status/:rsvpStatus", requireAuth, async (req, res) => {
    try {
      const { rsvpStatus } = req.params;
      const userId = req.user.id;
      const invites3 = await storage.getInvitesByRsvpStatus(rsvpStatus, userId);
      res.json(invites3);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invites by RSVP status" });
    }
  });
  app2.post("/api/webhooks/google-calendar", async (req, res) => {
    try {
      const payload = req.body;
      await rsvpTracker.processWebhookEvent("google_calendar_event_updated", payload);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Google Calendar webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });
  app2.post("/api/webhooks/outlook-calendar", async (req, res) => {
    try {
      const payload = req.body;
      await rsvpTracker.processWebhookEvent("outlook_event_updated", payload);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Outlook Calendar webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });
  app2.get("/api/webhooks/events", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { processed } = req.query;
      const processedFilter = processed === "true" ? true : processed === "false" ? false : void 0;
      const events = await storage.getWebhookEvents(processedFilter);
      const userCampaigns = await storage.getCampaigns(userId);
      const userCampaignIds = userCampaigns.map((c) => c.id);
      const filteredEvents = events.filter((event) => {
        if (event.metadata && event.metadata.campaignId) {
          return userCampaignIds.includes(event.metadata.campaignId);
        }
        return false;
      });
      res.json(filteredEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get webhook events" });
    }
  });
  app2.get("/api/activity", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        limit = "50",
        offset = "0",
        eventType,
        campaignId,
        inboxId,
        inboxType,
        recipientEmail,
        severity,
        startDate,
        endDate,
        search
      } = req.query;
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        eventType,
        campaignId: campaignId ? parseInt(campaignId) : void 0,
        inboxId: inboxId ? parseInt(inboxId) : void 0,
        inboxType,
        recipientEmail,
        severity,
        startDate: startDate ? new Date(startDate) : void 0,
        endDate: endDate ? new Date(endDate) : void 0,
        search
      };
      Object.keys(options).forEach((key) => {
        if (options[key] === void 0 || options[key] === "") {
          delete options[key];
        }
      });
      const [logs, total] = await Promise.all([
        storage.getActivityLogs(userId, options),
        storage.getActivityLogCount(userId, options)
      ]);
      res.json({
        logs,
        total,
        hasMore: options.offset + options.limit < total
      });
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to get activity logs" });
    }
  });
  app2.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });
  app2.put("/api/settings", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateSystemSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  app2.get("/api/queue/status", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const status = await queueManager.getQueueStatus();
      const userQueueItems = await storage.getQueueItems();
      const userPendingItems = userQueueItems.filter(
        (item) => item.status === "pending" && item.metadata && item.metadata.userId === userId
      );
      res.json({
        ...status,
        pendingItems: userPendingItems.length,
        userSpecific: true
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get queue status" });
    }
  });
  app2.get("/api/inbox/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const userAccounts = await storage.getAccountsWithStatus(userId);
      res.json(userAccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get inbox stats" });
    }
  });
  app2.get("/api/inbox/stats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await inboxLoadBalancer.getInboxStats(id);
      if (!stats) {
        return res.status(404).json({ error: "Inbox stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get inbox stats" });
    }
  });
  app2.post("/api/inbox/:id/pause", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      await inboxLoadBalancer.pauseInbox(id, reason || "Manual pause");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause inbox" });
    }
  });
  app2.post("/api/inbox/:id/resume", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await inboxLoadBalancer.resumeInbox(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to resume inbox" });
    }
  });
  app2.get("/api/inbox/config", async (req, res) => {
    try {
      const config = inboxLoadBalancer.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get load balancing config" });
    }
  });
  app2.put("/api/inbox/config", async (req, res) => {
    try {
      const updates = req.body;
      inboxLoadBalancer.updateConfig(updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update load balancing config" });
    }
  });
  app2.get("/api/inbox/:accountEmail/booked-slots", async (req, res) => {
    try {
      const { accountEmail } = req.params;
      const slots = timeSlotManager.getBookedSlots(accountEmail);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to get booked slots" });
    }
  });
  app2.post("/api/inbox/reset-daily", async (req, res) => {
    try {
      await inboxLoadBalancer.resetDailyCounters();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset daily counters" });
    }
  });
  app2.post("/api/scheduling/clear-old-slots", async (req, res) => {
    try {
      timeSlotManager.clearOldBookedSlots();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear old slots" });
    }
  });
  app2.get("/api/email/providers", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const userAccounts = await storage.getAccountsWithStatus(userId);
      const availableProviders = userAccounts.map((account) => ({
        id: account.email,
        type: "gmail",
        name: account.name || account.email,
        email: account.email,
        isActive: account.isActive
      }));
      res.json(availableProviders);
    } catch (error) {
      res.status(500).json({ error: "Failed to get email providers" });
    }
  });
  app2.get("/api/email/providers/stats", async (req, res) => {
    try {
      const stats = await multiProviderEmailService.getProviderStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get provider stats" });
    }
  });
  app2.post("/api/email/providers/:id/test", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const providers = await multiProviderEmailService.getAvailableProviders();
      const provider = providers.find((p) => p.accountId === providerId);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      const result = await multiProviderEmailService.testEmailProvider(provider);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to test email provider" });
    }
  });
  app2.get("/api/outlook/accounts", async (req, res) => {
    try {
      const accounts = await storage.getOutlookAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Outlook accounts" });
    }
  });
  app2.delete("/api/outlook/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOutlookAccount(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete Outlook account" });
    }
  });
  app2.put("/api/outlook/accounts/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getOutlookAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      await storage.updateOutlookAccount(id, {
        isActive: !account.isActive
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle Outlook account" });
    }
  });
  app2.post("/api/campaigns/process-all", async (req, res) => {
    try {
      await campaignProcessor.processAllCampaigns();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process campaigns" });
    }
  });
  app2.post("/api/campaigns/validate-scheduling", async (req, res) => {
    try {
      const { dateRangeStart, dateRangeEnd, selectedDaysOfWeek, timeWindowStart, timeWindowEnd, schedulingTimezone, totalSlots } = req.body;
      if (!dateRangeStart || !dateRangeEnd || !selectedDaysOfWeek || !timeWindowStart || !timeWindowEnd || !schedulingTimezone || !totalSlots) {
        return res.status(400).json({ error: "Missing required scheduling parameters" });
      }
      const config = {
        dateRangeStart: new Date(dateRangeStart),
        dateRangeEnd: new Date(dateRangeEnd),
        selectedDaysOfWeek,
        timeWindowStart,
        timeWindowEnd,
        timezone: schedulingTimezone,
        totalSlots
      };
      const validation = advancedScheduler.validateConfiguration(config);
      const availableSlots = advancedScheduler.getAvailableSlotCount(config);
      res.json({
        valid: validation.valid,
        errors: validation.errors,
        availableSlots
      });
    } catch (error) {
      console.error("Scheduling validation error:", error);
      res.status(500).json({ error: "Failed to validate scheduling configuration" });
    }
  });
  app2.post("/api/campaigns/generate-slots", async (req, res) => {
    try {
      const { dateRangeStart, dateRangeEnd, selectedDaysOfWeek, timeWindowStart, timeWindowEnd, schedulingTimezone, totalSlots } = req.body;
      const config = {
        dateRangeStart: new Date(dateRangeStart),
        dateRangeEnd: new Date(dateRangeEnd),
        selectedDaysOfWeek,
        timeWindowStart,
        timeWindowEnd,
        timezone: schedulingTimezone,
        totalSlots
      };
      const slots = advancedScheduler.generateRandomizedSlots(config);
      res.json({ slots });
    } catch (error) {
      console.error("Slot generation error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to generate slots" });
    }
  });
  app2.get("/api/campaigns/using-inbox/:inboxId", async (req, res) => {
    try {
      const inboxId = parseInt(req.params.inboxId);
      const campaigns4 = await storage.getCampaignsUsingInbox(inboxId);
      res.json(campaigns4);
    } catch (error) {
      console.error("Error checking campaigns using inbox:", error);
      res.status(500).json({ error: "Failed to check campaigns" });
    }
  });
  app2.post("/api/accounts/:id/disconnect", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getGoogleAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      const queueItems = await storage.getQueueItems("pending");
      const itemsToCancel = queueItems.filter((item) => {
        const prospectData = item.prospectData;
        return prospectData.assignedInboxId === accountId;
      });
      for (const item of itemsToCancel) {
        await storage.updateQueueItem(item.id, {
          status: "cancelled"
        });
      }
      try {
        const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${account.refreshToken}`;
        await fetch(revokeUrl, { method: "POST" });
      } catch (revokeError) {
        console.warn("Failed to revoke OAuth tokens:", revokeError);
      }
      await storage.createActivityLog({
        type: "account_deleted",
        googleAccountId: accountId,
        message: `Account ${account.email} has been permanently deleted from the platform`,
        metadata: {
          email: account.email,
          cancelledQueueItems: itemsToCancel.length,
          action: "complete_deletion"
        }
      });
      await storage.disconnectGoogleAccount(accountId);
      res.json({
        success: true,
        message: "Account permanently deleted from platform",
        cancelledItems: itemsToCancel.length
      });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      res.status(500).json({ error: "Failed to disconnect account" });
    }
  });
  app2.get("/api/scheduling/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const settings = await schedulingService.getSchedulingSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching scheduling settings:", error);
      res.status(500).json({ error: "Failed to fetch scheduling settings" });
    }
  });
  app2.patch("/api/scheduling/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      await schedulingService.updateSchedulingSettings(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating scheduling settings:", error);
      res.status(500).json({ error: "Failed to update scheduling settings" });
    }
  });
  app2.get("/api/scheduling/invites", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { campaignId, status, startDate, endDate } = req.query;
      const filters = {
        campaignId: campaignId ? parseInt(campaignId) : void 0,
        status,
        startDate,
        endDate
      };
      const invites3 = campaignId ? await schedulingService.getScheduledInvites(parseInt(campaignId), userId) : await schedulingService.getAllScheduledInvites(userId, filters);
      res.json(invites3);
    } catch (error) {
      console.error("Error fetching scheduled invites:", error);
      res.status(500).json({ error: "Failed to fetch scheduled invites" });
    }
  });
  app2.get("/api/scheduling/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const stats = await schedulingService.getSchedulingStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching scheduling stats:", error);
      res.status(500).json({ error: "Failed to fetch scheduling stats" });
    }
  });
  app2.get("/api/scheduling/campaigns/:campaignId/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const campaignId = parseInt(req.params.campaignId);
      const stats = await schedulingService.getSchedulingStats(userId, campaignId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching campaign scheduling stats:", error);
      res.status(500).json({ error: "Failed to fetch campaign scheduling stats" });
    }
  });
  app2.post("/api/scheduling/invites/:inviteId/reschedule", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const inviteId = parseInt(req.params.inviteId);
      const { newTime } = req.body;
      if (!newTime) {
        return res.status(400).json({ error: "New time is required" });
      }
      const result = await schedulingService.rescheduleInvite(inviteId, newTime, userId);
      res.json(result);
    } catch (error) {
      console.error("Error rescheduling invite:", error);
      res.status(500).json({ error: "Failed to reschedule invite" });
    }
  });
  app2.post("/api/scheduling/invites/:inviteId/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const inviteId = parseInt(req.params.inviteId);
      const result = await schedulingService.cancelInvite(inviteId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error canceling invite:", error);
      res.status(500).json({ error: "Failed to cancel invite" });
    }
  });
  app2.post("/api/scheduling/invites", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const inviteData = {
        ...req.body,
        userId
      };
      const result = await schedulingService.scheduleInvite(inviteData);
      res.json(result);
    } catch (error) {
      console.error("Error scheduling invite:", error);
      res.status(500).json({ error: "Failed to schedule invite" });
    }
  });
  app2.use("/api/prospect-validation", router);
  const confirmationEmailRouter = await Promise.resolve().then(() => (init_confirmation_emails(), confirmation_emails_exports));
  app2.use("/api/confirmation-emails", confirmationEmailRouter.default);
  const responseIntelligenceRoutes = await Promise.resolve().then(() => (init_response_intelligence2(), response_intelligence_exports));
  responseIntelligenceRoutes.registerResponseIntelligenceRoutes(app2);
  const httpServer = createServer2(app2);
  return httpServer;
}
var init_routes = __esm({
  "server/routes.ts"() {
    "use strict";
    init_storage();
    init_google_auth();
    init_google_service_auth();
    init_gmail_app_password();
    init_outlook_auth();
    init_campaign_processor();
    init_queue_manager();
    init_inbox_load_balancer();
    init_time_slot_manager();
    init_multi_provider_email();
    init_oauth_calendar();
    init_scheduling_service();
    init_schema();
    init_advanced_scheduler();
    init_rsvp_tracker();
    init_auth();
    init_prospect_validation();
    init_db();
  }
});

// server/vercel-handler.ts
import "dotenv/config";
import express3 from "express";

// server/create-server.ts
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

// server/preview-routes.ts
import { createServer } from "http";
var mockUser = {
  id: "preview-user",
  email: "preview@example.com",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
var emptyStats = {
  activeCampaigns: 0,
  invitesToday: 0,
  dailyLimit: 100,
  acceptedInvites: 0,
  acceptanceRate: 0,
  connectedAccounts: 0,
  apiUsage: 12
};
function registerPreviewRoutes(app2) {
  app2.get("/api/me", (_req, res) => res.json(mockUser));
  app2.get("/api/dashboard/stats", (_req, res) => res.json(emptyStats));
  app2.get("/api/campaigns", (_req, res) => res.json([]));
  app2.get("/api/accounts", (_req, res) => res.json([]));
  app2.get("/api/accounts/with-status", (_req, res) => res.json([]));
  app2.get(
    "/api/activity",
    (_req, res) => res.json({ logs: [], total: 0, hasMore: false })
  );
  app2.get(
    "/api/queue/status",
    (_req, res) => res.json({ pending: 0, processing: 0, pendingItems: 0 })
  );
  app2.get("/api/oauth-calendar/accounts", (_req, res) => res.json([]));
  app2.get("/api/microsoft/accounts", (_req, res) => res.json([]));
  app2.get("/api/settings", (_req, res) => res.json({}));
  app2.get(
    "/api/auth/service-account/status",
    (_req, res) => res.json({ configured: false, available: false })
  );
  app2.post("/api/login", (req, res) => {
    req.session.userId = mockUser.id;
    res.json(mockUser);
  });
  app2.post("/api/signup", (req, res) => {
    req.session.userId = mockUser.id;
    res.json(mockUser);
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
  app2.use("/api", (_req, res) => {
    res.json([]);
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();

// server/create-server.ts
init_gmail_app_password();
async function configureSessions(app2, isProduction, hasDatabase) {
  if (hasDatabase) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: 7 * 24 * 60 * 60,
      tableName: "sessions"
    });
    app2.use(
      session({
        secret: process.env.SESSION_SECRET || "shady-5-session-secret-key",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction,
          maxAge: 7 * 24 * 60 * 60 * 1e3,
          httpOnly: true
        }
      })
    );
    return;
  }
  console.warn("DATABASE_URL not set \u2014 using preview mode with in-memory sessions");
  const MemoryStore = createMemoryStore(session);
  app2.use(
    session({
      secret: process.env.SESSION_SECRET || "shady-5-session-secret-key",
      store: new MemoryStore({ checkPeriod: 864e5 }),
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1e3,
        httpOnly: true
      }
    })
  );
}
async function initApp(app2, options = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  await configureSessions(app2, isProduction, hasDatabase);
  if (hasDatabase) {
    await gmailAppPasswordService.initialize();
    if (!options.apiOnly) {
      console.log("Starting connection monitoring service...");
      const { connectionMonitorService: connectionMonitorService2 } = await Promise.resolve().then(() => (init_connection_monitor(), connection_monitor_exports));
      connectionMonitorService2.startMonitoring();
    }
    const { registerRoutes: registerRoutes2 } = await Promise.resolve().then(() => (init_routes(), routes_exports));
    await registerRoutes2(app2);
  } else {
    registerPreviewRoutes(app2);
  }
  app2.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}

// server/vercel-handler.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
var initPromise = null;
function ensureReady() {
  if (!initPromise) {
    initPromise = initApp(app, { apiOnly: true });
  }
  return initPromise;
}
async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
var vercel_handler_default = handler;
export {
  vercel_handler_default as default
};
