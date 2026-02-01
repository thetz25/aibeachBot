"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyWebhook = void 0;
const env_1 = require("../config/env");
const car_service_1 = require("../services/car.service");
const messenger_service_1 = require("../services/messenger.service");
const openai_service_1 = require("../services/openai.service");
const db_service_1 = require("../services/db.service");
const appointment_service_1 = require("../services/appointment.service");
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
        // Send immediate response to Facebook to prevent timeout
        res.status(200).send('EVENT_RECEIVED');
        // Process events asynchronously after responding
        for (const entry of body.entry) {
            if (entry.messaging) {
                for (const webhook_event of entry.messaging) {
                    console.log('🔍 Processing webhook_event:', typeof webhook_event);
                    let senderId;
                    try {
                        senderId = webhook_event.sender.id;
                        console.log(`✅ Extracted senderId: ${senderId}`);
                    }
                    catch (err) {
                        console.error('❌ Failed to extract senderId:', err.message);
                        continue;
                    }
                    // Handle Postbacks (Button Clicks)
                    if (webhook_event.postback) {
                        try {
                            const payload = webhook_event.postback.payload;
                            console.log(`🔘 Received postback: ${payload} from ${senderId}`);
                            if (payload.startsWith('DETAILS_')) {
                                const carId = payload.replace('DETAILS_', '');
                                const car = await car_service_1.carService.getCarById(carId);
                                if (car) {
                                    await (0, messenger_service_1.sendCarDetails)(senderId, car);
                                }
                            }
                            else if (payload.startsWith('QUOTE_')) {
                                const carId = payload.replace('QUOTE_', '');
                                const car = await car_service_1.carService.getCarById(carId);
                                if (car) {
                                    // Send default quotation (20% DP, 5 Years)
                                    await (0, messenger_service_1.sendQuotation)(senderId, car, 0.20, 5);
                                }
                            }
                            else if (payload.startsWith('TEST_DRIVE_')) {
                                const carId = payload.replace('TEST_DRIVE_', '');
                                const car = await car_service_1.carService.getCarById(carId);
                                if (car) {
                                    // Instruct AI to handle the booking flow
                                    const history = await (0, db_service_1.getHistory)(senderId);
                                    const instruction = `User clicked "Book Test Drive" for ${car.name}. Start the booking process by asking for their preferred date.`;
                                    // Map to AI history first
                                    const aiHistory = history.map((msg) => ({
                                        role: msg.role,
                                        content: msg.content
                                    }));
                                    // Inject hidden system instruction
                                    aiHistory.push({ role: 'system', content: instruction });
                                    // Trigger AI response
                                    const response = await (0, openai_service_1.generateAIResponse)(instruction, aiHistory);
                                    if (response.content) {
                                        await (0, messenger_service_1.sendMessage)(senderId, response.content);
                                        await (0, db_service_1.saveMessage)(senderId, 'assistant', response.content);
                                    }
                                }
                            }
                            else if (payload === 'SHOW_SERVICES') {
                                const cars = await car_service_1.carService.getAllCars();
                                await (0, messenger_service_1.sendCarGallery)(senderId, cars);
                            }
                        }
                        catch (error) {
                            console.error(`❌ Error handling postback from ${senderId}:`, error.message);
                            await (0, messenger_service_1.sendMessage)(senderId, "Sorry, I encountered an error processing your request. Please try again.");
                        }
                        continue; // Skip further processing for postbacks
                    }
                    console.log('📩 Received event:', JSON.stringify(webhook_event, null, 2));
                    console.log(`👤 Sender ID: ${senderId}`);
                    console.log('🔍 DEBUG: About to check message.text condition');
                    console.log(`   - webhook_event.message exists: ${!!webhook_event.message}`);
                    if (webhook_event.message) {
                        console.log(`   - webhook_event.message.text exists: ${!!webhook_event.message.text}`);
                        console.log(`   - text value: "${webhook_event.message.text}"`);
                    }
                    if (webhook_event.message && webhook_event.message.text) {
                        const receivedText = webhook_event.message.text;
                        let history = [];
                        try {
                            history = await (0, db_service_1.getHistory)(senderId);
                        }
                        catch (err) {
                            console.log('⚠️ Could not fetch history, continuing without it');
                        }
                        // Map history to OpenAI format
                        let aiHistory = history.map((msg) => ({
                            role: msg.role,
                            content: msg.content
                        }));
                        let response = await (0, openai_service_1.generateAIResponse)(receivedText, aiHistory);
                        // TOOL EXECUTION LOOP
                        try {
                            while (response.toolCalls && response.toolCalls.length > 0) {
                                const toolMessages = [];
                                // Process each tool call
                                for (const toolCall of response.toolCalls) {
                                    const functionName = toolCall.function.name;
                                    const args = JSON.parse(toolCall.function.arguments);
                                    console.log(`🛠️ Executing tool: ${functionName}`, args);
                                    let toolResult;
                                    if (functionName === 'get_car_specs') {
                                        const car = await car_service_1.carService.getCarById(args.model_id);
                                        if (car) {
                                            await (0, messenger_service_1.sendCarDetails)(senderId, car);
                                            toolResult = `Displayed specs for ${car.name}.`;
                                        }
                                        else {
                                            toolResult = "Error: Invalid car model ID.";
                                        }
                                    }
                                    else if (functionName === 'calculate_quotation') {
                                        const car = await car_service_1.carService.getCarById(args.model_id);
                                        if (car) {
                                            const dp = args.downpayment_percent || 0.20;
                                            const years = args.years || 5;
                                            await (0, messenger_service_1.sendQuotation)(senderId, car, dp, years);
                                            toolResult = `Sent quotation for ${car.name} with ${dp * 100}% DP for ${years} years.`;
                                        }
                                        else {
                                            toolResult = "Error: Invalid car model ID.";
                                        }
                                    }
                                    else if (functionName === 'show_car_gallery') {
                                        const cars = await car_service_1.carService.getAllCars();
                                        await (0, messenger_service_1.sendCarGallery)(senderId, cars);
                                        toolResult = "Car gallery displayed to user.";
                                    }
                                    else if (functionName === 'check_test_drive_availability') {
                                        let car = args.model_id ? await car_service_1.carService.getCarById(args.model_id) : null;
                                        if (!car) {
                                            const allCars = await car_service_1.carService.getAllCars();
                                            car = allCars[0];
                                        }
                                        if (car) {
                                            const slots = await (0, appointment_service_1.checkAvailability)(new Date(args.date), car);
                                            toolResult = slots.length > 0 ? slots.map((s) => s.toISOString()) : "No available slots for this date.";
                                        }
                                        else {
                                            toolResult = "Error: Invalid car model ID.";
                                        }
                                    }
                                    else if (functionName === 'book_test_drive') {
                                        const car = await car_service_1.carService.getCarById(args.model_id);
                                        if (car) {
                                            const appointment = await (0, appointment_service_1.bookAppointment)({
                                                name: args.customer_name,
                                                phone: args.customer_phone,
                                                facebookUserId: senderId
                                            }, car, new Date(args.date_time));
                                            await (0, messenger_service_1.sendAppointmentConfirmation)(senderId, appointment);
                                            toolResult = `Successfully booked test drive. Reference ID: ${appointment.id}`;
                                        }
                                        else {
                                            toolResult = "Error: Invalid car model ID.";
                                        }
                                    }
                                    else if (functionName === 'send_quick_replies') {
                                        await (0, messenger_service_1.sendYesNoReplies)(senderId, args.text);
                                        toolResult = "Quick replies sent to user.";
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
                            console.log(`🤖 AI Response: ${aiReply ? aiReply.substring(0, 100) + '...' : 'null/empty'}`);
                            if (aiReply) {
                                console.log(`📤 Sending message to ${senderId}`);
                                await (0, messenger_service_1.sendMessage)(senderId, aiReply);
                                // Save messages non-blocking (don't wait for completion)
                                (0, db_service_1.saveMessage)(senderId, 'user', receivedText).catch(() => { });
                                (0, db_service_1.saveMessage)(senderId, 'assistant', aiReply).catch(() => { });
                                console.log(`✅ Message sent successfully`);
                            }
                            else {
                                console.log(`⚠️ No AI response generated - not sending message`);
                            }
                        }
                        catch (error) {
                            console.error(`❌ Error processing message from ${senderId}:`, error.message);
                            await (0, messenger_service_1.sendMessage)(senderId, "Sorry, I encountered an error. Please try again in a moment.");
                        }
                    }
                }
            }
        }
    }
    else {
        res.sendStatus(404);
    }
};
exports.handleWebhook = handleWebhook;
