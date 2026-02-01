"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = exports.tools = void 0;
const openai_1 = __importDefault(require("openai"));
const knowledge_1 = require("../config/knowledge");
// Validate OpenAI API key on startup
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ CRITICAL: OPENAI_API_KEY environment variable is not set!');
    console.error('   The bot will not be able to generate responses.');
}
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const SYSTEM_PROMPT = knowledge_1.BOT_PERSONA;
exports.tools = [
    {
        type: "function",
        function: {
            name: "get_car_specs",
            description: "Get detailed specifications for a specific car model. Use this when the user asks about engine, power, price or features of a car.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "string",
                        description: "The ID of the car model (e.g., car_xpander_gls, car_montero_gt). Infer from user text."
                    }
                },
                required: ["model_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "calculate_quotation",
            description: "Calculate monthly amortization based on downpayment and loan term.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "string",
                        description: "The ID of the car model."
                    },
                    downpayment_percent: {
                        type: "number",
                        description: "The downpayment percentage (decimal, e.g., 0.20 for 20%). Default to 0.20 if not specified."
                    },
                    years: {
                        type: "number",
                        description: "The loan term in years (e.g., 3, 4, 5). Default to 5 if not specified."
                    }
                },
                required: ["model_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_car_gallery",
            description: "Show a visual gallery of all available Mitsubishi car models. Use this for greeting or when asked what cars are available."
        }
    },
    {
        type: "function",
        function: {
            name: "book_test_drive",
            description: "Book a test drive appointment for a customer.",
            parameters: {
                type: "object",
                properties: {
                    model_id: {
                        type: "string",
                        description: "The ID of the car model to test drive."
                    },
                    date_time: {
                        type: "string",
                        description: "The ISO string of the chosen date and time."
                    },
                    customer_name: {
                        type: "string",
                        description: "The full name of the customer."
                    },
                    customer_phone: {
                        type: "string",
                        description: "The phone number of the customer."
                    }
                },
                required: ["model_id", "date_time", "customer_name", "customer_phone"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_test_drive_availability",
            description: "Check available test drive slots for a specific date.",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "The date to check in YYYY-MM-DD format."
                    },
                    model_id: {
                        type: "string",
                        description: "The ID of the car model (optional, but good to have)."
                    }
                },
                required: ["date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "send_quick_replies",
            description: "Sends quick replies to the user.",
            parameters: {
                type: "object",
                properties: {
                    text: {
                        type: "string",
                        description: "The text message to accompany the quick replies."
                    }
                },
                required: ["text"]
            }
        }
    }
];
const generateAIResponse = async (userMessage, history = []) => {
    try {
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map(msg => ({
                role: msg.role === 'tool' ? 'tool' : msg.role,
                content: msg.content,
                tool_call_id: msg.tool_call_id,
                name: msg.name
            })),
            { role: "user", content: userMessage }
        ];
        console.log('🌐 Sending request to OpenAI...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 400,
            tools: exports.tools,
            tool_choice: "auto"
        }, {
            timeout: 10000 // 10 second timeout
        });
        console.log('✅ Received response from OpenAI');
        const message = completion.choices[0].message;
        return {
            content: message.content,
            toolCalls: message.tool_calls
        };
    }
    catch (error) {
        console.error("❌ OpenAI API Error:", error.message);
        return { content: "I'm having trouble connecting to my brain right now. Please try again later." };
    }
};
exports.generateAIResponse = generateAIResponse;
