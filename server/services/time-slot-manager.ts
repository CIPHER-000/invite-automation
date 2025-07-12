import { Campaign } from "@shared/schema";
import { storage } from "../storage";

export interface TimeSlotPreferences {
  startHour: number; // 9 for 9AM
  endHour: number; // 17 for 5PM
  timezone: string; // 'America/New_York'
  daysOfWeek: number[]; // [1,2,3,4,5] for Mon-Fri
  excludeDates?: Date[]; // holidays or specific dates to avoid
}

export interface ProspectScheduleData {
  email: string;
  timezone?: string;
  preferredHours?: string; // "9-17" or "9AM-5PM"
  preferredDays?: string; // "Mon-Fri" or "1,2,3,4,5"
}

export class TimeSlotManager {
  private bookedSlots: Map<string, Set<string>> = new Map(); // account -> set of datetime strings
  private globalBookedSlots: Set<string> = new Set(); // All slots across all accounts/campaigns

  /**
   * Generate an optimal time slot for a prospect based on their preferences
   */
  async generateTimeSlot(
    prospect: ProspectScheduleData,
    campaign: Campaign,
    accountEmail: string,
    baseDate?: Date
  ): Promise<Date> {
    const preferences = this.parseProspectPreferences(prospect, campaign);
    const targetDate = baseDate || new Date();
    
    // Refresh global booked slots from database
    await this.refreshGlobalBookedSlots();
    
    // Find next available business day
    let scheduleDate = new Date(targetDate);
    scheduleDate = this.findNextBusinessDay(scheduleDate, preferences);
    
    // Generate random time within preferred hours
    const timeSlot = this.generateRandomTimeSlot(scheduleDate, preferences);
    
    // Ensure no double booking (check both account-specific and global)
    const finalSlot = this.ensureNoDoubleBookingGlobally(timeSlot, accountEmail, preferences);
    
    // Mark slot as booked both locally and globally
    await this.markSlotAsBooked(accountEmail, finalSlot);
    
    return finalSlot;
  }

  /**
   * Parse prospect preferences from data or use campaign defaults
   */
  private parseProspectPreferences(
    prospect: ProspectScheduleData,
    campaign: Campaign
  ): TimeSlotPreferences {
    // Default preferences - 12PM-4PM as per user requirements
    let preferences: TimeSlotPreferences = {
      startHour: 12,
      endHour: 16,
      timezone: campaign.timeZone || 'UTC',
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    };

    // Parse prospect timezone
    if (prospect.timezone) {
      preferences.timezone = prospect.timezone;
    }

    // Parse preferred hours (e.g., "9-17" or "9AM-5PM")
    if (prospect.preferredHours) {
      const hours = this.parseTimeRange(prospect.preferredHours);
      if (hours) {
        preferences.startHour = hours.start;
        preferences.endHour = hours.end;
      }
    }

    // Parse preferred days
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
  private parseTimeRange(timeRange: string): { start: number; end: number } | null {
    // Handle formats like "9-17", "9AM-5PM", "09:00-17:00"
    const patterns = [
      /(\d{1,2})-(\d{1,2})/, // "9-17"
      /(\d{1,2})AM-(\d{1,2})PM/, // "9AM-5PM"
      /(\d{1,2}):00-(\d{1,2}):00/, // "09:00-17:00"
    ];

    for (const pattern of patterns) {
      const match = timeRange.match(pattern);
      if (match) {
        return {
          start: parseInt(match[1]),
          end: parseInt(match[2]),
        };
      }
    }

    return null;
  }

  /**
   * Parse days of week from string like "Mon-Fri" or "1,2,3,4,5"
   */
  private parseDaysOfWeek(daysStr: string): number[] {
    if (daysStr.includes(',')) {
      // Handle "1,2,3,4,5" format
      return daysStr.split(',').map(d => parseInt(d.trim())).filter(d => d >= 0 && d <= 6);
    }
    
    if (daysStr.toLowerCase().includes('mon-fri')) {
      return [1, 2, 3, 4, 5];
    }
    
    if (daysStr.toLowerCase().includes('weekdays')) {
      return [1, 2, 3, 4, 5];
    }

    // Default to weekdays
    return [1, 2, 3, 4, 5];
  }

  /**
   * Find the next available time slot with minimum 2-day gap enforcement
   */
  private findNextBusinessDay(startDate: Date, preferences: TimeSlotPreferences): Date {
    const now = new Date();
    
    // ENFORCE MINIMUM 2-DAY GAP: Add 2 days to current date
    const minimumDate = new Date(now);
    minimumDate.setDate(minimumDate.getDate() + 2);
    
    // Start from the minimum date or provided date (whichever is later)
    let date = new Date(Math.max(startDate.getTime(), minimumDate.getTime()));
    
    // Find next valid business day that meets the minimum gap requirement
    let attempts = 0;
    while (attempts < 14) { // Don't search more than 2 weeks
      const dayOfWeek = date.getDay();
      
      if (preferences.daysOfWeek.includes(dayOfWeek)) {
        // Check if it's not an excluded date
        if (!preferences.excludeDates?.some(excluded => 
          excluded.toDateString() === date.toDateString()
        )) {
          return date;
        }
      }
      
      date.setDate(date.getDate() + 1);
      attempts++;
    }

    // Fallback to minimum date if no valid day found
    return minimumDate;
  }

  /**
   * Generate a random time slot within preferred hours
   */
  private generateRandomTimeSlot(date: Date, preferences: TimeSlotPreferences): Date {
    const slot = new Date(date);
    
    // Random hour within range
    const hourRange = preferences.endHour - preferences.startHour;
    const randomHour = preferences.startHour + Math.floor(Math.random() * hourRange);
    
    // Random minute (0, 15, 30, or 45 to look natural)
    const possibleMinutes = [0, 15, 30, 45];
    const randomMinute = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
    
    slot.setHours(randomHour, randomMinute, 0, 0);
    
    return slot;
  }

  /**
   * Ensure no double booking by checking against already booked slots (globally and per account)
   */
  private ensureNoDoubleBookingGlobally(
    proposedSlot: Date,
    accountEmail: string,
    preferences: TimeSlotPreferences
  ): Date {
    const slotKey = this.getSlotKey(proposedSlot);
    const bookedSlotsForAccount = this.bookedSlots.get(accountEmail) || new Set();
    
    // Check if slot is available both globally and for this specific account
    if (!bookedSlotsForAccount.has(slotKey) && !this.globalBookedSlots.has(slotKey)) {
      return proposedSlot;
    }

    // If slot is taken, try the next available slot
    let attempts = 0;
    let alternativeSlot = new Date(proposedSlot);
    
    while (attempts < 50) { // Increased attempts since we're checking more conflicts
      alternativeSlot.setMinutes(alternativeSlot.getMinutes() + 15);
      
      // If we've gone past business hours, move to next day
      if (alternativeSlot.getHours() >= preferences.endHour) {
        alternativeSlot = this.findNextBusinessDay(
          new Date(alternativeSlot.getTime() + 24 * 60 * 60 * 1000),
          preferences
        );
        alternativeSlot = this.generateRandomTimeSlot(alternativeSlot, preferences);
      }
      
      const altSlotKey = this.getSlotKey(alternativeSlot);
      const altBookedForAccount = this.bookedSlots.get(accountEmail) || new Set();
      
      // Check both account-specific and global availability
      if (!altBookedForAccount.has(altSlotKey) && !this.globalBookedSlots.has(altSlotKey)) {
        return alternativeSlot;
      }
      
      attempts++;
    }

    // If all slots in the expanded range are taken, we need to allow overlap
    // This should only happen when the time window is completely saturated
    console.warn(`Warning: All time slots are saturated. Allowing overlap for slot ${proposedSlot.toISOString()}`);
    return proposedSlot;
  }

  /**
   * Mark a time slot as booked for an account (both locally and globally)
   */
  private async markSlotAsBooked(accountEmail: string, slot: Date): Promise<void> {
    const slotKey = this.getSlotKey(slot);
    
    // Mark in local memory for this account
    if (!this.bookedSlots.has(accountEmail)) {
      this.bookedSlots.set(accountEmail, new Set());
    }
    this.bookedSlots.get(accountEmail)!.add(slotKey);
    
    // Mark globally to prevent any other account from using this slot
    this.globalBookedSlots.add(slotKey);
    
    console.log(`Booked time slot: ${slot.toISOString()} for account ${accountEmail}`);
  }

  /**
   * Refresh global booked slots from database to get latest state
   */
  private async refreshGlobalBookedSlots(): Promise<void> {
    try {
      // Get all recent invites with their proposed meeting times
      const allInvites = await storage.getInvites(""); // Get all invites across all users
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      this.globalBookedSlots.clear();
      
      for (const invite of allInvites) {
        // Only consider recent invites that have actual calendar events
        if (invite.eventId && invite.createdAt && invite.createdAt > cutoffTime) {
          // Extract the meeting time from event data if available
          // For now, we'll use a simple heuristic based on creation time + offset
          // In a real implementation, you'd query the calendar API for the actual event time
          const estimatedMeetingTime = new Date(invite.createdAt.getTime() + 24 * 60 * 60 * 1000);
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
  private getSlotKey(slot: Date): string {
    return slot.toISOString();
  }

  /**
   * Clear old booked slots (older than 24 hours)
   */
  clearOldBookedSlots(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.bookedSlots.forEach((slots, accountEmail) => {
      const validSlots = new Set<string>();
      
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
  getBookedSlots(accountEmail: string): Date[] {
    const slots = this.bookedSlots.get(accountEmail) || new Set();
    return Array.from(slots).map(slotKey => new Date(slotKey));
  }

  /**
   * Convert time to prospect's timezone
   */
  convertToProspectTimezone(date: Date, prospectTimezone: string): Date {
    try {
      // This is a simplified conversion - in production you might want to use a library like date-fns-tz
      return new Date(date.toLocaleString("en-US", { timeZone: prospectTimezone }));
    } catch (error) {
      console.warn(`Invalid timezone ${prospectTimezone}, using original date`);
      return date;
    }
  }
}

export const timeSlotManager = new TimeSlotManager();