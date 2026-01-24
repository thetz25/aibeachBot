import axios from 'axios';
import { config } from '../config/env';

const FACEBOOK_API_URL = 'https://graph.facebook.com/v22.0/me/messages';

export const sendMessage = async (recipientId: string, text: string) => {
    try {
        await axios.post(FACEBOOK_API_URL, {
            messaging_type: 'RESPONSE',
            recipient: { id: recipientId },
            message: {
                text: text,
                metadata: "BOT_MESSAGE"
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
