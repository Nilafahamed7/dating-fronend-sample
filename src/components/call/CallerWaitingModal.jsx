import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

// Generate ringing sound using Web Audio API
const createRingingSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800; // Ring frequency
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);

  return audioContext;
};

export const CallerWaitingModal = ({ isOpen, onClose, calleeName, calleeAvatar, callType, onCancel }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const ringIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Play ringing sound when modal opens
  useEffect(() => {
    if (isOpen) {
      // Play ringing sound every 2 seconds
      const playRing = () => {
        try {
          const ctx = createRingingSound();
          audioContextRef.current = ctx;
        } catch (error) {
          }
      };

      // Play immediately
      playRing();

      // Then play every 2 seconds
      ringIntervalRef.current = setInterval(playRing, 2000);

      // Timer for elapsed time
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
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
      setElapsedTime(0);
      // Stop ringing when modal closes
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    }
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isVideoCall = callType === 'video';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-800">
              {/* Callee Avatar */}
              <div className="flex flex-col items-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="relative mb-4"
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-2xl">
                    {calleeAvatar ? (
                      <img
                        src={calleeAvatar}
                        alt={calleeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {calleeName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {/* Pulsing ring */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full border-4 border-yellow-400"
                  />
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-2">{calleeName || 'Unknown'}</h2>
                <div className="flex items-center gap-2 text-gray-300">
                  {isVideoCall ? (
                    <>
                      <VideoCameraIcon className="w-5 h-5" />
                      <span>Video Call</span>
                    </>
                  ) : (
                    <>
                      <PhoneIcon className="w-5 h-5" />
                      <span>Voice Call</span>
                    </>
                  )}
                </div>
                <div className="mt-4 text-yellow-400 font-semibold">Ringing...</div>
              </div>

              {/* Elapsed Time */}
              <div className="text-center mb-8">
                <div className="text-sm text-gray-400 mb-2">Calling for</div>
                <div className="text-3xl font-bold text-white">{formatTime(elapsedTime)}</div>
              </div>

              {/* Cancel Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Stop ringing sound
                    if (ringIntervalRef.current) {
                      clearInterval(ringIntervalRef.current);
                      ringIntervalRef.current = null;
                    }
                    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                      audioContextRef.current.close().catch(() => {});
                    }
                    onCancel();
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full py-4 px-8 flex items-center justify-center gap-2 font-semibold shadow-lg"
                >
                  <XMarkIcon className="w-6 h-6" />
                  <span>Cancel</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

