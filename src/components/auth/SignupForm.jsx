import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import PasswordInput from './PasswordInput';
import SocialLogin from './SocialLogin';
import { GENDERS } from '../../utils/constants';
import { validatePhoneNumber, normalizePhoneNumber } from '../../utils/phoneValidation';
import toast from 'react-hot-toast';

export default function SignupForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Validate phone number (always required)
    if (!formData.phone || formData.phone.trim() === '') {
      toast.error('Phone number is required');
      return;
    }

    // Validate phone format
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error || 'Invalid phone number format');
      return;
    }

    // Normalize phone number
    try {
      const normalized = normalizePhoneNumber(formData.phone);
      setFormData({ ...formData, phone: normalized });
    } catch (error) {
      toast.error(error.message || 'Invalid phone number format');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { confirmPassword, ...signupData } = formData;

    // Format dateOfBirth to ISO string
    if (signupData.dateOfBirth) {
      signupData.dateOfBirth = new Date(signupData.dateOfBirth).toISOString();
    }

    // Phone is always required, keep it in signupData

    const result = await signup(signupData);

    if (result.success) {
      // Redirect to complete profile page immediately after signup
      navigate('/complete-profile', { replace: true });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={step === 1 ? handleStep1Submit : handleSubmit} className="space-y-3 sm:space-y-3.5 md:space-y-4 w-full" style={{ overflow: 'visible' }}>
      {step === 1 ? (
        <>
          <div>
            <label htmlFor="name" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field bg-gray-50 text-gray-900 placeholder-gray-400 py-2.5 sm:py-3 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:border-velora-primary focus:ring-2 focus:ring-velora-primary/20 transition-all w-full"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field bg-gray-50 text-gray-900 placeholder-gray-400 py-2.5 sm:py-3 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:border-velora-primary focus:ring-2 focus:ring-velora-primary/20 transition-all w-full"
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input-field bg-gray-50 text-gray-900 placeholder-gray-400 py-2.5 sm:py-3 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:border-velora-primary focus:ring-2 focus:ring-velora-primary/20 transition-all w-full"
              placeholder="+1234567890"
            />
            <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 mt-0.5 leading-tight mb-0">Include country code (e.g., +1 for US, +44 for UK)</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a strong password"
            />
            <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 mt-0.5 leading-tight mb-0">
              At least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
            />
          </div>

          <SocialLogin />

          <button type="submit" className="btn-primary w-full py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-base">
            Continue
          </button>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="dateOfBirth" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="input-field bg-gray-50 text-gray-900 py-2.5 sm:py-3 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:border-velora-primary focus:ring-2 focus:ring-velora-primary/20 transition-all w-full"
            />
            <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 mt-0.5 leading-tight mb-0">You must be at least 18 years old</p>
          </div>

          <div>
            <label htmlFor="gender" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="input-field bg-gray-50 text-gray-900 py-2.5 sm:py-3 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:border-velora-primary focus:ring-2 focus:ring-velora-primary/20 transition-all w-full"
            >
              <option value="">Select your gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-outline flex-1"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-base"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Sign Up'}
            </button>
          </div>
        </>
      )}

    </form>
  );
}

