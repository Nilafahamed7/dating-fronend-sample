import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCarousel from './PhotoCarousel';
import { calculateAge, calculateDistance, calculateMatchPercentage } from '../../utils/helpers';
import { XMarkIcon, HeartIcon, ChatBubbleLeftIcon, GiftIcon, StarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PremiumBadge from '../common/PremiumBadge';

export default function SwipeCard({ profile, onSwipe, currentUserLocation, onAction }) {
  const [dragDirection, setDragDirection] = useState(null);
  const [superLikeHover, setSuperLikeHover] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.isPremium || false;

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
    : null;

  const photos = profile.photos || profile.Profile?.photos || [];

  const userInterests = user?.profile?.interests || user?.interests || [];
  const profileInterests = profile.interests || [];
  const matchPercentage = calculateMatchPercentage(userInterests, profileInterests);

  const bio = profile.about || profile.bio || profile.Profile?.about || profile.Profile?.bio || '';
  const displayName = profile.name || profile.userId?.name || profile.Profile?.name || 'Unknown';
  const displayAge = age ? `, ${age}` : '';

  const handleAction = (action) => {
    // Prevent action if already liked/superliked
    if (hasLiked && (action === 'like' || action === 'superlike')) {
      return;
    }

    if (onAction) {
      onAction(profile, action);
    } else if (onSwipe) {
      onSwipe(action);
    }
  };

  const handleMessage = () => {
    const userId = profile.userId?._id || profile.userId || profile._id;
    navigate(`/chat/${userId}`);
  };

  const handleDrag = (event, info) => {
    if (info.offset.x > 50) {
      setDragDirection('right');
    } else if (info.offset.x < -50) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    // Swipe if dragged far enough OR if velocity is high enough
    if (info.offset.x > threshold || velocity > 500) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || velocity < -500) {
      onSwipe('left');
    }
    setDragDirection(null);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.2}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-white cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: dragDirection === 'right' ? 15 : dragDirection === 'left' ? -15 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        scale: { duration: 0.3 },
        rotate: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute inset-0">
        <PhotoCarousel
          photos={photos}
          profileUserId={profile.userId?._id || profile.userId || profile._id}
        />
      </div>

      {/* Premium Badge - Upper Right */}
      <PremiumBadge
        isPremium={profile.userId?.isPremium || profile.isPremium}
        placement="top-right"
        size="sm"
      />

      {/* Stunning Yellow Gradient Overlay - GoMeet Style */}
      <div className="absolute inset-x-0 bottom-16 h-32 z-10">
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
      <div className="absolute bottom-16 left-0 right-0 h-32 z-20 flex flex-col justify-end p-4">
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

      {/* Action Buttons - Grid Style */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4 bg-white z-30 rounded-b-3xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: 0.2
        }}
      >
        <div className="flex items-center justify-between gap-2">
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

          {/* Super Like Button */}
          <motion.button
            whileHover={!hasLiked ? {
              scale: 1.15,
              rotate: [0, 180, 360],
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.5)"
            } : {}}
            whileTap={!hasLiked ? { scale: 0.85 } : {}}
            onHoverStart={() => !hasLiked && setSuperLikeHover(true)}
            onHoverEnd={() => setSuperLikeHover(false)}
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
            {/* Animated gradient shine */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Pulsing glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.7)',
                  '0 0 0 10px rgba(59, 130, 246, 0)',
                  '0 0 0 0 rgba(59, 130, 246, 0)'
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />

            {/* Star icon with special animation */}
            <motion.div
              animate={{
                rotate: superLikeHover ? [0, 360] : [0, 360],
                scale: superLikeHover ? [1, 1.3, 1] : [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <StarIcon className="w-6 h-6 text-white relative z-10" />
            </motion.div>

            {/* Sparkle particles on hover */}
            <AnimatePresence>
              {superLikeHover && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: Math.cos((i * 60) * Math.PI / 180) * 30,
                        y: Math.sin((i * 60) * Math.PI / 180) * 30,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                      className="absolute w-1 h-1 bg-white rounded-full"
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
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

      {/* Swipe Direction Indicators */}
      <AnimatePresence>
        {dragDirection === 'right' && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: 1,
              rotate: 0,
              y: [0, -10, 0]
            }}
            exit={{ scale: 0, opacity: 0, rotate: 20 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
              scale: { duration: 0.3 }
            }}
            className="absolute top-4 right-4 text-green-500 text-5xl font-bold drop-shadow-2xl z-50"
            style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.8)' }}
          >
            LIKE
          </motion.div>
        )}
        {dragDirection === 'left' && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: 20 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: 1,
              rotate: 0,
              y: [0, -10, 0]
            }}
            exit={{ scale: 0, opacity: 0, rotate: -20 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
              scale: { duration: 0.3 }
            }}
            className="absolute top-4 left-4 text-red-500 text-5xl font-bold drop-shadow-2xl z-50"
            style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.8)' }}
          >
            PASS
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

