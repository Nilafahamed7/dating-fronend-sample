import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { callService } from '../../services/callService';
import { playRingtone, stopRingtone, cleanupRingtone, isPremiumUser, vibrate } from '../../utils/ringtone';
import toast from 'react-hot-toast';

// Generate traditional phone ringtone sound using Web Audio API
const createRingtoneSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Traditional phone ringtone: two-tone pattern (like a real phone)
    // First tone: 440 Hz (A4 note)
    // Second tone: 480 Hz (slightly higher)
    oscillator1.frequency.value = 440;
    oscillator2.frequency.value = 480;
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Volume envelope: quick attack, sustain, then fade
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05); // Quick attack
    gainNode.gain.setValueAtTime(0.25, now + 0.3); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4); // Fade out

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.4);
    oscillator2.stop(now + 0.4);

    return audioContext;
  } catch (error) {
    return null;
  }
};

export const IncomingCallModal = ({ isOpen, onClose, callData, onAccept, onDecline }) => {
  const [ringTimeout, setRingTimeout] = useState(30); // 30 seconds timeout
  const ringIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (isOpen && callData) {
      // Check if user is premium for premium ringtone
      const isPremium = isPremiumUser();

      // Play premium ringtone (or fallback to Web Audio API)
      playRingtone(isPremium).catch(() => {
        // Fallback to Web Audio API ringtone if file-based ringtone fails
        const playWebAudioRingtone = () => {
          try {
            const ctx = createRingtoneSound();
            if (ctx) {
              audioContextRef.current = ctx;
            }
          } catch (error) {
            }
        };

        // Play immediately
        playWebAudioRingtone();

        // Then play every 2 seconds (traditional phone ring pattern)
        ringIntervalRef.current = setInterval(playWebAudioRingtone, 2000);
      });

      // Vibrate device
      vibrate([200, 100, 200]);

      // Start countdown
      const interval = setInterval(() => {
        setRingTimeout((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Use setTimeout to call handleDecline outside of setState
            setTimeout(() => {
              // Stop ringtone before declining
              stopRingtone();
              if (ringIntervalRef.current) {
                clearInterval(ringIntervalRef.current);
                ringIntervalRef.current = null;
              }
              if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
              }
              handleDecline('timeout');
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        stopRingtone();
        if (ringIntervalRef.current) {
          clearInterval(ringIntervalRef.current);
          ringIntervalRef.current = null;
        }
        // Close audio context if still open
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      };
    } else {
      setRingTimeout(30);
      // Stop ringtone when modal closes
      stopRingtone();
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, callData]);

  const handleAccept = async () => {
    // Stop ringtone
    stopRingtone();
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }

    // Validate callData and callId
    if (!callData || !callData.callId) {
      toast.error('Invalid call data. Please try again.');
      return;
    }

    try {
      const response = await callService.acceptCall(callData.callId);
      // Check if response indicates success (status 200-299 or success: true)
      const isSuccess = response && (
        (response.success === true) ||
        (response.status >= 200 && response.status < 300) ||
        (!response.success && !response.error && !response.message)
      );

      if (isSuccess) {
        // Call accepted successfully - don't show any error toast
        onAccept(response.call || response);
        // Return early to prevent any error handling
        return;
      }

      // Only show error if it's a real failure (not a false positive)
      // Suppress any "failed to attend" or similar messages that appear after successful accept
      const errorMessage = response.message || response.error || '';
      if (errorMessage &&
          !errorMessage.toLowerCase().includes('attend') &&
          !errorMessage.toLowerCase().includes('failed to attend') &&
          !errorMessage.toLowerCase().includes('unable to attend') &&
          !errorMessage.toLowerCase().includes('already accepted')) {
        toast.error(errorMessage || 'Failed to accept call');
      }
    } catch (error) {
      // Check if error is actually a success (sometimes axios throws on 200 with certain configs)
      const status = error.response?.status;
      if (status >= 200 && status < 300) {
        // This is actually a success - don't show error
        onAccept(error.response?.data?.call || error.response?.data);
        return;
      }

      // Handle specific error codes
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || error.message || '';

      // If call is already accepted or in invalid state, try to proceed anyway
      if (errorCode === 'INVALID_STATE' && errorMessage.includes('already accepted')) {
        // Try to get call details and proceed
        onAccept({ callId: callData.callId, status: 'accepted' });
        return;
      }

      // Suppress error toasts that contain "attend" or "failed to attend"
      // These often appear incorrectly after successful accept
      if (errorMessage &&
          !errorMessage.toLowerCase().includes('attend') &&
          !errorMessage.toLowerCase().includes('failed to attend') &&
          !errorMessage.toLowerCase().includes('unable to attend') &&
          !errorMessage.toLowerCase().includes('already accepted')) {
        toast.error(errorMessage || 'Failed to accept call');
      }
    }
  };

  const handleDecline = async (reason = 'declined') => {
    // Stop ringtone
    stopRingtone();
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }

    try {
      // For timeout, call the server to end the call as missed
      if (reason === 'timeout') {
        // Call server endpoint to mark call as missed due to timeout
        await callService.endCall(callData.callId).catch(() => {
          // If endCall fails, try declineCall as fallback
          return callService.declineCall(callData.callId);
        });
      } else {
        await callService.declineCall(callData.callId);
      }
      onDecline(reason);
    } catch (error) {
      // Still call onDecline even if API call fails
      onDecline(reason);
    }
  };

  if (!isOpen || !callData) return null;

  const isVideoCall = callData.callType === 'video';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Animated Backdrop with gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-md z-[99999]"
            onClick={() => handleDecline()}
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    opacity: 0,
                  }}
                  animate={{
                    y: [null, Math.random() * window.innerHeight],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Beautiful Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-white/10 pointer-events-auto relative overflow-hidden">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />

              {/* Caller Avatar with beautiful animations */}
              <div className="flex flex-col items-center mb-8 relative z-10">
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut"
                  }}
                  className="relative mb-6"
                >
                  {/* Multiple pulsing rings */}
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.4 + i * 0.2, 1.4 + i * 0.2],
                        opacity: [0.6, 0, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.3,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 rounded-full border-2 border-yellow-400/50"
                      style={{
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0
                      }}
                    />
                  ))}

                  <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-2xl ring-4 ring-yellow-400/20">
                    {callData.callerAvatar ? (
                      <img
                        src={callData.callerAvatar}
                        alt={callData.callerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
                        {callData.callerName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg"
                >
                  {callData.callerName || 'Unknown'}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-3 text-gray-300 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    {isVideoCall ? (
                      <>
                        <VideoCameraIcon className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">Incoming Video Call</span>
                      </>
                    ) : (
                      <>
                        <PhoneIcon className="w-5 h-5 text-green-400" />
                        <span className="font-medium">Incoming Voice Call</span>
                      </>
                    )}
                  </div>
                  {/* Coin rate info */}
                  <div className="bg-blue-500/20 border border-blue-400/30 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-sm font-semibold text-blue-300">
                      {isVideoCall ? '40' : '20'} coins/min
                    </span>
                    <span className="text-xs text-gray-400 ml-2">(paid by male user)</span>
                  </div>
                </motion.div>
              </div>

              {/* Beautiful Countdown Timer */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-8 relative z-10"
              >
                <div className="text-sm text-gray-400 mb-3 font-medium">Call will timeout in</div>
                <motion.div
                  key={ringTimeout}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg"
                >
                  {ringTimeout}s
                </motion.div>
              </motion.div>

              {/* Beautiful Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 justify-center relative z-10"
              >
                {/* Decline Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDecline()}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full py-5 px-6 flex items-center justify-center gap-3 font-bold shadow-xl shadow-red-500/30 transition-all"
                >
                  <XMarkIcon className="w-7 h-7" />
                  <span className="text-lg">Decline</span>
                </motion.button>

                {/* Accept Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAccept}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full py-5 px-6 flex items-center justify-center gap-3 font-bold shadow-xl shadow-green-500/30 transition-all"
                >
                  {isVideoCall ? (
                    <>
                      <VideoCameraIcon className="w-7 h-7" />
                      <span className="text-lg">Accept</span>
                    </>
                  ) : (
                    <>
                      <PhoneIcon className="w-7 h-7" />
                      <span className="text-lg">Accept</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

