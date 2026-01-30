"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTypingIndicator = exports.sendAppointmentConfirmation = exports.sendGenericTemplate = exports.sendButtonTemplate = exports.sendQuickReplies = exports.sendMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const date_utils_1 = require("../utils/date.utils");
const FACEBOOK_API_URL = 'https://graph.facebook.com/v22.0/me/messages';
/**
 * Send a simple text message
 */
const sendMessage = async (recipientId, text) => {
    try {
        await axios_1.default.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                text: text,
                metadata: "DENTAL_BOT"
            }
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
/**
 * Send message with quick reply buttons
 */
const sendQuickReplies = async (recipientId, text, quickReplies) => {
    try {
        await axios_1.default.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                text: text,
                quick_replies: quickReplies
            }
        }, {
            params: { access_token: env_1.config.facebook.pageAccessToken }
        });
        console.log(`✅ Quick replies sent to ${recipientId}`);
    }
    catch (error) {
        console.error(`❌ Failed to send quick replies: ${error.message}`);
        if (error.response)
            console.error(error.response.data);
    }
};
exports.sendQuickReplies = sendQuickReplies;
/**
 * Send button template
 */
const sendButtonTemplate = async (recipientId, text, buttons) => {
    try {
        await axios_1.default.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        text: text,
                        buttons: buttons
                    }
                }
            }
        }, {
            params: { access_token: env_1.config.facebook.pageAccessToken }
        });
        console.log(`✅ Button template sent to ${recipientId}`);
    }
    catch (error) {
        console.error(`❌ Failed to send button template: ${error.message}`);
        if (error.response)
            console.error(error.response.data);
    }
};
exports.sendButtonTemplate = sendButtonTemplate;
/**
 * Send generic template (carousel)
 */
const sendGenericTemplate = async (recipientId, elements) => {
    try {
        await axios_1.default.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: elements
                    }
                }
            }
        }, {
            params: { access_token: env_1.config.facebook.pageAccessToken }
        });
        console.log(`✅ Generic template sent to ${recipientId}`);
    }
    catch (error) {
        console.error(`❌ Failed to send generic template: ${error.message}`);
        if (error.response)
            console.error(error.response.data);
    }
};
exports.sendGenericTemplate = sendGenericTemplate;
/**
 * Send dental appointment confirmation
 */
const sendAppointmentConfirmation = async (recipientId, appointment) => {
    const message = `
✅ *Appointment Confirmed!*

📋 *Reference:* ${appointment.id}
🦷 *Service:* ${appointment.service.name}
📅 *Date & Time:* ${(0, date_utils_1.formatAppointmentDateTime)(appointment.dateTime)}
👤 *Patient:* ${appointment.customer.name}
📱 *Phone:* ${appointment.customer.phone}

See you at the clinic! 😊

_Type "my appointments" to view your bookings_
_Type "cancel" to cancel an appointment_
    `.trim();
    await (0, exports.sendMessage)(recipientId, message);
};
exports.sendAppointmentConfirmation = sendAppointmentConfirmation;
/**
 * Send typing indicator
 */
const sendTypingIndicator = async (recipientId, on = true) => {
    try {
        await axios_1.default.post(FACEBOOK_API_URL, {
            recipient: { id: recipientId },
            sender_action: on ? 'typing_on' : 'typing_off'
        }, {
            params: { access_token: env_1.config.facebook.pageAccessToken }
        });
    }
    catch (error) {
        // Silently fail for typing indicators
    }
};
exports.sendTypingIndicator = sendTypingIndicator;
