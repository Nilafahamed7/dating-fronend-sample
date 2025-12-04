import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { app } from '../config/firebase';
import toast from 'react-hot-toast';

let recaptchaVerifier = null;
let recaptchaWidgetId = null;

/**
 * Initialize reCAPTCHA verifier
 * @param {string} containerId - ID of the container element for reCAPTCHA
 * @param {Function} callback - Callback function when reCAPTCHA is ready
 * @returns {Promise<RecaptchaVerifier>}
 */
export const initializeRecaptcha = async (containerId = 'recaptcha-container', callback) => {
  try {
    // Check if Firebase app is initialized
    if (!app) {
      throw new Error('Firebase is not initialized. Please check your Firebase configuration.');
    }

    // Verify Firebase configuration
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error('Firebase API key or Project ID is missing. Please check your .env file.');
    }

    + '...',
    });

    // Clean up existing verifier if any
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      recaptchaVerifier = null;
    }

    // Clean up container element if it exists and has reCAPTCHA rendered
    let container = document.getElementById(containerId);
    if (container) {
      // Remove any existing reCAPTCHA widgets
      const widgets = container.querySelectorAll('[id^="recaptcha"]');
      widgets.forEach(widget => {
        try {
          widget.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      // Clear container innerHTML to remove any rendered reCAPTCHA
      container.innerHTML = '';
    }

    const auth = getAuth(app);

    // Check if auth is available
    if (!auth) {
      throw new Error('Firebase Auth is not available. Please check your Firebase configuration.');
    }

    // Verify auth is properly configured
    if (!auth.app || !auth.app.options) {
      throw new Error('Firebase Auth configuration is invalid.');
    }

    // Create invisible reCAPTCHA verifier
    // Note: For invisible reCAPTCHA, we need to ensure the container exists
    if (!container) {
      // Create container if it doesn't exist
      container = document.createElement('div');
      container.id = containerId;
      container.style.display = 'none'; // Hide invisible reCAPTCHA
      document.body.appendChild(container);
    }

    // Try invisible reCAPTCHA first, fallback to normal if needed
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      callback: (response) => {
        if (callback) callback(response);
      },
      'expired-callback': () => {
        toast.error('reCAPTCHA expired. Please try again.');
        // Reset verifier
        if (recaptchaVerifier) {
          try {
            recaptchaVerifier.clear();
          } catch (e) {
            // Ignore cleanup errors
          }
          recaptchaVerifier = null;
        }
      },
      'error-callback': (error) => {
        toast.error('reCAPTCHA verification failed. Please try again.');
        // Reset verifier
        if (recaptchaVerifier) {
          try {
            recaptchaVerifier.clear();
          } catch (e) {
            // Ignore cleanup errors
          }
          recaptchaVerifier = null;
        }
      },
      });
    } catch (recaptchaError) {
      // Fallback to normal size reCAPTCHA if invisible fails
      if (container) {
        container.style.display = 'block'; // Show container for normal reCAPTCHA
      }
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: (response) => {
          if (callback) callback(response);
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please try again.');
          if (recaptchaVerifier) {
            try {
              recaptchaVerifier.clear();
            } catch (e) {
              // Ignore cleanup errors
            }
            recaptchaVerifier = null;
          }
        },
        'error-callback': (error) => {
          toast.error('reCAPTCHA verification failed. Please try again.');
          if (recaptchaVerifier) {
            try {
              recaptchaVerifier.clear();
            } catch (e) {
              // Ignore cleanup errors
            }
            recaptchaVerifier = null;
          }
        },
      });
    }

    // Render reCAPTCHA
    await recaptchaVerifier.render();
    recaptchaWidgetId = recaptchaVerifier.recaptchaWidgetId;

    return recaptchaVerifier;
    } catch (error) {
      // Handle specific Firebase errors
      if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
        throw new Error('SMS_VERIFICATION_NOT_CONFIGURED');
      } else if (error.code === 'auth/argument-error') {
        throw new Error('Invalid reCAPTCHA configuration. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and Firebase Console settings.');
      } else if (error.code === 'auth/app-not-authorized') {
        throw new Error('Firebase app is not authorized. Please check your Firebase configuration.');
      } else if (error.message?.includes('reCAPTCHA')) {
        throw new Error('reCAPTCHA verification failed. Please refresh the page and try again.');
      }

      throw new Error(`Failed to initialize reCAPTCHA: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Normalize phone number to E.164 format
 * @param {string} phone - Phone number input
 * @param {string} countryCode - Optional country code (e.g., '+1', '+44')
 * @returns {string} - Normalized phone number in E.164 format
 */
export const normalizePhoneNumber = (phone, countryCode = null) => {
  if (!phone) return '';

  // Remove all whitespace and non-digit characters except +
  let normalized = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Remove leading zeros if present (common in some countries)
  normalized = normalized.replace(/^\+?0+/, '');

  // If phone doesn't start with +, add country code
  if (!normalized.startsWith('+')) {
    if (countryCode) {
      // Ensure country code starts with +
      const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
      normalized = code + normalized;
    } else {
      // Default to +1 (US) if no country code provided
      normalized = '+1' + normalized;
    }
  }

  // Validate E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(normalized)) {
    throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)');
  }

  return normalized;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }

  try {
    const normalized = normalizePhoneNumber(phone);
    return { valid: true, normalized };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Send SMS OTP using Firebase Authentication
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {Promise<{ confirmationResult: any, success: boolean, error?: string }>}
 */
export const sendSMSOTP = async (phoneNumber) => {
  try {
    const auth = getAuth(app);

    // Verify Firebase configuration before proceeding
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error('Firebase configuration is missing. Please check your .env file.');
    }

    + '...');
    // Ensure reCAPTCHA is initialized
    if (!recaptchaVerifier) {
      // Try to initialize if not already done
      await initializeRecaptcha();
    }

    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized. Please refresh the page and try again.');
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    // Send OTP
    const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier);

    return {
      success: true,
      confirmationResult,
      phoneNumber: normalizedPhone,
    };
  } catch (error) {
    // Log the actual API response if available
    if (error.customData) {
      }
    if (error.serverResponse) {
      }

    // Handle specific Firebase errors
    let errorMessage = 'Failed to send OTP. Please try again.';

    if (error.code === 'auth/billing-not-enabled') {
      errorMessage = 'BILLING_NOT_ENABLED';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'TOO_MANY_REQUESTS';
      } else if (error.code === 'auth/invalid-app-credential') {
      errorMessage = 'INVALID_APP_CREDENTIAL';
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;

      // Verify API key matches expected value
      const expectedApiKey = 'AIzaSyDivrY3jA10HgNnfuHKXz38vIE9wcdTh5E';
      const apiKeyMatches = apiKey === expectedApiKey;

      + '...' : '❌ NOT SET',
        apiKeyFull: apiKey || 'NOT SET',
        apiKeyMatches: apiKeyMatches ? '✅ MATCHES' : '❌ DOES NOT MATCH',
        expectedApiKey: expectedApiKey,
        projectId: projectId || '❌ NOT SET',
        authDomain: authDomain || '❌ NOT SET',
        error: 'The Firebase API key or reCAPTCHA configuration is incorrect.',
        errorDetails: error.message || 'No additional details',
        commonCauses: [
          '1. Phone Authentication not enabled in Firebase Console',
          '2. Identity Toolkit API not enabled in Google Cloud Console',
          '3. API key has restrictions that block the request',
          '4. Project is not on Blaze plan (required for SMS)',
          '5. Authorized domains do not include localhost',
          '6. API key in .env does not match Firebase Console',
          '7. Changes not propagated yet (wait 5-10 minutes)'
        ],
        fixSteps: [
          '1. VERIFY API KEY: Go to Firebase Console → Project Settings → Your apps → Web app',
          `   → Check if API key matches: ${expectedApiKey}`,
          '   → If different, update VITE_FIREBASE_API_KEY in .env file',
          '2. Go to Firebase Console → Authentication → Sign-in method → Enable "Phone"',
          '3. Go to Google Cloud Console → APIs & Services → Enable "Identity Toolkit API"',
          '4. Go to Google Cloud Console → Credentials → Edit your API key',
          '   → Application restrictions: Set to "None" (for testing)',
          '   → API restrictions: Set to "Don\'t restrict key" (for testing)',
          '   → Click SAVE',
          '5. Go to Firebase Console → Authentication → Settings → Authorized domains',
          '   → Add "localhost" if not present',
          '6. Verify project is on Blaze plan (Firebase Console → Usage and billing)',
          '7. WAIT 5-10 MINUTES after making changes',
          '8. Clear browser cache completely (Ctrl+Shift+Delete)',
          '9. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)',
          '10. Restart your dev server if using .env file'
        ],
        links: {
          phoneAuth: `https://console.firebase.google.com/project/${projectId}/authentication/providers`,
          identityToolkit: `https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=${projectId}`,
          apiKey: `https://console.cloud.google.com/apis/credentials?project=${projectId}`,
          authorizedDomains: `https://console.firebase.google.com/project/${projectId}/authentication/settings`,
          projectSettings: `https://console.firebase.google.com/project/${projectId}/settings/general`
        }
      });

      // Additional check: verify API key in Firebase app config
      if (app && app.options) {
        const appApiKey = app.options.apiKey;
        + '...' : 'NOT SET');
        if (appApiKey !== expectedApiKey) {
          }
      }
    } else if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Invalid phone number format. Please check and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMessage = 'SMS quota exceeded. Please try again later or contact support.';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'auth/app-not-authorized') {
      errorMessage = 'App not authorized. Please contact support.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Reset reCAPTCHA on error
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      recaptchaVerifier = null;
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
    };
  }
};

/**
 * Verify SMS OTP code
 * @param {any} confirmationResult - Confirmation result from sendSMSOTP
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<{ success: boolean, userCredential?: any, error?: string }>}
 */
export const verifySMSOTP = async (confirmationResult, code) => {
  try {
    if (!confirmationResult) {
      throw new Error('Verification session expired. Please request a new OTP.');
    }

    if (!code || code.length !== 6) {
      throw new Error('Please enter a valid 6-digit code.');
    }

    // Verify OTP
    const userCredential = await confirmationResult.confirm(code);

    return {
      success: true,
      userCredential,
    };
  } catch (error) {
    // Handle specific Firebase errors
    let errorMessage = 'Invalid verification code. Please try again.';

    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Invalid verification code. Please check and try again.';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'Verification code has expired. Please request a new code.';
    } else if (error.code === 'auth/session-expired') {
      errorMessage = 'Verification session expired. Please request a new OTP.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
    };
  }
};

/**
 * Get Firebase ID token from user credential
 * @param {any} userCredential - User credential from verifySMSOTP
 * @returns {Promise<string>} - Firebase ID token
 */
export const getFirebaseIdToken = async (userCredential) => {
  try {
    if (!userCredential || !userCredential.user) {
      throw new Error('Invalid user credential');
    }

    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch (error) {
    throw new Error('Failed to get authentication token');
  }
};

/**
 * Clean up reCAPTCHA verifier
 */
export const cleanupRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // Ignore cleanup errors
    }
    recaptchaVerifier = null;
    recaptchaWidgetId = null;
  }

  // Also clean up the container element
  const container = document.getElementById('recaptcha-container');
  if (container) {
    try {
      // Remove any reCAPTCHA widgets
      const widgets = container.querySelectorAll('[id^="recaptcha"]');
      widgets.forEach(widget => {
        try {
          widget.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      container.innerHTML = '';
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

/**
 * Reset reCAPTCHA (useful for resend scenarios)
 */
export const resetRecaptcha = async () => {
  cleanupRecaptcha();
  // Re-initialize will happen on next sendSMSOTP call
};

