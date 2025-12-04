import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { callService } from '../services/callService';
import toast from 'react-hot-toast';
import queueToast from '../utils/toastQueue';
import { API_URL } from '../utils/constants';

export const useAgoraCall = () => {
  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const clientRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const isEndingCallRef = useRef(false);
  const isJoiningCallRef = useRef(false);
  const callDataRef = useRef(null);
  const isInCallRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    callDataRef.current = callData;
  }, [callData]);

  useEffect(() => {
    isInCallRef.current = isInCall;
  }, [isInCall]);

  // Initialize Agora client
  useEffect(() => {
    const initClient = async () => {
      try {
        // Set log level to WARNING to reduce console noise (only show warnings and errors)
        // Set to LOG_LEVEL.INFO or LOG_LEVEL.DEBUG if you need more verbose logging
        AgoraRTC.setLogLevel(2); // 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=NONE
        
        const agoraClient = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8'
        });
        setClient(agoraClient);
        clientRef.current = agoraClient;

        // Handle user joined
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);

          if (mediaType === 'video') {
            setRemoteUsers((prev) => {
              if (!prev.find((u) => u.uid === user.uid)) {
                return [...prev, user];
              }
              return prev;
            });
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        // Handle user left
        agoraClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
        });

        // Handle user left channel - automatically end call when remote user leaves
        agoraClient.on('user-left', async (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));

          // If we're in a call and the remote user left, end the call
          // Use refs to get current values (avoid stale closure)
          const currentIsInCall = isInCallRef.current;
          const currentCallData = callDataRef.current;
          const currentIsEnding = isEndingCallRef.current;

          if (currentIsInCall && currentCallData && !currentIsEnding) {
            // Trigger end call via custom event (endCallRef will handle it)
            // This ensures the other party's call is properly cleaned up
            window.dispatchEvent(new CustomEvent('agora-user-left', {
              detail: { callId: currentCallData.callId }
            }));
          }
        });
      } catch (error) {
        toast.error('Failed to initialize call system');
      }
    };

    initClient();

    return () => {
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
      }
    };
  }, []);

  // Start call duration timer
  const startDurationTimer = () => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }
    }, 1000);
  };

  // Stop call duration timer
  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    startTimeRef.current = null;
    setCallDuration(0);
  };

  // Initiate call (only API call, doesn't join Agora yet)
  const initiateCall = async (calleeId, callType, confirmReturnCall = false) => {
    try {
      // 1. Initiate call on server
      const initiateResponse = await callService.initiateCall(calleeId, callType, confirmReturnCall);

      // Handle CONFIRM_RETURN_CALL response (should not happen if confirmReturnCall is true)
      if (!initiateResponse.success && initiateResponse.code === 'CONFIRM_RETURN_CALL') {
        // This should be handled by the UI before calling initiateCall
        // But if it happens, return the response so UI can handle it
        return { requiresConfirmation: true, calleeName: initiateResponse.calleeName };
      }

      if (!initiateResponse.success) {
        // Handle offline user case
        if (initiateResponse.code === 'CALLEE_OFFLINE' || initiateResponse.code === 'CALL_BUSY_OR_OFFLINE') {
          // Don't show toast here - the white card notification will be shown via call-missed socket event
          return { isOffline: true, callId: initiateResponse.callId || null };
        }
        if (initiateResponse.code === 'PREMIUM_REQUIRED') {
          toast.error('Upgrade to Premium to use voice & video calls');
        } else if (initiateResponse.code === 'INSUFFICIENT_COINS') {
          toast.error('Not enough coins to start call');
        } else {
          // Show error toast for other failures
          toast.error(initiateResponse.message || 'Failed to initiate call');
        }
        return null;
      }

      // Extract call object from response
      const call = initiateResponse?.call;

      // Validate call data exists
      if (!call) {
        toast.error('Invalid call response from server - missing call data');
        return null;
      }

      // Validate required fields
      if (!call.callId) {
        toast.error('Invalid call response - missing call ID');
        return null;
      }

      if (!call.channelName) {
        toast.error('Invalid call response - missing channel name');
        return null;
      }

      // Validate and normalize token - Agora SDK requires null instead of empty string
      // If token is empty, undefined, or whitespace, use null
      const token = (call.agoraToken && typeof call.agoraToken === 'string' && call.agoraToken.trim() !== '')
        ? call.agoraToken.trim()
        : null;

      // Token validation is handled above - token can be null for tokenless mode

      // Validate that callId exists
      if (!call.callId) {
        toast.error('Invalid call response - missing call ID');
        return null;
      }

      // Return call data (don't join yet - wait for accept)
      const normalizedCall = {
        ...call,
        callId: call.callId, // Ensure callId is explicitly set
        agoraToken: token,
        calleeId,
        callType,
        // Include coin information from response
        requiredReserve: call.requiredReserve || 0,
        pricing: call.pricing || {},
        calleeFreeMinutesRemaining: call.calleeFreeMinutesRemaining || 0,
      };
      setCallData(normalizedCall);
      return normalizedCall;
    } catch (error) {
      // Cleanup: Leave Agora channel if joined
      try {
        if (clientRef.current) {
          const connectionState = clientRef.current.connectionState;
          if (connectionState === 'CONNECTING' || connectionState === 'CONNECTED') {
            await clientRef.current.leave();
            }
        }
      } catch (cleanupError) {
        }

      // Cleanup: Stop and close tracks (use state values)
      try {
        if (localAudioTrack) {
          localAudioTrack.stop();
          localAudioTrack.close();
          setLocalAudioTrack(null);
          }
        if (localVideoTrack) {
          localVideoTrack.stop();
          localVideoTrack.close();
          setLocalVideoTrack(null);
          }
      } catch (trackError) {
        }

      // Reset state
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setIsInCall(false);

      // Extract error message from axios error response
      const errorData = error.response?.data || {};
      const errorCode = errorData.code;
      const errorMessage = errorData.message || error.message || 'Failed to start call';

      // Show user-friendly error messages
      if (errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Upgrade to Premium to use voice & video calls');
      } else if (errorCode === 'INSUFFICIENT_COINS') {
        toast.error(`Not enough coins to start call. Required: ${errorData.requiredCoins || 'N/A'}, Available: ${errorData.availableCoins || 0}`);
      } else if (errorCode === 'USER_NOT_FOUND') {
        toast.error('User not found');
      } else if (error.response?.status === 403) {
        toast.error(errorMessage || 'You don\'t have permission to make this call');
      } else {
        toast.error(errorMessage);
      }

      return null;
    }
  };

  // Join call after accept (connects to Agora and starts call)
  const joinCall = async (callData) => {
    // Prevent multiple simultaneous join attempts
    if (isJoiningCallRef.current) {
      return null;
    }

    // Prevent joining if we're ending a call
    if (isEndingCallRef.current) {
      return null;
    }

    isJoiningCallRef.current = true;
    let audioTrack = null;
    let videoTrack = null;

    try {
      const agoraAppId = import.meta.env.VITE_AGORA_APP_ID;

      if (!agoraAppId) {
        toast.error('Agora App ID not configured');
        return null;
      }

      if (!callData || !callData.channelName) {
        return null;
      }

      if (!clientRef.current) {
        toast.error('Call system not ready');
        return null;
      }

      // 1. Get local tracks
      if (callData.callType === 'voice' || callData.callType === 'video') {
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          setLocalAudioTrack(audioTrack);
          } catch (error) {
          toast.error('Microphone permission denied');
          return null;
        }
      }

      // Handle video track creation based on call type and one-way mode
      if (callData.callType === 'video') {
        // Check if this is one-way video mode
        const isOneWay = callData.allowOneWay === true;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.userId || user._id;
        const isCaller = callData.callerId === userId;

        // In one-way mode, only caller creates video track, recipient receives only
        if (!isOneWay || isCaller) {
          try {
            videoTrack = await AgoraRTC.createCameraVideoTrack();
            setLocalVideoTrack(videoTrack);
            setIsVideoEnabled(true);
            } catch (error) {
            toast.error('Camera permission denied');
            // Don't return null - allow call to continue without video
            if (isOneWay && !isCaller) {
              // Recipient in one-way mode - this is expected, no video track
              } else {
              return null;
            }
          }
        } else {
          // Recipient in one-way mode - no video track, receive only
          setIsVideoEnabled(false);
        }
      }

      // 2. Join channel
      const token = (callData.agoraToken && typeof callData.agoraToken === 'string' && callData.agoraToken.trim() !== '')
        ? callData.agoraToken.trim()
        : null;

      // Check if client is already connected and leave if so
      const connectionState = clientRef.current.connectionState;
      if (connectionState === 'CONNECTING' || connectionState === 'CONNECTED') {
        try {
          // Wait a bit for any in-progress operations to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          await clientRef.current.leave();
          // Wait a bit more to ensure cleanup is complete
          await new Promise(resolve => setTimeout(resolve, 200));
          } catch (leaveError) {
          // Continue anyway - might already be disconnected
        }
      }

      // Double-check we're not ending the call
      if (isEndingCallRef.current) {
        return null;
      }

      try {
        await clientRef.current.join(
          agoraAppId,
          callData.channelName,
          token,
          callData.uid || null
        );
      } catch (joinError) {
        // Handle OPERATION_ABORTED specifically
        if (joinError.name === 'AgoraRTCException' && joinError.code === 'OPERATION_ABORTED') {
          // Don't show error toast for aborted operations - they're usually intentional
          return null;
        }
        throw joinError;
      }

      // 3. Publish local tracks
      if (audioTrack) {
        await clientRef.current.publish(audioTrack);
        }
      if (videoTrack) {
        await clientRef.current.publish(videoTrack);
        }

      // 4. Start call on server (reserve coins)
      const startResponse = await callService.startCall(callData.callId);

      // Check again if we're ending the call
      if (isEndingCallRef.current) {
        // Cleanup tracks
        if (audioTrack) {
          audioTrack.stop();
          audioTrack.close();
        }
        if (videoTrack) {
          videoTrack.stop();
          videoTrack.close();
        }
        // Leave channel
        try {
          await clientRef.current.leave();
        } catch (e) {
          }
        return null;
      }

      if (startResponse.success) {
        setIsInCall(true);
        startDurationTimer();
        setCallData(callData);
        toast.success('Call connected');
        return callData;
      } else {
        return null;
      }
    } catch (error) {
      // Handle OPERATION_ABORTED specifically
      if (error.name === 'AgoraRTCException' && error.code === 'OPERATION_ABORTED') {
        // Don't show error toast for aborted operations
        return null;
      }

      // Cleanup
      try {
        if (clientRef.current) {
          const connectionState = clientRef.current.connectionState;
          if (connectionState === 'CONNECTING' || connectionState === 'CONNECTED') {
            await clientRef.current.leave();
          }
        }
      } catch (cleanupError) {
        }

      if (audioTrack) {
        try {
          audioTrack.stop();
          audioTrack.close();
        } catch (e) {
          }
        setLocalAudioTrack(null);
      }
      if (videoTrack) {
        try {
          videoTrack.stop();
          videoTrack.close();
        } catch (e) {
          }
        setLocalVideoTrack(null);
      }

      toast.error('Failed to join call');
      return null;
    } finally {
      isJoiningCallRef.current = false;
    }
  };

  // End call
  const endCall = async () => {
    // Prevent multiple simultaneous end calls
    if (isEndingCallRef.current) {
      return;
    }

    // If we're joining, wait a bit for it to complete or cancel
    if (isJoiningCallRef.current) {
      // Wait up to 2 seconds for join to complete
      let waitCount = 0;
      while (isJoiningCallRef.current && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
    }

    isEndingCallRef.current = true;

    try {
      const currentCallData = callDataRef.current;

      // IMPORTANT: Notify server FIRST (before leaving channel) so socket event is sent immediately
      // This ensures the other party gets notified even if they haven't joined the Agora channel yet
        if (currentCallData && currentCallData.callId) {
          try {
            // Use Promise.race to ensure we don't wait too long, but still send the notification
          await Promise.race([
            callService.endCall(currentCallData.callId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]).catch(error => {
            if (error.message !== 'Timeout') {
              // Don't show error toast - the server will still process the call end via socket events
              // The transaction event will arrive via socket even if the API call fails
            } else {
              // Server will still process the call end, transaction will arrive via socket
            }
          });
          } catch (error) {
          // Continue with cleanup even if server call fails
        }
      }

      // IMPORTANT: Leave Agora channel AFTER notifying server
      // This ensures the other party gets the socket event first, then the user-left event
      if (clientRef.current) {
        try {
          const connectionState = clientRef.current.connectionState;
          if (connectionState === 'CONNECTING' || connectionState === 'CONNECTED' || isInCallRef.current) {
            await clientRef.current.leave();
            }
        } catch (error) {
          // Continue even if leave fails
        }
      }

      // Stop local tracks
      if (localAudioTrack) {
        try {
          localAudioTrack.stop();
          localAudioTrack.close();
        } catch (error) {
          }
        setLocalAudioTrack(null);
      }

      if (localVideoTrack) {
        try {
          localVideoTrack.stop();
          localVideoTrack.close();
        } catch (error) {
          }
        setLocalVideoTrack(null);
      }

      // Cleanup state
      setRemoteUsers([]);
      setIsInCall(false);
      stopDurationTimer();
      setCallData(null);
      setIsMuted(false);
      setIsVideoEnabled(true);

      } catch (error) {
      // Don't show error toast - the server will still process the call end
      // The transaction event will arrive via socket even if cleanup fails
      // Only show error for critical failures that prevent cleanup
      if (error.message && !error.message.includes('Timeout') && !error.message.includes('already')) {
        // Silent error - server will handle call end via other mechanisms
        }
    } finally {
      isEndingCallRef.current = false;
    }
  };

  // Expose endCall via ref so it can be called from event handlers
  const endCallRef = useRef(endCall);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  // Listen for user-left events and end call
  useEffect(() => {
    const handleUserLeft = async (event) => {
      const { callId } = event.detail;
      const currentCallData = callDataRef.current;
      const currentIsEnding = isEndingCallRef.current;

      // Only process if this is our call and we're not already ending it
      if (currentCallData && currentCallData.callId === callId && !currentIsEnding) {
        // Call endCall to properly clean up and notify server
        try {
          await endCallRef.current();
        } catch (error) {
          }
      }
    };

    window.addEventListener('agora-user-left', handleUserLeft);
    return () => {
      window.removeEventListener('agora-user-left', handleUserLeft);
    };
  }, []);

  // Toggle mute
  const toggleMute = async () => {
    if (localAudioTrack) {
      const newState = !localAudioTrack.enabled;
      await localAudioTrack.setEnabled(newState);
      setIsMuted(!newState);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    try {
      if (localVideoTrack) {
        // Toggle existing video track
        const newState = !localVideoTrack.enabled;
        await localVideoTrack.setEnabled(newState);
        setIsVideoEnabled(newState);

        // Emit video state update
        if (callDataRef.current?.callId) {
          const { getSocket } = require('../services/socketService');
          const socket = getSocket();
          if (socket) {
            socket.emit('call:video_state', {
              callId: callDataRef.current.callId,
              userId: JSON.parse(localStorage.getItem('user') || '{}').userId || JSON.parse(localStorage.getItem('user') || '{}')._id,
              cameraOn: newState,
            });
          }
        }
      } else if (isInCall && callDataRef.current) {
        // Enable video for the first time (create new track)
        try {
          const track = await AgoraRTC.createCameraVideoTrack();
          setLocalVideoTrack(track);
          setIsVideoEnabled(true);

          // Publish video track
          if (clientRef.current) {
            await clientRef.current.publish(track);
            }

          // Emit video state update
          const { getSocket } = require('../services/socketService');
          const socket = getSocket();
          if (socket && callDataRef.current?.callId) {
            socket.emit('call:video_state', {
              callId: callDataRef.current.callId,
              userId: JSON.parse(localStorage.getItem('user') || '{}').userId || JSON.parse(localStorage.getItem('user') || '{}')._id,
              cameraOn: true,
            });
          }
        } catch (error) {
          toast.error('Failed to enable camera. Please check permissions.');
        }
      }
    } catch (error) {
      toast.error('Failed to toggle camera');
    }
  };

  return {
    client,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isInCall,
    callData,
    callDuration,
    isMuted,
    isVideoEnabled,
    initiateCall,
    joinCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};

