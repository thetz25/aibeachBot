import dotenv from 'dotenv';
dotenv.config();

// Parse Multi-Page Tokens
let pageTokens: Record<string, string> = {};
try {
    if (process.env.FACEBOOK_PAGE_TOKENS) {
        pageTokens = JSON.parse(process.env.FACEBOOK_PAGE_TOKENS);
    }
} catch (e) {
    console.error("❌ Failed to parse FACEBOOK_PAGE_TOKENS JSON", e);
}

export const config = {
    port: process.env.PORT || 3000,
    facebook: {
        // Legacy single token
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        verifyToken: process.env.FACEBOOK_VERIFY_TOKEN,
        // Helper to get token by Page ID
        getToken: (pageId: string): string | undefined => {
            // 1. Check specific map
            if (pageTokens[pageId]) return pageTokens[pageId];
            // 2. Fallback to single token (Assume it matches if map invalid or legacy usage)
            return process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        }
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
        tableName: 'messages'
    }
};

if (!config.facebook.pageAccessToken && Object.keys(pageTokens).length === 0) {
    console.error("⚠️ WARNING: Missing Facebook Credentials. Chatbot will not function correctly.");
}
