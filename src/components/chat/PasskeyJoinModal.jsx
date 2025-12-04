import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, KeyIcon } from '@heroicons/react/24/outline';
import { groupChatService } from '../../services/groupChatService';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function PasskeyJoinModal({ isOpen, onClose, groupId, groupName, onJoinSuccess, navigateToChat = true }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passkey.trim()) {
      toast.error('Passkey is required');
      return;
    }

    try {
      setLoading(true);
      const response = await groupChatService.joinGroup(groupId, passkey.trim());

      if (response.success) {
        toast.success('Successfully joined the group!');

        // Call success callback if provided
        onJoinSuccess?.();

        // Navigate to group chat if enabled (default: true)
        if (navigateToChat && response.data?._id) {
          // Small delay to ensure socket events are processed
          setTimeout(() => {
            navigate(`/chat/group/${response.data._id}`);
          }, 300);
        }

        handleClose();
      }
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || 'Failed to join group';

      if (errorCode === 'INVALID_PASSKEY') {
        toast.error('Invalid passkey. Please try again.');
      } else if (errorCode === 'PASSKEY_REQUIRED') {
        toast.error('This group requires a passkey to join.');
      } else if (errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Premium membership required to join groups. Please upgrade.', { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasskey('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl w-full max-w-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Join Group</h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              <strong>{groupName}</strong> requires a passkey to join.
            </p>
            {!user?.isPremium && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mt-2">
                Note: Non-premium users can join with a passkey, but premium is required to send messages.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passkey" className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-4 h-4" />
                  Enter Passkey
                </div>
              </label>
              <input
                type="password"
                id="passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary"
                placeholder="Enter the group passkey"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !passkey.trim()}
                className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Joining...
                  </>
                ) : (
                  'Join Group'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

