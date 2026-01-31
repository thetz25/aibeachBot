import { format, parse, addMinutes, isWithinInterval, setHours, setMinutes, addDays, startOfDay, isBefore, isAfter } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { config } from '../config/env';

/**
 * Generate available time slots for a given date
 */
export const generateTimeSlots = (date: Date, duration: number): Date[] => {
    const slots: Date[] = [];
    const timezone = config.dealership.timezone;

    // Parse business hours
    // Default business hours if not set
    const startStr = process.env.DEALERSHIP_BUSINESS_HOURS_START || '09:00';
    const endStr = process.env.DEALERSHIP_BUSINESS_HOURS_END || '18:00';

    const [startHour, startMinute] = startStr.split(':').map(Number);
    const [endHour, endMinute] = endStr.split(':').map(Number);

    // Set start and end times for the day
    let currentSlot = setMinutes(setHours(startOfDay(date), startHour), startMinute);
    const endTime = setMinutes(setHours(startOfDay(date), endHour), endMinute);

    // Generate slots
    while (isBefore(currentSlot, endTime)) {
        slots.push(new Date(currentSlot));
        currentSlot = addMinutes(currentSlot, duration);
    }

    return slots;
};

/**
 * Check if a datetime is within business hours
 */
export const isWithinBusinessHours = (dateTime: Date): boolean => {
    const startStr = process.env.DEALERSHIP_BUSINESS_HOURS_START || '09:00';
    const endStr = process.env.DEALERSHIP_BUSINESS_HOURS_END || '18:00';

    const [startHour, startMinute] = startStr.split(':').map(Number);
    const [endHour, endMinute] = endStr.split(':').map(Number);

    const startTime = setMinutes(setHours(startOfDay(dateTime), startHour), startMinute);
    const endTime = setMinutes(setHours(startOfDay(dateTime), endHour), endMinute);

    return isWithinInterval(dateTime, { start: startTime, end: endTime });
};

/**
 * Format appointment date for user display
 */
export const formatAppointmentDate = (date: Date): string => {
    return formatInTimeZone(date, config.dealership.timezone, 'MMMM dd, yyyy');
};

/**
 * Format appointment time for user display
 */
export const formatAppointmentTime = (date: Date): string => {
    return formatInTimeZone(date, config.dealership.timezone, 'h:mm a');
};

/**
 * Format full appointment datetime
 */
export const formatAppointmentDateTime = (date: Date): string => {
    return formatInTimeZone(date, config.dealership.timezone, 'MMMM dd, yyyy \'at\' h:mm a');
};

/**
 * Parse user date input (supports various formats)
 */
export const parseUserDate = (input: string): Date | null => {
    const today = new Date();

    // Handle relative dates
    const lowerInput = input.toLowerCase().trim();

    if (lowerInput === 'today') {
        return startOfDay(today);
    }

    if (lowerInput === 'tomorrow') {
        return startOfDay(addDays(today, 1));
    }

    // Try parsing common date formats
    const formats = [
        'yyyy-MM-dd',
        'MM/dd/yyyy',
        'dd/MM/yyyy',
        'MMMM dd, yyyy',
        'MMM dd, yyyy'
    ];

    for (const formatStr of formats) {
        try {
            const parsed = parse(input, formatStr, new Date());
            if (!isNaN(parsed.getTime())) {
                return startOfDay(parsed);
            }
        } catch (e) {
            // Continue to next format
        }
    }

    return null;
};

/**
 * Check if date is within allowed booking window
 */
export const isWithinBookingWindow = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const daysAdvance = 30; // Default or from config
    const maxDate = addDays(today, daysAdvance);

    return !isBefore(date, today) && !isAfter(date, maxDate);
};

/**
 * Get next available dates (excluding weekends if needed)
 */
export const getNextAvailableDates = (count: number = 7): Date[] => {
    const dates: Date[] = [];
    let currentDate = startOfDay(new Date());

    while (dates.length < count) {
        currentDate = addDays(currentDate, 1);

        // Skip Sundays (0 = Sunday)
        if (currentDate.getDay() !== 0) {
            dates.push(new Date(currentDate));
        }
    }

    return dates;
};

/**
 * Convert time string to Date object for today
 */
export const timeStringToDate = (timeStr: string, baseDate?: Date): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = baseDate ? new Date(baseDate) : new Date();
    return setMinutes(setHours(date, hours), minutes);
};

/**
 * Generate appointment ID
 */
export const generateAppointmentId = (date: Date): string => {
    const dateStr = format(date, 'yyyyMMdd');
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `APT-${dateStr}-${randomSuffix}`;
};
