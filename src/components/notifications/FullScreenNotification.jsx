import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

export default function FullScreenNotification({ notification, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Prevent body scroll when notification is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Send opened receipt when modal is displayed
  useEffect(() => {
    if (notification?.broadcastId && user?._id) {
      const deviceId = localStorage.getItem('deviceId') || `device-${user._id}-${Date.now()}`;
      if (!localStorage.getItem('deviceId')) {
        localStorage.setItem('deviceId', deviceId);
      }

        // Send opened receipt
        notificationService.sendDeliveryReceipt(notification.broadcastId, deviceId, 'opened')
          .catch(err => {
            // Error handling for delivery receipt
          });
      }
  }, [notification, user]);

  const handleAction = () => {
    if (notification?.deepLink) {
      navigate(notification.deepLink);
    }
    onClose();
  };

  if (!notification) return null;

  const isBroadcast = notification.type === 'broadcast';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`${isBroadcast ? 'bg-gradient-to-r from-velora-primary to-velora-secondary' : 'bg-gray-800'} p-6 relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <BellAlertIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isBroadcast ? '📢 Broadcast' : 'Notification'}
                </h2>
                <p className="text-white/80 text-sm">Just now</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Image */}
            {notification.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={notification.imageUrl}
                  alt={notification.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {notification.title}
            </h3>

            {/* Message */}
            <p className="text-gray-700 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
              {notification.body}
            </p>

            {/* Action Button */}
            {notification.deepLink && notification.deepLink !== '/' && (
              <button
                onClick={handleAction}
                className="w-full py-3 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                View Details
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

