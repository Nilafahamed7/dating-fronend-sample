import { useState } from 'react';
import { motion } from 'framer-motion';
import PrivatePhotoOverlay from './PrivatePhotoOverlay';
import UnlockPhotoModal from './UnlockPhotoModal';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PrivatePhoto Component
 * Displays a photo with blur overlay if it's private and not unlocked
 * Handles unlock flow with modal
 */
export default function PrivatePhoto({
  photo,
  photoOwner,
  className = '',
  style = {},
  alt = 'Photo',
  unlockedPhotos = new Map(), // Map of photoId -> photoUrl for session unlocks
  onUnlockSuccess, // Callback when photo is unlocked
  children, // Optional children to render inside
}) {
  const { user } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const photoId = photo?._id?.toString();
  const isPrivate = photo?.privacy === 'private';
  const coinCost = photo?.coinCost || 0;
  const isOwner = user?._id && photoOwner?._id && user._id.toString() === photoOwner._id.toString();
  const isPremium = user?.isPremium || false;

  // Check if photo is unlocked: owner, premium user (free), backend says paid, or session unlocked
  const backendIsPaid = photo?.isPaid === true;
  const sessionUnlocked = photoId && unlockedPhotos.has(photoId);
  // Premium users can view private photos for free
  const isUnlocked = isOwner || isPremium || backendIsPaid || sessionUnlocked;

  // Determine if payment is required (not for owners, not for premium users)
  const requiresPayment = isPrivate && coinCost > 0 && !isUnlocked && !isPremium;

  // Get photo URL - use unlocked URL if available
  const photoUrl = (photoId && unlockedPhotos.has(photoId))
    ? unlockedPhotos.get(photoId)
    : (photo?.url || '');

  const handleUnlockClick = () => {
    if (!requiresPayment || isUnlocking) return;
    setShowUnlockModal(true);
  };

  const handleUnlockSuccess = (unlockData) => {
    setIsUnlocking(false);
    if (onUnlockSuccess) {
      onUnlockSuccess(unlockData);
    }
  };

  return (
    <>
      <div className={`relative ${className}`} style={style}>
        {/* Photo */}
        <img
          src={photoUrl}
          alt={alt}
          className={`w-full h-full object-cover ${
            requiresPayment ? 'blur-[18px]' : ''
          }`}
          style={{
            filter: requiresPayment ? 'blur(18px)' : 'none',
            transform: requiresPayment ? 'scale(1.1)' : 'none',
          }}
        />

        {/* Blur overlay and unlock CTA */}
        {requiresPayment && (
          <PrivatePhotoOverlay
            coinCost={coinCost}
            onUnlock={handleUnlockClick}
            isUnlocking={isUnlocking}
          />
        )}

        {/* Optional children */}
        {children}
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <UnlockPhotoModal
          isOpen={showUnlockModal}
          onClose={() => {
            setShowUnlockModal(false);
            setIsUnlocking(false);
          }}
          photo={photo}
          photoOwner={photoOwner}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}
    </>
  );
}

