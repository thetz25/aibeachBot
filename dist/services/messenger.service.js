"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const FACEBOOK_API_URL = 'https://graph.facebook.com/v22.0/me/messages';
const sendMessage = async (recipientId, text) => {
    try {
        await axios_1.default.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: { text }
        }, {
            params: { access_token: env_1.config.facebook.pageAccessToken }
        });
        console.log(`✅ Message sent to ${recipientId}`);
    }
    catch (error) {
        console.error(`❌ Failed to send message: ${error.message}`);
        if (error.response)
            console.error(error.response.data);
    }
};
exports.sendMessage = sendMessage;
