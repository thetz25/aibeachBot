import { google, sheets_v4 } from 'googleapis';
import { config } from '../config/env';
import { Appointment, AppointmentStatus } from '../types/appointment.types';
import { formatAppointmentDate, formatAppointmentTime } from '../utils/date.utils';
import fs from 'fs';

let sheetsClient: sheets_v4.Sheets | null = null;

const SHEET_NAME = 'SiteVisits';
const HEADER_ROW = [
    'Visit ID',
    'Date',
    'Time',
    'Car Model', // Renamed from Lot/Service
    'Customer Name',
    'Phone',
    'Email',
    'Status',
    'Created At',
    'Facebook User ID',
    'Calendar Event ID',
    'Notes',
    'Price'
];

/**
 * Initialize Google Sheets API client
 */
export const initializeSheets = async (): Promise<sheets_v4.Sheets> => {
    if (sheetsClient) {
        return sheetsClient;
    }

    try {
        let credentials;
        if (config.google.credentialsJson) {
            credentials = JSON.parse(config.google.credentialsJson);
        } else {
            if (!fs.existsSync(config.google.credentialsPath)) {
                throw new Error(`Google Credentials file not found at ${config.google.credentialsPath}`);
            }
            credentials = JSON.parse(fs.readFileSync(config.google.credentialsPath, 'utf-8'));
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const authClient = await auth.getClient();
        sheetsClient = google.sheets({ version: 'v4', auth: authClient as any });

        // Ensure sheet exists with headers
        await ensureSheetSetup();

        console.log('✅ Google Sheets initialized successfully');
        return sheetsClient;
    } catch (error: any) {
        console.error('❌ Failed to initialize Google Sheets:', error.message);
        throw new Error('Google Sheets initialization failed');
    }
};

/**
 * Ensure the spreadsheet has the correct structure
 */
const ensureSheetSetup = async (): Promise<void> => {
    if (!sheetsClient || !config.google.sheetId) return;

    try {
        // Check if sheet exists
        const spreadsheet = await sheetsClient.spreadsheets.get({
            spreadsheetId: config.google.sheetId
        });

        const sheet = spreadsheet.data.sheets?.find(
            (s: sheets_v4.Schema$Sheet) => s.properties?.title === SHEET_NAME
        );

        if (!sheet) {
            // Create the sheet
            await sheetsClient.spreadsheets.batchUpdate({
                spreadsheetId: config.google.sheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: SHEET_NAME
                            }
                        }
                    }]
                }
            });

            // Add headers
            await sheetsClient.spreadsheets.values.update({
                spreadsheetId: config.google.sheetId,
                range: `${SHEET_NAME}!A1:M1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [HEADER_ROW]
                }
            });

            console.log('✅ Created SiteVisits sheet with headers');
        }
    } catch (error: any) {
        console.error('⚠️ Failed to setup sheet:', error.message);
    }
};

/**
 * Save appointment to Google Sheets
 */
export const saveAppointment = async (appointment: Appointment): Promise<void> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) {
        console.warn('⚠️ No Google Sheet ID configured, skipping save');
        return;
    }

    const row = [
        appointment.id,
        formatAppointmentDate(appointment.dateTime),
        formatAppointmentTime(appointment.dateTime),
        appointment.carModel.name, // Updated
        appointment.customer.name,
        appointment.customer.phone,
        appointment.customer.email || '',
        appointment.status,
        new Date().toISOString(),
        appointment.customer.facebookUserId,
        appointment.calendarEventId || '',
        appointment.notes || '',
        appointment.carModel.price // Updated
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [row]
            }
        });

        console.log(`✅ Appointment saved to sheet: ${appointment.id}`);
    } catch (error: any) {
        console.error('❌ Failed to save appointment to sheet:', error.message);
        throw error;
    }
};

/**
 * Update appointment status in Google Sheets
 */
export const updateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
): Promise<void> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) return;

    try {
        // Find the row with this ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:A`
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex((row: any[]) => row[0] === appointmentId);

        if (rowIndex === -1) {
            console.warn(`⚠️ Appointment ${appointmentId} not found in sheet`);
            return;
        }

        // Update status column (H)
        await sheets.spreadsheets.values.update({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!H${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[status]]
            }
        });

        console.log(`✅ Updated appointment status: ${appointmentId} -> ${status}`);
    } catch (error: any) {
        console.error('❌ Failed to update appointment status:', error.message);
    }
};

/**
 * Get appointment history for a customer
 */
export const getAppointmentHistory = async (phone: string): Promise<any[]> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) return [];

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });

        const rows = response.data.values || [];

        // Skip header row and filter by phone number
        const appointments = rows.slice(1).filter((row: any[]) => row[5] === phone);

        return appointments.map((row: any[]) => ({
            id: row[0],
            date: row[1],
            time: row[2],
            serviceName: row[3], // Updated mapping name
            name: row[4],
            phone: row[5],
            email: row[6],
            status: row[7],
            createdAt: row[8],
            calendarEventId: row[10]
        }));
    } catch (error: any) {
        console.error('❌ Failed to get appointment history:', error.message);
        return [];
    }
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (appointmentId: string): Promise<any | null> => {
    const sheets = await initializeSheets();
    if (!config.google.sheetId) return null;

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });

        const rows = response.data.values || [];
        const row = rows.find(r => r[0] === appointmentId);

        if (!row) return null;

        return {
            id: row[0],
            date: row[1],
            time: row[2],
            serviceName: row[3], // Updated mapping name
            customerName: row[4],
            phone: row[5],
            email: row[6],
            status: row[7],
            createdAt: row[8],
            facebookUserId: row[9],
            calendarEventId: row[10],
            notes: row[11],
            price: row[12]
        };
    } catch (error: any) {
        console.error('❌ Failed to get appointment by ID:', error.message);
        return null;
    }
};

/**
 * Generate daily report of appointments
 */
export const generateDailyReport = async (date: Date): Promise<any[]> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) return [];

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });

        const rows = response.data.values || [];
        const targetDate = formatAppointmentDate(date);

        // Filter for the target date
        const dailyAppointments = rows.slice(1).filter((row: any[]) => row[1] === targetDate);

        return dailyAppointments.map((row: any[]) => ({
            id: row[0],
            date: row[1],
            time: row[2],
            serviceName: row[3], // Updated mapping name
            name: row[4],
            phone: row[5],
            status: row[7],
            price: row[12]
        }));
    } catch (error: any) {
        console.error('❌ Failed to generate daily report:', error.message);
        return [];
    }
};

/**
 * Get all upcoming appointments
 */
export const getUpcomingAppointments = async (): Promise<any[]> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) return [];

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });

        const rows = response.data.values || [];
        const today = new Date();

        // Filter future appointments with CONFIRMED status
        const upcoming = rows.slice(1).filter((row: any[]) => {
            const visitDate = new Date(row[1]);
            return visitDate >= today && row[7] === AppointmentStatus.CONFIRMED;
        });

        return upcoming.map((row: any[]) => ({
            id: row[0],
            date: row[1],
            time: row[2],
            serviceName: row[3], // Updated mapping name
            name: row[4],
            phone: row[5],
            status: row[7]
        }));
    } catch (error: any) {
        console.error('❌ Failed to get upcoming appointments:', error.message);
        return [];
    }
};
