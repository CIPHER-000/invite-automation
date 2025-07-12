import { 
  addDays, 
  isWeekend, 
  format, 
  parseISO, 
  startOfDay, 
  endOfDay, 
  addHours, 
  isAfter, 
  isBefore,
  differenceInDays,
  addBusinessDays,
  isBusinessDay,
  setHours,
  setMinutes,
  getHours,
  getMinutes
} from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { storage } from '../storage';
import type { 
  ScheduledInvite, 
  InsertScheduledInvite, 
  SchedulingSettings, 
  CalendarSlot,
  Campaign,
  GoogleAccount,
  OutlookAccount
} from '@shared/schema';

export interface SchedulingRequest {
  campaignId: number;
  recipientEmail: string;
  recipientName?: string;
  recipientTimezone?: string;
  userId: string;
  preferredSenderAccountId?: number;
  preferredSenderAccountType?: 'google' | 'microsoft';
}

export interface SchedulingResult {
  success: boolean;
  scheduledInvite?: ScheduledInvite;
  error?: string;
  needsManualScheduling?: boolean;
  suggestedSlots?: TimeSlot[];
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isDoubleBooking: boolean;
  accountId: number;
  accountType: 'google' | 'microsoft';
  timezone: string;
}

export interface AvailabilityCheck {
  accountId: number;
  accountType: 'google' | 'microsoft';
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  conflictingEvent?: string;
}

export class AdvancedSchedulerService {
  private readonly BUSINESS_HOURS = { start: 9, end: 17 }; // 9 AM - 5 PM
  private readonly MEETING_DURATION_MINUTES = 30;
  private readonly TIMEZONE_MAPPING = {
    'gmail.com': 'America/New_York',
    'outlook.com': 'America/New_York',
    'hotmail.com': 'America/New_York',
    // Add more domain-to-timezone mappings as needed
  };

  /**
   * Main scheduling method that handles all the advanced logic
   */
  async scheduleInvite(request: SchedulingRequest): Promise<SchedulingResult> {
    try {
      // 1. Get campaign and settings
      const campaign = await storage.getCampaign(request.campaignId, request.userId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      const settings = await this.getSchedulingSettings(request.userId, request.campaignId);
      
      // 2. Determine recipient timezone
      const recipientTimezone = this.determineRecipientTimezone(
        request.recipientTimezone, 
        request.recipientEmail, 
        settings.enableTimezoneDetection
      );

      // 3. Calculate business day range
      const schedulingRange = this.calculateSchedulingRange(settings);
      
      // 4. Get available sender accounts
      const senderAccounts = await this.getAvailableSenderAccounts(
        request.userId, 
        request.preferredSenderAccountId,
        request.preferredSenderAccountType
      );

      if (senderAccounts.length === 0) {
        return { success: false, error: 'No available sender accounts' };
      }

      // 5. Find optimal time slots
      const availableSlots = await this.findAvailableTimeSlots(
        senderAccounts,
        schedulingRange,
        recipientTimezone,
        settings
      );

      if (availableSlots.length === 0) {
        // 6. Handle no available slots - try double booking if enabled
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
          error: 'No available time slots found',
          needsManualScheduling: true,
          suggestedSlots: []
        };
      }

      // 7. Select optimal slot and create scheduled invite
      const selectedSlot = this.selectOptimalSlot(availableSlots, settings);
      return this.createScheduledInvite(request, selectedSlot, settings, false);

    } catch (error) {
      console.error('Advanced scheduler error:', error);
      return { success: false, error: 'Internal scheduling error' };
    }
  }

  /**
   * Get scheduling settings for user/campaign
   */
  private async getSchedulingSettings(userId: string, campaignId?: number): Promise<SchedulingSettings> {
    // Try to get campaign-specific settings first
    if (campaignId) {
      const campaignSettings = await storage.getSchedulingSettings(userId, campaignId);
      if (campaignSettings) {
        return campaignSettings;
      }
    }

    // Fall back to global settings
    const globalSettings = await storage.getGlobalSchedulingSettings(userId);
    if (globalSettings) {
      return globalSettings;
    }

    // Return default settings if none exist
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
      fallbackPolicy: 'skip',
      enableTimezoneDetection: true,
      retryAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Determine recipient timezone from various sources
   */
  private determineRecipientTimezone(
    explicitTimezone?: string,
    email?: string,
    enableDetection: boolean = true
  ): string {
    if (explicitTimezone) {
      return explicitTimezone;
    }

    if (enableDetection && email) {
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain && this.TIMEZONE_MAPPING[domain]) {
        return this.TIMEZONE_MAPPING[domain];
      }
    }

    return 'America/New_York'; // Default timezone
  }

  /**
   * Calculate the scheduling range based on business days
   */
  private calculateSchedulingRange(settings: SchedulingSettings): { startDate: Date; endDate: Date } {
    const today = new Date();
    const startDate = addBusinessDays(today, settings.minLeadTimeDays);
    const endDate = addBusinessDays(today, settings.maxLeadTimeDays);

    return { startDate, endDate };
  }

  /**
   * Get available sender accounts for the user
   */
  private async getAvailableSenderAccounts(
    userId: string,
    preferredAccountId?: number,
    preferredAccountType?: 'google' | 'microsoft'
  ): Promise<Array<GoogleAccount | OutlookAccount>> {
    const accounts: Array<GoogleAccount | OutlookAccount> = [];

    // Get Google accounts
    const googleAccounts = await storage.getGoogleAccounts(userId);
    accounts.push(...googleAccounts.filter(acc => acc.isActive));

    // Get Microsoft accounts
    const outlookAccounts = await storage.getOutlookAccounts(userId);
    accounts.push(...outlookAccounts.filter(acc => acc.isActive));

    // Filter by preferred account if specified
    if (preferredAccountId && preferredAccountType) {
      const preferredAccount = accounts.find(acc => 
        acc.id === preferredAccountId && 
        (preferredAccountType === 'google' ? 'accessToken' in acc : 'microsoftId' in acc)
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
  private async findAvailableTimeSlots(
    senderAccounts: Array<GoogleAccount | OutlookAccount>,
    schedulingRange: { startDate: Date; endDate: Date },
    recipientTimezone: string,
    settings: SchedulingSettings
  ): Promise<TimeSlot[]> {
    const availableSlots: TimeSlot[] = [];
    
    for (const account of senderAccounts) {
      const accountType = 'microsoftId' in account ? 'microsoft' : 'google';
      const accountSlots = await this.getAccountAvailableSlots(
        account,
        accountType,
        schedulingRange,
        recipientTimezone,
        settings
      );
      availableSlots.push(...accountSlots);
    }

    // Sort by date/time and remove duplicates
    return this.sortAndDeduplicateSlots(availableSlots);
  }

  /**
   * Get available slots for a specific account
   */
  private async getAccountAvailableSlots(
    account: GoogleAccount | OutlookAccount,
    accountType: 'google' | 'microsoft',
    schedulingRange: { startDate: Date; endDate: Date },
    recipientTimezone: string,
    settings: SchedulingSettings
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    let currentDate = new Date(schedulingRange.startDate);

    while (currentDate <= schedulingRange.endDate) {
      // Skip weekends if configured
      if (settings.excludeWeekends && isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Generate time slots for this day
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
  private async generateDaySlots(
    date: Date,
    account: GoogleAccount | OutlookAccount,
    accountType: 'google' | 'microsoft',
    recipientTimezone: string,
    settings: SchedulingSettings
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    
    // Convert preferred hours to recipient timezone
    const recipientStartHour = settings.preferredStartHour;
    const recipientEndHour = settings.preferredEndHour;
    
    // Generate 30-minute slots within preferred hours
    for (let hour = recipientStartHour; hour < recipientEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const recipientTime = setMinutes(setHours(date, hour), minute);
        const utcTime = fromZonedTime(recipientTime, recipientTimezone);
        const slotEnd = addHours(utcTime, 0.5); // 30 minutes

        // Check if this slot is available
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

    return slots.filter(slot => slot.isAvailable);
  }

  /**
   * Check if a specific time slot is available for an account
   */
  private async checkSlotAvailability(
    account: GoogleAccount | OutlookAccount,
    accountType: 'google' | 'microsoft',
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      // Check against existing scheduled invites
      const existingInvites = await storage.getScheduledInvitesByTimeRange(
        account.id,
        accountType,
        startTime,
        endTime
      );

      if (existingInvites.length > 0) {
        return false;
      }

      // Check against calendar busy times
      const busyTimes = await this.getCalendarBusyTimes(account, accountType, startTime, endTime);
      
      for (const busyTime of busyTimes) {
        if (this.timesOverlap(startTime, endTime, busyTime.startTime, busyTime.endTime)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  }

  /**
   * Get busy times from calendar API
   */
  private async getCalendarBusyTimes(
    account: GoogleAccount | OutlookAccount,
    accountType: 'google' | 'microsoft',
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ startTime: Date; endTime: Date; title?: string }>> {
    try {
      if (accountType === 'google') {
        return await this.getGoogleCalendarBusyTimes(account as GoogleAccount, startTime, endTime);
      } else {
        return await this.getMicrosoftCalendarBusyTimes(account as OutlookAccount, startTime, endTime);
      }
    } catch (error) {
      console.error('Error fetching calendar busy times:', error);
      return [];
    }
  }

  /**
   * Get busy times from Google Calendar
   */
  private async getGoogleCalendarBusyTimes(
    account: GoogleAccount,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ startTime: Date; endTime: Date; title?: string }>> {
    // Implementation would integrate with Google Calendar API
    // For now, returning empty array
    return [];
  }

  /**
   * Get busy times from Microsoft Calendar
   */
  private async getMicrosoftCalendarBusyTimes(
    account: OutlookAccount,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ startTime: Date; endTime: Date; title?: string }>> {
    // Implementation would integrate with Microsoft Graph API
    // For now, returning empty array
    return [];
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Find slots that could be double-booked
   */
  private async findDoubleBookingSlots(
    senderAccounts: Array<GoogleAccount | OutlookAccount>,
    schedulingRange: { startDate: Date; endDate: Date },
    recipientTimezone: string,
    settings: SchedulingSettings
  ): Promise<TimeSlot[]> {
    const doubleBookingSlots: TimeSlot[] = [];
    
    for (const account of senderAccounts) {
      const accountType = 'microsoftId' in account ? 'microsoft' : 'google';
      
      // Get existing scheduled invites that haven't been accepted
      const existingInvites = await storage.getScheduledInvitesByAccount(
        account.id,
        accountType,
        ['pending', 'sent']
      );

      // Check if any of these slots can accommodate double booking
      for (const invite of existingInvites) {
        if (invite.wasDoubleBooked) continue; // Skip already double-booked slots
        
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
  private selectOptimalSlot(slots: TimeSlot[], settings: SchedulingSettings): TimeSlot {
    // Sort by preference: non-double-booking first, then by time
    const sortedSlots = slots.sort((a, b) => {
      if (a.isDoubleBooking !== b.isDoubleBooking) {
        return a.isDoubleBooking ? 1 : -1;
      }
      return a.startTime.getTime() - b.startTime.getTime();
    });

    // Add some randomization to avoid always picking the first slot
    const topSlots = sortedSlots.slice(0, Math.min(3, sortedSlots.length));
    return topSlots[Math.floor(Math.random() * topSlots.length)];
  }

  /**
   * Create a scheduled invite record
   */
  private async createScheduledInvite(
    request: SchedulingRequest,
    slot: TimeSlot,
    settings: SchedulingSettings,
    isDoubleBooking: boolean
  ): Promise<SchedulingResult> {
    try {
      const recipientTimezone = this.determineRecipientTimezone(
        request.recipientTimezone,
        request.recipientEmail,
        settings.enableTimezoneDetection
      );

      const scheduledInvite: InsertScheduledInvite = {
        campaignId: request.campaignId,
        userId: request.userId,
        recipientEmail: request.recipientEmail,
        recipientName: request.recipientName,
        recipientTimezone,
        scheduledTimeUtc: slot.startTime,
        scheduledTimeLocal: toZonedTime(slot.startTime, recipientTimezone),
        status: 'pending',
        senderAccountId: slot.accountId,
        senderAccountType: slot.accountType,
        wasDoubleBooked: isDoubleBooking,
        leadTimeDays: settings.minLeadTimeDays,
        metadata: {
          selectedFromSlots: 1,
          schedulingMethod: 'automatic',
          fallbackUsed: false
        }
      };

      const created = await storage.createScheduledInvite(scheduledInvite);
      
      // Log the scheduling activity
      await storage.createActivityLog({
        eventType: 'invite_scheduled',
        action: 'schedule',
        description: `Scheduled invite for ${request.recipientEmail} at ${format(slot.startTime, 'PPpp')}`,
        severity: 'info',
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
      console.error('Error creating scheduled invite:', error);
      return { success: false, error: 'Failed to create scheduled invite' };
    }
  }

  /**
   * Sort and deduplicate time slots
   */
  private sortAndDeduplicateSlots(slots: TimeSlot[]): TimeSlot[] {
    const uniqueSlots = new Map<string, TimeSlot>();
    
    for (const slot of slots) {
      const key = `${slot.startTime.toISOString()}-${slot.accountId}-${slot.accountType}`;
      if (!uniqueSlots.has(key)) {
        uniqueSlots.set(key, slot);
      }
    }

    return Array.from(uniqueSlots.values()).sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
  }

  /**
   * Reschedule an existing invite
   */
  async rescheduleInvite(
    inviteId: number,
    newTimeSlot: TimeSlot,
    userId: string
  ): Promise<SchedulingResult> {
    try {
      const existingInvite = await storage.getScheduledInvite(inviteId, userId);
      if (!existingInvite) {
        return { success: false, error: 'Invite not found' };
      }

      const updates = {
        scheduledTimeUtc: newTimeSlot.startTime,
        scheduledTimeLocal: toZonedTime(newTimeSlot.startTime, existingInvite.recipientTimezone),
        senderAccountId: newTimeSlot.accountId,
        senderAccountType: newTimeSlot.accountType,
        wasDoubleBooked: newTimeSlot.isDoubleBooking,
        originalScheduledTime: existingInvite.originalScheduledTime || existingInvite.scheduledTimeUtc,
        rescheduledCount: existingInvite.rescheduledCount + 1,
        status: 'pending',
        updatedAt: new Date()
      };

      const updated = await storage.updateScheduledInvite(inviteId, updates, userId);
      
      // Log the rescheduling activity
      await storage.createActivityLog({
        eventType: 'invite_rescheduled',
        action: 'reschedule',
        description: `Rescheduled invite for ${existingInvite.recipientEmail} from ${format(existingInvite.scheduledTimeUtc, 'PPpp')} to ${format(newTimeSlot.startTime, 'PPpp')}`,
        severity: 'info',
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
      console.error('Error rescheduling invite:', error);
      return { success: false, error: 'Failed to reschedule invite' };
    }
  }

  /**
   * Get available slots for manual scheduling
   */
  async getAvailableSlots(
    userId: string,
    campaignId: number,
    dateRange: { startDate: Date; endDate: Date },
    recipientTimezone: string = 'America/New_York'
  ): Promise<TimeSlot[]> {
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
      console.error('Error getting available slots:', error);
      return [];
    }
  }
}

export const advancedScheduler = new AdvancedSchedulerService();