import { motion } from 'framer-motion';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

export default function LockedVideo({ thumbnailUrl, caption }) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/premium'); // Navigate to premium subscription page
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg overflow-hidden bg-gray-900 group cursor-pointer"
      onClick={handleUpgrade}
    >
      {/* Thumbnail or Placeholder */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Profile video"
          className="w-full h-auto object-cover opacity-50 group-hover:opacity-60 transition-opacity"
        />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <LockClosedIcon className="w-16 h-16 text-gray-600" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
              <LockClosedIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">
              Video for Premium Members Only
            </h3>
            <p className="text-gray-300 text-sm max-w-md">
              Upgrade to premium to view profile videos and unlock exclusive features
            </p>
          </div>

          {/* Upgrade Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleUpgrade();
            }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            <SparklesIcon className="w-5 h-5" />
            Upgrade to Premium
          </motion.button>
        </motion.div>
      </div>

      {/* Caption (if provided) */}
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm">{caption}</p>
        </div>
      )}
    </motion.div>
  );
}







