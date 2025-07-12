import { db } from "../db";
import { scheduledInvites, schedulingSettings, campaigns, users } from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { addBusinessDays, isWeekend, format, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface SchedulingOptions {
  minLeadTimeDays?: number;
  maxLeadTimeDays?: number;
  preferredStartHour?: number;
  preferredEndHour?: number;
  allowDoubleBooking?: boolean;
  excludeWeekends?: boolean;
  recipientTimezone?: string;
}

export interface ScheduledInviteData {
  campaignId: number;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  recipientTimezone?: string;
  mergeData?: any;
}

export class SchedulingService {
  /**
   * Get scheduling settings for a user (global) or campaign
   */
  async getSchedulingSettings(userId: string, campaignId?: number) {
    const settings = await db
      .select()
      .from(schedulingSettings)
      .where(
        and(
          eq(schedulingSettings.userId, userId),
          campaignId ? eq(schedulingSettings.campaignId, campaignId) : eq(schedulingSettings.isGlobal, true)
        )
      )
      .limit(1);

    if (settings.length === 0) {
      // Return default settings
      return {
        minLeadTimeDays: 2,
        maxLeadTimeDays: 6,
        preferredStartHour: 12,
        preferredEndHour: 16,
        allowDoubleBooking: false,
        excludeWeekends: true,
        businessHoursOnly: true,
        fallbackPolicy: 'skip' as const,
        enableTimezoneDetection: true,
        retryAttempts: 3,
      };
    }

    return settings[0];
  }

  /**
   * Update scheduling settings
   */
  async updateSchedulingSettings(userId: string, settingsData: Partial<typeof schedulingSettings.$inferInsert>) {
    const existingSettings = await db
      .select()
      .from(schedulingSettings)
      .where(
        and(
          eq(schedulingSettings.userId, userId),
          eq(schedulingSettings.isGlobal, true)
        )
      )
      .limit(1);

    if (existingSettings.length === 0) {
      // Create new settings
      await db.insert(schedulingSettings).values({
        userId,
        isGlobal: true,
        ...settingsData,
      });
    } else {
      // Update existing settings
      await db
        .update(schedulingSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(schedulingSettings.id, existingSettings[0].id));
    }
  }

  /**
   * Calculate next available time slot
   */
  calculateNextAvailableSlot(
    options: SchedulingOptions,
    timezone: string = 'UTC'
  ): Date {
    const {
      minLeadTimeDays = 2,
      maxLeadTimeDays = 6,
      preferredStartHour = 12,
      preferredEndHour = 16,
      excludeWeekends = true,
    } = options;

    const now = new Date();
    let targetDate = addBusinessDays(now, minLeadTimeDays);

    // Skip weekends if required
    if (excludeWeekends && isWeekend(targetDate)) {
      targetDate = addBusinessDays(targetDate, 1);
    }

    // Random time within preferred window
    const randomHour = Math.floor(Math.random() * (preferredEndHour - preferredStartHour)) + preferredStartHour;
    const randomMinute = Math.floor(Math.random() * 4) * 15; // 15-minute intervals

    // Create time in recipient's timezone
    const localTime = new Date(targetDate);
    localTime.setHours(randomHour, randomMinute, 0, 0);

    // Convert to UTC
    const utcTime = fromZonedTime(localTime, timezone);

    return utcTime;
  }

  /**
   * Schedule a new invite
   */
  async scheduleInvite(inviteData: ScheduledInviteData, options?: SchedulingOptions): Promise<any> {
    const settings = await this.getSchedulingSettings(inviteData.userId, inviteData.campaignId);
    const finalOptions = { ...settings, ...options };

    const recipientTz = inviteData.recipientTimezone || 'America/New_York';
    const scheduledTime = this.calculateNextAvailableSlot(finalOptions, recipientTz);

    const [result] = await db
      .insert(scheduledInvites)
      .values({
        ...inviteData,
        scheduledTimeUtc: scheduledTime,
        recipientTimezone: recipientTz,
        leadTimeDays: finalOptions.minLeadTimeDays,
      })
      .returning();

    return result;
  }

  /**
   * Get all scheduled invites for a campaign
   */
  async getScheduledInvites(campaignId: number, userId: string) {
    return await db
      .select({
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
        senderEmail: users.email,
      })
      .from(scheduledInvites)
      .leftJoin(campaigns, eq(scheduledInvites.campaignId, campaigns.id))
      .leftJoin(users, eq(scheduledInvites.userId, users.id))
      .where(
        and(
          eq(scheduledInvites.campaignId, campaignId),
          eq(scheduledInvites.userId, userId)
        )
      )
      .orderBy(asc(scheduledInvites.scheduledTimeUtc));
  }

  /**
   * Get all scheduled invites for a user
   */
  async getAllScheduledInvites(userId: string, filters?: {
    campaignId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = db
      .select({
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
        senderEmail: users.email,
      })
      .from(scheduledInvites)
      .leftJoin(campaigns, eq(scheduledInvites.campaignId, campaigns.id))
      .leftJoin(users, eq(scheduledInvites.userId, users.id))
      .where(eq(scheduledInvites.userId, userId));

    // Apply filters
    if (filters?.campaignId) {
      query = query.where(eq(scheduledInvites.campaignId, filters.campaignId));
    }

    if (filters?.status) {
      query = query.where(eq(scheduledInvites.status, filters.status));
    }

    if (filters?.startDate) {
      query = query.where(gte(scheduledInvites.scheduledTimeUtc, parseISO(filters.startDate)));
    }

    if (filters?.endDate) {
      query = query.where(lte(scheduledInvites.scheduledTimeUtc, parseISO(filters.endDate)));
    }

    return await query.orderBy(asc(scheduledInvites.scheduledTimeUtc));
  }

  /**
   * Get scheduling statistics
   */
  async getSchedulingStats(userId: string, campaignId?: number) {
    let baseQuery = db
      .select()
      .from(scheduledInvites)
      .where(eq(scheduledInvites.userId, userId));

    if (campaignId) {
      baseQuery = baseQuery.where(eq(scheduledInvites.campaignId, campaignId));
    }

    const allInvites = await baseQuery;

    const stats = {
      totalScheduled: allInvites.length,
      pendingInvites: allInvites.filter(i => i.status === 'pending').length,
      acceptedInvites: allInvites.filter(i => i.status === 'accepted').length,
      declinedInvites: allInvites.filter(i => i.status === 'declined').length,
      canceledInvites: allInvites.filter(i => i.status === 'canceled').length,
      doubleBookedSlots: allInvites.filter(i => i.wasDoubleBooked).length,
      needsAttention: allInvites.filter(i => i.status === 'needs_attention').length,
      upcomingInvites: allInvites.filter(i => 
        i.status === 'pending' && new Date(i.scheduledTimeUtc) > new Date()
      ).length,
      conflictingSlots: allInvites.filter(i => 
        i.status === 'needs_attention' && i.errorMessage?.includes('conflict')
      ).length,
    };

    if (campaignId) {
      // Add campaign-specific stats
      const avgLeadTime = allInvites.reduce((sum, invite) => {
        const leadTime = Math.floor(
          (new Date(invite.scheduledTimeUtc).getTime() - new Date(invite.createdAt).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return sum + leadTime;
      }, 0) / allInvites.length || 0;

      return {
        ...stats,
        averageLeadTime: Math.round(avgLeadTime),
      };
    }

    return stats;
  }

  /**
   * Reschedule an invite
   */
  async rescheduleInvite(inviteId: number, newTime: string, userId: string): Promise<any> {
    const newTimeUtc = parseISO(newTime);
    
    const [result] = await db
      .update(scheduledInvites)
      .set({
        scheduledTimeUtc: newTimeUtc,
        rescheduledCount: db.sql`${scheduledInvites.rescheduledCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(scheduledInvites.id, inviteId),
          eq(scheduledInvites.userId, userId)
        )
      )
      .returning();

    return result;
  }

  /**
   * Cancel an invite
   */
  async cancelInvite(inviteId: number, userId: string): Promise<any> {
    const [result] = await db
      .update(scheduledInvites)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(scheduledInvites.id, inviteId),
          eq(scheduledInvites.userId, userId)
        )
      )
      .returning();

    return result;
  }

  /**
   * Update invite status (e.g., when RSVP is received)
   */
  async updateInviteStatus(inviteId: number, status: string, eventId?: string): Promise<any> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (eventId) {
      updateData.senderCalendarEventId = eventId;
    }

    const [result] = await db
      .update(scheduledInvites)
      .set(updateData)
      .where(eq(scheduledInvites.id, inviteId))
      .returning();

    return result;
  }
}

export const schedulingService = new SchedulingService();