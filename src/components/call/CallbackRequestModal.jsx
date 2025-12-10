import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { callService } from '../../services/callService';
import toast from 'react-hot-toast';
import { getPlaceholderImage } from '../../utils/helpers';

export const CallbackRequestModal = ({ isOpen, onClose, callbackRequest }) => {
  const [processing, setProcessing] = useState(false);

  if (!callbackRequest) return null;

  const handleAccept = async () => {
    try {
      setProcessing(true);
      const response = await callService.acceptCallback(callbackRequest.callbackId);

      if (response.success) {
        toast.success('Callback accepted. Initiating call...');
        onClose();
        // The call will be initiated automatically by the backend
        // The incoming-call event will be received and handled by CallContext
      } else {
        toast.error(response.message || 'Failed to accept callback');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept callback');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      const response = await callService.rejectCallback(callbackRequest.callbackId);

      if (response.success) {
        toast.success('Callback request rejected');
        onClose();
      } else {
        toast.error(response.message || 'Failed to reject callback');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject callback');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Callback Request</h2>
              <button
                onClick={onClose}
                disabled={processing}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <div className="mb-4">
                <img
                  src={callbackRequest.fromUserAvatar || getPlaceholderImage(80, 80, callbackRequest.fromUserName)}
                  alt={callbackRequest.fromUserName}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-velora-primary"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {callbackRequest.fromUserName || 'User'} wants to talk to you
              </h3>
              <p className="text-gray-600">
                {callbackRequest.message || 'They tried to call you while you were busy.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PhoneIcon className="w-5 h-5" />
                    Accept Call
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};















