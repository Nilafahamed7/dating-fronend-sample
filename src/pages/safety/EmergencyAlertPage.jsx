import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/common/PageContainer';
import { safetyService } from '../../services/safetyService';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function EmergencyAlertPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendAlert = async () => {
    setSending(true);
    try {
      let locationData = {};

      // Try to get user's location
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (error) {
          }
      }

      const response = await safetyService.sendEmergencyAlert({
        ...locationData,
        message: 'Need help immediately!',
      });

      if (response.success) {
        toast.success('Emergency alert sent to trusted contacts');
        setShowConfirmModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send emergency alert');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Alert</h1>
          <p className="text-gray-600">Send an immediate alert to your trusted contacts</p>
        </div>

        {/* Warning Box */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Important Information</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>This will send an alert to all your trusted contacts</li>
                <li>Your location will be shared if available</li>
                <li>Only use this in genuine emergencies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="text-center">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
          >
            SEND EMERGENCY ALERT
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-[10001]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-900">Confirm Emergency Alert</h2>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  Are you sure you want to send an emergency alert? This will notify all your trusted contacts immediately.
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendAlert}
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send Alert'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </PageContainer>
  );
}

