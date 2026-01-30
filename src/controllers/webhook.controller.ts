import { Request, Response } from 'express';
import { config } from '../config/env';
import { sendMessage, sendAppointmentConfirmation } from '../services/messenger.service';
import { generateAIResponse } from '../services/openai.service';
import { getHistory, saveMessage } from '../services/db.service';
import { checkAvailability, bookAppointment } from '../services/appointment.service';
import { getServiceById } from '../config/services.config';

const pausedUsers = new Map<string, number>(); // UserId -> Expiry Timestamp
const PAUSE_DURATION_MS = 30 * 60 * 1000; // 30 Minutes

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
        for (const entry of body.entry) {
            if (entry.messaging) {
                for (const webhook_event of entry.messaging) {
                    console.log('📩 Received event:', JSON.stringify(webhook_event, null, 2));

                    if (webhook_event.message && webhook_event.message.is_echo) {
                        const metadata = webhook_event.message.metadata;
                        if (metadata !== 'BOT_MESSAGE') {
                            const recipientId = webhook_event.recipient.id;
                            console.log(`👨‍💻 HUMAN ADMIN replied to ${recipientId}. Pausing AI for 30 mins.`);
                            pausedUsers.set(recipientId, Date.now() + PAUSE_DURATION_MS);
                        }
                        continue;
                    }

                    const senderId = webhook_event.sender.id;

                    if (pausedUsers.has(senderId)) {
                        const expiry = pausedUsers.get(senderId) || 0;
                        if (Date.now() < expiry) {
                            console.log(`🤐 User ${senderId} is paused. Ignoring until ${new Date(expiry).toLocaleTimeString()}`);
                            continue;
                        } else {
                            pausedUsers.delete(senderId);
                        }
                    }

                    if (webhook_event.message && webhook_event.message.text) {
                        const receivedText = webhook_event.message.text;
                        const history = await getHistory(senderId);

                        // Map history to OpenAI format
                        let aiHistory: any[] = history.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }));

                        let response = await generateAIResponse(receivedText, aiHistory);

                        // TOOL EXECUTION LOOP
                        while (response.toolCalls && response.toolCalls.length > 0) {
                            const toolMessages: any[] = [];

                            // Process each tool call
                            for (const toolCall of response.toolCalls) {
                                const functionName = toolCall.function.name;
                                const args = JSON.parse(toolCall.function.arguments);

                                console.log(`🛠️ Executing tool: ${functionName}`, args);

                                let toolResult: any;
                                if (functionName === 'get_available_slots') {
                                    const service = getServiceById(args.service_id);
                                    if (service) {
                                        const slots = await checkAvailability(new Date(args.date), service);
                                        toolResult = slots.length > 0 ? slots.map(s => s.toISOString()) : "No available slots for this date.";
                                    } else {
                                        toolResult = "Error: Invalid service ID.";
                                    }
                                } else if (functionName === 'book_appointment') {
                                    const service = getServiceById(args.service_id);
                                    if (service) {
                                        const appointment = await bookAppointment(
                                            {
                                                name: args.customer_name,
                                                phone: args.customer_phone,
                                                facebookUserId: senderId
                                            },
                                            service,
                                            new Date(args.date_time)
                                        );
                                        // Send confirmation message separately to ensure it is rich
                                        await sendAppointmentConfirmation(senderId, appointment);
                                        toolResult = `Successfully booked appointment. Reference ID: ${appointment.id}`;
                                    } else {
                                        toolResult = "Error: Invalid service ID.";
                                    }
                                }

                                toolMessages.push({
                                    role: 'tool',
                                    tool_call_id: toolCall.id,
                                    name: functionName,
                                    content: JSON.stringify(toolResult)
                                });
                            }

                            // Update history with assistant message containing tool calls
                            aiHistory.push({
                                role: 'assistant',
                                content: response.content || "",
                                tool_calls: response.toolCalls
                            });

                            // Add tool results to history
                            aiHistory.push(...toolMessages);

                            // Get next response from AI
                            response = await generateAIResponse(receivedText, aiHistory);
                        }

                        const aiReply = response.content;

                        if (aiReply && aiReply.includes('TRANSFER_AGENT')) {
                            pausedUsers.set(senderId, Date.now() + (5 * 60 * 1000));
                            await sendMessage(senderId, "✅ Handing you over to our customer support. Please wait, they will reply shortly. Sa ngayon po, maaari niyo pong i-review ang aming services habang naghihintay.");
                            await saveMessage(senderId, 'user', receivedText);
                            await saveMessage(senderId, 'assistant', "✅ Handing you over to customer support...");
                        } else if (aiReply) {
                            await sendMessage(senderId, aiReply);
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
