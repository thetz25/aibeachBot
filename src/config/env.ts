import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    facebook: {
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        verifyToken: process.env.FACEBOOK_VERIFY_TOKEN
    }
};

if (!config.facebook.pageAccessToken || !config.facebook.verifyToken) {
    console.error("❌ CRITICAL: Missing Facebook Credentials in .env");
    process.exit(1);
}
