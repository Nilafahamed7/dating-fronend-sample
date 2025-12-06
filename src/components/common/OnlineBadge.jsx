import { motion } from 'framer-motion';

export default function OnlineBadge({ isOnline, size = 'md', className = '' }) {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const ringSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div 
      className={`absolute top-1 right-1 z-30 ${className}`}
      role="status"
      aria-label="Online now"
      title="Online now"
    >
      {/* Outer ring with pulse animation */}
      <motion.div
        className={`absolute ${ringSizeClasses[size]} rounded-full bg-green-500/30`}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.5, 0, 0.5],
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
      
      {/* Inner solid dot */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-[#25D366] border-2 border-white shadow-lg`}
        style={{
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
}




