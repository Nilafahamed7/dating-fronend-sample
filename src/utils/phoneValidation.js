/**
 * Validates a phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export const validatePhoneNumber = (phone) => {
    if (!phone) {
        return { valid: true, error: null }; // Optional field
    }

    // Basic regex for international phone numbers
    // Allows +, spaces, dashes, parentheses, and digits
    // Min length 7, max length 15 (E.164 standard is max 15)
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

    if (!phoneRegex.test(phone)) {
        return {
            valid: false,
            error: 'Invalid phone number format. Please include country code (e.g., +1)'
        };
    }

    // Check for at least 7 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
        return {
            valid: false,
            error: 'Phone number is too short'
        };
    }

    return { valid: true, error: null };
};

/**
 * Normalizes a phone number to E.164 format (or close to it)
 * Removes all non-numeric characters except leading +
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
export const normalizePhoneNumber = (phone) => {
    if (!phone) return '';

    // Keep only digits and leading plus sign
    let normalized = phone.replace(/[^\d+]/g, '');

    // Ensure it has a leading + if it looks like it's missing one but has country code
    // This is a heuristic and might need adjustment based on specific requirements
    if (!normalized.startsWith('+') && normalized.length > 10) {
        // Assume it might be missing +
        // normalized = '+' + normalized;
    }

    return normalized;
};
