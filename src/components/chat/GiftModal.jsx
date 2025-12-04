import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { publicService } from '../../services/publicService';
import { chatService } from '../../services/chatService';
import { walletService } from '../../services/walletService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

export default function GiftModal({ isOpen, onClose, matchId, onGiftSent }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [note, setNote] = useState('');
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadGifts();
      loadBalance();
    }
  }, [isOpen]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      const response = await publicService.getGifts();
      setGifts(response.gifts || []);
    } catch (error) {
      toast.error('Failed to load gifts');
      } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      setLoadingBalance(true);
      const response = await walletService.getBalance();
      setBalance(response.coins || 0);
    } catch (error) {
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Please select a gift');
      return;
    }

    const coinCost = selectedGift.metadata?.price || 50;
    if (balance < coinCost) {
      toast.error(`Insufficient coins! You need ${coinCost} coins but only have ${balance} coins.`);
      return;
    }

    try {
      setSending(true);
      await chatService.sendGift(matchId, selectedGift.title, note || undefined);
      toast.success('Gift sent successfully! 🎁');
      setSelectedGift(null);
      setNote('');
      await loadBalance(); // Refresh balance after sending
      onClose();
      if (onGiftSent) onGiftSent();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send gift';
      toast.error(errorMsg);
      await loadBalance(); // Refresh balance even on error
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Send a Gift 🎁</h2>
              {!loadingBalance && (
                <div className="flex items-center gap-2 mt-2">
                  <SparklesIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    Your balance: <span className="font-bold text-yellow-600">{balance.toLocaleString()} coins</span>
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : gifts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No gifts available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gifts.map((gift, index) => {
                  const coinCost = gift.metadata?.price || 50;
                  const isSelected = selectedGift?.title === gift.title;
                  const canAfford = balance >= coinCost;
                  const isDisabled = !canAfford;
                  const giftKey = gift._id || gift.id || `gift-${index}`;

                  return (
                    <motion.button
                      key={giftKey}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedGift(gift);
                        } else {
                          toast.error(`You need ${coinCost} coins but only have ${balance} coins`);
                        }
                      }}
                      disabled={isDisabled}
                      whileHover={!isDisabled ? { scale: 1.05, y: -5 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      className={`p-4 rounded-2xl border-2 transition-all relative ${
                        isDisabled
                          ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-pink-500 bg-pink-50 shadow-lg'
                          : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                      }`}
                    >
                      {isDisabled && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Insufficient
                        </div>
                      )}
                      <div className="mb-2 flex items-center justify-center h-16">
                        {gift.icon && (gift.icon.startsWith('http://') || gift.icon.startsWith('https://')) ? (
                          <img
                            src={gift.icon}
                            alt={gift.title}
                            className="max-w-full max-h-full object-contain"
                            style={{ maxWidth: '64px', maxHeight: '64px' }}
                          />
                        ) : (
                          <span className="text-4xl">{gift.icon || '🎁'}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">{gift.title}</p>
                      <p className={`text-xs font-semibold ${isDisabled ? 'text-red-600' : 'text-gray-600'}`}>
                        {coinCost} coins
                      </p>
                      {!canAfford && (
                        <p className="text-xs text-red-500 mt-1">Need {coinCost - balance} more</p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {selectedGift && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add a note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a message with your gift..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  rows="3"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{note.length}/200</p>
              </motion.div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-4">
            <div>
              {selectedGift && (
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-semibold text-gray-900">{selectedGift.title}</span>
                  <span className="ml-2 text-pink-600 font-bold">
                    ({(selectedGift.metadata?.price || 50)} coins)
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSendGift}
                disabled={!selectedGift || sending}
                whileHover={{ scale: selectedGift && !sending ? 1.05 : 1 }}
                whileTap={{ scale: selectedGift && !sending ? 0.95 : 1 }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedGift && !sending
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {sending ? 'Sending...' : 'Send Gift'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

