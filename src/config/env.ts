import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    facebook: {
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        verifyToken: process.env.FACEBOOK_VERIFY_TOKEN
    },
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY,
        baseId: process.env.AIRTABLE_BASE_ID,
        tableName: process.env.AIRTABLE_TABLE_NAME || 'Messages'
    }
};

if (!config.facebook.pageAccessToken || !config.facebook.verifyToken) {
    console.error("⚠️ WARNING: Missing Facebook Credentials. Chatbot will not function correctly.");
    // Do not process.exit(1) in serverless environments, it causes 502/500 errors.
}
