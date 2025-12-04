import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, LockClosedIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { profileService } from '../../services/profileService';
import { walletService } from '../../services/walletService';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentGate } from '../../hooks/usePaymentGate';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function UnlockPhotoModal({
  isOpen,
  onClose,
  photo,
  photoOwner,
  onUnlockSuccess
}) {
  const { user } = useAuth();
  const { refreshBalance } = usePaymentGate();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const coinCost = photo?.coinCost || 0;
  const photoId = photo?._id?.toString();

  useEffect(() => {
    if (isOpen) {
      loadBalance();
      // Lock body scroll
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore body scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isOpen]);

  const loadBalance = async () => {
    try {
      setLoadingBalance(true);
      const response = await walletService.getBalance();
      if (response.success) {
        setBalance(response.coins || 0);
      }
    } catch (error) {
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleConfirm = async () => {
    if (!photoId || loading) return;

    try {
      setLoading(true);
      toast.dismiss();

      const response = await profileService.unlockPrivatePhoto(photoId);

      if (response.success) {
        // Refresh balance
        await refreshBalance();

        // Show success message
        toast.success('Photo unlocked — enjoy!', {
          duration: 3000,
        });

        // Call success callback with unlocked photo URL (including signed URL data)
        if (onUnlockSuccess) {
          onUnlockSuccess({
            photoId: photoId,
            url: response.photo.url,
            expiresAt: response.photo.expiresAt,
            token: response.photo.token,
            coinsPaid: response.coinsPaid,
            remainingCoins: response.remainingCoins,
          });
        }

        // Update balance in modal
        setBalance(response.remainingCoins || 0);

        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || 'Failed to unlock photo';
      const requiredCoins = error.response?.data?.requiredCoins;
      const currentCoins = error.response?.data?.currentCoins;
      const status = error.response?.status;

      // Handle different error codes
      if (status === 402 || errorCode === 'insufficient_funds') {
        // Payment required - show buy coins flow
        toast.error(
          `Insufficient coins. You need ${requiredCoins} coins but only have ${currentCoins}.`,
          {
            duration: 5000,
            action: {
              label: 'Buy Coins',
              onClick: () => navigate('/wallet'),
            },
          }
        );
      } else if (status === 403 || errorCode === 'forbidden') {
        // Forbidden - owner viewing own photo, photo not private, etc.
        toast.error(errorMessage, {
          duration: 4000,
        });
      } else if (status === 429 || errorCode === 'rate_limited') {
        // Rate limited
        toast.error('Too many unlock attempts. Please try again later.', {
          duration: 4000,
        });
      } else {
        // Other errors
        toast.error(errorMessage, {
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasEnoughCoins = balance !== null && balance >= coinCost;
  const ownerName = photoOwner?.name || 'User';
  const ownerAvatar = photoOwner?.photos?.[0]?.url || null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4"
            style={{ top: 'var(--navbar-height, 64px)' }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="unlock-photo-title"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 id="unlock-photo-title" className="text-xl font-bold text-gray-900">
                  Unlock private photo
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Blurred Preview */}
                <div className="relative w-full aspect-[3/4] bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={photo?.url || ''}
                    alt="Private photo preview"
                    className="w-full h-full object-cover filter blur-[18px] scale-110"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <LockClosedIcon className="w-16 h-16 text-white/60" />
                  </div>
                </div>

                {/* Price */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full">
                    <BanknotesIcon className="w-5 h-5 text-yellow-600" />
                    <span className="text-lg font-bold text-yellow-900">
                      Unlock for {coinCost} coins
                    </span>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  {ownerAvatar ? (
                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {ownerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Photo owner</p>
                    <p className="font-semibold text-gray-900">{ownerName}</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Your balance</p>
                  {loadingBalance ? (
                    <p className="text-lg font-bold text-gray-900">Loading...</p>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">
                      {balance !== null ? `${balance} coins` : '0 coins'}
                    </p>
                  )}
                  {!hasEnoughCoins && balance !== null && (
                    <p className="text-sm text-red-600 mt-1">
                      You need {coinCost - balance} more coins
                    </p>
                  )}
                </div>

                {/* Microcopy */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    View this photo by paying {coinCost} coins to the owner. This unlock is temporary.
                  </p>
                  <p>All transactions are final.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !hasEnoughCoins || loadingBalance}
                  className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="w-5 h-5" />
                      <span>Confirm & Pay</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

