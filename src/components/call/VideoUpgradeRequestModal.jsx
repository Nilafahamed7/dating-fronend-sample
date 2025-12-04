import { motion, AnimatePresence } from 'framer-motion';
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const VideoUpgradeRequestModal = ({
  isOpen,
  onClose,
  requesterName,
  requesterAvatar,
  onAccept,
  onDecline,
  onDeclineOneWay,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Avatar */}
            <div className="relative mx-auto mb-6">
              {requesterAvatar ? (
                <img
                  src={requesterAvatar}
                  alt={requesterName}
                  className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-blue-500/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto ring-4 ring-blue-500/20">
                  <span className="text-3xl font-bold text-white">
                    {requesterName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-3 shadow-lg">
                <VideoCameraIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Video Request
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-4">
              <span className="font-semibold text-gray-900">{requesterName || 'User'}</span> wants to turn this into a video call.
            </p>

            {/* Coin rate info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Video call rate:</span>
                <span className="text-lg font-bold text-blue-600">40 coins/min</span>
              </div>
              <p className="text-xs text-gray-600">
                Coins will be deducted from male user only. Current voice rate: 20 coins/min.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <motion.button
                onClick={onAccept}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                Accept (Two-way video)
              </motion.button>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => onDeclineOneWay && onDeclineOneWay()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  View Only
                </motion.button>
                <motion.button
                  onClick={onDecline}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                >
                  Decline
                </motion.button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                "View Only" lets you see their video without sharing yours
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

