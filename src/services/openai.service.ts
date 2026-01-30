import OpenAI from 'openai';
import { config } from '../config/env';
import { BOT_PERSONA } from '../config/knowledge';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = BOT_PERSONA;

export const tools: any[] = [
    {
        type: "function",
        function: {
            name: "get_available_slots",
            description: "Check available appointment slots for a specific dental service and date.",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "The date to check in YYYY-MM-DD format."
                    },
                    service_id: {
                        type: "string",
                        description: "The ID of the dental service (e.g., dental_001, dental_002, etc.)."
                    }
                },
                required: ["date", "service_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "book_appointment",
            description: "Book a dental appointment for a customer.",
            parameters: {
                type: "object",
                properties: {
                    service_id: {
                        type: "string",
                        description: "The ID of the dental service."
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
                required: ["service_id", "date_time", "customer_name", "customer_phone"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_services",
            description: "Show a visual gallery of all available dental services."
        }
    },
    {
        type: "function",
        function: {
            name: "cancel_appointment",
            description: "Cancel an existing dental appointment.",
            parameters: {
                type: "object",
                properties: {
                    appointment_id: {
                        type: "string",
                        description: "The reference ID of the appointment to cancel."
                    }
                },
                required: ["appointment_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "reschedule_appointment",
            description: "Reschedule an existing dental appointment to a new date and time.",
            parameters: {
                type: "object",
                properties: {
                    appointment_id: {
                        type: "string",
                        description: "The reference ID of the appointment to reschedule."
                    },
                    date_time: {
                        type: "string",
                        description: "The new ISO string of the chosen date and time."
                    }
                },
                required: ["appointment_id", "date_time"]
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

export const generateAIResponse = async (
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant' | 'tool', content?: string, tool_call_id?: string, name?: string }> = []
): Promise<{ content: string | null, toolCalls?: any[] }> => {
    try {
        const messages: any[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map(msg => ({
                role: msg.role === 'tool' ? 'tool' : msg.role,
                content: msg.content,
                tool_call_id: msg.tool_call_id,
                name: msg.name
            })),
            { role: "user", content: userMessage }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 400,
            tools: tools,
            tool_choice: "auto"
        });

        const message = completion.choices[0].message;

        return {
            content: message.content,
            toolCalls: message.tool_calls
        };
    } catch (error: any) {
        console.error("❌ OpenAI API Error:", error.message);
        return { content: "I'm having trouble connecting to my brain right now. Please try again later." };
    }
};
