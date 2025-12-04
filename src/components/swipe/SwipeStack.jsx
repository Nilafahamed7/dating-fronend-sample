import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeCard from './SwipeCard';
import EmptyState from '../common/EmptyState';
import { HeartIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function SwipeStack({ profiles, onSwipe, currentUserLocation, loading, showSuperLikeSplash }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwipe = useCallback(async (action) => {
    if (currentIndex >= profiles.length || isAnimating) return;

    const currentProfile = profiles[currentIndex];
    const swipeDirection = action === 'right' || action === 'like' || action === 'superlike' ? 1 : -1;

    // For like and superlike actions, advance only after successful action
    if (action === 'like' || action === 'superlike') {
      setIsAnimating(true);
      setDirection(swipeDirection);

      try {
        // Call the onSwipe callback and wait for it to complete
        await onSwipe(currentProfile, action);

        // Only advance if action was successful (no error thrown)
        setCurrentIndex((prev) => prev + 1);

        // Reset animation state after animation completes
        setTimeout(() => {
          setIsAnimating(false);
          setDirection(0);
        }, 500);
      } catch (error) {
        // If action failed, don't advance and reset animation
        setIsAnimating(false);
        setDirection(0);
      }
    } else {
      // For other actions (dislike, pass), advance immediately
    setIsAnimating(true);
    setDirection(swipeDirection);

    // Advance index immediately for smooth UX
    setCurrentIndex((prev) => prev + 1);

      // Call the onSwipe callback and wait for it to complete
      // This ensures the profile is removed from the list before continuing
      onSwipe(currentProfile, action).catch(() => {
        // If action fails, revert the index
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      });

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
      setDirection(0);
    }, 500);
    }
  }, [currentIndex, profiles, isAnimating, onSwipe]);

  // Navigate to previous profile (just navigation, no action)
  const handlePrevious = useCallback(() => {
    if (currentIndex <= 0 || isAnimating) return;

    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [currentIndex, isAnimating]);

  // Navigate to next profile (just navigation, no action)
  const handleNext = useCallback(() => {
    if (currentIndex >= profiles.length - 1 || isAnimating) return;

    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [currentIndex, profiles.length, isAnimating]);

  useEffect(() => {
    setCurrentIndex(0);
    setDirection(0);
    setIsAnimating(false);
  }, [profiles]);

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isAnimating) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnimating, handlePrevious, handleNext]);

  const visibleCards = profiles.slice(currentIndex, currentIndex + 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-velora-gray border-t-velora-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <EmptyState
        icon={HeartIcon}
        title="No more profiles"
        message="Check back later for new matches!"
      />
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      {/* Left Arrow Button (Previous Profile) - Outside on Left */}
      <motion.button
        onClick={handlePrevious}
        disabled={currentIndex <= 0 || isAnimating}
        whileHover={{ scale: 1.1, x: -3 }}
        whileTap={{ scale: 0.95 }}
        className="absolute left-0 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-all touch-manipulation"
        aria-label="Previous Profile"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: currentIndex > 0 ? 1 : 0.3, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ChevronLeftIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" strokeWidth={2.5} />
      </motion.button>

      {/* Right Arrow Button (Next Profile) - Outside on Right */}
      <motion.button
        onClick={handleNext}
        disabled={currentIndex >= profiles.length - 1 || isAnimating}
        whileHover={{ scale: 1.1, x: 3 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-0 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-all touch-manipulation"
        aria-label="Next Profile"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: currentIndex < profiles.length - 1 ? 1 : 0.3, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ChevronRightIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" strokeWidth={2.5} />
      </motion.button>

      {/* Card Container with proper spacing */}
      <div className="relative h-[650px] sm:h-[700px] mx-auto max-w-sm px-16 sm:px-20 md:px-24">
        <AnimatePresence mode="wait" initial={false}>
        {visibleCards.map((profile, index) => {
          const isTop = index === 0;
          const scale = 1 - index * 0.05;
          const yOffset = index * 10;
          const profileId = profile._id || profile.userId?._id || profile.userId || `profile-${currentIndex + index}`;

          return (
            <motion.div
              key={`${profileId}-${currentIndex}`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{
                scale: isTop ? 1 : scale,
                opacity: isTop ? 1 : 0.6,
                y: isTop ? 0 : yOffset,
                rotate: isTop ? 0 : index * 1.5,
                zIndex: visibleCards.length - index,
                x: 0,
              }}
              exit={{
                x: direction * 1000,
                opacity: 0,
                scale: 0.5,
                rotate: direction * 30,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.4
                },
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: index * 0.03
              }}
              className="absolute inset-0 w-full"
              style={{ pointerEvents: isTop && !isAnimating ? 'auto' : 'none' }}
            >
              <SwipeCard
                profile={profile}
                onSwipe={handleSwipe}
                onAction={handleSwipe}
                currentUserLocation={currentUserLocation}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div>
    </div>
  );
}

