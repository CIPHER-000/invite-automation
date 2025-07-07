import { Campaign } from "@shared/schema";

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

  /**
   * Generate an optimal time slot for a prospect based on their preferences
   */
  generateTimeSlot(
    prospect: ProspectScheduleData,
    campaign: Campaign,
    accountEmail: string,
    baseDate?: Date
  ): Date {
    const preferences = this.parseProspectPreferences(prospect, campaign);
    const targetDate = baseDate || new Date();
    
    // Find next available business day
    let scheduleDate = new Date(targetDate);
    scheduleDate = this.findNextBusinessDay(scheduleDate, preferences);
    
    // Generate random time within preferred hours
    const timeSlot = this.generateRandomTimeSlot(scheduleDate, preferences);
    
    // Ensure no double booking
    const finalSlot = this.ensureNoDoubleBooking(timeSlot, accountEmail, preferences);
    
    // Mark slot as booked
    this.markSlotAsBooked(accountEmail, finalSlot);
    
    return finalSlot;
  }

  /**
   * Parse prospect preferences from data or use campaign defaults
   */
  private parseProspectPreferences(
    prospect: ProspectScheduleData,
    campaign: Campaign
  ): TimeSlotPreferences {
    // Default preferences
    let preferences: TimeSlotPreferences = {
      startHour: 9,
      endHour: 17,
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
   * Find the next available time slot (immediate or near-immediate scheduling)
   */
  private findNextBusinessDay(startDate: Date, preferences: TimeSlotPreferences): Date {
    let date = new Date(startDate);
    const now = new Date();
    
    // For campaign automation, we want to start sending invites soon
    // Only advance to next day if it's very late (after 10 PM) or very early (before 6 AM)
    if (date.toDateString() === now.toDateString() && 
        (now.getHours() >= 22 || now.getHours() < 6)) {
      date.setDate(date.getDate() + 1);
      date.setHours(preferences.startHour, 0, 0, 0);
    } else if (date.toDateString() === now.toDateString()) {
      // If it's the same day and within reasonable hours, start soon
      // Add 5-30 minutes from now to spread out the sends
      date = new Date(now.getTime() + Math.random() * 25 * 60000 + 5 * 60000);
    }

    // Find next valid business day only if we're on a weekend
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

    // Fallback to original date if no valid day found
    return startDate;
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
   * Ensure no double booking by checking against already booked slots
   */
  private ensureNoDoubleBooking(
    proposedSlot: Date,
    accountEmail: string,
    preferences: TimeSlotPreferences
  ): Date {
    const slotKey = this.getSlotKey(proposedSlot);
    const bookedSlotsForAccount = this.bookedSlots.get(accountEmail) || new Set();
    
    if (!bookedSlotsForAccount.has(slotKey)) {
      return proposedSlot;
    }

    // If slot is taken, try the next available slot
    let attempts = 0;
    let alternativeSlot = new Date(proposedSlot);
    
    while (attempts < 20) { // Try up to 20 different times
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
      if (!bookedSlotsForAccount.has(altSlotKey)) {
        return alternativeSlot;
      }
      
      attempts++;
    }

    // Fallback: return original slot (better than infinite loop)
    return proposedSlot;
  }

  /**
   * Mark a time slot as booked for an account
   */
  private markSlotAsBooked(accountEmail: string, slot: Date): void {
    const slotKey = this.getSlotKey(slot);
    
    if (!this.bookedSlots.has(accountEmail)) {
      this.bookedSlots.set(accountEmail, new Set());
    }
    
    this.bookedSlots.get(accountEmail)!.add(slotKey);
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