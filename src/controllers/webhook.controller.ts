import { Request, Response } from 'express';
import { config } from '../config/env';
import { sendMessage } from '../services/messenger.service';
import { generateAIResponse } from '../services/openai.service';

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
                    console.log('📩 Received event:', webhook_event);

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

                        // AI Logic
                        console.log(`🤖 Generatng AI response for: "${receivedText}"`);
                        const aiReply = await generateAIResponse(receivedText);

                        // HANDOFF CHECK
                        if (aiReply.includes('TRANSFER_AGENT')) {
                            // Pause for 5 minutes from NOW
                            pausedUsers.set(senderId, Date.now() + PAUSE_DURATION_MS);
                            await sendMessage(senderId, "✅ Handing you over to a human agent. Please wait, they will reply shortly.");
                            console.log(`👨‍💼 HANDOFF TRIGGERED for ${senderId}. Bot paused for 5 mins.`);
                        } else {
                            await sendMessage(senderId, aiReply);
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
