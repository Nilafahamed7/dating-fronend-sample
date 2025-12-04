import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { emailOTPService } from '../../services/emailOTPService';
import toast from 'react-hot-toast';

export default function EmailOTPVerification({
  email,
  purpose = 'verification',
  onVerify,
  onCancel,
  onResend
}) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    if (expiresIn > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(expiresIn);
        setExpiresIn(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresIn]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setCode(newCode);
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleVerify = async (otpCode = null) => {
    const otp = otpCode || code.join('');
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await emailOTPService.verifyOTP(email, otp, purpose);
      if (response.success) {
        toast.success('OTP verified successfully');
        if (onVerify) {
          onVerify(otp);
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      toast.error(message);
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await emailOTPService.resendOTP(email, purpose);
      if (response.success) {
        toast.success('OTP resent successfully');
        setExpiresIn(response.expiresIn || 300);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        if (onResend) {
          onResend();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <EnvelopeIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to <span className="font-semibold">{email}</span>
        </p>
      </div>

      {/* Timer */}
      {expiresIn > 0 && (
        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>Code expires in {formatTime(expiresIn)}</span>
        </div>
      )}

      {/* OTP Input */}
      <div className="mb-6">
        <div className="flex gap-2 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-velora-primary focus:ring-2 focus:ring-velora-primary/20 transition-all"
              disabled={loading}
            />
          ))}
        </div>
      </div>

      {/* Error/Status Messages */}
      {expiresIn === 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">OTP expired. Please request a new code.</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => handleVerify()}
          disabled={loading || code.some(d => !d) || expiresIn === 0}
          className="w-full px-4 py-3 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleResend}
            disabled={resendLoading || expiresIn > 240} // Can resend after 1 minute
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </div>

      {/* Help Text */}
      <p className="mt-4 text-xs text-center text-gray-500">
        Didn't receive the code? Check your spam folder or try resending.
      </p>
    </div>
  );
}

