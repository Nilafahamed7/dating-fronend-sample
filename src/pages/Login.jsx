import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function Login() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Existing users always go to home, even if profile is incomplete
        // New signups are handled by ProtectedRoute
        navigate('/home', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="fixed inset-0 w-full bg-gradient-to-br from-velora-primary via-velora-secondary to-black flex items-center justify-center p-2 sm:p-3 md:p-4" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Animated background elements */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-64 h-64 bg-velora-primary/20 rounded-full blur-3xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Floating hearts */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`heart-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 30}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <HeartIcon className="w-8 h-8 text-velora-primary/30" />
        </motion.div>
      ))}

      <div className="w-full max-w-md mx-auto relative z-10 flex items-center justify-center" style={{ maxHeight: '100vh' }}>
        {/* Login Form */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-6 w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ maxHeight: 'calc(100vh - 0.5rem)' }}
          >
            <div className="text-center mb-3 sm:mb-4 md:mb-5">
              <motion.div
                key="logo"
                className="inline-block mb-1.5 sm:mb-2 md:mb-3"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ willChange: 'transform' }}
              >
                <HeartIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-velora-primary mx-auto" />
              </motion.div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black mb-0.5 sm:mb-1">
                Welcome Back
              </h2>
              <p className="text-gray-700 text-xs sm:text-sm md:text-base font-semibold">Sign in to continue your journey</p>
            </div>

            <div key="form">
              <LoginForm />
            </div>

            <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-gray-200 text-center">
              <p className="text-gray-700 text-xs sm:text-sm md:text-base font-medium">
                Don't have an account?{' '}
                <Link to="/signup" className="text-velora-primary font-bold hover:underline transition-all" style={{ color: '#FFCB2B' }}>
                  Sign up now
                </Link>
              </p>
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="mt-2 sm:mt-3 md:mt-4 inline-flex items-center justify-center w-full px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
              >
                Admin Login
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
