"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = void 0;
const openai_1 = __importDefault(require("openai"));
const knowledge_1 = require("../config/knowledge");
// Initialize OpenAI Client
// NOTE: Ensure OPENAI_API_KEY is in .env
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const SYSTEM_PROMPT = knowledge_1.BOT_PERSONA;
const generateAIResponse = async (userMessage, history = []) => {
    try {
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: userMessage }
        ];
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using mini for speed/cost efficiency
            messages: messages,
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
