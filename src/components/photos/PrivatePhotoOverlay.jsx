import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function PrivatePhotoOverlay({ coinCost, onUnlock, isUnlocking = false }) {
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-10 rounded-lg overflow-hidden">
      <motion.button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUnlocking && onUnlock) {
            onUnlock();
          }
        }}
        disabled={isUnlocking}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: isUnlocking ? 1 : 1.05 }}
        whileTap={{ scale: isUnlocking ? 1 : 0.95 }}
        aria-label={`Unlock photo for ${coinCost} coins`}
      >
        <LockClosedIcon className="w-5 h-5" />
        <span>Unlock • {coinCost} coins</span>
      </motion.button>
    </div>
  );
}






