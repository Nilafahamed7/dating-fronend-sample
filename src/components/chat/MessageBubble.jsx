import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { formatDate, formatMessageTimestamp } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, CheckIcon, XMarkIcon, SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { groupService } from '../../services/groupService';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import toast from 'react-hot-toast';

export default function MessageBubble({ message, isMine, index = 0, onInvitationUpdate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadGroups } = useGroups();
  const [processing, setProcessing] = useState(false);
  const [showGiftValue, setShowGiftValue] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  // Show confetti only for receivers when gift value is revealed
  useEffect(() => {
    if (showGiftValue && !isMine && message.metadata?.giftValue) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000); // Confetti for 3 seconds
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [showGiftValue, isMine, message.metadata?.giftValue]);

  // Auto-hide coin value after 3 seconds for receivers
  useEffect(() => {
    if (showGiftValue && !isMine && (message.metadata?.giftValue || message.metadata?.giftCost)) {
      const timer = setTimeout(() => {
        setShowGiftValue(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showGiftValue, isMine, message.metadata?.giftValue, message.metadata?.giftCost]);

  // Initialize from backend status: 'active' (joined), 'pending' (invited), or null (no action yet)
  const getInitialStatus = () => {
    if (message.invitationStatus === 'active') return 'accepted';
    if (message.invitationStatus === 'pending') return 'pending';
    return null;
  };

  const [invitationStatus, setInvitationStatus] = useState(getInitialStatus());

  const isImage = message.messageType === 'image';
  const isVideo = message.messageType === 'video';
  const isGift = message.messageType === 'gift';
  const isGroupInvitation = message.messageType === 'group_invitation';
  const isSystemMessage = message.messageType === 'system' || message.isSystemMessage;

  const handleAcceptInvitation = async () => {
    try {
      setProcessing(true);

      // Check permissions before accepting
      const canJoin = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);
      if (!canJoin) {
        toast.error('Only premium male users and all female users can join groups. Please upgrade to premium.');
        setTimeout(() => navigate('/subscriptions'), 2000);
        return;
      }

      const groupId = message.metadata?.groupId;
      const response = await groupService.acceptInvitation(groupId);
      if (response.success) {
        toast.success('Successfully joined the group!');
        setInvitationStatus('accepted');
        if (onInvitationUpdate) onInvitationUpdate();
        // Reload groups to update the list
        await loadGroups();
        // Navigate to group chat directly after a short delay
        setTimeout(() => navigate(`/group/${groupId}`), 500);
      }
    } catch (error) {
      // Handle 403 - Premium required
      if (error.response?.status === 403 && error.response?.data?.code === 'PREMIUM_REQUIRED') {
        toast.error('Only premium male users and all female users can join groups. Please upgrade to premium.');
        setTimeout(() => navigate('/subscriptions'), 2000);
        return;
      }

      // Handle 401 errors - check if it's a token issue
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || '';
        const isTokenError =
          errorMessage.includes('token') ||
          errorMessage.includes('authorized') ||
          errorMessage.includes('session') ||
          errorMessage.includes('Not authorized');

        if (isTokenError) {
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 1500);
          return;
        }
      }

      const errorMsg = error.response?.data?.message || 'Failed to join group';
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvitation = async () => {
    try {
      setProcessing(true);
      const groupId = message.metadata?.groupId;
      await groupService.rejectInvitation(groupId);
      toast.success('Invitation rejected');
      setInvitationStatus('rejected');
      if (onInvitationUpdate) onInvitationUpdate();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject invitation';
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // System messages are centered and styled differently
  if (isSystemMessage) {
    return (
      <motion.div
        className="flex justify-center mb-3 px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <div className="px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
          {message.text}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4 px-2 relative`}
      style={{
        zIndex: showGiftValue ? 999 : 1,
        position: 'relative',
        isolation: 'isolate'
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.03,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      <motion.div
        className={`max-w-xs lg:max-w-md px-5 py-3 rounded-3xl shadow-md backdrop-blur-sm relative ${isMine
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-br-md'
            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
          }`}
        style={{
          overflow: 'visible',
          zIndex: showGiftValue ? 1000 : 'auto',
          position: 'relative'
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isImage && message.imageUrl && (
          <motion.img
            src={message.imageUrl}
            alt="Shared image"
            className="rounded-2xl mb-2 max-w-full w-full h-auto object-contain shadow-md hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.01 }}
          />
        )}

        {isVideo && message.videoUrl && (
          <motion.video
            src={message.videoUrl}
            controls
            className="rounded-2xl mb-2 max-w-full max-h-96 shadow-md hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Your browser does not support the video tag.
          </motion.video>
        )}

        {isGift && (
          <motion.div
            className={`text-center py-5 px-4 rounded-2xl relative cursor-pointer ${isMine
                ? 'bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100'
                : 'bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50'
              }`}
            style={{
              overflow: 'visible',
              zIndex: showGiftValue ? 10000 : 'auto',
              position: 'relative',
              isolation: 'isolate',
              willChange: showGiftValue ? 'transform' : 'auto'
            }}
            initial={{ scale: 0.9 }}
            animate={{
              scale: showGiftValue ? 1.08 : 1,
              boxShadow: showGiftValue
                ? '0 20px 60px rgba(255, 110, 199, 0.4), 0 0 40px rgba(255, 215, 0, 0.3)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isMine && !showGiftValue) {
                // Trigger confetti when receiver opens gift
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
              }
              setShowGiftValue(!showGiftValue);
            }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Background glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-yellow-400/20 blur-xl"
              animate={{
                opacity: showGiftValue ? [0.5, 0.8, 0.5] : 0,
                scale: showGiftValue ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-300/30 rounded-full blur-2xl"></div>

            {/* Gift icon with shaking effect */}
            <div className="relative mb-3 flex flex-col items-center" style={{ minHeight: '100px', overflow: 'visible' }}>
              {/* Gift box container with shake animation */}
              <motion.div
                className="text-6xl relative z-10 inline-block mb-2"
                style={{ perspective: '1000px' }}
                animate={showGiftValue && !isMine ? {
                  // Shake animation when opening - using keyframes with tween
                  x: [0, -10, 10, -8, 8, -5, 5, 0],
                  y: [0, -5, 5, -3, 3, 0],
                  rotate: [0, -5, 5, -3, 3, 0],
                } : {
                  // Gentle float when not opened
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={showGiftValue && !isMine ? {
                  duration: 0.6,
                  ease: "easeInOut",
                  repeat: 0,
                  type: "tween" // Use tween instead of spring for multiple keyframes
                } : {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  type: "tween"
                }}
              >
                {showGiftValue && !isMine ? (
                  <div className="relative inline-block" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                    {/* Gift box base (stays in place) */}
                    <motion.div
                      initial={{ scale: 1, y: 0 }}
                      animate={{
                        scale: [1, 1.1, 1.05, 1],
                        y: [0, -2, 0]
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                      className="relative z-10"
                      style={{
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                      }}
                    >
                      {(() => {
                        const giftIcon = message.giftIcon || message.metadata?.giftIcon;
                        return giftIcon && (giftIcon.startsWith('http://') || giftIcon.startsWith('https://')) ? (
                          <img src={giftIcon} alt={message.giftType} className="w-16 h-16 object-contain" />
                        ) : (
                          <span className="text-6xl">{giftIcon || '🎁'}</span>
                        );
                      })()}
                    </motion.div>

                    {/* Lid opening and flying off */}
                    <motion.div
                      initial={{
                        y: 0,
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: 0,
                        opacity: 1,
                        scale: 1
                      }}
                      animate={{
                        y: [-15, -50, -80, -120],
                        rotateX: [0, -30, -60, -90, -120],
                        rotateY: [0, 15, 25, 30, 35],
                        rotateZ: [0, 10, 20, 25, 30],
                        opacity: [1, 1, 0.8, 0.5, 0],
                        scale: [1, 1.1, 1.05, 0.9, 0.7]
                      }}
                      transition={{
                        duration: 1.2,
                        delay: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className="absolute inset-0 z-20"
                      style={{
                        transformOrigin: 'center bottom',
                        transformStyle: 'preserve-3d',
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                      }}
                    >
                      {(() => {
                        const giftIcon = message.giftIcon || message.metadata?.giftIcon;
                        return giftIcon && (giftIcon.startsWith('http://') || giftIcon.startsWith('https://')) ? (
                          <img src={giftIcon} alt={message.giftType} className="w-16 h-16 object-contain" />
                        ) : (
                          <span className="text-6xl">{giftIcon || '🎁'}</span>
                        );
                      })()}
                    </motion.div>

                    {/* Opening flash effect */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 2, 2.5, 0],
                        opacity: [0, 1, 0.8, 0]
                      }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 z-15"
                      style={{
                        background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 215, 0, 0.6) 30%, transparent 70%)',
                        filter: 'blur(15px)',
                        borderRadius: '50%',
                      }}
                    />
                  </div>
                ) : (
                  <motion.div>
                    {(() => {
                      const giftIcon = message.giftIcon || message.metadata?.giftIcon;
                      return giftIcon && (giftIcon.startsWith('http://') || giftIcon.startsWith('https://')) ? (
                        <img src={giftIcon} alt={message.giftType} className="w-16 h-16 object-contain" />
                      ) : (
                        <span className="text-6xl">{giftIcon || '🎁'}</span>
                      );
                    })()}
                  </motion.div>
                )}
              </motion.div>

              {/* Gift name below icon */}
              <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {message.giftType}
              </p>

              {/* Coin value coming out - only for receiver */}
              {showGiftValue && !isMine && (message.metadata?.giftValue || message.metadata?.giftCost) && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.3,
                    y: -20,
                    x: 0
                  }}
                  animate={{
                    opacity: [0, 0, 1, 1, 1],
                    scale: [0.3, 0.8, 1.2, 1.1, 1],
                    y: [-20, -60, -80, -70, -60],
                    x: [0, 0, 5, -5, 0]
                  }}
                  transition={{
                    delay: 0.5,
                    duration: 1,
                    type: "tween", // Use tween for multiple keyframes
                    ease: [0.34, 1.56, 0.64, 1] // Bouncy easing
                  }}
                  className="absolute top-0 flex flex-col items-center gap-1 pointer-events-none"
                  style={{
                    zIndex: 10050,
                    transform: 'translateY(-100%)'
                  }}
                >
                  {/* Coin value text */}
                  <motion.p
                    className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 0 30px rgba(255, 215, 0, 1), 0 0 15px rgba(255, 140, 66, 0.8)',
                      WebkitTextStroke: '2px rgba(255, 215, 0, 0.5)',
                      filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
                      lineHeight: '1.2'
                    }}
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  >
                    +{message.metadata?.giftValue || message.metadata?.giftCost || 0}
                  </motion.p>

                  {/* Coins label */}
                  <motion.p
                    className="text-lg font-bold text-yellow-600 flex items-center gap-2"
                    style={{
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: [0, 0, 1],
                      y: [10, 5, 0]
                    }}
                    transition={{
                      delay: 0.8,
                      type: "tween",
                      ease: "easeOut"
                    }}
                  >
                    <motion.span
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="text-xl"
                    >
                      🪙
                    </motion.span>
                    <span>Coins</span>
                    <motion.span
                      animate={{
                        rotate: [0, -360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="text-xl"
                    >
                      🪙
                    </motion.span>
                  </motion.p>

                  {/* Sparkles around coin value */}
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * 360;
                    const distance = 40;
                    return (
                      <motion.div
                        key={`sparkle-${i}`}
                        className="absolute text-2xl pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          zIndex: 10051 + i,
                          transform: 'translate(-50%, -50%)',
                        }}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          scale: [0, 1.5, 1, 0],
                          x: Math.cos(angle * Math.PI / 180) * distance,
                          y: Math.sin(angle * Math.PI / 180) * distance,
                          rotate: [0, 360]
                        }}
                        transition={{
                          duration: 1.5,
                          delay: 0.6 + (i * 0.1),
                          ease: "easeOut",
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      >
                        ✨
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Sender/Receiver message */}
            <p className="text-sm font-semibold text-gray-800 mb-2">
              {isMine ? '💝 You sent a gift' : '🎉 You received a gift'}
            </p>

            {/* Gift note - shown to both sender and receiver */}
            {message.text && (
              <p className="text-sm text-gray-700 mt-2 italic px-2">"{message.text}"</p>
            )}

            {/* Tap hint - Only shown to receivers */}
            {!showGiftValue && !isMine && (message.metadata?.giftValue || message.metadata?.giftCost) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-xs text-gray-600 mt-3 font-bold bg-yellow-100/50 px-3 py-1.5 rounded-full inline-block"
              >
                👆 Tap to see {(message.metadata?.giftValue || message.metadata?.giftCost || 0)} coins! ✨
              </motion.p>
            )}
          </motion.div>
        )}

        {isGroupInvitation && (
          <motion.div
            className={`py-5 px-4 rounded-2xl relative overflow-hidden ${isMine
                ? 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100'
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
              }`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/30 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-300/20 rounded-full blur-xl"></div>

            <div className="relative z-10">
              <motion.div
                className="flex items-center justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <UserGroupIcon className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <motion.p
                className="text-sm font-semibold text-gray-700 text-center mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isMine ? '✉️ You sent a group invitation' : '🎉 You received a group invitation!'}
              </motion.p>

              <motion.p
                className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {message.metadata?.groupName || 'Unknown Group'}
              </motion.p>

              {message.metadata?.description && (
                <motion.p
                  className="text-xs text-gray-600 text-center mb-3 px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {message.metadata.description}
                </motion.p>
              )}

              {/* Show buttons for recipient - only if no action taken */}
              {!isMine && invitationStatus === null && (
                <motion.div
                  className="flex gap-3 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    whileHover={{ scale: processing ? 1 : 1.08, y: -2 }}
                    whileTap={{ scale: processing ? 1 : 0.95 }}
                    onClick={handleAcceptInvitation}
                    disabled={processing}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="w-5 h-5" />
                    {processing ? 'Joining...' : 'Join Group'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: processing ? 1 : 1.08, y: -2 }}
                    whileTap={{ scale: processing ? 1 : 0.95 }}
                    onClick={handleRejectInvitation}
                    disabled={processing}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    {processing ? 'Rejecting...' : 'Reject'}
                  </motion.button>
                </motion.div>
              )}

              {/* Show status after action or if already joined/pending */}
              {!isMine && invitationStatus === 'accepted' && (
                <motion.div
                  className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => navigate(`/groups/${message.metadata?.groupId}`)}
                >
                  <p className="text-sm text-green-700 text-center font-bold flex items-center justify-center gap-2">
                    <CheckIcon className="w-5 h-5" />
                    You joined this group! Click to view
                  </p>
                </motion.div>
              )}
              {!isMine && invitationStatus === 'pending' && (
                <motion.div
                  className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <p className="text-sm text-yellow-700 text-center font-bold flex items-center justify-center gap-2">
                    ⏳ Invitation pending...
                  </p>
                </motion.div>
              )}
              {!isMine && invitationStatus === 'rejected' && (
                <motion.div
                  className="mt-4 p-3 bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-400 rounded-xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <p className="text-sm text-red-700 text-center font-bold flex items-center justify-center gap-2">
                    <XMarkIcon className="w-5 h-5" />
                    Invitation rejected
                  </p>
                </motion.div>
              )}

              {/* Show message for sender */}
              {isMine && (
                <motion.div
                  className="mt-3 flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                  <p className="text-xs text-gray-600 font-medium">
                    ✓ Invitation sent
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {message.text && !isGift && !isGroupInvitation && (
          <div className="flex items-start gap-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words flex-1">{message.text}</p>
            {message.autoGenerated && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                Auto
              </span>
            )}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <p className={`text-xs ${isMine ? 'text-black/50' : 'text-gray-400'} font-medium`}>
            {formatMessageTimestamp(message.createdAt)}
          </p>
          {isMine && (
            <div className="flex items-center">
              {message.status === 'sending' ? (
                <span className="text-gray-500 text-[10px]">🕒</span>
              ) : message.isRead ? (
                <div className="flex">
                  <CheckIcon className="w-3 h-3 text-blue-500 stroke-[3]" />
                  <CheckIcon className="w-3 h-3 text-blue-500 stroke-[3] -ml-1.5" />
                </div>
              ) : (
                <CheckIcon className="w-3 h-3 text-gray-500 stroke-[2]" />
              )}
            </div>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <span key={reaction.user?._id || reaction.user || `reaction-${index}`} className="text-lg">
                {reaction.reaction}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

