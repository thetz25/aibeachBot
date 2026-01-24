"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = exports.saveMessage = void 0;
const airtable_1 = __importDefault(require("airtable"));
const env_1 = require("../config/env");
// Initialize Airtable
// Note: Lazy initialization to allow app to start without keys being present immediately
let base = null;
const getBase = () => {
    if (base)
        return base;
    if (!env_1.config.airtable.apiKey || !env_1.config.airtable.baseId) {
        console.error("❌ CRTICAL: Airtable API Key or Base ID missing. Memory is disabled.");
        return null;
    }
    try {
        base = new airtable_1.default({ apiKey: env_1.config.airtable.apiKey }).base(env_1.config.airtable.baseId);
        return base;
    }
    catch (err) {
        console.error("❌ Error initializing Airtable:", err);
        return null;
    }
};
const saveMessage = async (userId, role, content) => {
    const db = getBase();
    if (!db)
        return;
    try {
        await db(env_1.config.airtable.tableName).create([
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
    }
    catch (error) {
        console.error("⚠️ Failed to save message to Airtable:", error.message);
    }
};
exports.saveMessage = saveMessage;
const getHistory = async (userId, limit = 10) => {
    const db = getBase();
    if (!db)
        return [];
    try {
        // Fetch recent messages for this user
        const records = await db(env_1.config.airtable.tableName).select({
            maxRecords: limit,
            sort: [{ field: "Timestamp", direction: "desc" }], // Assuming you have a 'Timestamp' field or rely on Created Time
            filterByFormula: `{UserId} = '${userId}'`
        }).firstPage();
        // Map to ChatMessage format and reverse to get chronological order (oldest first)
        return records.map(record => ({
            userId: record.get('UserId'),
            role: record.get('Role'),
            content: record.get('Content'),
            timestamp: (record.get('Timestamp') || record._rawJson.createdTime)
        })).reverse();
    }
    catch (error) {
        console.error("⚠️ Failed to fetch history from Airtable:", error.message);
        return [];
    }
};
exports.getHistory = getHistory;
