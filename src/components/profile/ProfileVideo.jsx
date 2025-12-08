import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { videoProfileService } from '../../services/videoProfileService';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer from './VideoPlayer';
import LockedVideo from './LockedVideo';
import LoadingSpinner from '../common/LoadingSpinner';
import { VideoCameraIcon, ClockIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ProfileVideo({ userId, isOwn = false, className = '' }) {
  const { user: currentUser } = useAuth();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await videoProfileService.getVideoProfile(userId);

        if (response.success) {
          setVideoData(response);
        } else {
          setError(response.message || 'Video not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [userId]);

  const handleUnlock = async () => {
    try {
      setUnlocking(true);
      const response = await videoProfileService.unlockVideo(videoData.videoId);

      if (response.success) {
        toast.success('Video unlocked successfully!');
        setVideoData(prev => ({ ...prev, isUnlocked: true }));
        setShowUnlockModal(false);
      } else {
        throw new Error(response.message || 'Failed to unlock video');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to unlock video');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !videoData) {
    return null; // Don't show anything if no video
  }

  // Owner can always see their video (even if pending/rejected)
  if (isOwn) {
    const status = videoData.status;

    // Show pending/rejected status
    if (status === 'pending') {
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center gap-2 text-yellow-600">
            <ClockIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Video pending review</span>
          </div>
          {videoData.thumbnailUrl && (
            <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={videoData.thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-auto opacity-50"
              />
            </div>
          )}
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Video rejected</span>
            {videoData.rejectionReason && (
              <span className="text-xs text-gray-600">({videoData.rejectionReason})</span>
            )}
          </div>
        </div>
      );
    }

    // Approved video - show player
    if (status === 'approved' && videoData.videoUrl) {
      return (
        <div className={className}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
            onClick={() => setShowPlayer(true)}
          >
            {videoData.thumbnailUrl ? (
              <img
                src={videoData.thumbnailUrl}
                alt="Profile video"
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <VideoCameraIcon className="w-16 h-16 text-gray-600" />
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <VideoCameraIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Caption */}
            {videoData.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm">{videoData.caption}</p>
              </div>
            )}
          </motion.div>

          {showPlayer && (
            <VideoPlayer
              videoUrl={videoData.videoUrl}
              thumbnailUrl={videoData.thumbnailUrl}
              onClose={() => setShowPlayer(false)}
            />
          )}
        </div>
      );
    }

    return null;
  }

  // Visibility Logic for other users
  const isFemale = currentUser?.gender?.toLowerCase() === 'female';
  const isPremium = currentUser?.isPremium;
  const canView = isFemale || isPremium || videoData.isUnlocked;

  // Non-owner: check if they can view
  if (!canView) {
    // Show locked video UI
    return (
      <div className={className}>
        <LockedVideo
          thumbnailUrl={videoData.thumbnailUrl}
          caption={videoData.caption}
          onUnlock={() => setShowUnlockModal(true)}
        />

        {/* Unlock Modal */}
        <AnimatePresence>
          {showUnlockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
              >
                <button
                  onClick={() => setShowUnlockModal(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockClosedIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Profile Video</h3>
                  <p className="text-gray-600 mb-6">
                    Unlock this video to watch it anytime. This will deduct <span className="font-bold text-yellow-600">50 coins</span> from your wallet.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUnlockModal(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="flex-1 px-4 py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {unlocking ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Unlocking...
                        </>
                      ) : (
                        <>
                          Unlock Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Allowed user can view
  if (videoData.videoUrl && videoData.status === 'approved') {
    return (
      <div className={className}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative rounded-lg overflow-hidden bg-gray-900 cursor-pointer group"
          onClick={() => setShowPlayer(true)}
        >
          {videoData.thumbnailUrl ? (
            <img
              src={videoData.thumbnailUrl}
              alt="Profile video"
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <VideoCameraIcon className="w-16 h-16 text-gray-600" />
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <VideoCameraIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Caption */}
          {videoData.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm">{videoData.caption}</p>
            </div>
          )}
        </motion.div>

        {showPlayer && (
          <VideoPlayer
            videoUrl={videoData.videoUrl}
            thumbnailUrl={videoData.thumbnailUrl}
            onClose={() => setShowPlayer(false)}
          />
        )}
      </div>
    );
  }

  return null;
}




