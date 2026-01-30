import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    facebook: {
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        verifyToken: process.env.FACEBOOK_VERIFY_TOKEN
    },

    google: {
        credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './credentials/google-credentials.json',
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        sheetId: process.env.GOOGLE_SHEET_ID
    },

    clinic: {
        name: process.env.CLINIC_NAME || 'Smile Dental Clinic',
        timezone: process.env.CLINIC_TIMEZONE || 'Asia/Manila',
        businessHours: {
            start: process.env.CLINIC_BUSINESS_HOURS_START || '09:00',
            end: process.env.CLINIC_BUSINESS_HOURS_END || '18:00'
        },
        slotDuration: parseInt(process.env.CLINIC_SLOT_DURATION || '30'),
        daysAdvanceBooking: parseInt(process.env.CLINIC_DAYS_ADVANCE_BOOKING || '30')
    },

    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },

    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
        tableName: process.env.SUPABASE_TABLE_NAME
    }
};

// Validation
if (!config.facebook.pageAccessToken || !config.facebook.verifyToken) {
    console.error("⚠️ WARNING: Missing Facebook Credentials. Chatbot will not function correctly.");
}

if (!config.google.sheetId) {
    console.warn("⚠️ WARNING: Missing Google Sheet ID. Appointments will not be saved to sheets.");
}

