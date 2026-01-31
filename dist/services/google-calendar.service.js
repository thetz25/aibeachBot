"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppointmentsByCustomer = exports.cancelAppointment = exports.updateAppointment = exports.createAppointment = exports.getAvailableSlots = exports.initializeCalendar = void 0;
const googleapis_1 = require("googleapis");
const env_1 = require("../config/env");
const date_utils_1 = require("../utils/date.utils");
const date_fns_1 = require("date-fns");
const fs_1 = __importDefault(require("fs"));
let calendarClient = null;
/**
 * Initialize Google Calendar API client
 */
const initializeCalendar = async () => {
    if (calendarClient) {
        return calendarClient;
    }
    try {
        // Load credentials from file
        const credentials = JSON.parse(fs_1.default.readFileSync(env_1.config.google.credentialsPath, 'utf-8'));
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });
        const authClient = await auth.getClient();
        calendarClient = googleapis_1.google.calendar({ version: 'v3', auth: authClient });
        console.log('✅ Google Calendar initialized successfully');
        return calendarClient;
    }
    catch (error) {
        console.error('❌ Failed to initialize Google Calendar:', error.message);
        throw new Error('Google Calendar initialization failed');
    }
};
exports.initializeCalendar = initializeCalendar;
/**
 * Get available time slots for a specific date
 */
const getAvailableSlots = async (date, duration) => {
    const calendar = await (0, exports.initializeCalendar)();
    // Generate all possible slots for the day
    const allSlots = (0, date_utils_1.generateTimeSlots)(date, duration);
    // Get existing events for the day
    const startOfDayTime = (0, date_fns_1.startOfDay)(date).toISOString();
    const endOfDayTime = (0, date_fns_1.endOfDay)(date).toISOString();
    try {
        const response = await calendar.events.list({
            calendarId: env_1.config.google.calendarId,
            timeMin: startOfDayTime,
            timeMax: endOfDayTime,
            singleEvents: true,
            orderBy: 'startTime'
        });
        const events = response.data.items || [];
        // Check which slots are available
        const availableSlots = allSlots.map(slotStart => {
            const slotEnd = (0, date_fns_1.addMinutes)(slotStart, duration);
            // Check if slot overlaps with any existing event
            const isBooked = events.some((event) => {
                if (!event.start?.dateTime || !event.end?.dateTime)
                    return false;
                const eventStart = new Date(event.start.dateTime);
                const eventEnd = new Date(event.end.dateTime);
                // Check for overlap
                return ((slotStart >= eventStart && slotStart < eventEnd) ||
                    (slotEnd > eventStart && slotEnd <= eventEnd) ||
                    (slotStart <= eventStart && slotEnd >= eventEnd));
            });
            return {
                start: slotStart,
                end: slotEnd,
                available: !isBooked
            };
        });
        return availableSlots.filter(slot => slot.available);
    }
    catch (error) {
        console.error('❌ Failed to get available slots:', error.message);
        throw error;
    }
};
exports.getAvailableSlots = getAvailableSlots;
/**
 * Create test drive appointment in Google Calendar
 */
const createAppointment = async (appointment) => {
    const calendar = await (0, exports.initializeCalendar)();
    // Default duration for test drive: 60 minutes
    const duration = 60;
    const endTime = (0, date_fns_1.addMinutes)(appointment.dateTime, duration);
    const event = {
        summary: `Test Drive: ${appointment.carModel.name} - ${appointment.customer.name}`,
        description: `
Customer: ${appointment.customer.name}
Phone: ${appointment.customer.phone}
${appointment.customer.email ? `Email: ${appointment.customer.email}` : ''}
Car: ${appointment.carModel.name}
Appointment ID: ${appointment.id}
${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}
    `.trim(),
        start: {
            dateTime: appointment.dateTime.toISOString(),
            timeZone: env_1.config.dealership.timezone
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: env_1.config.dealership.timezone
        },
        attendees: appointment.customer.email ? [
            { email: appointment.customer.email }
        ] : undefined,
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 } // 1 hour before
            ]
        },
        colorId: '5' // Yellow for Test Drive
    };
    try {
        const response = await calendar.events.insert({
            calendarId: env_1.config.google.calendarId,
            requestBody: event,
            sendUpdates: 'all'
        });
        console.log(`✅ Calendar event created: ${response.data.id}`);
        return response.data.id;
    }
    catch (error) {
        console.error('❌ Failed to create calendar event:', error.message);
        throw error;
    }
};
exports.createAppointment = createAppointment;
/**
 * Update appointment in Google Calendar
 */
const updateAppointment = async (eventId, updates) => {
    const calendar = await (0, exports.initializeCalendar)();
    try {
        // Get existing event
        const existingEvent = await calendar.events.get({
            calendarId: env_1.config.google.calendarId,
            eventId: eventId
        });
        const event = existingEvent.data;
        // Update fields
        if (updates.dateTime && updates.carModel) {
            const duration = 60;
            event.start = {
                dateTime: updates.dateTime.toISOString(),
                timeZone: env_1.config.dealership.timezone
            };
            event.end = {
                dateTime: (0, date_fns_1.addMinutes)(updates.dateTime, duration).toISOString(),
                timeZone: env_1.config.dealership.timezone
            };
        }
        if (updates.customer || updates.carModel) {
            const customerName = updates.customer?.name || event.summary?.split(' - ').pop();
            const carName = updates.carModel?.name || event.summary?.split(': ').pop()?.split(' - ')[0];
            event.summary = `Test Drive: ${carName} - ${customerName}`;
        }
        await calendar.events.update({
            calendarId: env_1.config.google.calendarId,
            eventId: eventId,
            requestBody: event,
            sendUpdates: 'all'
        });
        console.log(`✅ Calendar event updated: ${eventId}`);
    }
    catch (error) {
        console.error('❌ Failed to update calendar event:', error.message);
        throw error;
    }
};
exports.updateAppointment = updateAppointment;
/**
 * Cancel appointment in Google Calendar
 */
const cancelAppointment = async (eventId) => {
    const calendar = await (0, exports.initializeCalendar)();
    try {
        await calendar.events.delete({
            calendarId: env_1.config.google.calendarId,
            eventId: eventId,
            sendUpdates: 'all'
        });
        console.log(`✅ Calendar event cancelled: ${eventId}`);
    }
    catch (error) {
        console.error('❌ Failed to cancel calendar event:', error.message);
        throw error;
    }
};
exports.cancelAppointment = cancelAppointment;
/**
 * Get appointments for a specific customer by phone number
 */
const getAppointmentsByCustomer = async (phone) => {
    const calendar = await (0, exports.initializeCalendar)();
    try {
        const response = await calendar.events.list({
            calendarId: env_1.config.google.calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
            q: phone // Search for phone number in event description
        });
        return response.data.items || [];
    }
    catch (error) {
        console.error('❌ Failed to get customer appointments:', error.message);
        return [];
    }
};
exports.getAppointmentsByCustomer = getAppointmentsByCustomer;
