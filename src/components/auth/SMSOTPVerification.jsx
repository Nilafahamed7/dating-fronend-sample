import { useState } from 'react';
import toast from 'react-hot-toast';
import { normalizePhoneNumber } from '../../utils/phoneValidation';

/**
 * SMS OTP Verification component (Firebase removed)
 * This component is now a stub that redirects users to use email verification
 */
export default function SMSOTPVerification({ phoneNumber, signupData = null, onVerified, onBack }) {
  const [phoneDisplay, setPhoneDisplay] = useState('');

  // Show error message on mount
  useState(() => {
    if (phoneNumber) {
      const normalized = normalizePhoneNumber(phoneNumber);
      const masked = normalized.slice(0, 3) + '****' + normalized.slice(-4);
      setPhoneDisplay(masked);
    }

    toast.error('SMS verification is not available. Please use email verification instead.', {
      duration: 5000,
    });

    // Call onBack after a short delay to redirect to email verification
    if (onBack) {
      setTimeout(() => {
        onBack();
      }, 2000);
    }
  });

  return (
    <div className="space-y-6 w-full flex flex-col items-center justify-center">
      <div className="text-center w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-velora-darkGray mb-2">
          SMS Verification Not Available
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          SMS verification has been disabled. Please use email verification instead.
        </p>
        {phoneDisplay && (
          <p className="text-sm text-gray-500 mb-4">
            Phone number: <strong>{phoneDisplay}</strong>
          </p>
        )}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="btn-primary px-6 py-2 text-sm sm:text-base"
          >
            ← Go back to Email Verification
          </button>
        )}
      </div>
    </div>
  );
}
