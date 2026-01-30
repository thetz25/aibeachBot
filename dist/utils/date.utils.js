"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAppointmentId = exports.timeStringToDate = exports.getNextAvailableDates = exports.isWithinBookingWindow = exports.parseUserDate = exports.formatAppointmentDateTime = exports.formatAppointmentTime = exports.formatAppointmentDate = exports.isWithinBusinessHours = exports.generateTimeSlots = void 0;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const env_1 = require("../config/env");
/**
 * Generate available time slots for a given date
 */
const generateTimeSlots = (date, duration) => {
    const slots = [];
    const timezone = env_1.config.clinic.timezone;
    // Parse business hours
    const [startHour, startMinute] = env_1.config.clinic.businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = env_1.config.clinic.businessHours.end.split(':').map(Number);
    // Set start and end times for the day
    let currentSlot = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)((0, date_fns_1.startOfDay)(date), startHour), startMinute);
    const endTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)((0, date_fns_1.startOfDay)(date), endHour), endMinute);
    // Generate slots
    while ((0, date_fns_1.isBefore)(currentSlot, endTime)) {
        slots.push(new Date(currentSlot));
        currentSlot = (0, date_fns_1.addMinutes)(currentSlot, duration);
    }
    return slots;
};
exports.generateTimeSlots = generateTimeSlots;
/**
 * Check if a datetime is within business hours
 */
const isWithinBusinessHours = (dateTime) => {
    const [startHour, startMinute] = env_1.config.clinic.businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = env_1.config.clinic.businessHours.end.split(':').map(Number);
    const startTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)((0, date_fns_1.startOfDay)(dateTime), startHour), startMinute);
    const endTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)((0, date_fns_1.startOfDay)(dateTime), endHour), endMinute);
    return (0, date_fns_1.isWithinInterval)(dateTime, { start: startTime, end: endTime });
};
exports.isWithinBusinessHours = isWithinBusinessHours;
/**
 * Format appointment date for user display
 */
const formatAppointmentDate = (date) => {
    return (0, date_fns_tz_1.formatInTimeZone)(date, env_1.config.clinic.timezone, 'MMMM dd, yyyy');
};
exports.formatAppointmentDate = formatAppointmentDate;
/**
 * Format appointment time for user display
 */
const formatAppointmentTime = (date) => {
    return (0, date_fns_tz_1.formatInTimeZone)(date, env_1.config.clinic.timezone, 'h:mm a');
};
exports.formatAppointmentTime = formatAppointmentTime;
/**
 * Format full appointment datetime
 */
const formatAppointmentDateTime = (date) => {
    return (0, date_fns_tz_1.formatInTimeZone)(date, env_1.config.clinic.timezone, 'MMMM dd, yyyy \'at\' h:mm a');
};
exports.formatAppointmentDateTime = formatAppointmentDateTime;
/**
 * Parse user date input (supports various formats)
 */
const parseUserDate = (input) => {
    const today = new Date();
    // Handle relative dates
    const lowerInput = input.toLowerCase().trim();
    if (lowerInput === 'today') {
        return (0, date_fns_1.startOfDay)(today);
    }
    if (lowerInput === 'tomorrow') {
        return (0, date_fns_1.startOfDay)((0, date_fns_1.addDays)(today, 1));
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
            const parsed = (0, date_fns_1.parse)(input, formatStr, new Date());
            if (!isNaN(parsed.getTime())) {
                return (0, date_fns_1.startOfDay)(parsed);
            }
        }
        catch (e) {
            // Continue to next format
        }
    }
    return null;
};
exports.parseUserDate = parseUserDate;
/**
 * Check if date is within allowed booking window
 */
const isWithinBookingWindow = (date) => {
    const today = (0, date_fns_1.startOfDay)(new Date());
    const maxDate = (0, date_fns_1.addDays)(today, env_1.config.clinic.daysAdvanceBooking);
    return !(0, date_fns_1.isBefore)(date, today) && !(0, date_fns_1.isAfter)(date, maxDate);
};
exports.isWithinBookingWindow = isWithinBookingWindow;
/**
 * Get next available dates (excluding weekends if needed)
 */
const getNextAvailableDates = (count = 7) => {
    const dates = [];
    let currentDate = (0, date_fns_1.startOfDay)(new Date());
    while (dates.length < count) {
        currentDate = (0, date_fns_1.addDays)(currentDate, 1);
        // Skip Sundays (0 = Sunday)
        if (currentDate.getDay() !== 0) {
            dates.push(new Date(currentDate));
        }
    }
    return dates;
};
exports.getNextAvailableDates = getNextAvailableDates;
/**
 * Convert time string to Date object for today
 */
const timeStringToDate = (timeStr, baseDate) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = baseDate ? new Date(baseDate) : new Date();
    return (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(date, hours), minutes);
};
exports.timeStringToDate = timeStringToDate;
/**
 * Generate appointment ID
 */
const generateAppointmentId = (date) => {
    const dateStr = (0, date_fns_1.format)(date, 'yyyyMMdd');
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `APT-${dateStr}-${randomSuffix}`;
};
exports.generateAppointmentId = generateAppointmentId;
