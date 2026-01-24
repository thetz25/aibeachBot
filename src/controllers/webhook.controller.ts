import { Request, Response } from 'express';
import { config } from '../config/env';
import { sendMessage } from '../services/messenger.service';
import { generateAIResponse } from '../services/openai.service';
import { getHistory, saveMessage } from '../services/db.service';

const pausedUsers = new Map<string, number>(); // UserId -> Expiry Timestamp
const PAUSE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes

// GET /webhook - Verification Challenge
export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === config.facebook.verifyToken) {
            console.log('✅ Webhook Verified');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request
    }
};

// POST /webhook - Event Handling
export const handleWebhook = async (req: Request, res: Response) => {
    const body = req.body;

    if (body.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        for (const entry of body.entry) {
            // Iterate over each messaging event
            if (entry.messaging) {
                for (const webhook_event of entry.messaging) {
                    console.log('📩 Received event:', JSON.stringify(webhook_event, null, 2));

                    // 0. Handle ECHO (Messages sent by Page/Human)
                    if (webhook_event.message && webhook_event.message.is_echo) {
                        const metadata = webhook_event.message.metadata;
                        // If metadata is NOT "BOT_MESSAGE", it means a human sent it via Inbox
                        if (metadata !== 'BOT_MESSAGE') {
                            const recipientId = webhook_event.recipient.id; // In echo, recipient is the User
                            console.log(`👨‍💻 HUMAN ADMIN replied to ${recipientId}. Pausing AI for 30 mins.`);
                            pausedUsers.set(recipientId, Date.now() + (30 * 60 * 1000)); // 30 Minutes
                        }
                        continue; // Skip processing any echo
                    }

                    const senderId = webhook_event.sender.id;

                    // CHECK: Is user paused?
                    if (pausedUsers.has(senderId)) {
                        const expiry = pausedUsers.get(senderId) || 0;
                        if (Date.now() < expiry) {
                            console.log(`🤐 User ${senderId} is paused (Human Active). Ignoring until ${new Date(expiry).toLocaleTimeString()}`);
                            continue;
                        } else {
                            console.log(`⏰ Pause expired for ${senderId}. Bot waking up.`);
                            pausedUsers.delete(senderId);
                        }
                    }

                    if (webhook_event.message && webhook_event.message.text) {
                        const receivedText = webhook_event.message.text;

                        // 1. Fetch History
                        const history = await getHistory(senderId);

                        // AI Logic
                        console.log(`🤖 Generatng AI response for: "${receivedText}"`);
                        const aiReply = await generateAIResponse(receivedText, history);

                        // HANDOFF CHECK
                        if (aiReply.includes('TRANSFER_AGENT')) {
                            // Pause for 5 minutes from NOW
                            pausedUsers.set(senderId, Date.now() + PAUSE_DURATION_MS);
                            await sendMessage(senderId, "✅ Handing you over to a human agent. Please wait, they will reply shortly.");
                            console.log(`👨‍💼 HANDOFF TRIGGERED for ${senderId}. Bot paused for 5 mins.`);
                            // Validate if we should save the handoff message? Yes.
                            await saveMessage(senderId, 'user', receivedText);
                            await saveMessage(senderId, 'assistant', "✅ Handing you over to a human agent...");
                        } else {
                            await sendMessage(senderId, aiReply);

                            // 2. Save to Airtable (Fire and forget to not block response)
                            saveMessage(senderId, 'user', receivedText);
                            saveMessage(senderId, 'assistant', aiReply);
                        }
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
};
