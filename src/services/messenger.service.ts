import axios from 'axios';
import { config } from '../config/env';
import { SiteVisit } from '../types/appointment.types';
import { formatAppointmentDateTime } from '../utils/date.utils';

const FACEBOOK_API_URL = 'https://graph.facebook.com/v22.0/me/messages';

interface QuickReply {
    content_type: 'text';
    title: string;
    payload: string;
}

interface Button {
    type: 'postback' | 'web_url';
    title: string;
    payload?: string;
    url?: string;
}

/**
 * Send a simple text message
 */
export const sendMessage = async (recipientId: string, text: string) => {
    try {
        await axios.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                text: text,
                metadata: "LOT_BOT"
            }
        }, {
            params: { access_token: config.facebook.pageAccessToken }
        });
        console.log(`✅ Message sent to ${recipientId}`);
    } catch (error: any) {
        console.error(`❌ Failed to send message: ${error.message}`);
        if (error.response) console.error(error.response.data);
    }
};

/**
 * Send message with quick reply buttons
 */
export const sendQuickReplies = async (
    recipientId: string,
    text: string,
    quickReplies: QuickReply[]
) => {
    try {
        await axios.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                text: text,
                quick_replies: quickReplies
            }
        }, {
            params: { access_token: config.facebook.pageAccessToken }
        });
        console.log(`✅ Quick replies sent to ${recipientId}`);
    } catch (error: any) {
        console.error(`❌ Failed to send quick replies: ${error.message}`);
        if (error.response) console.error(error.response.data);
    }
};

/**
 * Send button template
 */
export const sendButtonTemplate = async (
    recipientId: string,
    text: string,
    buttons: Button[]
) => {
    try {
        await axios.post(FACEBOOK_API_URL, {
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
            params: { access_token: config.facebook.pageAccessToken }
        });
        console.log(`✅ Button template sent to ${recipientId}`);
    } catch (error: any) {
        console.error(`❌ Failed to send button template: ${error.message}`);
        if (error.response) console.error(error.response.data);
    }
};

/**
 * Send generic template (carousel)
 */
export const sendGenericTemplate = async (
    recipientId: string,
    elements: any[]
) => {
    try {
        await axios.post(FACEBOOK_API_URL, {
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
            params: { access_token: config.facebook.pageAccessToken }
        });
        console.log(`✅ Generic template sent to ${recipientId}`);
    } catch (error: any) {
        console.error(`❌ Failed to send generic template: ${error.message}`);
        if (error.response) console.error(error.response.data);
    }
};

/**
 * Send site visit confirmation
 */
export const sendSiteVisitConfirmation = async (
    recipientId: string,
    siteVisit: SiteVisit
) => {
    const message = `
✅ *Site Visit Confirmed!*

📋 *Reference:* ${siteVisit.id}
📍 *Lot:* ${siteVisit.service.name}
📅 *Date & Time:* ${formatAppointmentDateTime(siteVisit.dateTime)}
👤 *Customer:* ${siteVisit.customer.name}
📱 *Phone:* ${siteVisit.customer.phone}

See you at the site! 😊

_Type "my visits" to view your bookings_
_Type "cancel" to cancel a visit_
    `.trim();

    await sendMessage(recipientId, message);
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = async (recipientId: string, on: boolean = true) => {
    try {
        await axios.post(FACEBOOK_API_URL, {
            recipient: { id: recipientId },
            sender_action: on ? 'typing_on' : 'typing_off'
        }, {
            params: { access_token: config.facebook.pageAccessToken }
        });
    } catch (error: any) {
        // Silently fail for typing indicators
    }
};

