import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, HeartIcon, ChatBubbleLeftIcon, GiftIcon, StarIcon } from '@heroicons/react/24/solid';
import { calculateAge, calculateDistance, calculateMatchPercentage, getPlaceholderImage } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentGate } from '../../hooks/usePaymentGate';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { matchService } from '../../services/matchService';
import { profileService } from '../../services/profileService';
import PhotoCarousel from '../swipe/PhotoCarousel';
import PremiumBadge from '../common/PremiumBadge';
import OnlineBadge from '../common/OnlineBadge';

export default function ProfileGridCard({ profile, currentUserLocation, onAction, index, isOnline = false }) {
  const { user } = useAuth();
  const { isPremium, hasSufficientCoins, ACTION_COSTS } = usePaymentGate();
  const navigate = useNavigate();
  const [unlockedSinglePhoto, setUnlockedSinglePhoto] = useState(false);
  const [unlockedPhotoUrl, setUnlockedPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  // Check if user is owner
  const isOwner = user?._id && (profile.userId?._id || profile.userId || profile._id) &&
    user._id.toString() === (profile.userId?._id || profile.userId || profile._id).toString();

  // Check if user has already liked or superliked this profile
  const currentAction = profile?.currentAction || null;
  const hasLiked = currentAction === 'like' || currentAction === 'superlike';

  const age = calculateAge(profile.dob || profile.dateOfBirth);
  const distance = profile.location?.coordinates && currentUserLocation
    ? calculateDistance(
        currentUserLocation.lat,
        currentUserLocation.lng,
        profile.location.coordinates[1],
        profile.location.coordinates[0]
      )
    : profile.distance || null;

  const photos = profile.photos || profile.Profile?.photos || [];
  const placeholderImg = getPlaceholderImage(400, 600, 'No Photo');
  const mainPhoto = (photos[0]?.url && (!photos[0]?.requiresPayment || photos[0]?.isPaid))
    ? photos[0]?.url
    : placeholderImg;

  const userInterests = user?.profile?.interests || user?.interests || [];
  const profileInterests = profile.interests || [];
  const matchPercentage = calculateMatchPercentage(userInterests, profileInterests);

  const handleAction = async (action) => {
    if (onAction) {
      try {
        await onAction(profile, action);
      } catch (error) {
        // Error is already handled in Home.jsx, don't show duplicate toast
        // Just prevent the error from bubbling up
      }
    }
  };

  const handleMessage = async () => {
    const userId = profile.userId?._id || profile.userId || profile._id;

    // Check if users have matched first
    try {
      // Dismiss any existing toasts first
      toast.dismiss();
      const response = await matchService.getMatchStatus(userId);

      if (response.success && response.data && response.data.matchId) {
        navigate(`/chat/${response.data.matchId}`);
      } else {
        // If no match exists, show error
        toast.error('You need to match with this user first before messaging', {
          duration: 4000,
          style: {
            zIndex: 99999,
          },
        });
      }
    } catch (error) {
      // Dismiss any existing toasts first
      toast.dismiss();
      toast.error('Unable to start chat. Please try again.', {
        duration: 4000,
        style: {
          zIndex: 99999,
        },
      });
    }
  };

  const handleCardClick = () => {
    const userId = profile.userId?._id || profile.userId || profile._id;
    if (!userId) return;

    // Check if user has sufficient coins (backend will deduct on actual view)
    // Premium users bypass the check
    if (!isPremium && !hasSufficientCoins(ACTION_COSTS.viewProfile)) {
      toast.error(`Insufficient coins. You need ${ACTION_COSTS.viewProfile} coins to view a profile.`, {
        duration: 4000,
        action: {
          label: 'Buy Coins',
          onClick: () => navigate('/wallet'),
        },
      });
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const bio = profile.about || profile.bio || '';
  const displayName = profile.name || profile.userId?.name || 'Unknown';
  const displayAge = age ? `, ${age}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9, rotateY: -15 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        rotateY: 2,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 20
        }
      }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
      style={{ perspective: 1000 }}
    >
      <div className="relative aspect-[3/4] overflow-hidden group">
        {photos.length > 1 ? (
          <PhotoCarousel
            photos={photos}
            profileUserId={profile.userId?._id || profile.userId || profile._id}
          />
        ) : (
          <div className="relative w-full h-full">
            {(() => {
              const photo = photos[0];
              const isPrivate = photo?.privacy === 'private';
              const coinCost = photo?.coinCost || 0;
              const requiresPayment = photo?.requiresPayment && !photo?.isPaid && !unlockedSinglePhoto;
              // Premium users and owners can view private photos for free
              const canViewForFree = isOwner || isPremium;
              const shouldBlur = isPrivate && coinCost > 0 && !canViewForFree && requiresPayment;

              return shouldBlur ? (
                <>
                  <img
                    src={photo?.url || placeholderImg}
                    alt={displayName}
                    className="w-full h-full object-cover blur-2xl"
                    style={{ filter: 'blur(20px)' }}
                    onError={(e) => {
                      if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
                        e.target.src = placeholderImg;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 z-40">
                    <div className="text-center mb-3">
                      <p className="text-white text-lg font-bold mb-1">🔒 Private Photo</p>
                      <p className="text-white/90 text-xs mb-3">Pay {coinCost} coins to view</p>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const photoId = photo?._id?.toString();
                        if (!photoId || loadingPhoto) return;

                        try {
                          setLoadingPhoto(true);
                          toast.dismiss();
                          const response = await profileService.unlockPrivatePhoto(photoId);
                          if (response.success && response.photo?.url) {
                            setUnlockedSinglePhoto(true);
                            setUnlockedPhotoUrl(response.photo.url);
                            const coinsPaid = response.coinsPaid || 0;
                            if (coinsPaid > 0) {
                              toast.success(`Photo unlocked! ${coinsPaid} coins deducted.`);
                            } else {
                              toast.success('Photo unlocked! (Premium - Free)');
                            }
                          }
                        } catch (error) {
                          const message = error.response?.data?.message || 'Failed to unlock photo';
                          toast.error(message);
                        } finally {
                          setLoadingPhoto(false);
                        }
                      }}
                      disabled={loadingPhoto}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingPhoto ? 'Unlocking...' : `Unlock for ${coinCost} coins`}
                    </button>
                  </div>
                </>
              ) : (
                <img
                  src={unlockedSinglePhoto && unlockedPhotoUrl ? unlockedPhotoUrl : mainPhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
                      e.target.src = placeholderImg;
                    }
                  }}
                />
              );
            })()}
          </div>
        )}

        {/* Premium Badge - Upper Right */}
        <PremiumBadge
          isPremium={profile.userId?.isPremium || profile.isPremium}
          placement="top-right"
          size="sm"
        />

        {/* Online Badge - Top Right (above premium badge) */}
        <OnlineBadge isOnline={isOnline} size="md" className="top-2 right-2" />

        {/* Stunning Yellow Gradient Overlay - GoMeet Style */}
        <div className="absolute inset-x-0 bottom-0 h-32 z-10">
          {/* Base vibrant yellow gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700] via-[#FFCB2B] to-[#FFCB2B]/75" />
          {/* Rich depth layer for premium look */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFA500]/20 via-transparent to-transparent" />
          {/* Subtle shadow for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" />
          {/* Shine/gloss effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/8 to-white/3 opacity-60" />
        </div>

        {/* Content on Gradient Overlay - Positioned on Yellow Box */}
        <div className="absolute bottom-0 left-0 right-0 h-32 z-20 flex flex-col justify-end p-4">
          {/* Top Row: Name/Age on Left, Distance on Right */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-lg font-semibold text-white truncate drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {displayName}{displayAge}
              </h3>
            </div>
            {distance && (
              <div className="ml-2 flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white text-sm font-medium">{distance.toFixed(2)} KM</span>
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          {bio ? (
            <p className="text-sm text-white drop-shadow-lg line-clamp-2 leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              {bio}
            </p>
          ) : (
            <p className="text-sm text-white/90 italic drop-shadow-md">No bio available</p>
          )}
        </div>
      </div>

      {/* Action Buttons - Exact GoMeet Style with Black Backgrounds */}
      <div
        className="p-4 flex items-center justify-between gap-2 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          whileHover={{
            scale: 1.15,
            rotate: [0, -15, 15, 0],
            boxShadow: "0 8px 20px rgba(239, 68, 68, 0.4)"
          }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            handleAction('dislike');
          }}
          className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.3 }}
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={!hasLiked ? {
            scale: 1.15,
            rotate: [0, -10, 10, 0],
            boxShadow: "0 8px 20px rgba(239, 68, 68, 0.4)"
          } : {}}
          whileTap={!hasLiked ? { scale: 0.85 } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasLiked) {
            handleAction('like');
            }
          }}
          disabled={hasLiked}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            hasLiked
              ? 'bg-gray-400 cursor-not-allowed opacity-60'
              : 'bg-black hover:bg-gray-800'
          }`}
          title={hasLiked ? 'Already liked' : 'Like'}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <HeartIcon className="w-6 h-6 text-red-500" />
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{
            scale: 1.15,
            y: -2,
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)"
          }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            handleMessage();
          }}
          className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <motion.div
            animate={{
              y: [0, -3, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ChatBubbleLeftIcon className="w-6 h-6 text-white" />
          </motion.div>
        </motion.button>

        {/* Super Like Button - Available for all (coins for non-premium) */}
        <motion.button
          whileHover={!hasLiked ? {
            scale: 1.15,
            rotate: [0, 180, 360],
            boxShadow: "0 8px 25px rgba(59, 130, 246, 0.5)"
          } : {}}
          whileTap={!hasLiked ? { scale: 0.85 } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasLiked) {
            handleAction('superlike');
            }
          }}
          disabled={hasLiked}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors relative overflow-hidden ${
            hasLiked
              ? 'bg-gray-400 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          }`}
          title={hasLiked ? 'Already liked' : (isPremium ? 'Super Like (Premium - Free)' : 'Super Like (20 coins)')}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <StarIcon className="w-6 h-6 text-white relative z-10" />
          </motion.div>
        </motion.button>

        {/* Gift Button - Premium Only */}
        <motion.button
          whileHover={isPremium ? {
            scale: 1.15,
            rotate: [0, -10, 10, 0],
            boxShadow: "0 8px 25px rgba(236, 72, 153, 0.5)"
          } : {}}
          whileTap={isPremium ? { scale: 0.85 } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPremium) {
              toast.error('Sending gifts requires a premium subscription. Please subscribe first.');
              navigate('/subscriptions');
              return;
            }
            handleAction('gift');
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors relative overflow-hidden ${
            isPremium
              ? 'bg-gradient-to-br from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
              : 'bg-gray-300 opacity-60 cursor-not-allowed'
          }`}
          title={isPremium ? 'Send Gift (Premium)' : 'Send Gift - Premium Feature'}
        >
          {isPremium && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
          <motion.div
            animate={isPremium ? {
              y: [0, -5, 0],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <GiftIcon className="w-6 h-6 text-white relative z-10" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}

