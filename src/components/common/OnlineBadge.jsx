import { motion, AnimatePresence } from 'framer-motion';

export default function OnlineBadge({ isOnline, size = 'md', className = '', placement = 'top-left' }) {

  const placementClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  const textSizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <AnimatePresence>
      {isOnline && (
        <motion.div
          key="online-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={`absolute ${placementClasses[placement]} z-30 ${className}`}
          role="status"
          aria-label="Online now"
          title="Online now"
        >
          {/* Online Pill with green dot and text */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md border border-green-100">
            {/* Green dot with pulse animation */}
            <motion.div
              className={`${dotSizeClasses[size]} rounded-full bg-[#25D366] relative`}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Pulse ring */}
              <motion.div
                className={`absolute inset-0 ${dotSizeClasses[size]} rounded-full bg-[#25D366]`}
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </motion.div>
            
            {/* Online text */}
            <span className={`${textSizeClasses[size]} font-semibold text-gray-800 whitespace-nowrap`}>
              Online
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}






