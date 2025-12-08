import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import PasswordInput from './PasswordInput';
import SocialLogin from './SocialLogin';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(identifier, password, { suppressErrorToast: true });
    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Existing users always go to home, even if profile is incomplete
        // New signups are handled by ProtectedRoute
        navigate('/home', { replace: true });
      }
    } else if (result.error) {
      toast.error(result.error || 'Account or password is incorrect.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div>
        <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
          Email or Phone Number
        </label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="input-field bg-gray-50 text-gray-900 placeholder-gray-400"
          placeholder="you@example.com or +1234567890"
        />
        <p className="text-xs text-gray-500 mt-1">Login with your email address or phone number</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />
      </div>

      <div className="flex items-center justify-between">
        <Link to="/forgot-password" className="text-sm text-velora-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center"
      >
        {loading ? <LoadingSpinner size="sm" /> : 'Log In'}
      </button>

      <SocialLogin />
    </form>
  );
}
