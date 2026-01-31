
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Initialize Supabase Client
if (!config.supabase.url || !config.supabase.key) {
    console.error("❌ CRTICAL: Supabase URL or Key missing.");
}

export const supabase = createClient(
    config.supabase.url || '',
    config.supabase.key || ''
);

export interface ChatMessage {
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}

const MSG_TABLE = config.supabase.tableName || 'messages';
const CRED_TABLE = 'page_credentials';

/**
 * Save a message to the chat history
 */
export const saveMessage = async (userId: string, role: 'user' | 'assistant', content: string) => {
    try {
        const { error } = await supabase
            .from(MSG_TABLE)
            .insert([
                { user_id: userId, role: role, content: content }
            ]);

        if (error) throw error;
    } catch (error: any) {
        console.error("⚠️ Failed to save message to Supabase:", error.message);
    }
};

/**
 * Get chat history for a user
 */
export const getHistory = async (userId: string, limit: number = 10): Promise<ChatMessage[]> => {
    try {
        const { data, error } = await supabase
            .from(MSG_TABLE)
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

/**
 * Save Page Credentials (OAuth)
 */
export const savePageCredential = async (pageId: string, pageName: string, accessToken: string) => {
    try {
        const { error } = await supabase
            .from(CRED_TABLE)
            .upsert([
                { page_id: pageId, page_name: pageName, access_token: accessToken, updated_at: new Date() }
            ], { onConflict: 'page_id' });

        if (error) throw error;
        console.log(`✅ Saved credentials for Page: ${pageName} (${pageId})`);
    } catch (error: any) {
        console.error("❌ Failed to save page credential:", error.message);
        throw error;
    }
};

/**
 * Get Page Credential by ID
 */
export const getPageCredential = async (pageId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from(CRED_TABLE)
            .select('access_token')
            .eq('page_id', pageId)
            .single();

        if (error || !data) return null;
        return data.access_token;
    } catch (error: any) {
        // console.error("⚠️ Failed to fetch page credential:", error.message);
        return null;
    }
};
