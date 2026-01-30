"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyWebhook = void 0;
const env_1 = require("../config/env");
const services_config_1 = require("../config/services.config");
const messenger_service_1 = require("../services/messenger.service");
const openai_service_1 = require("../services/openai.service");
const db_service_1 = require("../services/db.service");
const appointment_service_1 = require("../services/appointment.service");
const pausedUsers = new Map(); // UserId -> Expiry Timestamp
const PAUSE_DURATION_MS = 30 * 60 * 1000; // 30 Minutes
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
                        }
                        else {
                            pausedUsers.delete(senderId);
                        }
                    }
                    if (webhook_event.message && webhook_event.message.text) {
                        const receivedText = webhook_event.message.text;
                        const history = await (0, db_service_1.getHistory)(senderId);
                        // Map history to OpenAI format
                        let aiHistory = history.map((msg) => ({
                            role: msg.role,
                            content: msg.content
                        }));
                        let response = await (0, openai_service_1.generateAIResponse)(receivedText, aiHistory);
                        // TOOL EXECUTION LOOP
                        while (response.toolCalls && response.toolCalls.length > 0) {
                            const toolMessages = [];
                            // Process each tool call
                            for (const toolCall of response.toolCalls) {
                                const functionName = toolCall.function.name;
                                const args = JSON.parse(toolCall.function.arguments);
                                console.log(`🛠️ Executing tool: ${functionName}`, args);
                                let toolResult;
                                if (functionName === 'get_available_slots') {
                                    const service = (0, services_config_1.getServiceById)(args.service_id);
                                    if (service) {
                                        const slots = await (0, appointment_service_1.checkAvailability)(new Date(args.date), service);
                                        toolResult = slots.length > 0 ? slots.map((s) => s.toISOString()) : "No available slots for this date.";
                                    }
                                    else {
                                        toolResult = "Error: Invalid service ID.";
                                    }
                                }
                                else if (functionName === 'book_appointment') {
                                    const service = (0, services_config_1.getServiceById)(args.service_id);
                                    if (service) {
                                        const appointment = await (0, appointment_service_1.bookAppointment)({
                                            name: args.customer_name,
                                            phone: args.customer_phone,
                                            facebookUserId: senderId
                                        }, service, new Date(args.date_time));
                                        // Send confirmation message separately to ensure it is rich
                                        await (0, messenger_service_1.sendAppointmentConfirmation)(senderId, appointment);
                                        toolResult = `Successfully booked appointment. Reference ID: ${appointment.id}`;
                                    }
                                    else {
                                        toolResult = "Error: Invalid service ID.";
                                    }
                                }
                                else if (functionName === 'show_services') {
                                    await (0, messenger_service_1.sendServiceGallery)(senderId, services_config_1.DENTAL_SERVICES);
                                    toolResult = "Service gallery displayed to user.";
                                }
                                else if (functionName === 'cancel_appointment') {
                                    await (0, appointment_service_1.cancelAppointmentById)(args.appointment_id);
                                    toolResult = `Appointment ${args.appointment_id} has been cancelled.`;
                                }
                                else if (functionName === 'reschedule_appointment') {
                                    await (0, appointment_service_1.rescheduleAppointmentById)(args.appointment_id, new Date(args.date_time));
                                    toolResult = `Appointment ${args.appointment_id} has been rescheduled to ${new Date(args.date_time).toLocaleString()}.`;
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
                            response = await (0, openai_service_1.generateAIResponse)(receivedText, aiHistory);
                        }
                        const aiReply = response.content;
                        if (aiReply && aiReply.includes('TRANSFER_AGENT')) {
                            pausedUsers.set(senderId, Date.now() + (5 * 60 * 1000));
                            await (0, messenger_service_1.sendMessage)(senderId, "✅ Handing you over to our customer support. Please wait, they will reply shortly. Sa ngayon po, maaari niyo pong i-review ang aming services habang naghihintay.");
                            await (0, db_service_1.saveMessage)(senderId, 'user', receivedText);
                            await (0, db_service_1.saveMessage)(senderId, 'assistant', "✅ Handing you over to customer support...");
                        }
                        else if (aiReply) {
                            await (0, messenger_service_1.sendMessage)(senderId, aiReply);
                            (0, db_service_1.saveMessage)(senderId, 'user', receivedText);
                            (0, db_service_1.saveMessage)(senderId, 'assistant', aiReply);
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
