import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { XMarkIcon, PhotoIcon, LockClosedIcon, LockOpenIcon, SparklesIcon, BanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function PhotoUpload({ photos = [], onUpload, onDelete, onPrivacyChange, maxPhotos = 6 }) {
  const [dragging, setDragging] = useState(false);
  const [uploadPrivacy, setUploadPrivacy] = useState('public');
  const [coinCost, setCoinCost] = useState(0);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPrivacy, setPendingPrivacy] = useState('public');
  const [showPrivacyCoinModal, setShowPrivacyCoinModal] = useState(false);
  const [pendingPhotoId, setPendingPhotoId] = useState(null);
  const [pendingNewPrivacy, setPendingNewPrivacy] = useState('public');
  const [privacyCoinCost, setPrivacyCoinCost] = useState(0);
  const [showPrivacyConfirmModal, setShowPrivacyConfirmModal] = useState(false);
  const [pendingPrivacyChange, setPendingPrivacyChange] = useState(null);
  const isProcessingRef = useRef(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      if (uploadPrivacy === 'private') {
        // Show coin cost modal for private photos
        setPendingFile(file);
        setPendingPrivacy('private');
        // Scroll to top first, then show modal
        window.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => {
          setShowCoinModal(true);
        }, 100);
      } else {
        // Upload public photo directly
        onUpload(file, 'public', 0);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      if (uploadPrivacy === 'private') {
        // Show coin cost modal for private photos
        setPendingFile(file);
        setPendingPrivacy('private');
        // Scroll to top first, then show modal
        window.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => {
          setShowCoinModal(true);
        }, 100);
      } else {
        // Upload public photo directly
        onUpload(file, 'public', 0);
      }
    }
  };

  const handleConfirmCoinCost = () => {
    if (pendingFile && coinCost >= 1) {
      onUpload(pendingFile, pendingPrivacy, coinCost);
      setShowCoinModal(false);
      setPendingFile(null);
      setCoinCost(0);
      setUploadPrivacy('public'); // Reset to public for next upload
    }
  };

  // Set default coin cost when modal opens
  useEffect(() => {
    if (showCoinModal) {
      if (coinCost === 0) {
        setCoinCost(1); // Default to 1 coin
      }
      // Lock body scroll and ensure modal is visible
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';

      // Scroll to top to ensure modal is visible in center
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, [showCoinModal]);

  // Lock body scroll when privacy coin modal is open
  useEffect(() => {
    if (showPrivacyCoinModal) {
      if (privacyCoinCost === 0) {
        setPrivacyCoinCost(1); // Default to 1 coin
      }
      // Lock body scroll and ensure modal is visible
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';

      // Scroll to top to ensure modal is visible in center
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, [showPrivacyCoinModal]);

  // Lock body scroll when privacy confirm modal is open
  useEffect(() => {
    if (showPrivacyConfirmModal) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, [showPrivacyConfirmModal]);

  const handleCancelCoinModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowCoinModal(false);
    setPendingFile(null);
    setCoinCost(0);
    setUploadPrivacy('public');
  };

  const handleConfirmPrivacyCoinCost = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
    }

    // Prevent multiple clicks
    if (isProcessingRef.current) {
      return;
    }

    if (pendingPhotoId !== null && privacyCoinCost >= 1) {
      isProcessingRef.current = true;

      // Close modal first to prevent any form interaction
      setShowPrivacyCoinModal(false);
      const photoId = pendingPhotoId;
      const privacy = pendingNewPrivacy;
      const cost = privacyCoinCost;
      setPendingPhotoId(null);
      setPrivacyCoinCost(0);

      // Call the handler after a small delay to ensure modal is closed and form is not affected
      setTimeout(async () => {
        try {
          await onPrivacyChange(photoId, privacy, cost);
        } catch (error) {
          } finally {
          isProcessingRef.current = false;
        }
      }, 200);
    }
  };

  const handleCancelPrivacyCoinModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowPrivacyCoinModal(false);
    setPendingPhotoId(null);
    setPrivacyCoinCost(0);
  };

  const handlePrivacyButtonClick = (e, photo, index) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
    }

    // Prevent if already processing
    if (isProcessingRef.current) {
      return;
    }

    const newPrivacy = photo.privacy === 'private' ? 'public' : 'private';
    const currentCoinCost = photo.coinCost || 0;

    // Store the pending change
    setPendingPrivacyChange({
      photoId: photo._id || index,
      currentPrivacy: photo.privacy,
      newPrivacy: newPrivacy,
      currentCoinCost: currentCoinCost
    });

    // Show confirmation modal first
    setShowPrivacyConfirmModal(true);
  };

  const handleConfirmPrivacyChange = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
    }

    // Prevent multiple clicks
    if (isProcessingRef.current) {
      return;
    }

    if (!pendingPrivacyChange) return;

    isProcessingRef.current = true;
    const { photoId, newPrivacy, currentCoinCost } = pendingPrivacyChange;

    // Close confirmation modal first
    setShowPrivacyConfirmModal(false);
    const changeData = {
      photoId,
      newPrivacy,
      coinCost: newPrivacy === 'private' ? currentCoinCost : 0
    };
    setPendingPrivacyChange(null);

    // If changing to private and no coin cost set, show coin cost modal
    if (newPrivacy === 'private' && currentCoinCost === 0) {
      setPendingPhotoId(photoId);
      setPendingNewPrivacy('private');
      setPrivacyCoinCost(0);
      // Small delay to ensure modal is closed
      setTimeout(() => {
        setShowPrivacyCoinModal(true);
        isProcessingRef.current = false;
      }, 200);
    } else {
      // Directly change privacy (public or already has coin cost)
      // Use longer setTimeout to prevent form submission and ensure modal is fully closed
      setTimeout(async () => {
        try {
          // Ensure body scroll is restored
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.documentElement.style.overflow = '';

          // Call the handler - this should NOT cause navigation
          await onPrivacyChange(changeData.photoId, changeData.newPrivacy, changeData.coinCost);
        } catch (error) {
          } finally {
          isProcessingRef.current = false;
        }
      }, 500);
    }
  };

  const handleCancelPrivacyConfirm = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
    }
    setShowPrivacyConfirmModal(false);
    setPendingPrivacyChange(null);
    isProcessingRef.current = false;
  };

  return (
    <div className="space-y-4">
      {/* Privacy Change Confirmation Modal */}
      {showPrivacyConfirmModal && pendingPrivacyChange && createPortal(
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCancelPrivacyConfirm(e);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            margin: 0,
            padding: '1rem',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '28rem',
              padding: '0 1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full p-5 sm:p-6 md:p-8 relative border-2 border-purple-100"
              style={{
                maxHeight: '85vh',
                overflowY: 'auto',
                margin: 0,
                position: 'relative'
              }}
            >
              {/* Close button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelPrivacyConfirm(e);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 bg-white/80 backdrop-blur-sm shadow-md"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Header */}
              <div className="relative z-10 text-center mb-4 sm:mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 rounded-full mb-2 sm:mb-3 shadow-2xl relative mx-auto"
                >
                  {pendingPrivacyChange.newPrivacy === 'private' ? (
                    <LockClosedIcon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white z-10" />
                  ) : (
                    <LockOpenIcon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white z-10" />
                  )}
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2 px-2"
                >
                  Change Photo Privacy?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs sm:text-sm text-gray-600 px-2 leading-relaxed"
                >
                  {pendingPrivacyChange.newPrivacy === 'private'
                    ? 'This photo will be private. Users will need to pay coins to view it.'
                    : 'This photo will be public. Everyone will be able to see it.'}
                </motion.p>
              </div>

              {/* Action buttons */}
              <div className="relative z-10 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelPrivacyConfirm(e);
                  }}
                  className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm sm:text-base rounded-xl transition-colors shadow-md"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmPrivacyChange(e);
                  }}
                  className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 hover:from-purple-600 hover:via-pink-600 hover:to-yellow-500 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative z-10 flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Confirm
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}

      {/* Coin Cost Modal for New Upload - Centered Modal */}
      {showCoinModal && createPortal(
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCancelCoinModal(e);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            margin: 0,
            padding: '1rem',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '28rem',
              padding: '0 1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full p-5 sm:p-6 md:p-8 relative border-2 border-purple-100"
              style={{
                maxHeight: '85vh',
                overflowY: 'auto',
                margin: 0,
                position: 'relative'
              }}
            >
              {/* Animated gradient background */}
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(251, 191, 36, 0.15) 100%)',
                    'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(251, 191, 36, 0.15) 50%, rgba(168, 85, 247, 0.15) 100%)',
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(251, 191, 36, 0.15) 100%)',
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 right-0 h-40"
              />

              {/* Floating sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 200 - 100,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <SparklesIcon className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}

              {/* Close button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelCoinModal(e);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 bg-white/80 backdrop-blur-sm shadow-md"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Header */}
              <div className="relative z-10 text-center mb-4 sm:mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 rounded-full mb-2 sm:mb-3 shadow-2xl relative mx-auto"
                >
                  <BanknotesIcon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white z-10" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-3 sm:border-4 border-yellow-400/30"
                  />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2 px-2"
                >
                  Set Coin Cost
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs sm:text-sm text-gray-600 px-2 leading-relaxed"
                >
                  How many coins should users pay to view this private photo?
                </motion.p>
              </div>

              {/* Coin input */}
              <div className="relative z-10 mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Coin Cost
                </label>
                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  className="relative"
                >
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 z-10">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-500" />
                    </motion.div>
                    <span className="text-xs sm:text-sm text-gray-600 font-semibold hidden sm:inline">Coins</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={coinCost || ''}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      setCoinCost(value);
                    }}
                    onKeyDown={(e) => {
                      // Prevent Enter key from submitting the form
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleConfirmCoinCost(e);
                      }
                    }}
                    className="w-full pl-16 sm:pl-24 md:pl-28 pr-3 sm:pr-4 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold border-2 border-purple-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 sm:focus:ring-3 focus:ring-purple-300 focus:border-purple-500 transition-all bg-gradient-to-r from-purple-50 to-pink-50"
                    placeholder="1"
                    autoFocus
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex items-start gap-2 p-2 sm:p-2.5 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-200"
                >
                  <LockClosedIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-700 font-medium leading-relaxed">
                    Users will need to pay <span className="font-bold text-purple-900">{coinCost || 1}</span> coin{coinCost !== 1 ? 's' : ''} to unlock this photo
                  </p>
                </motion.div>
              </div>

              {/* Action buttons */}
              <div className="relative z-10 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelCoinModal(e);
                  }}
                  className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm sm:text-base rounded-xl transition-colors shadow-md"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmCoinCost(e);
                  }}
                  disabled={!coinCost || coinCost < 1}
                  className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 hover:from-purple-600 hover:via-pink-600 hover:to-yellow-500 text-white font-bold text-sm sm:text-base rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative z-10 flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="whitespace-nowrap">Confirm & Upload</span>
                  </motion.span>
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}

      {/* Coin Cost Modal for Privacy Change */}
      {showPrivacyCoinModal && createPortal(
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCancelPrivacyCoinModal(e);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            margin: 0,
            padding: '1rem',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '28rem',
              padding: '0 1rem'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full p-5 sm:p-6 md:p-8 relative border-2 border-purple-100"
              style={{
                maxHeight: '85vh',
                overflowY: 'auto',
                margin: 0,
                position: 'relative'
              }}
            >
              {/* Animated gradient background */}
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(251, 191, 36, 0.15) 100%)',
                    'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(251, 191, 36, 0.15) 50%, rgba(168, 85, 247, 0.15) 100%)',
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(251, 191, 36, 0.15) 100%)',
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 right-0 h-40"
              />

              {/* Floating sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 200 - 100,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <SparklesIcon className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}

              {/* Close button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelPrivacyCoinModal(e);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 bg-white/80 backdrop-blur-sm shadow-md"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Header */}
              <div className="relative z-10 text-center mb-4 sm:mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 rounded-full mb-2 sm:mb-3 shadow-2xl relative mx-auto"
                >
                  <LockClosedIcon className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white z-10" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-3 sm:border-4 border-yellow-400/30"
                  />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2 px-2"
                >
                  Set Private Photo Price
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs sm:text-sm text-gray-600 px-2 leading-relaxed"
                >
                  How many coins should users pay to view this private photo?
                </motion.p>
              </div>

              {/* Coin input */}
              <div className="relative z-10 mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Coin Cost
                </label>
                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  className="relative"
                >
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 z-10">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-500" />
                    </motion.div>
                    <span className="text-xs sm:text-sm text-gray-600 font-semibold hidden sm:inline">Coins</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={privacyCoinCost || ''}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      setPrivacyCoinCost(value);
                    }}
                    onKeyDown={(e) => {
                      // Prevent Enter key from submitting the form
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleConfirmPrivacyCoinCost(e);
                      }
                    }}
                    className="w-full pl-16 sm:pl-24 md:pl-28 pr-3 sm:pr-4 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold border-2 border-purple-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 sm:focus:ring-3 focus:ring-purple-300 focus:border-purple-500 transition-all bg-gradient-to-r from-purple-50 to-pink-50"
                    placeholder="1"
                    autoFocus
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex items-start gap-2 p-2 sm:p-2.5 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-200"
                >
                  <LockClosedIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-700 font-medium leading-relaxed">
                    Users will need to pay <span className="font-bold text-purple-900">{privacyCoinCost || 1}</span> coin{privacyCoinCost !== 1 ? 's' : ''} to unlock this photo
                  </p>
                </motion.div>
              </div>

              {/* Action buttons */}
              <div className="relative z-10 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelPrivacyCoinModal(e);
                  }}
                  className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm sm:text-base rounded-xl transition-colors shadow-md"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmPrivacyCoinCost(e);
                  }}
                  disabled={!privacyCoinCost || privacyCoinCost < 1}
                  className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 hover:from-purple-600 hover:via-pink-600 hover:to-yellow-500 text-white font-bold text-sm sm:text-base rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative z-10 flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Confirm
                  </motion.span>
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
        {photos.map((photo, index) => (
          <motion.div
            key={photo._id || index}
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -5, rotateY: 5 }}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-xl hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-purple-300"
          >
            <img
              src={photo.url || URL.createObjectURL(photo)}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Animated gradient overlay on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            />
            {/* Shine effect on hover */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
            />
            {onDelete && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(photo._id || index);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </motion.button>
            )}
            {onPrivacyChange && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handlePrivacyButtonClick(e, photo, index)}
                className={`absolute top-2 left-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg ${photo.privacy === 'private'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  : 'bg-green-500/90 hover:bg-green-600 text-white'
                  }`}
                title={photo.privacy === 'private' ? `Private - ${photo.coinCost || 0} coins to view` : 'Public - Everyone can see'}
              >
                {photo.privacy === 'private' ? (
                  <LockClosedIcon className="w-4 h-4" />
                ) : (
                  <LockOpenIcon className="w-4 h-4" />
                )}
              </motion.button>
            )}
            {photo.isPrimary && (
              <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                <SparklesIcon className="w-3 h-3" />
                Primary
              </div>
            )}
            {photo.privacy === 'private' && (
              <div className="absolute bottom-2 right-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                <LockClosedIcon className="w-3 h-3" />
                {photo.coinCost > 0 ? (
                  <span className="flex items-center gap-1">
                    <BanknotesIcon className="w-3 h-3" />
                    {photo.coinCost}
                  </span>
                ) : (
                  'Private'
                )}
              </div>
            )}
          </motion.div>
        ))}

        {photos.length < maxPhotos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: photos.length * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="aspect-[3/4] rounded-2xl border-3 border-dashed flex flex-col items-center justify-center overflow-hidden group relative bg-gradient-to-br from-gray-50 to-gray-100"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all relative ${dragging
                ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 via-purple-50 to-pink-50 scale-105 shadow-2xl'
                : 'border-gray-300 hover:border-yellow-400 hover:bg-gradient-to-br hover:from-yellow-50/70 hover:via-purple-50/70 hover:to-pink-50/70'
                }`}
            >
              {/* Animated background gradient */}
              <motion.div
                animate={{
                  background: dragging
                    ? [
                      'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(168, 85, 247, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)',
                      'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(251, 191, 36, 0.2) 50%, rgba(168, 85, 247, 0.2) 100%)',
                      'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(168, 85, 247, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)',
                    ]
                    : 'linear-gradient(135deg, rgba(251, 191, 36, 0) 0%, rgba(168, 85, 247, 0) 50%, rgba(236, 72, 153, 0) 100%)'
                }}
                transition={{ duration: 2, repeat: dragging ? Infinity : 0, ease: "easeInOut" }}
                className="absolute inset-0"
              />

              {/* Pulsing ring effect */}
              {dragging && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 border-4 border-yellow-400 rounded-2xl"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center relative z-10">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, -5, 0] }}
                  whileTap={{ scale: 0.9 }}
                  className="mb-4 relative"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(251, 191, 36, 0.4)',
                          '0 0 0 20px rgba(251, 191, 36, 0)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                    />
                    <PhotoIcon className="w-16 h-16 text-gray-400 group-hover:text-yellow-500 transition-colors relative z-10" />
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                      transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="absolute -top-2 -right-2"
                    >
                      <SparklesIcon className="w-8 h-8 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </div>
                </motion.div>
                <motion.span
                  animate={dragging ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: dragging ? Infinity : 0 }}
                  className="text-base font-bold text-gray-700 group-hover:text-gray-900 text-center px-2 mb-1 transition-colors"
                >
                  {dragging ? 'Drop Photo Here!' : 'Add Photo'}
                </motion.span>
                <span className="text-xs text-gray-500 group-hover:text-gray-700 text-center px-2 font-medium">
                  Drag & drop or click to upload
                </span>
              </label>

              {/* Privacy selector */}
              <div className="flex flex-col gap-3 mt-6 w-full px-4 relative z-10">
                <div className="flex gap-2 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUploadPrivacy('public');
                      setCoinCost(0);
                    }}
                    className={`px-5 py-2.5 text-xs font-bold rounded-full transition-all flex items-center gap-2 shadow-md ${uploadPrivacy === 'public'
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg ring-2 ring-yellow-300'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`} >
                    <LockOpenIcon className="w-4 h-4" />
                    Public
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUploadPrivacy('private');
                    }}
                    className={`px-5 py-2.5 text-xs font-bold rounded-full transition-all flex items-center gap-2 shadow-md ${uploadPrivacy === 'private'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg ring-2 ring-purple-300'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    <LockClosedIcon className="w-4 h-4" />
                    Private
                  </motion.button>
                </div>
                {uploadPrivacy === 'private' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-full bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-xl p-4 border-2 border-purple-200 shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <BanknotesIcon className="w-5 h-5 text-purple-600" />
                      </motion.div>
                      <span className="text-xs font-bold text-purple-700">
                        Set coin cost when uploading
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 leading-relaxed">
                      You'll be asked to set the coin cost after selecting your photo
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

