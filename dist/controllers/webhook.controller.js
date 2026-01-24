"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyWebhook = void 0;
const env_1 = require("../config/env");
const messenger_service_1 = require("../services/messenger.service");
const openai_service_1 = require("../services/openai.service");
// GET /webhook - Verification Challenge
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === env_1.config.facebook.verifyToken) {
            console.log('✅ Webhook Verified');
            res.status(200).send(challenge);
        }
        else {
            res.sendStatus(403);
        }
    }
    else {
        res.sendStatus(400); // Bad Request
    }
};
exports.verifyWebhook = verifyWebhook;
// POST /webhook - Event Handling
const handleWebhook = async (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        for (const entry of body.entry) {
            // Iterate over each messaging event
            if (entry.messaging) {
                for (const webhook_event of entry.messaging) {
                    console.log('📩 Received event:', webhook_event);
                    const senderId = webhook_event.sender.id;
                    if (webhook_event.message && webhook_event.message.text) {
                        const receivedText = webhook_event.message.text;
                        // AI Logic
                        console.log(`🤖 Generatng AI response for: "${receivedText}"`);
                        const aiReply = await (0, openai_service_1.generateAIResponse)(receivedText);
                        await (0, messenger_service_1.sendMessage)(senderId, aiReply);
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    }
    else {
        res.sendStatus(404);
    }
};
exports.handleWebhook = handleWebhook;
