/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();
  
  // Must start with +
  if (!trimmed.startsWith('+')) {
    return { valid: false, error: 'Phone number must include country code (e.g., +1234567890)' };
  }

  // E.164 format: + followed by 1-15 digits
  const e164Pattern = /^\+[1-9]\d{1,14}$/;
  if (!e164Pattern.test(trimmed)) {
    return { valid: false, error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)' };
  }

  return { valid: true };
};

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  // Remove leading zeros after country code
  normalized = normalized.replace(/^\+0+/, '+');

  return normalized;
};



