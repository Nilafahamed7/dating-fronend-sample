import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getPlaceholderImage } from '../../utils/helpers';
import { profileService } from '../../services/profileService';
import PrivatePhotoOverlay from '../photos/PrivatePhotoOverlay';
import UnlockPhotoModal from '../photos/UnlockPhotoModal';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PhotoCarousel({ photos, profileUserId, profileOwner }) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [unlockedPhotos, setUnlockedPhotos] = useState(new Map()); // Map of photoId -> photoUrl
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const placeholderImg = getPlaceholderImage(400, 600, 'No Photo');

  // Track which photos have been unlocked and their URLs
  useEffect(() => {
    const paidPhotos = new Map();
    photos.forEach(photo => {
      if (photo.isPaid && photo._id && photo.url) {
        paidPhotos.set(photo._id.toString(), photo.url);
      }
    });
    setUnlockedPhotos(prev => {
      // Merge with existing unlocked photos
      const merged = new Map(prev);
      paidPhotos.forEach((url, id) => merged.set(id, url));
      return merged;
    });
  }, [photos]);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No photos</span>
      </div>
    );
  }

  const nextPhoto = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(index);
  };

  const handleUnlockClick = (photo) => {
    setSelectedPhoto(photo);
    setShowUnlockModal(true);
  };

  const handleUnlockSuccess = (unlockData) => {
    // Add to unlocked photos with the URL and expiration
    // Store expiration info for session management
    const unlockInfo = {
      url: unlockData.url,
      expiresAt: unlockData.expiresAt,
      token: unlockData.token,
    };

    setUnlockedPhotos(prev => {
      const updated = new Map(prev);
      updated.set(unlockData.photoId.toString(), unlockInfo);
      return updated;
    });

    // Check expiration periodically and remove expired unlocks
    if (unlockData.expiresAt) {
      const timeUntilExpiry = unlockData.expiresAt - Date.now();
      if (timeUntilExpiry > 0) {
        setTimeout(() => {
          setUnlockedPhotos(prev => {
            const updated = new Map(prev);
            updated.delete(unlockData.photoId.toString());
            return updated;
          });
        }, timeUntilExpiry);
      }
    }

    setShowUnlockModal(false);
    setSelectedPhoto(null);
  };

  const currentPhoto = photos[currentIndex];
  const photoId = currentPhoto?._id?.toString();
  const isPrivate = currentPhoto?.privacy === 'private';
  const coinCost = currentPhoto?.coinCost || 0;
  const isPremium = user?.isPremium || false;
  const isOwner = user?._id && profileUserId && user._id.toString() === profileUserId.toString();

  // Get the photo URL - use unlocked URL if available, otherwise use original
  // For private unpaid photos, we still show the URL (blurred) for the blur effect
  const unlockInfo = photoId && unlockedPhotos.has(photoId) ? unlockedPhotos.get(photoId) : null;

  // Check if unlock has expired (must be calculated before it's used)
  const isUnlockExpired = unlockInfo && typeof unlockInfo === 'object' && unlockInfo.expiresAt
    ? Date.now() > unlockInfo.expiresAt
    : false;

  // Check if photo is paid: owner, premium user (free), marked as paid in backend OR unlocked in this session (and not expired)
  const backendIsPaid = currentPhoto?.isPaid === true;
  const sessionUnlocked = photoId && unlockedPhotos.has(photoId) && !isUnlockExpired;
  // Premium users can view private photos for free
  const isPaid = isOwner || isPremium || backendIsPaid || sessionUnlocked;

  // Use backend's requiresPayment flag if available, otherwise calculate it
  // Require payment if: private photo, has coin cost (> 0), NOT owner, NOT premium, and NOT paid
  const requiresPayment = (currentPhoto?.requiresPayment === true ||
    (isPrivate === true && coinCost > 0 && isPaid === false)) && !isOwner && !isPremium;

  const photoUrl = unlockInfo && !isUnlockExpired
    ? (typeof unlockInfo === 'string' ? unlockInfo : unlockInfo.url) // Handle both old string format and new object format
    : (currentPhoto?.url || placeholderImg);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="relative w-full h-full"
          initial={{
            opacity: 0,
            scale: 1.2,
            x: 100,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.8,
            x: -100,
          }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
        >
          {/* Photo with blur if private and not paid */}
          <img
            src={photoUrl}
            alt={`Photo ${currentIndex + 1}`}
            className={`w-full h-full object-cover ${
              requiresPayment ? 'blur-2xl' : ''
            }`}
            style={{
              filter: requiresPayment ? 'blur(20px)' : 'none',
            }}
            onError={(e) => {
              if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
                e.target.src = placeholderImg;
              }
            }}
          />

          {/* Payment Overlay for Private Photos */}
          {requiresPayment && (
            <PrivatePhotoOverlay
              coinCost={coinCost}
              onUnlock={() => handleUnlockClick(currentPhoto)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <>
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevPhoto(e);
            }}
            whileHover={{ scale: 1.15, x: -3 }}
            whileTap={{ scale: 0.85 }}
            className="absolute left-1 sm:left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white flex items-center justify-center shadow-2xl border-2 border-white/20 transition-all touch-manipulation"
            aria-label="Previous photo"
          >
            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" strokeWidth={3} />
          </motion.button>
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextPhoto(e);
            }}
            whileHover={{ scale: 1.15, x: 3 }}
            whileTap={{ scale: 0.85 }}
            className="absolute right-1 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white flex items-center justify-center shadow-2xl border-2 border-white/20 transition-all touch-manipulation"
            aria-label="Next photo"
          >
            <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" strokeWidth={3} />
          </motion.button>

          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {photos.map((_, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={(e) => goToPhoto(index, e)}
                className={`h-2 rounded-full ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                initial={false}
                animate={{
                  width: index === currentIndex ? 32 : 8,
                  opacity: index === currentIndex ? 1 : 0.5,
                  scale: index === currentIndex ? 1.2 : 1,
                }}
                whileHover={{
                  scale: 1.5,
                  y: -2
                }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              />
            ))}
          </motion.div>
        </>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && selectedPhoto && (
        <UnlockPhotoModal
          isOpen={showUnlockModal}
          onClose={() => {
            setShowUnlockModal(false);
            setSelectedPhoto(null);
          }}
          photo={selectedPhoto}
          photoOwner={profileOwner || { _id: profileUserId }}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}
    </div>
  );
}

