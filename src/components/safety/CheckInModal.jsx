import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { safetyService } from '../../services/safetyService';
import toast from 'react-hot-toast';

export default function CheckInModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [dateId, setDateId] = useState('');
  const [status, setStatus] = useState('safe');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateId.trim()) {
      toast.error('Please enter a date ID');
      return;
    }

    setLoading(true);
    try {
      const response = await safetyService.checkIn({ dateId: dateId.trim(), status });
      if (response.success) {
        toast.success('Check-in recorded');
        setDateId('');
        setStatus('safe');
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record check-in');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            <h2 className="text-xl font-bold text-gray-900">Date Check-in</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={dateId}
                onChange={(e) => setDateId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="Enter date ID"
              />
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Check-in Status <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                  style={{ borderColor: status === 'safe' ? '#10b981' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    name="status"
                    value="safe"
                    checked={status === 'safe'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-5 h-5 text-green-500 border-gray-300 focus:ring-green-500"
                  />
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">I am safe</p>
                    <p className="text-sm text-gray-500">Everything is going well</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-red-50"
                  style={{ borderColor: status === 'alert' ? '#ef4444' : '#e5e7eb' }}
                >
                  <input
                    type="radio"
                    name="status"
                    value="alert"
                    checked={status === 'alert'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-5 h-5 text-red-500 border-gray-300 focus:ring-red-500"
                  />
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Send alert</p>
                    <p className="text-sm text-gray-500">I need help immediately</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                  status === 'alert'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {loading ? 'Recording...' : 'Record Check-in'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

