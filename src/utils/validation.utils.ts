/**
 * Validate Philippine phone number
 * Accepts formats: 09171234567, +639171234567, 9171234567
 */
export const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Check Philippine mobile number patterns
    const patterns = [
        /^09\d{9}$/,           // 09171234567
        /^\+639\d{9}$/,        // +639171234567
        /^639\d{9}$/,          // 639171234567
        /^9\d{9}$/             // 9171234567
    ];

    return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Format phone number to standard format
 */
export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[\s-]/g, '');

    // Convert to 09XXXXXXXXX format
    if (cleaned.startsWith('+63')) {
        return '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('63')) {
        return '0' + cleaned.substring(2);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
        return '0' + cleaned;
    }

    return cleaned;
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validate date is valid and not in the past
 */
export const validateDate = (date: Date): boolean => {
    if (!date || isNaN(date.getTime())) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today;
};

/**
 * Validate name (at least 2 characters, letters and spaces only)
 */
export const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
};

/**
 * Sanitize user input to prevent injection
 */
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 500); // Limit length
};
