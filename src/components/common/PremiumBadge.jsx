import { motion } from 'framer-motion';

/**
 * PremiumBadge - A reusable component for displaying premium user badges
 *
 * @param {Object} props
 * @param {boolean} props.isPremium - Whether the user is premium
 * @param {string} props.placement - Placement: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'inline'
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 */
export default function PremiumBadge({
  isPremium,
  placement = 'inline',
  size = 'md',
  className = ''
}) {
  if (!isPremium) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const placementClasses = {
    'top-left': 'absolute top-2 left-2 z-20',
    'top-right': 'absolute top-2 right-2 z-20',
    'bottom-left': 'absolute bottom-2 left-2 z-20',
    'bottom-right': 'absolute bottom-2 right-2 z-20',
    'inline': 'inline-flex',
  };

  const badge = (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
      className={`
        ${placementClasses[placement]}
        ${sizeClasses[size]}
        inline-flex items-center gap-1.5
        bg-gradient-to-r from-velora-primary to-velora-secondary
        text-black font-bold rounded-full shadow-lg
        border-2 border-white/50 backdrop-blur-sm
        ${className}
      `}
      role="status"
      aria-label="Premium member"
      title="Premium member"
    >
      {/* Crown Icon */}
      <svg
        className={iconSizes[size]}
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
      </svg>
      <span>Premium</span>
    </motion.div>
  );

  return badge;
}

