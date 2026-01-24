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
    }
};
if (!exports.config.facebook.pageAccessToken || !exports.config.facebook.verifyToken) {
    console.error("❌ CRITICAL: Missing Facebook Credentials in .env");
    process.exit(1);
}
