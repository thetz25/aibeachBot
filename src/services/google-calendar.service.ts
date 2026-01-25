import { google, calendar_v3 } from 'googleapis';
import { config } from '../config/env';
import { SiteVisit, TimeSlot } from '../types/appointment.types';
import { formatAppointmentDateTime, generateTimeSlots, isWithinBusinessHours } from '../utils/date.utils';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';
import fs from 'fs';

let calendarClient: calendar_v3.Calendar | null = null;

/**
 * Initialize Google Calendar API client
 */
export const initializeCalendar = async (): Promise<calendar_v3.Calendar> => {
    if (calendarClient) {
        return calendarClient;
    }

    try {
        // Load credentials from file
        const credentials = JSON.parse(
            fs.readFileSync(config.google.credentialsPath, 'utf-8')
        );

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const authClient = await auth.getClient();
        calendarClient = google.calendar({ version: 'v3', auth: authClient as any });

        console.log('✅ Google Calendar initialized successfully');
        return calendarClient;
    } catch (error: any) {
        console.error('❌ Failed to initialize Google Calendar:', error.message);
        throw new Error('Google Calendar initialization failed');
    }
};

/**
 * Get available time slots for a specific date
 */
export const getAvailableSlots = async (
    date: Date,
    duration: number
): Promise<TimeSlot[]> => {
    const calendar = await initializeCalendar();

    // Generate all possible slots for the day
    const allSlots = generateTimeSlots(date, duration);

    // Get existing events for the day
    const startOfDayTime = startOfDay(date).toISOString();
    const endOfDayTime = endOfDay(date).toISOString();

    try {
        const response = await calendar.events.list({
            calendarId: config.google.calendarId,
            timeMin: startOfDayTime,
            timeMax: endOfDayTime,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items || [];

        // Check which slots are available
        const availableSlots: TimeSlot[] = allSlots.map(slotStart => {
            const slotEnd = addMinutes(slotStart, duration);

            // Check if slot overlaps with any existing event
            const isBooked = events.some(event => {
                if (!event.start?.dateTime || !event.end?.dateTime) return false;

                const eventStart = new Date(event.start.dateTime);
                const eventEnd = new Date(event.end.dateTime);

                // Check for overlap
                return (
                    (slotStart >= eventStart && slotStart < eventEnd) ||
                    (slotEnd > eventStart && slotEnd <= eventEnd) ||
                    (slotStart <= eventStart && slotEnd >= eventEnd)
                );
            });

            return {
                start: slotStart,
                end: slotEnd,
                available: !isBooked
            };
        });

        return availableSlots.filter(slot => slot.available);
    } catch (error: any) {
        console.error('❌ Failed to get available slots:', error.message);
        throw error;
    }
};

/**
 * Create site visit in Google Calendar
 */
export const createSiteVisit = async (siteVisit: SiteVisit): Promise<string> => {
    const calendar = await initializeCalendar();

    const endTime = addMinutes(siteVisit.dateTime, siteVisit.service.duration);

    const event: calendar_v3.Schema$Event = {
        summary: `Site Visit: ${siteVisit.service.name} - ${siteVisit.customer.name}`,
        description: `
Customer: ${siteVisit.customer.name}
Phone: ${siteVisit.customer.phone}
${siteVisit.customer.email ? `Email: ${siteVisit.customer.email}` : ''}
Lot/Service: ${siteVisit.service.name}
Site Visit ID: ${siteVisit.id}
${siteVisit.notes ? `\nNotes: ${siteVisit.notes}` : ''}
    `.trim(),
        start: {
            dateTime: siteVisit.dateTime.toISOString(),
            timeZone: config.clinic.timezone
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: config.clinic.timezone
        },
        attendees: siteVisit.customer.email ? [
            { email: siteVisit.customer.email }
        ] : undefined,
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 24 * 60 }, // 1 day before
                { method: 'popup', minutes: 60 }       // 1 hour before
            ]
        },
        colorId: '6' // Tangerine for site visits
    };

    try {
        const response = await calendar.events.insert({
            calendarId: config.google.calendarId,
            requestBody: event,
            sendUpdates: 'all'
        });

        console.log(`✅ Calendar event created: ${response.data.id}`);
        return response.data.id!;
    } catch (error: any) {
        console.error('❌ Failed to create calendar event:', error.message);
        throw error;
    }
};

/**
 * Update site visit in Google Calendar
 */
export const updateSiteVisit = async (
    eventId: string,
    updates: Partial<SiteVisit>
): Promise<void> => {
    const calendar = await initializeCalendar();

    try {
        // Get existing event
        const existingEvent = await calendar.events.get({
            calendarId: config.google.calendarId,
            eventId: eventId
        });

        const event = existingEvent.data;

        // Update fields
        if (updates.dateTime && updates.service) {
            event.start = {
                dateTime: updates.dateTime.toISOString(),
                timeZone: config.clinic.timezone
            };
            event.end = {
                dateTime: addMinutes(updates.dateTime, updates.service.duration).toISOString(),
                timeZone: config.clinic.timezone
            };
        }

        if (updates.customer) {
            event.summary = `Site Visit: ${updates.service?.name} - ${updates.customer.name}`;
        }

        await calendar.events.update({
            calendarId: config.google.calendarId,
            eventId: eventId,
            requestBody: event,
            sendUpdates: 'all'
        });

        console.log(`✅ Calendar event updated: ${eventId}`);
    } catch (error: any) {
        console.error('❌ Failed to update calendar event:', error.message);
        throw error;
    }
};

/**
 * Cancel site visit in Google Calendar
 */
export const cancelSiteVisit = async (eventId: string): Promise<void> => {
    const calendar = await initializeCalendar();

    try {
        await calendar.events.delete({
            calendarId: config.google.calendarId,
            eventId: eventId,
            sendUpdates: 'all'
        });

        console.log(`✅ Calendar event cancelled: ${eventId}`);
    } catch (error: any) {
        console.error('❌ Failed to cancel calendar event:', error.message);
        throw error;
    }
};

/**
 * Get site visits for a specific customer by phone number
 */
export const getSiteVisitsByCustomer = async (phone: string): Promise<calendar_v3.Schema$Event[]> => {
    const calendar = await initializeCalendar();

    try {
        const response = await calendar.events.list({
            calendarId: config.google.calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
            q: phone // Search for phone number in event description
        });

        return response.data.items || [];
    } catch (error: any) {
        console.error('❌ Failed to get customer site visits:', error.message);
        return [];
    }
};
