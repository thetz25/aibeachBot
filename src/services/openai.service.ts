import OpenAI from 'openai';
import { config } from '../config/env';

import { BOT_PERSONA } from '../config/knowledge';

// Initialize OpenAI Client
// NOTE: Ensure OPENAI_API_KEY is in .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = BOT_PERSONA;

export const generateAIResponse = async (userMessage: string): Promise<string> => {
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
    } catch (error: any) {
        console.error("❌ OpenAI API Error:", error.message);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
