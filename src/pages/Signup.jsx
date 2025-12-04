import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SignupForm from '../components/auth/SignupForm';
import { SparklesIcon } from '@heroicons/react/24/solid';

export default function Signup() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fix viewport height for mobile browsers
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="w-full bg-gradient-to-br from-velora-primary via-velora-secondary to-black relative"
      style={{
        height: '100%',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        padding: '0',
        margin: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      {/* Animated background elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-72 h-72 bg-velora-primary/20 rounded-full blur-3xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, Math.random() * 150 - 75, 0],
            y: [0, Math.random() * 150 - 75, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Floating sparkles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 20}%`,
            top: `${5 + i * 15}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SparklesIcon className="w-10 h-10 text-velora-primary/40" />
        </motion.div>
      ))}

      <div className="w-full max-w-xl lg:max-w-2xl mx-auto relative z-10 px-3 sm:px-4 md:px-6 flex items-center justify-center" style={{ width: '100%', margin: '0 auto', paddingTop: 'env(safe-area-inset-top, 1rem)', paddingBottom: '1rem', maxHeight: 'calc(100vh - 2rem)', overflow: 'visible', minHeight: 'calc(100vh - 2rem)' }}>
        {/* Signup Form */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-3 sm:p-4 md:p-6 w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ overflow: 'visible', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
          >
            <div className="text-center mb-1.5 sm:mb-2 md:mb-3">
              <motion.div
                key="logo"
                className="inline-block mb-0.5 sm:mb-1"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ willChange: 'transform' }}
              >
                <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-velora-primary mx-auto" />
              </motion.div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-black mb-0.5 sm:mb-1">
                Join Velora
              </h2>
              <p className="text-gray-700 text-xs sm:text-sm md:text-base font-semibold">Create your account and start matching</p>
            </div>

            <div key="form">
              <SignupForm />
            </div>

            <div className="mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 md:mt-3 md:pt-3 border-t border-gray-200 text-center">
              <p className="text-gray-700 font-medium text-[9px] sm:text-[10px] md:text-xs">
                Already have an account?{' '}
                <Link to="/login" className="text-velora-primary font-bold hover:underline transition-all" style={{ color: '#FFCB2B' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
