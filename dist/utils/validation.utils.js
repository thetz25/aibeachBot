"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateName = exports.validateDate = exports.validateEmail = exports.formatPhoneNumber = exports.validatePhoneNumber = void 0;
/**
 * Validate Philippine phone number
 * Accepts formats: 09171234567, +639171234567, 9171234567
 */
const validatePhoneNumber = (phone) => {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');
    // Check Philippine mobile number patterns
    const patterns = [
        /^09\d{9}$/, // 09171234567
        /^\+639\d{9}$/, // +639171234567
        /^639\d{9}$/, // 639171234567
        /^9\d{9}$/ // 9171234567
    ];
    return patterns.some(pattern => pattern.test(cleaned));
};
exports.validatePhoneNumber = validatePhoneNumber;
/**
 * Format phone number to standard format
 */
const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, '');
    // Convert to 09XXXXXXXXX format
    if (cleaned.startsWith('+63')) {
        return '0' + cleaned.substring(3);
    }
    else if (cleaned.startsWith('63')) {
        return '0' + cleaned.substring(2);
    }
    else if (cleaned.startsWith('9') && cleaned.length === 10) {
        return '0' + cleaned;
    }
    return cleaned;
};
exports.formatPhoneNumber = formatPhoneNumber;
/**
 * Validate email address
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};
exports.validateEmail = validateEmail;
/**
 * Validate date is valid and not in the past
 */
const validateDate = (date) => {
    if (!date || isNaN(date.getTime())) {
        return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
};
exports.validateDate = validateDate;
/**
 * Validate name (at least 2 characters, letters and spaces only)
 */
const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
};
exports.validateName = validateName;
/**
 * Sanitize user input to prevent injection
 */
const sanitizeInput = (input) => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 500); // Limit length
};
exports.sanitizeInput = sanitizeInput;
