"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTypingIndicator = exports.sendYesNoReplies = exports.sendQuotation = exports.sendCarDetails = exports.sendCarGallery = exports.sendAppointmentConfirmation = exports.sendGenericTemplate = exports.sendButtonTemplate = exports.sendQuickReplies = exports.sendMessage = void 0;
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
                metadata: "CAR_BOT"
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
 * Send test drive confirmation
 */
const sendAppointmentConfirmation = async (recipientId, appointment) => {
    const message = `
✅ *Test Drive Confirmed!*

📋 *Reference:* ${appointment.id}
🚗 *Car:* ${appointment.carModel.name}
📅 *Date & Time:* ${(0, date_utils_1.formatAppointmentDateTime)(appointment.dateTime)}
👤 *Customer:* ${appointment.customer.name}
📱 *Phone:* ${appointment.customer.phone}

Please visit our dealership 15 minutes before your schedule. Don't forget your driver's license! 🚘

_Type "cancel" to cancel your appointment_
    `.trim();
    await (0, exports.sendMessage)(recipientId, message);
};
exports.sendAppointmentConfirmation = sendAppointmentConfirmation;
/**
 * Send Car Model Gallery
 */
const sendCarGallery = async (recipientId, cars) => {
    // Facebook Generic Template limit is 10 elements
    const elements = cars.slice(0, 10).map(car => ({
        title: car.name,
        subtitle: `₱${car.price.toLocaleString()} \n${car.description.substring(0, 60)}...`,
        image_url: car.imageUrl,
        buttons: [
            {
                type: 'postback',
                title: 'View Specs',
                payload: `DETAILS_${car.id}`
            },
            {
                type: 'postback',
                title: 'Get Quote',
                payload: `QUOTE_${car.id}`
            },
            {
                type: 'postback',
                title: 'Book Test Drive',
                payload: `TEST_DRIVE_${car.id}`
            }
        ]
    }));
    await (0, exports.sendGenericTemplate)(recipientId, elements);
};
exports.sendCarGallery = sendCarGallery;
/**
 * Send detailed car specs with image
 */
const sendCarDetails = async (recipientId, car) => {
    const specs = `
🚘 *${car.name}*
💰 Price: ₱${car.price.toLocaleString()}

⚙️ *Specifications:*
• Engine: ${car.specs.engine}
• Power: ${car.specs.power}
• Torque: ${car.specs.torque}
• Transmission: ${car.specs.transmission}
• Seats: ${car.specs.seatingCapacity}
• Fuel: ${car.specs.fuelType}

${car.description}
    `.trim();
    // Workaround: Send image first as separate message or use generic template with 1 element for "Rich Media" feel
    // Using Generic Template for better UI
    const element = {
        title: car.name,
        subtitle: `₱${car.price.toLocaleString()} | ${car.specs.engine}`,
        image_url: car.imageUrl,
        buttons: [
            {
                type: 'postback',
                title: 'Get Quotation',
                payload: `QUOTE_${car.id}`
            },
            {
                type: 'postback',
                title: 'Book Test Drive',
                payload: `TEST_DRIVE_${car.id}`
            }
        ]
    };
    await (0, exports.sendGenericTemplate)(recipientId, [element]);
    // Send full specs text after
    await (0, exports.sendMessage)(recipientId, specs);
};
exports.sendCarDetails = sendCarDetails;
/**
 * Send Price Quotation
 */
const sendQuotation = async (recipientId, car, dpPercent, years) => {
    const dpAmount = car.price * dpPercent;
    const loanAmount = car.price - dpAmount;
    // Simple mock interest rate logic (e.g., 5% per annum flat)
    const interestRate = 0.05;
    const totalInterest = loanAmount * interestRate * years;
    const totalLoan = loanAmount + totalInterest;
    const monthlyAmortization = totalLoan / (years * 12);
    const message = `
📝 *Quotation for ${car.name}*

💰 *SRP:* ₱${car.price.toLocaleString()}
--------
💵 *Downpayment (${dpPercent * 100}%):* ₱${dpAmount.toLocaleString()}
🏦 *Loan Amount:* ₱${loanAmount.toLocaleString()}
📅 *Term:* ${years} Years

📉 *Monthly Amortization (Est.):*
*₱${Math.round(monthlyAmortization).toLocaleString()} / month*

_Note: This is an estimated computation. Subject to bank approval._

Would you like to schedule a test drive?
    `.trim();
    await (0, exports.sendQuickReplies)(recipientId, message, [
        { content_type: 'text', title: 'Yes, Test Drive', payload: `TEST_DRIVE_${car.id}` },
        { content_type: 'text', title: 'Check other cars', payload: 'SHOW_SERVICES' } // Using SHOW_SERVICES payload to trigger gallery
    ]);
};
exports.sendQuotation = sendQuotation;
/**
 * Helper to send a yes/no quick reply
 */
const sendYesNoReplies = async (recipientId, text) => {
    return (0, exports.sendQuickReplies)(recipientId, text, [
        { content_type: 'text', title: 'Yes', payload: 'YES' },
        { content_type: 'text', title: 'No', payload: 'NO' }
    ]);
};
exports.sendYesNoReplies = sendYesNoReplies;
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
