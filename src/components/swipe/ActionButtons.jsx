import { motion } from 'framer-motion';
import { XMarkIcon, HeartIcon, StarIcon, GiftIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ActionButtons({ onPass, onLike, onSuperlike, onGift, disabled }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.isPremium || false;
  const buttonVariants = {
    hover: {
      scale: 1.15,
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    },
    tap: { scale: 0.9 },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
    >
      <motion.button
        onClick={onPass}
        disabled={disabled}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 0.3 }}
        >
          <XMarkIcon className="w-8 h-8 text-red-500" />
        </motion.div>
      </motion.button>

      <motion.button
        onClick={onSuperlike}
        disabled={disabled}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        className="w-16 h-16 rounded-full bg-white border-4 border-blue-400 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title={isPremium ? 'Super Like (Premium - Free)' : 'Super Like (20 coins)'}
      >
        <motion.div
          animate={{ rotate: [0, 180, 360] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
        >
          <StarIcon className="w-8 h-8 text-blue-500" />
        </motion.div>
      </motion.button>

      <motion.button
        onClick={onLike}
        disabled={disabled}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        animate="pulse"
        className="w-20 h-20 rounded-full bg-velora-primary flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <HeartIcon className="w-10 h-10 text-white" />
        </motion.div>
      </motion.button>

      <motion.button
        onClick={() => {
          if (!isPremium) {
            toast.error('Sending gifts requires a premium subscription. Please subscribe first.');
            navigate('/subscriptions');
            return;
          }
          if (onGift) {
            onGift();
          }
        }}
        disabled={disabled}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        className={`w-16 h-16 rounded-full bg-white border-4 ${
          isPremium ? 'border-pink-400' : 'border-gray-300 opacity-60'
        } flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isPremium ? 'Send Gift (Premium)' : 'Send Gift - Premium Feature'}
      >
        <motion.div
          animate={isPremium ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <GiftIcon className={`w-8 h-8 ${isPremium ? 'text-pink-500' : 'text-gray-400'}`} />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

