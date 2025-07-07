import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['draft', 'active', 'paused', 'completed'] }).default('draft'),
  googleAccountId: text('google_account_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Google accounts table
export const googleAccounts = pgTable('google_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  isConnected: boolean('is_connected').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Meeting invites table
export const meetingInvites = pgTable('meeting_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  attendeeEmail: text('attendee_email').notNull(),
  eventId: text('event_id'), // Google Calendar event ID
  status: text('status', { enum: ['sent', 'accepted', 'declined', 'pending'] }).default('pending'),
  sentAt: timestamp('sent_at').defaultNow(),
});

// Insert schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleAccountSchema = createInsertSchema(googleAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingInviteSchema = createInsertSchema(meetingInvites).omit({
  id: true,
  sentAt: true,
});

// Types
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type GoogleAccount = typeof googleAccounts.$inferSelect;
export type InsertGoogleAccount = z.infer<typeof insertGoogleAccountSchema>;

export type MeetingInvite = typeof meetingInvites.$inferSelect;
export type InsertMeetingInvite = z.infer<typeof insertMeetingInviteSchema>;