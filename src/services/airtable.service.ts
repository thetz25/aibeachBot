import Airtable from 'airtable';
import { config } from '../config/env';

// Initialize Airtable
// Note: Lazy initialization to allow app to start without keys being present immediately
let base: Airtable.Base | null = null;

const getBase = () => {
    if (base) return base;

    if (!config.airtable.apiKey || !config.airtable.baseId) {
        console.error("❌ CRTICAL: Airtable API Key or Base ID missing. Memory is disabled.");
        return null;
    }

    try {
        base = new Airtable({ apiKey: config.airtable.apiKey }).base(config.airtable.baseId);
        return base;
    } catch (err) {
        console.error("❌ Error initializing Airtable:", err);
        return null;
    }
}

export interface ChatMessage {
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export const saveMessage = async (userId: string, role: 'user' | 'assistant', content: string) => {
    const db = getBase();
    if (!db) return;

    try {
        await db(config.airtable.tableName).create([
            {
                fields: {
                    UserId: userId,
                    Role: role,
                    Content: content,
                    // Airtable 'Created Time' field is automatic, but we can send a custom one if needed.
                    // Let's rely on Airtable's creation time for simplicity, or add a specific column if needed.
                    // If your table has a specific Date column, uncomment below:
                    // Timestamp: new Date().toISOString()
                }
            }
        ]);
        // console.log(`💾 Saved ${role} message to Airtable`);
    } catch (error: any) {
        console.error("⚠️ Failed to save message to Airtable:", error.message);
    }
};

export const getHistory = async (userId: string, limit: number = 10): Promise<ChatMessage[]> => {
    const db = getBase();
    if (!db) return [];

    try {
        // Fetch recent messages for this user
        const records = await db(config.airtable.tableName).select({
            maxRecords: limit,
            sort: [{ field: "Timestamp", direction: "desc" }], // Assuming you have a 'Timestamp' field or rely on Created Time
            filterByFormula: `{UserId} = '${userId}'`
        }).firstPage();

        // Map to ChatMessage format and reverse to get chronological order (oldest first)
        return records.map(record => ({
            userId: record.get('UserId') as string,
            role: record.get('Role') as 'user' | 'assistant',
            content: record.get('Content') as string,
            timestamp: ((record.get('Timestamp') as string) || (record as any)._rawJson.createdTime)
        })).reverse();

    } catch (error: any) {
        console.error("⚠️ Failed to fetch history from Airtable:", error.message);
        return [];
    }
};
