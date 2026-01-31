import axios from 'axios';
import { config } from '../config/env';
import { Appointment } from '../types/appointment.types';
import { formatAppointmentDateTime } from '../utils/date.utils';
import { CarModel } from '../config/cars.config';

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
                metadata: "CAR_BOT"
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
 * Send test drive confirmation
 */
export const sendAppointmentConfirmation = async (
    recipientId: string,
    appointment: Appointment
) => {
    const message = `
✅ *Test Drive Confirmed!*

📋 *Reference:* ${appointment.id}
🚗 *Car:* ${appointment.carModel.name}
📅 *Date & Time:* ${formatAppointmentDateTime(appointment.dateTime)}
👤 *Customer:* ${appointment.customer.name}
📱 *Phone:* ${appointment.customer.phone}

Please visit our dealership 15 minutes before your schedule. Don't forget your driver's license! 🚘

_Type "cancel" to cancel your appointment_
    `.trim();

    await sendMessage(recipientId, message);
};

/**
 * Send Car Model Gallery
 */
export const sendCarGallery = async (recipientId: string, cars: CarModel[]) => {
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

    await sendGenericTemplate(recipientId, elements);
};

/**
 * Send detailed car specs with image
 */
export const sendCarDetails = async (recipientId: string, car: CarModel) => {
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

    await sendGenericTemplate(recipientId, [element]);
    // Send full specs text after
    await sendMessage(recipientId, specs);
};

/**
 * Send Price Quotation
 */
export const sendQuotation = async (recipientId: string, car: CarModel, dpPercent: number, years: number) => {
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

    await sendQuickReplies(recipientId, message, [
        { content_type: 'text', title: 'Yes, Test Drive', payload: `TEST_DRIVE_${car.id}` },
        { content_type: 'text', title: 'Check other cars', payload: 'SHOW_SERVICES' } // Using SHOW_SERVICES payload to trigger gallery
    ]);
};

/**
 * Helper to send a yes/no quick reply
 */
export const sendYesNoReplies = async (recipientId: string, text: string) => {
    return sendQuickReplies(recipientId, text, [
        { content_type: 'text', title: 'Yes', payload: 'YES' },
        { content_type: 'text', title: 'No', payload: 'NO' }
    ]);
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

