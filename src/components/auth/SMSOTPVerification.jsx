import { useState, useEffect, useRef, useCallback } from 'react';
import {
  sendSMSOTP,
  verifySMSOTP,
  getFirebaseIdToken,
  initializeRecaptcha,
  cleanupRecaptcha,
  resetRecaptcha,
  validatePhoneNumber,
  normalizePhoneNumber
} from '../../services/firebaseSMSService';
import { authService } from '../../services/authService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { logFirebaseDiagnostics } from '../../utils/firebaseDiagnostics';

export default function SMSOTPVerification({ phoneNumber, signupData = null, onVerified, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const recaptchaContainerRef = useRef(null);
  const resendTimerRef = useRef(null);
  const inputRefs = useRef([]);

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    let isMounted = true;

    const initRecaptcha = async () => {
      try {
        // Clean up any existing reCAPTCHA first
        cleanupRecaptcha();

        // Create a hidden container for reCAPTCHA if it doesn't exist
        let container = document.getElementById('recaptcha-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'recaptcha-container';
          container.style.position = 'fixed';
          container.style.top = '-9999px';
          container.style.left = '-9999px';
          container.style.visibility = 'hidden';
          container.style.width = '0';
          container.style.height = '0';
          document.body.appendChild(container);
        } else {
          // Clear any existing content
          container.innerHTML = '';
        }

        // Wait a bit to ensure container is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted) return;

        await initializeRecaptcha('recaptcha-container');
        if (isMounted) {
          }
      } catch (error) {
        if (!isMounted) return;

        if (error.message === 'SMS_VERIFICATION_NOT_CONFIGURED' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
          toast.error('SMS verification is not configured. Please use email verification instead.', {
            duration: 5000,
          });
          // Optionally, call onBack to let user switch to email
          if (onBack) {
            setTimeout(() => {
              onBack();
            }, 2000);
          }
        } else if (error.message?.includes('already been rendered')) {
          // If already rendered, try to clean up and reinitialize
          cleanupRecaptcha();
          // Don't show error, just log it
        } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network')) {
          // Network error - might be temporary, don't show error immediately
          } else {
          toast.error('Failed to initialize security verification. Please refresh the page.');
        }
      }
    };

    initRecaptcha();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
      }
      cleanupRecaptcha();
    };
  }, []);

  // Send OTP on mount
  useEffect(() => {
    if (phoneNumber) {
      // Mask phone number for display
      const normalized = normalizePhoneNumber(phoneNumber);
      const masked = normalized.slice(0, 3) + '****' + normalized.slice(-4);
      setPhoneDisplay(masked);

      // Send OTP automatically
      handleSendOTP();
    }
  }, [phoneNumber]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
      }
    }

    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
      }
    };
  }, [resendCooldown]);

  const handleSendOTP = useCallback(async () => {
    if (!phoneNumber) {
      toast.error('Phone number is required');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Validate phone number
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Reset reCAPTCHA if needed
      cleanupRecaptcha();
      // Wait a bit before reinitializing
      await new Promise(resolve => setTimeout(resolve, 200));
      await initializeRecaptcha('recaptcha-container');

      // Send OTP
      const result = await sendSMSOTP(validation.normalized);

      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setResendCooldown(30); // 30 second cooldown
        toast.success('OTP sent successfully! Check your phone.');

        // Clear previous OTP
        setOtp(['', '', '', '', '', '']);

        // Focus first input after a short delay
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        // Check if it's a billing error
        if (result.code === 'auth/billing-not-enabled' || result.error?.includes('billing-not-enabled') || result.error === 'BILLING_NOT_ENABLED') {
          const billingError = new Error('BILLING_NOT_ENABLED');
          billingError.code = 'auth/billing-not-enabled';
          throw billingError;
        }
        // Check if it's an invalid app credential error
        if (result.code === 'auth/invalid-app-credential' || result.error?.includes('invalid-app-credential') || result.error === 'INVALID_APP_CREDENTIAL') {
          const credentialError = new Error('INVALID_APP_CREDENTIAL');
          credentialError.code = 'auth/invalid-app-credential';
          throw credentialError;
        }
        // Check if it's a rate limit error
        if (result.code === 'auth/too-many-requests' || result.error?.includes('too-many-requests') || result.error === 'TOO_MANY_REQUESTS') {
          const rateLimitError = new Error('TOO_MANY_REQUESTS');
          rateLimitError.code = 'auth/too-many-requests';
          throw rateLimitError;
        }
        throw new Error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      let errorMessage = error.message || 'Failed to send OTP. Please try again.';

      // Provide helpful guidance for configuration errors
      if (error.message === 'SMS_VERIFICATION_NOT_CONFIGURED' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
        errorMessage = 'SMS verification is not configured. Please use email verification instead.';
        toast.error('SMS verification is not available. Please go back and select email verification.', {
          duration: 5000,
        });
        // Optionally, call onBack to let user switch to email
        if (onBack) {
          setTimeout(() => {
            onBack();
          }, 2000);
        }
      } else if (error.code === 'auth/too-many-requests' || error.message === 'TOO_MANY_REQUESTS') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        toast.error('Too many SMS requests. Please wait 5-10 minutes before trying again.', {
          duration: 5000,
        });
      } else if (error.message === 'INVALID_APP_CREDENTIAL' || error.code === 'auth/invalid-app-credential' || error.message?.includes('invalid-app-credential')) {
        errorMessage = 'Firebase configuration error. Please check your Firebase project settings.';

        // Log diagnostics to help debug
        logFirebaseDiagnostics();

        toast.error(
          <div className="text-left">
            <p className="font-semibold">Firebase Configuration Error</p>
            <p className="text-sm mt-1">Your Firebase API key or reCAPTCHA settings don't match.</p>
            <p className="text-sm mt-1 font-semibold">Critical Steps (Check Console for Details):</p>
            <ol className="text-sm mt-1 list-decimal list-inside space-y-1">
              <li>Go to Firebase Console → Authentication → Sign-in method → Enable "Phone"</li>
              <li>Go to Google Cloud Console → APIs → Enable "Identity Toolkit API"</li>
              <li>Go to Google Cloud Console → Credentials → Edit API key → Remove restrictions</li>
              <li>Verify project is on Blaze plan (required for SMS)</li>
              <li>Wait 5-10 minutes after changes, then clear cache and retry</li>
            </ol>
            <p className="text-sm mt-2 font-semibold text-red-600">Check browser console for detailed diagnostics.</p>
            <p className="text-sm mt-2">Or use email verification instead (no billing required).</p>
          </div>,
          {
            duration: 20000,
            icon: '⚠️',
          }
        );
        // Redirect to email verification after delay
        if (onBack) {
          setTimeout(() => {
            onBack();
          }, 10000);
        }
      } else if (error.message === 'BILLING_NOT_ENABLED' || error.code === 'auth/billing-not-enabled' || error.message?.includes('billing-not-enabled')) {
        errorMessage = 'SMS verification requires a paid Firebase plan. Please use email verification instead.';
        toast.error(
          'SMS verification requires a paid Firebase plan. Please go back and select email verification instead.',
          {
            duration: 8000,
            icon: '⚠️',
          }
        );
        // Redirect to email verification after delay
        if (onBack) {
          setTimeout(() => {
            onBack();
          }, 3000);
        }
      } else if (error.message?.includes('Phone Authentication is not enabled')) {
        errorMessage = 'SMS verification is not configured. Please use email verification instead or contact support.';
        toast.error(errorMessage);
      } else if (error.message?.includes('Firebase')) {
        errorMessage = 'SMS verification is temporarily unavailable. Please use email verification instead.';
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }

      setError(errorMessage);

      // Clear confirmation result on error
      setConfirmationResult(null);
    } finally {
      setSending(false);
    }
  }, [phoneNumber, onBack]);

  const handleResend = async () => {
    if (resendCooldown > 0) {
      return;
    }

    await handleSendOTP();
  };

  const handleChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '');
    if (digit.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData.length === 6) {
      const newOtp = pastedData.split('').slice(0, 6);
      setOtp(newOtp);
      setError('');

      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    if (!confirmationResult) {
      setError('Verification session expired. Please request a new code.');
      toast.error('Verification session expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP with Firebase
      const verifyResult = await verifySMSOTP(confirmationResult, otpCode);

      if (verifyResult.success) {
        // Get Firebase ID token
        const idToken = await getFirebaseIdToken(verifyResult.userCredential);

        // Exchange Firebase token with backend for app session
        try {
          const exchangeResult = await authService.exchangeFirebaseToken(idToken, phoneNumber, signupData);

          if (exchangeResult.success) {
            // Store token and user data
            localStorage.setItem('token', exchangeResult.data.token);
            localStorage.setItem('user', JSON.stringify(exchangeResult.data.user));

            toast.success('Phone verified successfully!');

            // Call onVerified callback
            if (onVerified) {
              onVerified();
            }
          } else {
            throw new Error(exchangeResult.message || 'Failed to create session');
          }
        } catch (exchangeError) {
          throw new Error(exchangeError.response?.data?.message || 'Failed to complete verification. Please try again.');
        }
      } else {
        throw new Error(verifyResult.error || 'Invalid verification code');
      }
    } catch (error) {
      const errorMessage = error.message || 'Invalid verification code. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);

      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full flex flex-col items-center justify-center">
      <div className="text-center w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-velora-darkGray mb-2">
          Verify your phone number
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-1">
          We sent a 6-digit code to <strong>{phoneDisplay || phoneNumber}</strong>
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs sm:text-sm text-velora-primary hover:underline mt-2"
          >
            Change number
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center" onPaste={handlePaste}>
        <div className="flex justify-center gap-2 sm:gap-3 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary transition-all"
              aria-label={`OTP digit ${index + 1}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center w-full" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || sending}
          className="btn-primary w-full flex items-center justify-center py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>

        <div className="text-center w-full space-y-2">
          <p className="text-xs sm:text-sm text-gray-500">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || sending}
            className="text-xs sm:text-sm text-velora-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              'Sending...'
            ) : resendCooldown > 0 ? (
              `Resend code in ${resendCooldown}s`
            ) : (
              'Resend code'
            )}
          </button>
        </div>
      </form>

      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} style={{ display: 'none' }} />

      {/* Error message with email verification option */}
      {error && error.includes('INVALID_APP_CREDENTIAL') && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-semibold mb-2">
            SMS Verification Not Available
          </p>
          <p className="text-sm text-yellow-700 mb-3">
            Firebase Phone Authentication requires additional configuration. Please use email verification instead.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-yellow-800 underline hover:text-yellow-900 font-medium"
            >
              ← Go back and select Email Verification
            </button>
          )}
        </div>
      )}
    </div>
  );
}

