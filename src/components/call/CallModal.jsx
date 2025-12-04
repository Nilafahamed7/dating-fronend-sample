import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { XMarkIcon, PhoneIcon, VideoCameraIcon, MicrophoneIcon as MicrophoneOutlineIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { walletService } from '../../services/walletService';
import { useCall } from '../../contexts/CallContext';

export const CallModal = ({
  isOpen,
  onClose,
  calleeId,
  calleeName,
  callType: initialCallType,
  // Call functions from CallContext
  client,
  localVideoTrack,
  remoteUsers,
  isInCall,
  callDuration,
  isMuted,
  isVideoEnabled,
  endCall,
  toggleMute,
  toggleVideo,
  // Coin information
  requiredReserve = 0,
  pricing = {},
  calleeFreeMinutesRemaining = 0,
  // One-way video state
  allowOneWay = false,
}) => {
  const { convertCall, requestVideoUpgrade, activeCall: contextActiveCall } = useCall();
  const [currentCallType, setCurrentCallType] = useState(initialCallType || 'voice');
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinsDeducted, setCoinsDeducted] = useState(0);
  const [estimatedCoinsPerMinute, setEstimatedCoinsPerMinute] = useState(0);
  const [callTypeChangeTime, setCallTypeChangeTime] = useState(null); // Track when call type changed
  const localVideoTrackRef = useRef(null);

  // Update call type when prop changes
  useEffect(() => {
    if (initialCallType) {
      const previousType = currentCallType;
      setCurrentCallType(initialCallType);
      // If call type changed (e.g., voice to video), record the change time
      if (previousType !== initialCallType && isInCall) {
        setCallTypeChangeTime(Date.now());
      }
    }
  }, [initialCallType, isInCall]);

  // Also update when contextActiveCall callType changes
  useEffect(() => {
    if (contextActiveCall?.callType && contextActiveCall.callType !== currentCallType) {
      const previousType = currentCallType;
      setCurrentCallType(contextActiveCall.callType);
      if (previousType !== contextActiveCall.callType && isInCall) {
        setCallTypeChangeTime(Date.now());
      }
    }
  }, [contextActiveCall?.callType, isInCall]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Hide navbars when call is open
  useEffect(() => {
    if (isOpen) {
      // Hide top navbar - add class to body to hide via CSS
      document.body.classList.add('call-active');

      // Also directly hide navbars for immediate effect
      const topNav = document.querySelector('header, nav[class*="fixed"][class*="top-0"], [class*="GlobalNavBar"]');
      if (topNav) {
        topNav.style.display = 'none';
        topNav.setAttribute('data-call-hidden', 'true');
      }

      const bottomNav = document.querySelector('nav[class*="fixed"][class*="bottom-0"], [class*="BottomNav"]');
      if (bottomNav) {
        bottomNav.style.display = 'none';
        bottomNav.setAttribute('data-call-hidden', 'true');
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Show navbars when call closes
      document.body.classList.remove('call-active');

      const topNav = document.querySelector('[data-call-hidden="true"]');
      if (topNav) {
        topNav.style.display = '';
        topNav.removeAttribute('data-call-hidden');
      }

      const bottomNav = document.querySelector('[data-call-hidden="true"]');
      if (bottomNav) {
        bottomNav.style.display = '';
        bottomNav.removeAttribute('data-call-hidden');
      }

      document.body.style.overflow = '';
    }

    return () => {
      // Cleanup: restore navbars
      document.body.classList.remove('call-active');

      const hiddenNavs = document.querySelectorAll('[data-call-hidden="true"]');
      hiddenNavs.forEach(nav => {
        nav.style.display = '';
        nav.removeAttribute('data-call-hidden');
      });

      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch coin balance
  useEffect(() => {
    if (isOpen) {
      const fetchBalance = async () => {
        try {
          const response = await walletService.getBalance();
          if (response.success) {
            setCoinBalance(response.balance?.coins || 0);
          }
        } catch (error) {
          }
      };
      fetchBalance();
    }
  }, [isOpen]);

  // Set estimated coins per minute from pricing
  useEffect(() => {
    if (pricing && pricing.coinsPerMinute) {
      setEstimatedCoinsPerMinute(pricing.coinsPerMinute);
    } else {
      // Fallback to default rates: voice = 20, video = 40
      setEstimatedCoinsPerMinute(currentCallType === 'video' ? 40 : 20);
    }
  }, [pricing, currentCallType]);

  // Calculate coins deducted based on duration and call type changes
  useEffect(() => {
    if (isInCall && callDuration > 0) {
      let totalCoins = 0;

      // Check if we have call type change info from context
      const hasTypeChange = contextActiveCall?.callTypeChanges && contextActiveCall.callTypeChanges.length > 0;

      if (hasTypeChange && contextActiveCall.callTypeChanges.length > 0) {
        // Calculate segments based on callTypeChanges
        // For now, we'll use a simplified calculation: if current type is video and we started as voice,
        // estimate the split. More accurate calculation would require server-side data.
        // This is an approximation for UI display - actual billing is done server-side.

        // Simple heuristic: if current type is video but we started as voice, assume half/half split
        // In production, you'd want to get actual segment times from the server
        const totalMinutes = Math.ceil(callDuration / 60);

        // For display purposes, if we're in video mode but started as voice,
        // estimate: assume voice segment was about 30% of call, video is 70%
        // This is just for UI - actual billing uses server-side callTypeChanges
        if (currentCallType === 'video' && initialCallType === 'voice') {
          const estimatedVoiceMinutes = Math.ceil(totalMinutes * 0.3);
          const estimatedVideoMinutes = totalMinutes - estimatedVoiceMinutes;
          totalCoins = (estimatedVoiceMinutes * 20) + (estimatedVideoMinutes * 40);
        } else {
          // Single call type
          totalCoins = totalMinutes * estimatedCoinsPerMinute;
        }
      } else {
        // Single call type - use current rate
        const minutes = Math.ceil(callDuration / 60); // Round up to next minute
        totalCoins = minutes * estimatedCoinsPerMinute;
      }

      setCoinsDeducted(totalCoins);
    } else {
      setCoinsDeducted(0);
    }
  }, [isInCall, callDuration, estimatedCoinsPerMinute, currentCallType, initialCallType, contextActiveCall]);

  // CallModal is now only shown for active calls (after accept)
  // Only show "Connected" when call is actually active
  useEffect(() => {
    if (isOpen && isInCall) {
      } else if (isOpen && !isInCall) {
      // If modal is open but call is not active, show connecting state
      // Don't close immediately - give time for connection to establish
      // Only close if it's been more than 10 seconds without connection
      const timeout = setTimeout(() => {
        if (!isInCall) {
          onClose();
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
    // Don't auto-end call on modal close - let user explicitly end it
  }, [isOpen, isInCall, onClose]);

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
      localVideoTrackRef.current = localVideoTrack;
    }
  }, [localVideoTrack]);

  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      remoteUsers[0].videoTrack?.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>

      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Remote video - Full screen background */}
        <div className="flex-1 relative bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 backdrop-blur-sm">
          {remoteUsers.length > 0 && currentCallType === 'video' && remoteUsers[0].videoTrack ? (
            <div
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              style={{
                background: 'transparent',
                minHeight: '100%',
                minWidth: '100%'
              }}
            />
          ) : currentCallType === 'video' && (allowOneWay || contextActiveCall?.allowOneWay) ? (
            // One-way video mode - show waiting for video message
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center px-4">
                <div className="relative mx-auto mb-6">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl ring-4 ring-white/30 relative overflow-hidden">
                    <VideoCameraIcon className="w-20 h-20 text-white relative z-10" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 animate-ping opacity-20"></div>
                </div>
                <p className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">{calleeName}</p>
                <p className="text-lg text-gray-300">
                  Waiting for video...
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  You are viewing their video only
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center px-4">
                {/* Beautiful avatar circle with gradient */}
                <div className="relative mx-auto mb-6">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl ring-4 ring-white/30 relative overflow-hidden">
                    {currentCallType === 'video' ? (
                      <VideoCameraIcon className="w-20 h-20 text-white relative z-10" />
                    ) : (
                      <PhoneIcon className="w-20 h-20 text-white relative z-10" />
                    )}
                  </div>
                  {/* Multiple pulsing ring animations */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 animate-ping opacity-20"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 animate-ping opacity-5" style={{ animationDelay: '1s' }}></div>
                </div>
                <p className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">{calleeName}</p>
                <div className="flex items-center justify-center gap-2">
                  {!isInCall && (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                  <p className={`text-lg ${isInCall ? 'text-green-400' : 'text-gray-300'}`}>
                    {isInCall ? 'Connected' : 'Connecting...'}
                  </p>
                  {/* One-way video indicator */}
                  {currentCallType === 'video' && (allowOneWay || contextActiveCall?.allowOneWay) && (
                    <p className="text-xs text-blue-300 mt-1">
                      One-way video mode
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) - Beautiful rounded corner with shadow */}
        {/* Only show local video if we have a video track and it's enabled */}
        {currentCallType === 'video' && (localVideoTrack || localVideoTrackRef.current) && isVideoEnabled && (
          <motion.div
            className="absolute top-6 right-6 w-44 h-60 rounded-3xl overflow-hidden border-4 border-white/40 bg-black shadow-2xl backdrop-blur-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              ref={localVideoRef}
              className="w-full h-full object-cover"
              style={{
                background: 'transparent',
                minHeight: '100%',
                minWidth: '100%'
              }}
            />
            {/* Corner indicator with pulse */}
            <div className="absolute top-3 left-3 bg-green-500 w-4 h-4 rounded-full ring-2 ring-white shadow-lg">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
            {/* Gradient overlay for better visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </motion.div>
        )}

        {/* Call info bar - Duration, coins, balance */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-3 items-center flex-wrap justify-center max-w-[90%]">
          {/* Call type and rate */}
          <div className="bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-blue-400/50 shadow-2xl">
            <div className="flex items-center gap-2">
              {currentCallType === 'video' ? (
                <VideoCameraIcon className="w-4 h-4" />
              ) : (
                <PhoneIcon className="w-4 h-4" />
              )}
              <span className="capitalize">{currentCallType} Call</span>
              <span className="text-xs opacity-80">•</span>
              <span className="text-xs opacity-90">{estimatedCoinsPerMinute} coins/min</span>
            </div>
          </div>

          {/* Call duration */}
          {isInCall && (
            <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-green-400/50 shadow-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                <span className="font-mono">{formatDuration(callDuration)}</span>
              </div>
            </div>
          )}

          {/* Coin balance */}
          <div className="bg-gradient-to-r from-yellow-500/80 to-amber-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-yellow-400/50 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="font-mono">{coinBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Coins that will be deducted (before call starts) or being deducted (during call) */}
          {requiredReserve > 0 && !isInCall && (
            <div className="bg-gradient-to-r from-orange-500/80 to-red-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-orange-400/50 shadow-2xl animate-pulse">
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>Reserve: {requiredReserve} coins</span>
              </div>
            </div>
          )}

          {/* Coins deducted (during active call) */}
          {isInCall && coinsDeducted > 0 && (
            <div className="bg-gradient-to-r from-red-500/80 to-rose-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-red-400/50 shadow-2xl">
              <div className="flex items-center gap-2">
                <span>−</span>
                <span className="font-mono">{coinsDeducted}</span>
                <span className="text-xs opacity-80">coins</span>
                <span className="text-xs opacity-70">(approx.)</span>
              </div>
            </div>
          )}

          {/* Coin rate info */}
          {isInCall && (
            <div className="bg-gradient-to-r from-purple-500/60 to-pink-500/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-medium border border-purple-400/30">
              <span className="opacity-90">Coins deducted from male user only</span>
            </div>
          )}

          {/* Free minutes indicator */}
          {calleeFreeMinutesRemaining > 0 && (
            <div className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-blue-400/50 shadow-2xl">
              <div className="flex items-center gap-2">
                <span>🆓</span>
                <span>{calleeFreeMinutesRemaining} min free</span>
              </div>
            </div>
          )}

          {/* One-way video indicator */}
          {currentCallType === 'video' && (allowOneWay || contextActiveCall?.allowOneWay) && (
            <div className="bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border-2 border-blue-400/50 shadow-2xl">
              <div className="flex items-center gap-2">
                <VideoCameraIcon className="w-4 h-4" />
                <span>One-way video</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls - Beautiful floating buttons with glassmorphism */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-5 items-center z-20">
          {/* Mute button */}
          <motion.button
            onClick={toggleMute}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isMuted
                ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 ring-4 ring-red-500/40 shadow-red-500/50'
                : 'bg-white/25 hover:bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-white/20'
            } text-white`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicrophoneOutlineIcon className="w-8 h-8" />
            ) : (
              <MicrophoneIcon className="w-8 h-8" />
            )}
          </motion.button>

          {/* Video toggle button (for video calls) or Request video (for voice calls) */}
          {currentCallType === 'video' ? (
            <motion.button
              onClick={toggleVideo}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                !isVideoEnabled
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 ring-4 ring-red-500/40 shadow-red-500/50'
                  : 'bg-white/25 hover:bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-white/20'
              } text-white`}
              title={
                allowOneWay && !contextActiveCall?.isCaller && !isVideoEnabled
                  ? 'Enable your camera to start two-way video'
                  : isVideoEnabled
                    ? 'Turn off video'
                    : 'Turn on video'
              }
              disabled={false}
            >
              <VideoCameraIcon className="w-8 h-8" />
            </motion.button>
          ) : (
            <motion.button
              onClick={async () => {
                // Request video upgrade (new flow)
                if (requestVideoUpgrade) {
                  await requestVideoUpgrade();
                } else {
                  // Fallback to old convert method
                  if (convertCall) {
                    await convertCall('video');
                  } else {
                    toast.error('Video upgrade not available');
                  }
                }
              }}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 backdrop-blur-xl border-2 border-blue-400/40 shadow-blue-500/50 text-white"
              title="Request video call"
            >
              <VideoCameraIcon className="w-8 h-8" />
            </motion.button>
          )}

          {/* End call button - Larger and more prominent */}
          <motion.button
            onClick={() => {
              endCall();
              onClose();
            }}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.85 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white flex items-center justify-center transition-all duration-300 shadow-2xl ring-4 ring-red-500/40 shadow-red-500/50"
            title="End call"
          >
            <XMarkIcon className="w-10 h-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

