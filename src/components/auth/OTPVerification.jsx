import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function OTPVerification({ identifier, method = 'email', onVerified }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const { verifyOTP } = useAuth();

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(identifier, otpCode, method);
    if (result.success && onVerified) {
      onVerified();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      await authService.resendOTP(identifier, method);
      toast.success(`OTP resent! Check your ${method === 'email' ? 'email' : 'phone'}.`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 w-full flex flex-col items-center justify-center">
      <div className="text-center w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-velora-darkGray mb-2">
          Verify your {method === 'email' ? 'email' : 'phone'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          We sent a 6-digit code to <strong>{identifier}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center">
        <div className="flex justify-center gap-2 sm:gap-3 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-transparent"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center py-2 sm:py-3 text-sm sm:text-base"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Verify'}
        </button>

        <div className="text-center w-full">
          <button
            type="button"
            onClick={handleResend}
            className="text-xs sm:text-sm text-velora-primary hover:underline"
          >
            Resend code
          </button>
        </div>
      </form>
    </div>
  );
}

