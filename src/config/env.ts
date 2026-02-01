import dotenv from 'dotenv';
// Only load .env file in development (Vercel provides env vars directly)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    facebook: {
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        verifyToken: process.env.FACEBOOK_VERIFY_TOKEN
    },

    dealership: {
        name: process.env.DEALERSHIP_NAME || 'Mitsubishi Motors Bot',
        timezone: process.env.DEALERSHIP_TIMEZONE || 'Asia/Manila',
        defaultDpPercent: 0.20,
        maxLoanYears: 5
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



