"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = void 0;
const openai_1 = __importDefault(require("openai"));
// Initialize OpenAI Client
// NOTE: Ensure OPENAI_API_KEY is in .env
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const SYSTEM_PROMPT = ` You are a helpful, professional AI employee assistant living inside Facebook Messenger.
Your goal is to assist the user concisely. 
Do not use markdown formatting (bold, italic) that Messenger might not render well, or keep it very simple.
Keep responses under 1000 characters if possible.`;
const generateAIResponse = async (userMessage) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using mini for speed/cost efficiency
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage }
            ],
            max_tokens: 300,
        });
        return completion.choices[0].message.content || "I'm sorry, I couldn't think of a response.";
    }
    catch (error) {
        console.error("❌ OpenAI API Error:", error.message);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
exports.generateAIResponse = generateAIResponse;
