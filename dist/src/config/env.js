"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
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
if (!exports.config.facebook.pageAccessToken || !exports.config.facebook.verifyToken) {
    console.error("⚠️ WARNING: Missing Facebook Credentials. Chatbot will not function correctly.");
}
