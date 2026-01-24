"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyWebhook = void 0;
const env_1 = require("../config/env");
const messenger_service_1 = require("../services/messenger.service");
const openai_service_1 = require("../services/openai.service");
const airtable_service_1 = require("../services/airtable.service");
const pausedUsers = new Map(); // UserId -> Expiry Timestamp
const PAUSE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes
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
                    // CHECK: Is user paused?
                    if (pausedUsers.has(senderId)) {
                        const expiry = pausedUsers.get(senderId) || 0;
                        if (Date.now() < expiry) {
                            console.log(`🤐 User ${senderId} is paused (Human Active). Ignoring until ${new Date(expiry).toLocaleTimeString()}`);
                            continue;
                        }
                        else {
                            console.log(`⏰ Pause expired for ${senderId}. Bot waking up.`);
                            pausedUsers.delete(senderId);
                        }
                    }
                    if (webhook_event.message && webhook_event.message.text) {
                        const receivedText = webhook_event.message.text;
                        // 1. Fetch History
                        const history = await (0, airtable_service_1.getHistory)(senderId);
                        // AI Logic
                        console.log(`🤖 Generatng AI response for: "${receivedText}"`);
                        const aiReply = await (0, openai_service_1.generateAIResponse)(receivedText, history);
                        // HANDOFF CHECK
                        if (aiReply.includes('TRANSFER_AGENT')) {
                            // Pause for 5 minutes from NOW
                            pausedUsers.set(senderId, Date.now() + PAUSE_DURATION_MS);
                            await (0, messenger_service_1.sendMessage)(senderId, "✅ Handing you over to a human agent. Please wait, they will reply shortly.");
                            console.log(`👨‍💼 HANDOFF TRIGGERED for ${senderId}. Bot paused for 5 mins.`);
                            // Validate if we should save the handoff message? Yes.
                            await (0, airtable_service_1.saveMessage)(senderId, 'user', receivedText);
                            await (0, airtable_service_1.saveMessage)(senderId, 'assistant', "✅ Handing you over to a human agent...");
                        }
                        else {
                            await (0, messenger_service_1.sendMessage)(senderId, aiReply);
                            // 2. Save to Airtable (Fire and forget to not block response)
                            (0, airtable_service_1.saveMessage)(senderId, 'user', receivedText);
                            (0, airtable_service_1.saveMessage)(senderId, 'assistant', aiReply);
                        }
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
