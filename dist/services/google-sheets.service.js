"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingAppointments = exports.generateDailyReport = exports.getAppointmentById = exports.getAppointmentHistory = exports.updateAppointmentStatus = exports.saveAppointment = exports.initializeSheets = void 0;
const googleapis_1 = require("googleapis");
const env_1 = require("../config/env");
const appointment_types_1 = require("../types/appointment.types");
const date_utils_1 = require("../utils/date.utils");
const fs_1 = __importDefault(require("fs"));
let sheetsClient = null;
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
const initializeSheets = async () => {
    if (sheetsClient) {
        return sheetsClient;
    }
    try {
        const credentials = JSON.parse(fs_1.default.readFileSync(env_1.config.google.credentialsPath, 'utf-8'));
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const authClient = await auth.getClient();
        sheetsClient = googleapis_1.google.sheets({ version: 'v4', auth: authClient });
        // Ensure sheet exists with headers
        await ensureSheetSetup();
        console.log('✅ Google Sheets initialized successfully');
        return sheetsClient;
    }
    catch (error) {
        console.error('❌ Failed to initialize Google Sheets:', error.message);
        throw new Error('Google Sheets initialization failed');
    }
};
exports.initializeSheets = initializeSheets;
/**
 * Ensure the spreadsheet has the correct structure
 */
const ensureSheetSetup = async () => {
    if (!sheetsClient || !env_1.config.google.sheetId)
        return;
    try {
        // Check if sheet exists
        const spreadsheet = await sheetsClient.spreadsheets.get({
            spreadsheetId: env_1.config.google.sheetId
        });
        const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === SHEET_NAME);
        if (!sheet) {
            // Create the sheet
            await sheetsClient.spreadsheets.batchUpdate({
                spreadsheetId: env_1.config.google.sheetId,
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
                spreadsheetId: env_1.config.google.sheetId,
                range: `${SHEET_NAME}!A1:M1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [HEADER_ROW]
                }
            });
            console.log('✅ Created SiteVisits sheet with headers');
        }
    }
    catch (error) {
        console.error('⚠️ Failed to setup sheet:', error.message);
    }
};
/**
 * Save appointment to Google Sheets
 */
const saveAppointment = async (appointment) => {
    const sheets = await (0, exports.initializeSheets)();
    if (!env_1.config.google.sheetId) {
        console.warn('⚠️ No Google Sheet ID configured, skipping save');
        return;
    }
    const row = [
        appointment.id,
        (0, date_utils_1.formatAppointmentDate)(appointment.dateTime),
        (0, date_utils_1.formatAppointmentTime)(appointment.dateTime),
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
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!A:M`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [row]
            }
        });
        console.log(`✅ Appointment saved to sheet: ${appointment.id}`);
    }
    catch (error) {
        console.error('❌ Failed to save appointment to sheet:', error.message);
        throw error;
    }
};
exports.saveAppointment = saveAppointment;
/**
 * Update appointment status in Google Sheets
 */
const updateAppointmentStatus = async (appointmentId, status) => {
    const sheets = await (0, exports.initializeSheets)();
    if (!env_1.config.google.sheetId)
        return;
    try {
        // Find the row with this ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!A:A`
        });
        const rows = response.data.values || [];
        const rowIndex = rows.findIndex((row) => row[0] === appointmentId);
        if (rowIndex === -1) {
            console.warn(`⚠️ Appointment ${appointmentId} not found in sheet`);
            return;
        }
        // Update status column (H)
        await sheets.spreadsheets.values.update({
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!H${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[status]]
            }
        });
        console.log(`✅ Updated appointment status: ${appointmentId} -> ${status}`);
    }
    catch (error) {
        console.error('❌ Failed to update appointment status:', error.message);
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
/**
 * Get appointment history for a customer
 */
const getAppointmentHistory = async (phone) => {
    const sheets = await (0, exports.initializeSheets)();
    if (!env_1.config.google.sheetId)
        return [];
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });
        const rows = response.data.values || [];
        // Skip header row and filter by phone number
        const appointments = rows.slice(1).filter((row) => row[5] === phone);
        return appointments.map((row) => ({
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
    }
    catch (error) {
        console.error('❌ Failed to get appointment history:', error.message);
        return [];
    }
};
exports.getAppointmentHistory = getAppointmentHistory;
/**
 * Get appointment by ID
 */
const getAppointmentById = async (appointmentId) => {
    const sheets = await (0, exports.initializeSheets)();
    if (!env_1.config.google.sheetId)
        return null;
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });
        const rows = response.data.values || [];
        const row = rows.find(r => r[0] === appointmentId);
        if (!row)
            return null;
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
    }
    catch (error) {
        console.error('❌ Failed to get appointment by ID:', error.message);
        return null;
    }
};
exports.getAppointmentById = getAppointmentById;
/**
 * Generate daily report of appointments
 */
const generateDailyReport = async (date) => {
    const sheets = await (0, exports.initializeSheets)();
    if (!env_1.config.google.sheetId)
        return [];
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });
        const rows = response.data.values || [];
        const targetDate = (0, date_utils_1.formatAppointmentDate)(date);
        // Filter for the target date
        const dailyAppointments = rows.slice(1).filter((row) => row[1] === targetDate);
        return dailyAppointments.map((row) => ({
            id: row[0],
            date: row[1],
            time: row[2],
            serviceName: row[3], // Updated mapping name
            name: row[4],
            phone: row[5],
            status: row[7],
            price: row[12]
        }));
    }
    catch (error) {
        console.error('❌ Failed to generate daily report:', error.message);
        return [];
    }
};
exports.generateDailyReport = generateDailyReport;
/**
 * Get all upcoming appointments
 */
const getUpcomingAppointments = async () => {
    const sheets = await (0, exports.initializeSheets)();
    if (!env_1.config.google.sheetId)
        return [];
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: env_1.config.google.sheetId,
            range: `${SHEET_NAME}!A:M`
        });
        const rows = response.data.values || [];
        const today = new Date();
        // Filter future appointments with CONFIRMED status
        const upcoming = rows.slice(1).filter((row) => {
            const visitDate = new Date(row[1]);
            return visitDate >= today && row[7] === appointment_types_1.AppointmentStatus.CONFIRMED;
        });
        return upcoming.map((row) => ({
            id: row[0],
            date: row[1],
            time: row[2],
            serviceName: row[3], // Updated mapping name
            name: row[4],
            phone: row[5],
            status: row[7]
        }));
    }
    catch (error) {
        console.error('❌ Failed to get upcoming appointments:', error.message);
        return [];
    }
};
exports.getUpcomingAppointments = getUpcomingAppointments;
