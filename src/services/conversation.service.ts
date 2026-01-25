import { ConversationState, ConversationStage } from '../types/appointment.types';

// In-memory storage for conversation states
// In production, use Redis or a database
const conversationStates = new Map<string, ConversationState>();

/**
 * Get conversation state for a user
 */
export const getConversationState = (userId: string): ConversationState | null => {
    return conversationStates.get(userId) || null;
};

/**
 * Update conversation state
 */
export const updateConversationState = (
    userId: string,
    updates: Partial<ConversationState>
): ConversationState => {
    const existing = conversationStates.get(userId);

    const newState: ConversationState = {
        userId,
        stage: updates.stage || existing?.stage || ConversationStage.INITIAL,
        data: {
            ...existing?.data,
            ...updates.data
        },
        lastUpdated: new Date()
    };

    conversationStates.set(userId, newState);
    return newState;
};

/**
 * Set conversation stage
 */
export const setConversationStage = (
    userId: string,
    stage: ConversationStage
): void => {
    updateConversationState(userId, { stage });
};

/**
 * Update conversation data
 */
export const updateConversationData = (
    userId: string,
    data: Partial<ConversationState['data']>
): void => {
    updateConversationState(userId, { data });
};

/**
 * Reset conversation (start over)
 */
export const resetConversation = (userId: string): void => {
    conversationStates.delete(userId);
};

/**
 * Check if user has an active conversation
 */
export const hasActiveConversation = (userId: string): boolean => {
    const state = conversationStates.get(userId);
    if (!state) return false;

    // Consider conversation inactive after 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return state.lastUpdated > thirtyMinutesAgo;
};

/**
 * Get all active conversations (for debugging/monitoring)
 */
export const getActiveConversations = (): ConversationState[] => {
    return Array.from(conversationStates.values());
};

/**
 * Clean up old conversations (call periodically)
 */
export const cleanupOldConversations = (): void => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [userId, state] of conversationStates.entries()) {
        if (state.lastUpdated < oneHourAgo) {
            conversationStates.delete(userId);
        }
    }
};

// Auto cleanup every hour
setInterval(cleanupOldConversations, 60 * 60 * 1000);
