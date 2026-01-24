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
if (!exports.config.facebook.pageAccessToken || !exports.config.facebook.verifyToken) {
    console.error("⚠️ WARNING: Missing Facebook Credentials. Chatbot will not function correctly.");
    // Do not process.exit(1) in serverless environments, it causes 502/500 errors.
}
