import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CalendarIcon, MapPinIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { safetyService } from '../../services/safetyService';
import toast from 'react-hot-toast';

export default function ShareDatePlanModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [formData, setFormData] = useState({
    dateId: '',
    location: '',
    time: '',
    companionName: '',
    companionProfileId: '',
    trustedContacts: [],
  });

  useEffect(() => {
    if (isOpen) {
      loadTrustedContacts();
    }
  }, [isOpen]);

  const loadTrustedContacts = async () => {
    try {
      const response = await safetyService.getTrustedContacts();
      if (response.success) {
        setTrustedContacts(response.trustedContacts || []);
      }
    } catch (error) {
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.time || !formData.companionName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await safetyService.shareDatePlan(formData);
      if (response.success) {
        toast.success('Date plan shared successfully');
        setFormData({
          dateId: '',
          location: '',
          time: '',
          companionName: '',
          companionProfileId: '',
          trustedContacts: [],
        });
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share date plan');
    } finally {
      setLoading(false);
    }
  };

  const handleContactToggle = (contactId) => {
    setFormData(prev => ({
      ...prev,
      trustedContacts: prev.trustedContacts.includes(contactId)
        ? prev.trustedContacts.filter(id => id !== contactId)
        : [...prev.trustedContacts, contactId]
    }));
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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col z-[10001]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-velora-primary" />
              <h2 className="text-xl font-bold text-gray-900">Share Date Plan</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Date ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date ID (Optional)
              </label>
              <input
                type="text"
                value={formData.dateId}
                onChange={(e) => setFormData(prev => ({ ...prev, dateId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="Enter date ID"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Companion Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Companion Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.companionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companionName: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                  placeholder="Enter companion name"
                />
              </div>
            </div>

            {/* Companion Profile ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Companion Profile ID (Optional)
              </label>
              <input
                type="text"
                value={formData.companionProfileId}
                onChange={(e) => setFormData(prev => ({ ...prev, companionProfileId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="Enter profile ID"
              />
            </div>

            {/* Trusted Contacts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Trusted Contacts
              </label>
              {trustedContacts.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No trusted contacts available. Add contacts first.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {trustedContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.trustedContacts.includes(contact.id)}
                        onChange={() => handleContactToggle(contact.id)}
                        className="w-4 h-4 text-velora-primary border-gray-300 rounded focus:ring-velora-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
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
                className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sharing...' : 'Share Plan'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

