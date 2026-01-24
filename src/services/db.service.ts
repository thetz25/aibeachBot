
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Initialize Supabase Client
if (!config.supabase.url || !config.supabase.key) {
    console.error("❌ CRTICAL: Supabase URL or Key missing.");
}

const supabase = createClient(
    config.supabase.url || '',
    config.supabase.key || ''
);

export interface ChatMessage {
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}

const TABLE_NAME = config.supabase.tableName || 'messages';

export const saveMessage = async (userId: string, role: 'user' | 'assistant', content: string) => {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .insert([
                { user_id: userId, role: role, content: content }
            ]);

        if (error) throw error;
        // console.log(`💾 Saved ${role} message to Supabase`);
    } catch (error: any) {
        console.error("⚠️ Failed to save message to Supabase:", error.message);
    }
};

export const getHistory = async (userId: string, limit: number = 10): Promise<ChatMessage[]> => {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        if (!data) return [];

        // Reverse to get chronological order (Oldest first)
        return data.map((row: any) => ({
            userId: row.user_id,
            role: row.role as 'user' | 'assistant',
            content: row.content,
            timestamp: new Date(row.created_at)
        })).reverse();

    } catch (error: any) {
        console.error("⚠️ Failed to fetch history from Supabase:", error.message);
        return [];
    }
};
