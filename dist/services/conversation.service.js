"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldConversations = exports.getActiveConversations = exports.hasActiveConversation = exports.resetConversation = exports.updateConversationData = exports.setConversationStage = exports.updateConversationState = exports.getConversationState = void 0;
const appointment_types_1 = require("../types/appointment.types");
// In-memory storage for conversation states
// In production, use Redis or a database
const conversationStates = new Map();
/**
 * Get conversation state for a user
 */
const getConversationState = (userId) => {
    return conversationStates.get(userId) || null;
};
exports.getConversationState = getConversationState;
/**
 * Update conversation state
 */
const updateConversationState = (userId, updates) => {
    const existing = conversationStates.get(userId);
    const newState = {
        userId,
        stage: updates.stage || existing?.stage || appointment_types_1.ConversationStage.INITIAL,
        data: {
            ...existing?.data,
            ...updates.data
        },
        lastUpdated: new Date()
    };
    conversationStates.set(userId, newState);
    return newState;
};
exports.updateConversationState = updateConversationState;
/**
 * Set conversation stage
 */
const setConversationStage = (userId, stage) => {
    (0, exports.updateConversationState)(userId, { stage });
};
exports.setConversationStage = setConversationStage;
/**
 * Update conversation data
 */
const updateConversationData = (userId, data) => {
    (0, exports.updateConversationState)(userId, { data });
};
exports.updateConversationData = updateConversationData;
/**
 * Reset conversation (start over)
 */
const resetConversation = (userId) => {
    conversationStates.delete(userId);
};
exports.resetConversation = resetConversation;
/**
 * Check if user has an active conversation
 */
const hasActiveConversation = (userId) => {
    const state = conversationStates.get(userId);
    if (!state)
        return false;
    // Consider conversation inactive after 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return state.lastUpdated > thirtyMinutesAgo;
};
exports.hasActiveConversation = hasActiveConversation;
/**
 * Get all active conversations (for debugging/monitoring)
 */
const getActiveConversations = () => {
    return Array.from(conversationStates.values());
};
exports.getActiveConversations = getActiveConversations;
/**
 * Clean up old conversations (call periodically)
 */
const cleanupOldConversations = () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [userId, state] of conversationStates.entries()) {
        if (state.lastUpdated < oneHourAgo) {
            conversationStates.delete(userId);
        }
    }
};
exports.cleanupOldConversations = cleanupOldConversations;
// Auto cleanup every hour
setInterval(exports.cleanupOldConversations, 60 * 60 * 1000);
