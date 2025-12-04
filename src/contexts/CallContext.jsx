import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initializeSocket, getSocket } from '../services/socketService';
import { IncomingCallModal } from '../components/call/IncomingCallModal';
import { CallerWaitingModal } from '../components/call/CallerWaitingModal';
import { CallModal } from '../components/call/CallModal';
import { CallbackRequestModal } from '../components/call/CallbackRequestModal';
import { VideoUpgradeRequestModal } from '../components/call/VideoUpgradeRequestModal';
import { useAgoraCall } from '../hooks/useAgoraCall';
import { callService } from '../services/callService';
import toast from 'react-hot-toast';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  // Return default values if context is not available (graceful degradation)
  if (!context) {
    return {
      startCall: null,
      endCall: null,
      activeCall: null,
      isInCall: false,
      callDuration: 0,
      isMuted: false,
      isVideoEnabled: false,
      toggleMute: () => {},
      toggleVideo: () => {},
    };
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerWaiting, setCallerWaiting] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callbackRequest, setCallbackRequest] = useState(null);
  const [videoUpgradeRequest, setVideoUpgradeRequest] = useState(null);
  const callerWaitingRef = useRef(null);
  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);
  const rejoinAttemptedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    callerWaitingRef.current = callerWaiting;
  }, [callerWaiting]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const {
    client,
    localVideoTrack,
    remoteUsers,
    isInCall,
    callDuration,
    isMuted,
    isVideoEnabled,
    initiateCall: agoraInitiateCall,
    joinCall: agoraJoinCall,
    endCall: agoraEndCall,
    toggleMute,
    toggleVideo,
  } = useAgoraCall();

  // Initialize socket when user is available
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.userId && !user?._id) return;

    // Normalize userId - use _id if userId is not available
    const userId = user?.userId || user?._id;

    // Initialize socket with normalized userId
    const socket = initializeSocket(userId);

    // Ensure socket is connected and room is joined
    if (socket) {
      // If already connected, join room immediately
      if (socket.connected) {
        socket.emit('join-user-room', userId);
        } else {
        // Wait for connection then join room
        socket.once('connect', () => {
          socket.emit('join-user-room', userId);
          });
      }
    }

    // Listen for incoming calls
    const handleIncomingCall = (callData) => {
      // Validate call data
      if (!callData || !callData.callId) {
        return;
      }

      // Clear any existing incoming call first
      setIncomingCall(null);
      // Set new incoming call (use setTimeout to ensure state update)
      setTimeout(() => {
        setIncomingCall(callData);
      }, 100);
    };

    // Listen for call accepted (both caller and callee receive this)
    const handleCallAccepted = async (callData) => {
      setIncomingCall(null);

      // Determine if we're the caller or callee
      const isCaller = callData.callerId === userId;

      // Clear caller waiting if we're the caller
      if (isCaller && callerWaitingRef.current && callerWaitingRef.current.callId === callData.callId) {
        setCallerWaiting(null);
      }

      // Join the call with Agora (both parties join after accept)
      try {
        const call = await agoraJoinCall(callData);
        if (call) {
          // Set active call with proper info
          // For caller: show callee info
          // For callee: show caller info
          const otherPartyId = isCaller ? callData.calleeId : callData.callerId;
          const otherPartyName = isCaller ? callData.calleeName : callData.callerName;

          setActiveCall({
            ...callData,
            calleeId: otherPartyId,
            calleeName: otherPartyName || 'User',
            // Preserve coin information if available (from callerWaiting or callData)
            requiredReserve: callData.requiredReserve || callerWaiting?.requiredReserve || 0,
            pricing: callData.pricing || callerWaiting?.pricing || {},
            calleeFreeMinutesRemaining: callData.calleeFreeMinutesRemaining || callerWaiting?.calleeFreeMinutesRemaining || 0,
          });

          // Open call modal only after successful Agora connection
          setIsCallModalOpen(true);

          // Success - do NOT show any error toast
          } else {
          // Only show error if Agora join actually failed
          toast.error('Failed to join call');
        }
      } catch (error) {
        // Only show error for actual failures, not for successful accepts
        // Only show toast if it's a real error, not a successful accept
        const errorMessage = error.message || '';
        if (errorMessage && !errorMessage.includes('already joined') &&
            !errorMessage.toLowerCase().includes('attend') &&
            !errorMessage.toLowerCase().includes('failed to attend')) {
          toast.error('Failed to join call');
        }
      }
    };

    // Listen for call declined
    const handleCallDeclined = (data) => {
      setCallerWaiting(null);
      toast.error('Call was declined');
    };

      // Listen for call ended (process for active call, waiting call, or incoming call)
      const handleCallEnded = (data) => {
        // Use ref to get current values (avoid stale closure)
        const currentActiveCall = activeCallRef.current;
        const currentCallerWaiting = callerWaitingRef.current;
        const currentIncomingCall = incomingCallRef.current;

        // Process if this is for our active call, caller waiting, or incoming call
        const isActiveCall = currentActiveCall && currentActiveCall.callId === data.callId;
        const isWaitingCall = currentCallerWaiting && currentCallerWaiting.callId === data.callId;
        const isIncomingCallMatch = currentIncomingCall && currentIncomingCall.callId === data.callId;

          if (isActiveCall || isWaitingCall || isIncomingCallMatch) {
            // Dispatch custom event to refresh free minutes
          window.dispatchEvent(new CustomEvent('call-ended', { detail: data }));

          // Clean up all call states immediately
          setActiveCall(null);
          setIsCallModalOpen(false);
          setCallerWaiting(null);
          setIncomingCall(null);

          // Clean up Agora connection (this will handle leaving channel and cleanup)
          // Use a timeout to ensure state is cleaned up even if agoraEndCall takes time
          Promise.race([
            agoraEndCall(),
            new Promise((resolve) => setTimeout(resolve, 1000))
          ]).catch(err => {
            // Even if agoraEndCall fails, we've already cleaned up state
          });

          // Show appropriate message based on call status
          if (data.callTransaction && data.durationSeconds && data.durationSeconds > 0) {
            const minutes = Math.ceil(data.durationSeconds / 60);
            toast.success(`Call ended. Duration: ${minutes} min`);
          } else if (data.status === 'cancelled') {
            toast('Call was cancelled', {
              icon: 'ℹ️',
              duration: 3000,
            });
          } else if (data.status === 'missed') {
            // Don't show toast for missed calls - already handled elsewhere
          } else {
            toast('Call ended', {
              icon: '📴',
              duration: 2000,
            });
          }
        } else {
          }
      };

      // Listen for missed call (callee offline)
      const handleCallMissed = (data) => {
        // Dismiss any existing toasts to prevent duplicates
        toast.dismiss();

        // Show beautiful offline notification
        toast.error(
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">User is Offline</p>
              <p className="text-sm text-gray-600">Call recorded as missed. They'll see it when they come back online.</p>
            </div>
          </div>,
          {
            duration: 5000,
            style: {
              background: 'white',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              maxWidth: '400px',
            },
          }
        );

        // Clear caller waiting if we're the caller
        if (callerWaitingRef.current && callerWaitingRef.current.callId === data.callId) {
          setCallerWaiting(null);
        }
      };

    // Listen for callBusy event (user is already in a call)
    const handleCallBusy = (data) => {
      toast.error(
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">User is Busy</p>
            <p className="text-sm text-gray-600">{data.calleeName || 'User'} is already on another call. Callback request sent.</p>
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            background: 'white',
            border: '1px solid #fef3c7',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
          },
        }
      );

      // Clear caller waiting if we're the caller
      if (callerWaitingRef.current) {
        setCallerWaiting(null);
      }
    };

    // Listen for callbackRequest event (user wants to talk to you)
    const handleCallbackRequest = (data) => {
      // Store callback request in state to show modal
      setCallbackRequest(data);
    };

    // Listen for call converted (voice to video or vice versa)
    const handleCallConverted = (data) => {
      // Update active call type if this is our active call
      if (activeCallRef.current && activeCallRef.current.callId === data.callId) {
        setActiveCall((prev) => ({
          ...prev,
          callType: data.newCallType,
        }));
        toast.success(`Call converted to ${data.newCallType === 'video' ? 'video' : 'voice'}`);
      }
    };

    // Listen for video upgrade request
    const handleVideoUpgradeRequest = (data) => {
      // Only show if we're in an active call
      if (activeCallRef.current && activeCallRef.current.callId === data.callId) {
        setVideoUpgradeRequest(data);
      }
    };

    // Listen for video upgrade response
    const handleVideoUpgradeResponse = (data) => {
      if (activeCallRef.current && activeCallRef.current.callId === data.callId) {
        if (data.accepted) {
          // Two-way video accepted - update call type and pricing
          setActiveCall((prev) => ({
            ...prev,
            callType: 'video',
            allowOneWay: false,
            pricing: {
              coinsPerMinute: 40, // Video rate
            },
          }));
          toast.success('Video upgrade accepted! Starting two-way video... Rate: 40 coins/min');
        } else if (data.allowOneWay) {
          // One-way video allowed - still video rate for billing
          setActiveCall((prev) => ({
            ...prev,
            callType: 'video',
            allowOneWay: true,
            pricing: {
              coinsPerMinute: 40, // Video rate (caller pays)
            },
          }));
          toast.info('One-way video enabled - recipient can view your video. Rate: 40 coins/min');
        } else {
          // Completely declined - stay on voice
          toast('Video upgrade request declined. Continuing as voice call (20 coins/min)', { icon: 'ℹ️' });
        }
        // Clear any pending request
        setVideoUpgradeRequest(null);
      }
    };

    // Listen for participant rejoin
    const handleParticipantRejoin = (data) => {
      if (activeCallRef.current && activeCallRef.current.callId === data.callId) {
        toast.info('Other party reconnected', { duration: 3000 });
      }
    };

    // Listen for video state updates
    const handleVideoState = (data) => {
      if (activeCallRef.current && activeCallRef.current.callId === data.callId) {
        // Update video state - this can be used to show/hide placeholders
        // The actual video track handling is done by Agora SDK
        // This is mainly for UI updates
      }
    };

    // Handle socket disconnection
    const handleDisconnect = () => {
      // If we're in a call, try to reconnect
      if (activeCallRef.current || callerWaitingRef.current || incomingCallRef.current) {
        toast.error('Connection lost. Attempting to reconnect...', { duration: 3000 });
      }
    };

    // Handle socket reconnection
    const handleReconnect = () => {
      // Rejoin user room after reconnection
      if (userId) {
        socket.emit('join-user-room', userId);
        }
      // If we were in a call, try to rejoin
      if (activeCallRef.current) {
        toast.info('Reconnected. Call may need to be restarted.', { duration: 3000 });
      }
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-declined', handleCallDeclined);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-missed', handleCallMissed);
    socket.on('callBusy', handleCallBusy);
    socket.on('callbackRequest', handleCallbackRequest);
    socket.on('call-converted', handleCallConverted);
    socket.on('call:upgrade_video_request', handleVideoUpgradeRequest);
    socket.on('call:upgrade_video_response', handleVideoUpgradeResponse);
    socket.on('call:participant_rejoin', handleParticipantRejoin);
    socket.on('call:video_state', handleVideoState);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-declined', handleCallDeclined);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-missed', handleCallMissed);
      socket.off('callBusy', handleCallBusy);
      socket.off('callbackRequest', handleCallbackRequest);
      socket.off('call-converted', handleCallConverted);
      socket.off('call:upgrade_video_request', handleVideoUpgradeRequest);
      socket.off('call:upgrade_video_response', handleVideoUpgradeResponse);
      socket.off('call:participant_rejoin', handleParticipantRejoin);
      socket.off('call:video_state', handleVideoState);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleReconnect);
    };
  }, [agoraJoinCall, agoraEndCall]);

  const handleIncomingCallAccept = useCallback(async (acceptedCallData) => {
    setIncomingCall(null);
    // The socket event will trigger the actual call start
  }, []);

  const handleIncomingCallDecline = useCallback((reason) => {
    setIncomingCall(null);
    if (reason === 'timeout') {
      toast.error('Call timed out');
    }
  }, []);

  const handleCallerWaitingCancel = useCallback(async () => {
    if (callerWaiting?.callId) {
      try {
        // Cancel the call by ending it
        await agoraEndCall();
        setCallerWaiting(null);
      } catch (error) {
        }
    }
    setCallerWaiting(null);
  }, [callerWaiting, agoraEndCall]);

  const startCall = useCallback(async (calleeId, calleeName, calleeAvatar, callType, confirmReturnCall = false, onRequiresConfirmation = null) => {
    try {
      // Ensure socket is connected before initiating call
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.userId || user?._id;

      if (!userId) {
        toast.error('User not authenticated. Please log in again.');
        return;
      }

      let socket = getSocket();

      // Ensure socket is initialized and connected
      if (!socket) {
        socket = initializeSocket(userId);
      }

      // Wait for socket connection with timeout
      if (!socket.connected) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout'));
          }, 3000);

          if (socket.connected) {
            clearTimeout(timeout);
            resolve();
          } else {
            socket.once('connect', () => {
              clearTimeout(timeout);
              resolve();
            });
            socket.once('connect_error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          }
        }).catch((error) => {
          toast.error('Failed to connect. Please check your internet connection and try again.');
          throw error;
        });
      }

      // Ensure room is joined
      if (socket && socket.connected) {
        socket.emit('join-user-room', userId);
        } else {
        throw new Error('Socket connection failed');
      }

      // Show caller waiting modal
      setCallerWaiting({
        calleeId,
        calleeName,
        calleeAvatar,
        callType,
      });

      // Initiate call - this will trigger socket event to callee (doesn't join Agora yet)
      const response = await agoraInitiateCall(calleeId, callType, confirmReturnCall);

      if (!response) {
        // Call initiation failed (error already shown in useAgoraCall)
        setCallerWaiting(null);
        return;
      }

      // Handle return call confirmation requirement (must check before callId check)
      if (response && response.requiresConfirmation === true) {
        // Server is asking for confirmation before proceeding
        setCallerWaiting(null);
        // Notify the caller that confirmation is needed
        if (onRequiresConfirmation) {
          onRequiresConfirmation({
            calleeName: response.calleeName || calleeName,
            calleeId,
            callType,
          });
        } else {
          }
        return;
      }

      // If response indicates offline, don't show duplicate toast (socket will handle it)
      if (response.isOffline) {
        setCallerWaiting(null);
        // Don't show toast here - socket event will handle it
        return;
      }

      // If response indicates callee is busy, don't show duplicate toast (socket will handle it)
      if (response.code === 'CALLEE_BUSY' || response.callbackRequested) {
        setCallerWaiting(null);
        // Don't show toast here - socket event will handle it
        return;
      }

      // Check if response has callId (successful initiation)
      // The response from agoraInitiateCall should be normalizedCall with callId
      const callId = response?.callId;
      if (callId) {
        // Store call data for waiting modal, including coin information
        setCallerWaiting((prev) => ({
          ...prev,
          callId: callId,
          requiredReserve: response?.requiredReserve || response?.call?.requiredReserve || 0,
          pricing: response?.pricing || response?.call?.pricing || {},
          calleeFreeMinutesRemaining: response?.calleeFreeMinutesRemaining || response?.call?.calleeFreeMinutesRemaining || 0,
        }));
      } else {
        // Unexpected response format - log for debugging
        setCallerWaiting(null);
        toast.error('Failed to initiate call - invalid response from server');
      }
    } catch (error) {
      setCallerWaiting(null);
      toast.error('Failed to initiate call');
    }
  }, [agoraInitiateCall]);

  const endCall = useCallback(async () => {
    try {
      if (activeCall?.callId) {
        // End call on server first
        try {
          await callService.endCall(activeCall.callId);
        } catch (error) {
          // Continue with cleanup even if server call fails
        }
        // Then end Agora call
        await agoraEndCall();
      }

      // Clean up all call states
      setActiveCall(null);
      setIsCallModalOpen(false);
      setCallerWaiting(null);
      setIncomingCall(null);
      } catch (error) {
      // Still clean up state even if there's an error
      setActiveCall(null);
      setIsCallModalOpen(false);
      setCallerWaiting(null);
      setIncomingCall(null);
      toast.error('Error ending call. Please try again.');
    }
  }, [activeCall, agoraEndCall]);

  const convertCall = useCallback(async (newCallType) => {
    if (!activeCall?.callId) {
      toast.error('No active call to convert');
      return;
    }

    try {
      const response = await callService.convertCall(activeCall.callId, newCallType);
      if (response.success) {
        // Update active call type
        setActiveCall((prev) => ({
          ...prev,
          callType: newCallType,
        }));
        // Update pricing for new call type
        const newPricing = newCallType === 'video'
          ? { coinsPerMinute: 40 }
          : { coinsPerMinute: 20 };
        setActiveCall((prev) => ({
          ...prev,
          pricing: newPricing,
        }));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to convert call';
      toast.error(errorMessage);
    }
  }, [activeCall]);

  const requestVideoUpgrade = useCallback(async () => {
    if (!activeCall?.callId) {
      toast.error('No active call');
      return;
    }

    if (activeCall.callType === 'video') {
      toast.error('Call is already a video call');
      return;
    }

    try {
      const response = await callService.requestVideoUpgrade(activeCall.callId);
      if (response.success) {
        toast.success('Video request sent — waiting for response', { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to request video upgrade';
      toast.error(errorMessage);
    }
  }, [activeCall]);

  const respondVideoUpgrade = useCallback(async (accepted, allowOneWay = false) => {
    if (!videoUpgradeRequest?.callId) {
      return;
    }

    try {
      const response = await callService.respondVideoUpgrade(videoUpgradeRequest.callId, accepted, allowOneWay);
      if (response.success) {
        if (accepted) {
          // Two-way video accepted
          setActiveCall((prev) => ({
            ...prev,
            callType: 'video',
            allowOneWay: false,
          }));
          toast.success('Video upgrade accepted!');
        } else if (allowOneWay) {
          // One-way video allowed
          setActiveCall((prev) => ({
            ...prev,
            callType: 'video',
            allowOneWay: true,
          }));
          toast.info('One-way video enabled - you can view their video');
        } else {
          // Completely declined
          toast('Video upgrade declined', { icon: 'ℹ️' });
        }
      }
      setVideoUpgradeRequest(null);
    } catch (error) {
      toast.error('Failed to respond to video upgrade request');
    }
  }, [videoUpgradeRequest]);

  // Auto-rejoin on page load - only if there's a truly active call
  useEffect(() => {
    const attemptRejoin = async () => {
      // Only attempt once per session
      if (rejoinAttemptedRef.current) return;
      rejoinAttemptedRef.current = true;

      // Check if user is authenticated before attempting rejoin
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('activeCallId');
        return;
      }

      try {
        // Check for active call (only returns calls with status 'started')
        const response = await callService.getActiveCall();
        if (response.success && response.call && response.call.status === 'started') {
          const call = response.call;
          // Generate device ID
          let deviceId = localStorage.getItem('deviceId');
          if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('deviceId', deviceId);
          }

          // Rejoin call
          const rejoinResponse = await callService.rejoinCall(call.callId, deviceId);
          if (rejoinResponse.success) {
            // Store call info in localStorage for persistence
            localStorage.setItem('activeCallId', call.callId);

            // Set active call but DON'T open modal yet - wait for Agora connection
            setActiveCall({
              callId: call.callId,
              callType: call.callType,
              calleeId: call.otherParty.id,
              calleeName: call.otherParty.name,
              channelName: rejoinResponse.call.channelName,
              agoraToken: rejoinResponse.call.agoraToken,
              isCaller: call.isCaller,
              allowOneWay: rejoinResponse.call.allowOneWay || false,
            });

            // Join Agora call
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.userId || user._id;
            const agoraData = {
              callId: call.callId,
              channelName: rejoinResponse.call.channelName,
              agoraToken: rejoinResponse.call.agoraToken,
              uid: rejoinResponse.call.uid,
              callType: call.callType,
              allowOneWay: rejoinResponse.call.allowOneWay || false,
              callerId: call.isCaller ? userId : call.otherParty.id,
              calleeId: call.isCaller ? call.otherParty.id : userId,
            };

            const joined = await agoraJoinCall(agoraData);
            // Only open modal if Agora connection is successful
            if (joined) {
              // Wait a moment to ensure connection is established
              setTimeout(() => {
                setIsCallModalOpen(true);
                toast.success('Reconnected to call', { duration: 3000 });
              }, 500);
            } else {
              // If rejoin fails, clear the call state
              setActiveCall(null);
              localStorage.removeItem('activeCallId');
            }
          } else {
            // Rejoin failed, clear stale data
            localStorage.removeItem('activeCallId');
          }
        } else {
          // No active call found, clear any stale call data
          localStorage.removeItem('activeCallId');
        }
      } catch (error) {
        // Handle 401 (unauthorized) gracefully - user might not be logged in yet
        if (error.response?.status === 401 || error.message?.includes('401')) {
          localStorage.removeItem('activeCallId');
          return;
        }
        localStorage.removeItem('activeCallId');
        // Don't show error to user on page load - it's normal if there's no active call
      }
    };

    // Wait a bit for socket to connect before attempting rejoin
    const timer = setTimeout(() => {
      attemptRejoin();
    }, 1500);

    return () => clearTimeout(timer);
  }, [agoraJoinCall]);

  // Clear active call ID when call ends
  useEffect(() => {
    if (!activeCall) {
      localStorage.removeItem('activeCallId');
    } else {
      localStorage.setItem('activeCallId', activeCall.callId);
    }
  }, [activeCall]);

  // Hide navbars when any call UI is active
  useEffect(() => {
    const shouldHide = incomingCall || callerWaiting || isCallModalOpen;

    if (shouldHide) {
      document.body.classList.add('call-active');
      const topNav = document.querySelector('header, nav[class*="fixed"][class*="top-0"], [class*="GlobalNavBar"]');
      const bottomNav = document.querySelector('nav[class*="fixed"][class*="bottom-0"], [class*="BottomNav"]');

      if (topNav) {
        topNav.style.display = 'none';
        topNav.setAttribute('data-call-hidden', 'true');
      }
      if (bottomNav) {
        bottomNav.style.display = 'none';
        bottomNav.setAttribute('data-call-hidden', 'true');
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('call-active');
      const hiddenNavs = document.querySelectorAll('[data-call-hidden="true"]');
      hiddenNavs.forEach(nav => {
        nav.style.display = '';
        nav.removeAttribute('data-call-hidden');
      });
      document.body.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('call-active');
      const hiddenNavs = document.querySelectorAll('[data-call-hidden="true"]');
      hiddenNavs.forEach(nav => {
        nav.style.display = '';
        nav.removeAttribute('data-call-hidden');
      });
      document.body.style.overflow = '';
    };
  }, [incomingCall, callerWaiting, isCallModalOpen]);

  return (
    <CallContext.Provider
      value={{
        startCall,
        endCall,
        convertCall,
        requestVideoUpgrade,
        respondVideoUpgrade,
        activeCall,
        isInCall,
        callDuration,
        isMuted,
        isVideoEnabled,
        toggleMute,
        toggleVideo,
      }}
    >
      {children}

      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={!!incomingCall}
        onClose={() => setIncomingCall(null)}
        callData={incomingCall}
        onAccept={handleIncomingCallAccept}
        onDecline={handleIncomingCallDecline}
      />

      {/* Callback Request Modal */}
      <CallbackRequestModal
        isOpen={!!callbackRequest}
        onClose={() => setCallbackRequest(null)}
        callbackRequest={callbackRequest}
      />

      {/* Caller Waiting Modal */}
      <CallerWaitingModal
        isOpen={!!callerWaiting}
        onClose={() => setCallerWaiting(null)}
        calleeName={callerWaiting?.calleeName}
        calleeAvatar={callerWaiting?.calleeAvatar}
        callType={callerWaiting?.callType}
        onCancel={handleCallerWaitingCancel}
      />

      {/* Active Call Modal */}
      {activeCall && activeCall.calleeId && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={endCall}
          calleeId={activeCall.calleeId}
          calleeName={activeCall.calleeName || 'User'}
          callType={activeCall.callType || 'voice'}
          // Pass call functions from useAgoraCall
          client={client}
          localVideoTrack={localVideoTrack}
          remoteUsers={remoteUsers}
          isInCall={isInCall}
          callDuration={callDuration}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          endCall={endCall}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          // Pass coin information
          requiredReserve={activeCall.requiredReserve || 0}
          pricing={activeCall.pricing || {}}
          calleeFreeMinutesRemaining={activeCall.calleeFreeMinutesRemaining || 0}
          // Pass one-way video state
          allowOneWay={activeCall.allowOneWay || false}
        />
      )}

      {/* Video Upgrade Request Modal */}
      <VideoUpgradeRequestModal
        isOpen={!!videoUpgradeRequest}
        onClose={() => setVideoUpgradeRequest(null)}
        requesterName={videoUpgradeRequest?.fromUserName}
        requesterAvatar={videoUpgradeRequest?.fromUserAvatar}
        onAccept={() => respondVideoUpgrade(true, false)}
        onDecline={() => respondVideoUpgrade(false, false)}
        onDeclineOneWay={() => respondVideoUpgrade(false, true)}
      />
    </CallContext.Provider>
  );
};

