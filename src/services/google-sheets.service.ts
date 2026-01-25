import { google, sheets_v4 } from 'googleapis';
import { config } from '../config/env';
import { SiteVisit, SiteVisitStatus } from '../types/appointment.types';
import { formatAppointmentDate, formatAppointmentTime } from '../utils/date.utils';
import fs from 'fs';

let sheetsClient: sheets_v4.Sheets | null = null;

const SHEET_NAME = 'SiteVisits';
const HEADER_ROW = [
    'Visit ID',
    'Date',
    'Time',
    'Lot/Service',
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
        const credentials = JSON.parse(
            fs.readFileSync(config.google.credentialsPath, 'utf-8')
        );

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
            s => s.properties?.title === SHEET_NAME
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
 * Save site visit to Google Sheets
 */
export const saveSiteVisit = async (siteVisit: SiteVisit): Promise<void> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) {
        console.warn('⚠️ No Google Sheet ID configured, skipping save');
        return;
    }

    const row = [
        siteVisit.id,
        formatAppointmentDate(siteVisit.dateTime),
        formatAppointmentTime(siteVisit.dateTime),
        siteVisit.service.name,
        siteVisit.customer.name,
        siteVisit.customer.phone,
        siteVisit.customer.email || '',
        siteVisit.status,
        new Date().toISOString(),
        siteVisit.customer.facebookUserId,
        siteVisit.calendarEventId || '',
        siteVisit.notes || '',
        siteVisit.service.price
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

        console.log(`✅ Site visit saved to sheet: ${siteVisit.id}`);
    } catch (error: any) {
        console.error('❌ Failed to save site visit to sheet:', error.message);
        throw error;
    }
};

/**
 * Update site visit status in Google Sheets
 */
export const updateSiteVisitStatus = async (
    siteVisitId: string,
    status: SiteVisitStatus
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
        const rowIndex = rows.findIndex(row => row[0] === siteVisitId);

        if (rowIndex === -1) {
            console.warn(`⚠️ Site visit ${siteVisitId} not found in sheet`);
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

        console.log(`✅ Updated site visit status: ${siteVisitId} -> ${status}`);
    } catch (error: any) {
        console.error('❌ Failed to update site visit status:', error.message);
    }
};

/**
 * Get site visit history for a customer
 */
export const getSiteVisitHistory = async (phone: string): Promise<any[]> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) return [];

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });

        const rows = response.data.values || [];

        // Skip header row and filter by phone number
        const siteVisits = rows.slice(1).filter(row => row[5] === phone);

        return siteVisits.map(row => ({
            id: row[0],
            date: row[1],
            time: row[2],
            service: row[3],
            name: row[4],
            phone: row[5],
            email: row[6],
            status: row[7],
            createdAt: row[8],
            calendarEventId: row[10]
        }));
    } catch (error: any) {
        console.error('❌ Failed to get site visit history:', error.message);
        return [];
    }
};

/**
 * Generate daily report of site visits
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
        const dailyVisits = rows.slice(1).filter(row => row[1] === targetDate);

        return dailyVisits.map(row => ({
            id: row[0],
            date: row[1],
            time: row[2],
            service: row[3],
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
 * Get all upcoming site visits
 */
export const getUpcomingSiteVisits = async (): Promise<any[]> => {
    const sheets = await initializeSheets();

    if (!config.google.sheetId) return [];

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });

        const rows = response.data.values || [];
        const today = new Date();

        // Filter future site visits with CONFIRMED status
        const upcoming = rows.slice(1).filter(row => {
            const visitDate = new Date(row[1]);
            return visitDate >= today && row[7] === SiteVisitStatus.CONFIRMED;
        });

        return upcoming.map(row => ({
            id: row[0],
            date: row[1],
            time: row[2],
            service: row[3],
            name: row[4],
            phone: row[5],
            status: row[7]
        }));
    } catch (error: any) {
        console.error('❌ Failed to get upcoming site visits:', error.message);
        return [];
    }
};
