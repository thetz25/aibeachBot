"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageCredential = exports.savePageCredential = exports.getHistory = exports.saveMessage = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
// Initialize Supabase Client
if (!env_1.config.supabase.url || !env_1.config.supabase.key) {
    console.error("❌ CRTICAL: Supabase URL or Key missing.");
}
exports.supabase = (0, supabase_js_1.createClient)(env_1.config.supabase.url || '', env_1.config.supabase.key || '');
const MSG_TABLE = env_1.config.supabase.tableName || 'messages';
const CRED_TABLE = 'page_credentials';
/**
 * Save a message to the chat history
 */
const saveMessage = async (userId, role, content) => {
    try {
        const { error } = await exports.supabase
            .from(MSG_TABLE)
            .insert([
            { user_id: userId, role: role, content: content }
        ]);
        if (error)
            throw error;
    }
    catch (error) {
        console.error("⚠️ Failed to save message to Supabase:", error.message);
    }
};
exports.saveMessage = saveMessage;
/**
 * Get chat history for a user
 */
const getHistory = async (userId, limit = 10) => {
    try {
        const { data, error } = await exports.supabase
            .from(MSG_TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        if (!data)
            return [];
        // Reverse to get chronological order (Oldest first)
        return data.map((row) => ({
            userId: row.user_id,
            role: row.role,
            content: row.content,
            timestamp: new Date(row.created_at)
        })).reverse();
    }
    catch (error) {
        console.error("⚠️ Failed to fetch history from Supabase:", error.message);
        return [];
    }
};
exports.getHistory = getHistory;
/**
 * Save Page Credentials (OAuth)
 */
const savePageCredential = async (pageId, pageName, accessToken) => {
    try {
        const { error } = await exports.supabase
            .from(CRED_TABLE)
            .upsert([
            { page_id: pageId, page_name: pageName, access_token: accessToken, updated_at: new Date() }
        ], { onConflict: 'page_id' });
        if (error)
            throw error;
        console.log(`✅ Saved credentials for Page: ${pageName} (${pageId})`);
    }
    catch (error) {
        console.error("❌ Failed to save page credential:", error.message);
        throw error;
    }
};
exports.savePageCredential = savePageCredential;
/**
 * Get Page Credential by ID
 */
const getPageCredential = async (pageId) => {
    try {
        const { data, error } = await exports.supabase
            .from(CRED_TABLE)
            .select('access_token')
            .eq('page_id', pageId)
            .single();
        if (error || !data)
            return null;
        return data.access_token;
    }
    catch (error) {
        // console.error("⚠️ Failed to fetch page credential:", error.message);
        return null;
    }
};
exports.getPageCredential = getPageCredential;
