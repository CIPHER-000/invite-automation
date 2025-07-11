import { format, addDays, startOfDay, setHours, setMinutes, isAfter, isBefore, getDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface AdvancedSchedulingConfig {
  dateRangeStart: Date;
  dateRangeEnd: Date;
  selectedDaysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  timeWindowStart: string; // "09:00"
  timeWindowEnd: string; // "17:00"
  timezone: string; // "America/New_York"
  totalSlots: number; // Number of unique slots needed
}

export interface ScheduledSlot {
  dateTime: Date;
  localDateTime: string;
  utcDateTime: string;
  dayOfWeek: number;
  slotIndex: number;
}

export class AdvancedScheduler {
  /**
   * Generate unique randomized time slots within the specified constraints
   */
  generateRandomizedSlots(config: AdvancedSchedulingConfig): ScheduledSlot[] {
    const availableSlots = this.calculateAvailableSlots(config);
    
    if (availableSlots.length < config.totalSlots) {
      throw new Error(
        `Not enough available time slots. Need ${config.totalSlots} slots but only ${availableSlots.length} are available. ` +
        `Please expand your date range, add more days, or extend your time window.`
      );
    }

    // Randomly select unique slots
    const selectedSlots = this.shuffleArray([...availableSlots])
      .slice(0, config.totalSlots)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); // Sort by date/time

    return selectedSlots.map((slot, index) => ({
      ...slot,
      slotIndex: index
    }));
  }

  /**
   * Calculate all available time slots within constraints
   */
  private calculateAvailableSlots(config: AdvancedSchedulingConfig): ScheduledSlot[] {
    const slots: ScheduledSlot[] = [];
    const { dateRangeStart, dateRangeEnd, selectedDaysOfWeek, timeWindowStart, timeWindowEnd, timezone } = config;

    // Parse time window
    const [startHour, startMinute] = timeWindowStart.split(':').map(Number);
    const [endHour, endMinute] = timeWindowEnd.split(':').map(Number);

    // Iterate through each day in the date range
    let currentDate = startOfDay(dateRangeStart);
    const endDate = startOfDay(dateRangeEnd);

    while (!isAfter(currentDate, endDate)) {
      const dayOfWeek = getDay(currentDate);
      
      // Check if this day is selected
      if (selectedDaysOfWeek.includes(dayOfWeek)) {
        // Generate 30-minute slots within the time window
        for (let hour = startHour; hour < endHour || (hour === endHour && startMinute === 0); hour++) {
          for (let minute = hour === startHour ? startMinute : 0; 
               minute < 60 && (hour < endHour || (hour === endHour && minute < endMinute)); 
               minute += 30) {
            
            const localDateTime = setMinutes(setHours(currentDate, hour), minute);
            const utcDateTime = fromZonedTime(localDateTime, timezone);
            
            slots.push({
              dateTime: utcDateTime,
              localDateTime: this.formatLocalDateTime(localDateTime, timezone),
              utcDateTime: utcDateTime.toISOString(),
              dayOfWeek,
              slotIndex: 0 // Will be set later
            });
          }
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    return slots;
  }

  /**
   * Validate scheduling configuration
   */
  validateConfiguration(config: AdvancedSchedulingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check date range
    if (isAfter(config.dateRangeStart, config.dateRangeEnd)) {
      errors.push("Start date must be before end date");
    }

    // Check if start date is in the past
    const today = new Date();
    if (isBefore(config.dateRangeStart, today)) {
      errors.push("Start date cannot be in the past");
    }

    // Check days of week
    if (config.selectedDaysOfWeek.length === 0) {
      errors.push("At least one day of the week must be selected");
    }

    // Check time window
    const [startHour, startMinute] = config.timeWindowStart.split(':').map(Number);
    const [endHour, endMinute] = config.timeWindowEnd.split(':').map(Number);
    
    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
      errors.push("Start time must be before end time");
    }

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      errors.push("Hours must be between 0 and 23");
    }

    if (startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
      errors.push("Minutes must be between 0 and 59");
    }

    // Check if enough slots are available
    try {
      const availableSlots = this.calculateAvailableSlots(config);
      if (availableSlots.length < config.totalSlots) {
        errors.push(
          `Not enough available time slots. Need ${config.totalSlots} but only ${availableSlots.length} available. ` +
          `Expand your date range, add more days, or extend your time window.`
        );
      }
    } catch (error) {
      errors.push("Error calculating available slots");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available slot count for configuration
   */
  getAvailableSlotCount(config: Omit<AdvancedSchedulingConfig, 'totalSlots'>): number {
    try {
      const tempConfig: AdvancedSchedulingConfig = { ...config, totalSlots: 0 };
      return this.calculateAvailableSlots(tempConfig).length;
    } catch {
      return 0;
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Format local date time for display
   */
  private formatLocalDateTime(date: Date, timezone: string): string {
    const zonedDate = toZonedTime(date, timezone);
    return format(zonedDate, 'yyyy-MM-dd HH:mm');
  }

  /**
   * Get timezone-aware display string
   */
  getDisplayTime(utcDateTime: string, timezone: string): string {
    const utcDate = new Date(utcDateTime);
    const localDate = toZonedTime(utcDate, timezone);
    return format(localDate, 'MMM dd, yyyy hh:mm a');
  }
}

export const advancedScheduler = new AdvancedScheduler();