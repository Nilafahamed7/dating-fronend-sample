import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function NavBar({ title, showBack = false, rightAction, leftAction }) {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-velora-primary/20 shadow-lg overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        width: '100%',
        maxWidth: '100%',
        height: 'var(--top-navbar-height, 64px)',
        maxHeight: 'var(--top-navbar-height, 64px)',
        minHeight: 'var(--top-navbar-height, 64px)',
        overflow: 'hidden',
        transform: 'translateZ(0) translateY(0)',
        visibility: 'visible',
        opacity: 1,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        transition: 'none', // Prevent layout shifts during route changes
      }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-velora-primary/15 via-transparent to-velora-primary/15 opacity-70 pointer-events-none" />

      {/* Shimmer effect - contained within navbar */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-velora-primary/30 to-transparent pointer-events-none"
        style={{
          width: '100%',
          willChange: 'transform',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'linear',
        }}
      />

      <div className="relative z-10 flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center flex-1 min-w-0">
          {leftAction && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mr-3"
            >
              {leftAction}
            </motion.div>
          )}
          {showBack && (
            <motion.button
              onClick={() => {
                // Smooth scroll to top before navigating back
                window.scrollTo({ top: 0, behavior: 'instant' });
                navigate(-1);
              }}
              whileHover={{ scale: 1.1, x: -3 }}
              whileTap={{ scale: 0.92 }}
              className="mr-3 p-2 -ml-2 hover:bg-velora-primary/10 rounded-full transition-all duration-200 group relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            >
              <ArrowLeftIcon className="w-6 h-6 text-velora-darkGray group-hover:text-velora-primary transition-colors duration-200" />
              <motion.div
                className="absolute inset-0 rounded-full bg-velora-primary/20"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.5, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          )}
          {title && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 min-w-0"
            >
              {typeof title === 'string' ? (
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-black via-velora-darkGray to-black bg-clip-text text-transparent">
                  {title}
                </h1>
              ) : (
                title
              )}
            </motion.div>
          )}
        </div>

        {rightAction && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            {rightAction}
          </motion.div>
        )}
      </div>

      {/* Bottom border glow effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-velora-primary/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />
    </nav>
  );
}

