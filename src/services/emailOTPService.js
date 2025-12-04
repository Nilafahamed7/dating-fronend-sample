import api from './api';

export const emailOTPService = {
  /**
   * Send email OTP
   */
  sendOTP: async (email, purpose = 'verification') => {
    const response = await api.post('/auth/email-otp/send', {
      email,
      purpose,
    });
    return response.data;
  },

  /**
   * Verify email OTP
   */
  verifyOTP: async (email, code, purpose = 'verification') => {
    const response = await api.post('/auth/email-otp/verify', {
      email,
      code,
      purpose,
    });
    return response.data;
  },

  /**
   * Resend email OTP
   */
  resendOTP: async (email, purpose = 'verification') => {
    const response = await api.post('/auth/email-otp/resend', {
      email,
      purpose,
    });
    return response.data;
  },
};

