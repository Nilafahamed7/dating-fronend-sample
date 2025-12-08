import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import { usePaymentGate } from '../../hooks/usePaymentGate';
import { chatService } from '../../services/chatService';
import { callService } from '../../services/callService';
import { presenceService } from '../../services/presenceService';
import { getSocket } from '../../services/socketService';
import MessageBubble from './MessageBubble';
import CallEventMessage from './CallEventMessage';
import ChatInput from './ChatInput';
import GiftModal from './GiftModal';
import ChatOptionsMenu from './ChatOptionsMenu';
import IceBreakerStrip from './IceBreakerStrip';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavBarContext } from '../common/GlobalNavBar';
import { LockClosedIcon, PhoneIcon, VideoCameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function ChatWindow({ matchId, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  const [pendingCallType, setPendingCallType] = useState('voice');
  const [callType, setCallType] = useState('voice');
  const [callInfo, setCallInfo] = useState(null);
  const [loadingCallInfo, setLoadingCallInfo] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [callEvents, setCallEvents] = useState([]);
  const seenTransactionIdsRef = useRef(new Set()); // Track seen transaction IDs for deduplication
  const [showReturnCallConfirm, setShowReturnCallConfirm] = useState(false);
  const [selectedMissedCall, setSelectedMissedCall] = useState(null);
  const [pendingReturnCall, setPendingReturnCall] = useState(null);
  const [autoReplyWindowExpiresAt, setAutoReplyWindowExpiresAt] = useState(null);
  const [replyWindowExpiresAt, setReplyWindowExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [chatExpirationTime, setChatExpirationTime] = useState(null);
  const [chatTimeRemaining, setChatTimeRemaining] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState('offline'); // 'online' | 'offline'

  // New state for auto-message features
  const [isLocked, setIsLocked] = useState(false);
  const [autoReplyRequiresSubscription, setAutoReplyRequiresSubscription] = useState(false);

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { checkSendMessage, refreshBalance, openPaymentGate } = usePaymentGate();
  const {
    setBottomContent,
    callTrigger,
    setNavbarTitle,
    setShowBackButton,
    setHomeRightAction
  } = useNavBarContext();

  // Determine user gender (used throughout component for premium/non-premium logic)
  const isFemale = user?.gender === 'female';

  // Fetch online status and listen for real-time updates
  useEffect(() => {
    if (!otherUser?._id) {
      setOnlineStatus('offline');
      return;
    }

    const fetchPresence = async () => {
      try {
        const response = await presenceService.getPresence(otherUser._id);
        if (response.success && response.data) {
          // Use onlineStatus if available, fallback to isOnline
          const status = response.data.onlineStatus || (response.data.isOnline ? 'online' : 'offline');
          setOnlineStatus(status);
        } else {
          // Default to offline if fetch fails
          setOnlineStatus('offline');
        }
      } catch (error) {
        // Default to offline on error
        setOnlineStatus('offline');
      }
    };

    fetchPresence();

    // Listen for real-time presence updates via socket
    const socket = getSocket();
    const handlePresenceUpdate = (data) => {
      if (data.userId === otherUser?._id || data.userId === otherUser?.userId) {
        // Use onlineStatus if available, fallback to isOnline
        const status = data.onlineStatus || (data.isOnline ? 'online' : 'offline');
        setOnlineStatus(status);
      }
    };

    if (socket) {
      socket.on('presence:update', handlePresenceUpdate);
    }

    return () => {
      if (socket) {
        socket.off('presence:update', handlePresenceUpdate);
      }
    };
  }, [otherUser?._id, otherUser?.userId]);

  // Update Navbar with User Info and Actions
  useEffect(() => {
    if (otherUser) {
      // Set the navbar title to the user's name
      setNavbarTitle(otherUser.name || 'User');
      setShowBackButton(true);

      // Right side: Action buttons
      setHomeRightAction(
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              setPendingCallType('voice');
              setShowCallConfirm(true);
            }}
            className="p-2 text-gray-700 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Voice Call"
            title="Voice Call"
          >
            <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => {
              setPendingCallType('video');
              setShowCallConfirm(true);
            }}
            className="p-2 text-gray-700 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Video Call"
            title="Video Call"
          >
            <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => navigate(`/profile/${otherUser._id}`)}
            className="p-2 text-gray-700 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="View Profile"
            title="View Profile"
          >
            <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <ChatOptionsMenu otherUser={otherUser} matchId={matchId} />
        </div>
      );
    }

    return () => {
      setNavbarTitle('');
      setShowBackButton(false);
      setHomeRightAction(null);
    };
  }, [otherUser, navigate, onlineStatus, matchId, setNavbarTitle, setShowBackButton, setHomeRightAction, user?.isPremium, user?.gender, chatTimeRemaining, isFemale]);

  // Get call context - will return default values if provider not available
  const callContext = useCall();
  const startCall = callContext?.startCall || null;

  // Refresh messages when user becomes premium (subscription success)
  const prevIsPremiumRef = useRef(user?.isPremium);
  useEffect(() => {
    if (matchId && user?.isPremium && !prevIsPremiumRef.current) {
      // User just became premium - refresh messages to clear reply windows
      loadMessages();
    }
    prevIsPremiumRef.current = user?.isPremium;
  }, [user?.isPremium, matchId]);

  // Listen for call trigger from navbar - show confirmation modal
  const lastCallTriggerRef = useRef(null);
  useEffect(() => {
    if (callTrigger && otherUser?._id) {
      const triggerTimestamp = callTrigger.timestamp || 0;
      const now = Date.now();

      // Only proceed if trigger is recent (within 2 seconds) and different from last trigger
      if (triggerTimestamp && (now - triggerTimestamp) < 2000 && lastCallTriggerRef.current !== triggerTimestamp) {
        lastCallTriggerRef.current = triggerTimestamp;
        setPendingCallType(callTrigger.type || 'voice');
        setShowCallConfirm(true);
      }
    }
  }, [callTrigger, otherUser?._id]);

  // Note: We show rates in the modal. Free minutes info will be available after call initiation.
  // For now, we show standard rates (5 coins/min for voice, 10 for video)

  // Handle call confirmation - use CallContext to start call
  // Direct call button clicks should bypass return call confirmation and call immediately
  const handleConfirmCall = () => {
    if (otherUser?._id && startCall) {
      startCall(
        otherUser._id,
        otherUser.name || 'User',
        otherUser.photos?.[0]?.url || null,
        pendingCallType,
        true, // confirmReturnCall = true to bypass backend missed call check for direct calls
        null // No confirmation callback needed for direct calls
      );
      setShowCallConfirm(false);
    }
  };

  const handleCancelCall = () => {
    setShowCallConfirm(false);
    setPendingCallType('voice');
  };

  const handleMissedCallTap = (callEvent) => {
    setSelectedMissedCall(callEvent);
    setShowReturnCallConfirm(true);
  };

  const handleReturnCallConfirm = () => {
    if (otherUser?._id && startCall) {
      // Determine call type from the missed call event or pending return call
      const callType = selectedMissedCall?.callType || pendingReturnCall?.callType || 'voice';
      const targetUserId = pendingReturnCall?.calleeId || otherUser._id;
      const targetUserName = pendingReturnCall?.calleeName || otherUser.name || 'User';
      const targetUserAvatar = otherUser.photos?.[0]?.url || null;

      // Pass confirmReturnCall: true to bypass backend confirmation check
      startCall(
        targetUserId,
        targetUserName,
        targetUserAvatar,
        callType,
        true, // confirmReturnCall = true
        null // No need for another confirmation callback
      );
      setShowReturnCallConfirm(false);
      setSelectedMissedCall(null);
      setPendingReturnCall(null);
    }
  };

  const handleReturnCallCancel = () => {
    setShowReturnCallConfirm(false);
    setSelectedMissedCall(null);
    setPendingReturnCall(null);
  };

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  const loadCallEvents = useCallback(async () => {
    if (!otherUser?._id || !user?._id) {
      return;
    }

    try {
      const response = await callService.getCallTransactions(1, 100, otherUser._id);
      if (response.success && response.transactions) {
        // Transform call transactions into event objects for display
        const events = response.transactions
          .filter((tx) => {
            // Deduplicate: skip if already seen
            const transactionKey = tx.id || tx.callId;
            if (seenTransactionIdsRef.current.has(transactionKey)) {
              return false;
            }
            seenTransactionIdsRef.current.add(transactionKey);
            return true;
          })
          .map((tx) => {
            // Determine caller and callee IDs based on isCaller flag
            const callerIdFromTx = tx.isCaller ? user._id : otherUser._id;
            const calleeIdFromTx = tx.isCaller ? otherUser._id : user._id;

            // Trust server's authoritative callType (voice or video, no mixed)
            const authoritativeCallType = tx.callType || 'voice';

            return {
              id: `call-${tx.id || tx.callId}`,
              type: 'call_event',
              callType: authoritativeCallType, // Trust server's callType
              status: tx.status === 'completed' || tx.status === 'ended' || tx.status === 'success' || tx.status === 'paid'
                ? 'completed'  // Map all success statuses to 'completed'
                : tx.status || 'completed', // Preserve other statuses (cancelled, missed, failed_billing)
              durationSeconds: tx.durationSeconds || 0,
              timestamp: tx.attemptedAt || tx.startedAt || tx.createdAt,
              callId: tx.callId,
              transactionId: tx.id, // IMPORTANT: Include transactionId for idempotency
              isCaller: tx.isCaller,
              callerId: callerIdFromTx,
              calleeId: calleeIdFromTx,
              billedCoins: tx.billedCoins || 0,
              receiverShare: tx.receiverShare || tx.girlShareCoins || 0,
              adminShare: tx.adminShare || 0,
              payerId: tx.payerId ? (tx.payerId.toString() === user._id.toString() ? user._id : (tx.payerId.toString() === otherUser._id.toString() ? otherUser._id : null)) : null,
              initiatorId: tx.isCaller ? user._id.toString() : otherUser._id.toString(),
              receiverId: tx.isCaller ? otherUser._id.toString() : user._id.toString(),
            };
          });

        // Merge with existing events (deduplication already handled above)
        setCallEvents(prev => {
          const existingKeys = new Set(prev.map(e => e.transactionId || e.callId));
          const newEvents = events.filter(e => !existingKeys.has(e.transactionId || e.callId));
          return [...prev, ...newEvents];
        });
      } else {
        // Set empty array if no transactions
        setCallEvents([]);
      }
    } catch (error) {
      // Don't show toast for call events - it's not critical
      // But set empty array on error to avoid stale data
      setCallEvents([]);
    }
  }, [otherUser?._id, user?._id, matchId]);

  // Merge messages and call events chronologically (must be defined before useEffects that use it)
  const mergedMessages = useMemo(() => {
    const allItems = [];
    const callEventIds = new Set(); // Track call event IDs to avoid duplicates

    // Add call events first (they take precedence)
    callEvents.forEach(event => {
      if (event && event.timestamp) {
        const eventId = event.callId || event.transactionId || event.id;
        if (eventId) {
          callEventIds.add(eventId);
        }
        allItems.push({
          ...event,
          itemType: 'call_event',
          timestamp: new Date(event.timestamp),
        });
      }
    });

    // Add messages (excluding system messages with call metadata that are already in callEvents)
    messages.forEach(msg => {
      // Check if this is a system message with call metadata
      if (msg.messageType === 'system' && msg.metadata?.type) {
        const callMetadata = msg.metadata;
        const eventId = callMetadata.callId || callMetadata.transactionId;

        // If this call event is already in callEvents, skip it to avoid duplicates
        if (eventId && callEventIds.has(eventId)) {
          return; // Skip this message, we already have the call event
        }

        // Convert system message with call metadata to call event
        if (callMetadata.type === 'call_completed' || callMetadata.type === 'missed_call') {
          const isCaller = callMetadata.payerId ? (callMetadata.payerId.toString() === user?._id?.toString()) :
            (msg.sender?._id?.toString() === user?._id?.toString() || msg.sender?.toString() === user?._id?.toString());

          // Determine status: use transaction status if available, otherwise infer from message type
          let callStatus = 'completed';
          if (callMetadata.status) {
            // Use status from metadata if available
            callStatus = (callMetadata.status === 'completed' || callMetadata.status === 'ended' || callMetadata.status === 'success' || callMetadata.status === 'paid')
              ? 'completed'
              : callMetadata.status;
          } else {
            // Fallback to message type
            callStatus = callMetadata.type === 'call_completed' ? 'completed' : 'missed';
          }

          allItems.push({
            id: `call-${eventId || msg._id}`,
            type: 'call_event',
            callType: callMetadata.callType || 'voice',
            status: callStatus,
            durationSeconds: callMetadata.durationSeconds || 0,
            timestamp: callMetadata.startedAt || callMetadata.attemptedAt || msg.createdAt || msg.timestamp,
            callId: callMetadata.callId,
            transactionId: callMetadata.transactionId,
            isCaller: isCaller,
            callerId: isCaller ? user?._id : otherUser?._id,
            calleeId: isCaller ? otherUser?._id : user?._id,
            billedCoins: callMetadata.billedCoins || 0,
            receiverShare: callMetadata.receiverShare || 0,
            payerId: callMetadata.payerId,
            itemType: 'call_event',
          });
          return; // Don't add as regular message
        }
      }

      // Regular message
      allItems.push({
        ...msg,
        itemType: 'message',
        timestamp: msg.createdAt || msg.timestamp || new Date(),
      });
    });

    // Sort by timestamp (oldest first)
    allItems.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    return allItems;
  }, [messages, callEvents, user?._id, otherUser?._id]);

  useEffect(() => {
    if (matchId && otherUser?._id) {
      loadMessages();
      loadCallEvents();
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadMessages();
        loadCallEvents();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [matchId, otherUser?._id]);

  // Listen for real-time call:transaction events
  useEffect(() => {
    if (!matchId || !otherUser?._id) return;

    const socket = getSocket();

    const handleCallTransaction = (transactionData) => {
      // Check if this transaction is for the current chat
      // Use threadId if available, otherwise match by participants
      const currentUserId = user?._id?.toString() || user?.userId?.toString();
      const otherUserId = otherUser?._id?.toString() || otherUser?.userId?.toString();
      const currentThreadId = matchId?.toString();

      // Match by threadId first (most reliable), then by participants
      const isForThisChat =
        (transactionData.threadId && transactionData.threadId === currentThreadId) ||
        (transactionData.initiatorId === currentUserId && transactionData.receiverId === otherUserId) ||
        (transactionData.initiatorId === otherUserId && transactionData.receiverId === currentUserId) ||
        transactionData.participants?.some(
          p => (p.id === otherUserId || p.id === otherUser?._id || p.id === otherUser?.userId)
        );

      if (isForThisChat) {
        // Transform transaction data to call event format
        const isCaller = transactionData.initiatorId === currentUserId;
        const callerId = transactionData.initiatorId;
        const calleeId = transactionData.receiverId;

        // Trust server's authoritative callType (voice or video, no mixed)
        const authoritativeCallType = transactionData.callType || 'voice';

        // Check for duplicate by transactionId (primary dedupe key) or callId (secondary)
        const transactionKey = transactionData.transactionId || transactionData.callId;
        if (seenTransactionIdsRef.current.has(transactionKey)) {
          return; // Ignore duplicate
        }

        const callEvent = {
          id: `call-transaction-${transactionData.transactionId || transactionData.callId}`,
          type: 'call_event',
          callType: authoritativeCallType, // Trust server's callType
          // Map status correctly - use server status directly
          // Map all success statuses to 'completed' for display
          status: (transactionData.status === 'paid' ||
            transactionData.status === 'completed' ||
            transactionData.status === 'ended' ||
            transactionData.status === 'success')
            ? 'completed'  // Map all success statuses to 'completed' for display
            : transactionData.status || 'completed', // Default to completed for unknown statuses (assume success)
          durationSeconds: transactionData.durationSeconds || 0,
          timestamp: transactionData.timestamp || new Date().toISOString(),
          callId: transactionData.callId,
          transactionId: transactionData.transactionId, // Primary dedupe key
          billedCoins: transactionData.totalCoins || transactionData.billedCoins || 0,
          receiverShare: transactionData.distribution?.femaleShare || transactionData.receiverShare || transactionData.femaleShare || 0,
          adminShare: transactionData.distribution?.adminShare || transactionData.adminShare || 0,
          payerUserId: transactionData.distribution?.payerId || transactionData.payerUserId,
          participants: transactionData.participants || [],
          rates: transactionData.rates || { voice: 20, video: 40 },
          initiatorId: transactionData.initiatorId,
          receiverId: transactionData.receiverId,
          // Determine if current user is caller (initiator)
          isCaller: isCaller,
          callerId: callerId,
          calleeId: calleeId,
        };

        // Mark as seen and add to call events
        seenTransactionIdsRef.current.add(transactionKey);
        setCallEvents(prev => {
          // Check if this transaction already exists by transactionId or callId (double-check)
          const existingIndex = prev.findIndex(e =>
            (e.transactionId && e.transactionId === callEvent.transactionId) ||
            (e.callId === callEvent.callId && callEvent.transactionId)
          );

          if (existingIndex >= 0) {
            // Update existing event with authoritative transaction data
            const updated = [...prev];
            updated[existingIndex] = callEvent;
            return updated;
          }

          // Remove any placeholder "failed" events for this callId (without transactionId)
          const filtered = prev.filter(e =>
            !(e.callId === callEvent.callId &&
              (e.status === 'failed' || e.status === 'error') &&
              !e.transactionId)
          );

          return [...filtered, callEvent];
        });

        // Reload call events after a delay to ensure we have complete data
        // This helps if the real-time event arrives before the transaction is fully persisted
        // Reduced delay to 2 seconds for faster updates
        setTimeout(() => {
          loadCallEvents();
        }, 2000);
      }
    };

    const handleBillingFailed = (data) => {
      // Check if this is for the current chat
      const currentUserId = user?._id?.toString() || user?.userId?.toString();
      const otherUserId = otherUser?._id?.toString() || otherUser?.userId?.toString();

      const isForThisChat =
        (data.initiatorId === currentUserId && data.receiverId === otherUserId) ||
        (data.initiatorId === otherUserId && data.receiverId === currentUserId);

      if (isForThisChat) {
        // Add a system message about billing failure
        const billingFailedEvent = {
          id: `billing-failed-${data.callId}`,
          type: 'call_event',
          callType: 'voice', // Default, could be enhanced
          status: 'failed',
          timestamp: data.timestamp || new Date().toISOString(),
          callId: data.callId,
          error: data.error,
          isBillingFailed: true,
        };

        setCallEvents(prev => {
          const exists = prev.some(e => e.id === billingFailedEvent.id);
          if (exists) return prev;
          return [...prev, billingFailedEvent];
        });
      }
    };

    socket.on('call:transaction', handleCallTransaction);
    socket.on('call:billing_failed', handleBillingFailed);

    return () => {
      socket.off('call:transaction', handleCallTransaction);
      socket.off('call:billing_failed', handleBillingFailed);
    };
  }, [matchId, otherUser?._id, user?._id, user?.userId, loadCallEvents]);

  // Reconciliation: Fetch missed transactions when window regains focus
  useEffect(() => {
    if (!matchId || !otherUser?._id || !user?._id) return;

    // Reconcile when window regains focus (user returns to app)
    const handleFocus = () => {
      loadCallEvents();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [matchId, otherUser?._id, user?._id, loadCallEvents]);

  // Scroll to bottom when messages first load
  useEffect(() => {
    if (!loading && mergedMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
        shouldAutoScrollRef.current = true;
      }, 100);
    }
  }, [loading, mergedMessages.length]);

  // Check if user is at bottom of scroll container
  const isAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Only auto-scroll if user is at bottom or if new message is from other user
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentMessageCount = mergedMessages.length;
    const lastItem = mergedMessages[mergedMessages.length - 1];
    const isNewMessageFromOther = lastItem && lastItem.itemType === 'message' &&
      (lastItem.sender?._id !== user?._id && lastItem.sender !== user?._id) &&
      currentMessageCount > lastMessageCountRef.current;

    // Auto-scroll if:
    // 1. User is at bottom, OR
    // 2. New message is from other user (always scroll for incoming messages)
    if (shouldAutoScrollRef.current && (isAtBottom() || isNewMessageFromOther)) {
      scrollToBottom();
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [mergedMessages, user]);

  // Track scroll position to determine if user manually scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      shouldAutoScrollRef.current = isAtBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Update countdown timer for chat expiration (12 hours) - only for non-premium male users
  // Females have free access, so they don't see countdowns
  useEffect(() => {
    const isNonPremiumMale = !user?.isPremium && user?.gender === 'male';

    // Only track chat expiration for non-premium male users (not females)
    if (isFemale || !isNonPremiumMale || !chatExpirationTime) {
      setChatTimeRemaining(null);
      return;
    }

    const updateChatTimer = () => {
      const now = new Date();
      const expiresAt = new Date(chatExpirationTime);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setChatTimeRemaining(null);
        // Chat expired - hide messages
        setMessages([]);
        setIsLocked(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setChatTimeRemaining({ hours, minutes, seconds, total: diff });
    };

    updateChatTimer();
    const interval = setInterval(updateChatTimer, 1000);

    return () => clearInterval(interval);
  }, [chatExpirationTime, user?.isPremium, user?.gender]);

  // Update countdown timer for reply windows (auto-message or premium→non-premium)
  useEffect(() => {
    // If user is premium or female, they don't have reply windows
    if (user?.isPremium || isFemale) {
      setTimeRemaining(null);
      return;
    }

    // Use the earliest expiring window (either auto-message or premium→non-premium)
    const activeExpiresAt = autoReplyWindowExpiresAt || replyWindowExpiresAt;

    if (!activeExpiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(activeExpiresAt);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        setAutoReplyWindowExpiresAt(null);
        setReplyWindowExpiresAt(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, total: diff });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [autoReplyWindowExpiresAt, replyWindowExpiresAt, user?.isPremium]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      // Use scrollTo for more reliable scrolling
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else if (messagesEndRef.current) {
      // Fallback to scrollIntoView
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadMessages = async () => {
    try {
      const response = await chatService.getMessages(matchId);

      // Handle locked conversation (expired auto-message)
      if (response.isLocked) {
        setIsLocked(true);
        setMessages([]);
        setAutoReplyRequiresSubscription(true);
        setLoading(false);
        return;
      } else {
        setIsLocked(false);
      }

      const messages = response.chat || response.data || [];
      setMessages(messages);

      // Calculate chat expiration (12 hours from last incoming message) for non-premium male users only
      // Females have free access, so they don't have chat expiration
      const isNonPremiumMale = !user?.isPremium && user?.gender === 'male';

      if (!isFemale && isNonPremiumMale && messages.length > 0) {
        // Use chatExpirationTime from backend if available, otherwise calculate from last incoming message
        if (response.chatExpirationTime) {
          setChatExpirationTime(new Date(response.chatExpirationTime));
        } else {
          // Find the last incoming message (not from current user)
          const lastIncomingMessage = messages
            .filter(msg => {
              const msgSenderId = msg.sender?._id || msg.sender;
              return msgSenderId && msgSenderId.toString() !== user?._id?.toString();
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

          if (lastIncomingMessage && lastIncomingMessage.createdAt) {
            const lastMessageTime = new Date(lastIncomingMessage.createdAt);
            const expirationTime = new Date(lastMessageTime.getTime() + (12 * 60 * 60 * 1000)); // 12 hours
            setChatExpirationTime(expirationTime);
          } else {
            setChatExpirationTime(null);
          }
        }
      } else {
        setChatExpirationTime(null);
      }

      // Check if chat is hidden/expired (for non-premium males - 12-hour timer)
      if (isNonPremiumMale && (response.chatExpired || response.hiddenForRecipient)) {
        setIsLocked(true);
        setMessages([]);
        setChatExpirationTime(null);
        setLoading(false);
        return;
      }

      // Update auto-reply window expiration
      if (response.autoReplyWindowExpiresAt) {
        const expiresAt = new Date(response.autoReplyWindowExpiresAt);
        setAutoReplyWindowExpiresAt(expiresAt);
      } else {
        setAutoReplyWindowExpiresAt(null);
      }

      // Update premium→non-premium reply window expiration
      if (response.replyWindowExpiresAt) {
        const expiresAt = new Date(response.replyWindowExpiresAt);
        setReplyWindowExpiresAt(expiresAt);
      } else {
        setReplyWindowExpiresAt(null);
      }

      // Update auto-reply subscription requirement
      if (response.autoReplyRequiresSubscription !== undefined) {
        setAutoReplyRequiresSubscription(response.autoReplyRequiresSubscription);
      }

      setIsBlocked(false); // Reset blocked status if messages load successfully
      if (loading) setLoading(false);
    } catch (error) {
      // Check if error is due to blocking
      const errorMessage = error.response?.data?.message || error.message || '';
      const isBlockedError = error.response?.status === 403 &&
        (errorMessage.toLowerCase().includes('blocked') ||
          errorMessage.toLowerCase().includes('messaging is blocked'));

      if (isBlockedError) {
        setIsBlocked(true);
        setMessages([]); // Clear messages when blocked
        if (loading) setLoading(false);
        return;
      }
      // Only log error once to avoid spam, don't show toast on every poll
      if (loading) {
        toast.error('Failed to load messages');
        setLoading(false);
      }
    }
  };

  const handleSend = async (text) => {
    try {
      // Check if blocked
      if (isBlocked) {
        toast.error('User is blocked. Unblock to send messages.');
        return;
      }

      // Check if chat expired (12-hour timer for non-premium males)
      const isNonPremiumMale = !user?.isPremium && user?.gender === 'male';
      if (isNonPremiumMale && chatTimeRemaining === null && chatExpirationTime) {
        toast.error('Your 12-hour reply window expired. Subscribe to continue messaging.');
        setIsLocked(true);
        setMessages([]);
        return;
      }

      // Check if reply window expired (either auto-message or premium→non-premium)
      // Premium users bypass this check
      // Only check if the last message was NOT sent by the current user (they received it)
      // Use mergedMessages to get the actual last item (including call events)
      const lastItem = mergedMessages.length > 0 ? mergedMessages[mergedMessages.length - 1] : null;
      const lastMsgIsFromMe = lastItem && lastItem.itemType === 'message' &&
        (lastItem.sender?._id === user?._id || lastItem.sender === user?._id);
      const shouldCheckReplyWindow = activeReplyWindow && !lastMsgIsFromMe;

      if (shouldCheckReplyWindow && !user?.isPremium) {
        const now = new Date();
        const expiresAt = new Date(activeReplyWindow);
        if (now > expiresAt) {
          toast.error('Reply window expired — subscribe to reply.');
          setAutoReplyWindowExpiresAt(null);
          setReplyWindowExpiresAt(null);
          return;
        }
      }

      // Check payment gate for sending message
      const canProceed = await checkSendMessage();
      if (!canProceed) {
        return; // Payment gate blocked the action
      }

      setSending(true);
      await chatService.sendMessage(matchId, text);
      await refreshBalance(); // Refresh balance after successful message
      await loadMessages();
      // Ensure we scroll to bottom after sending
      setTimeout(() => {
        shouldAutoScrollRef.current = true;
        scrollToBottom();
      }, 100);
    } catch (error) {
      // Check if error is due to expired reply window
      if (error.response?.status === 410 ||
        error.response?.data?.code === 'EXPIRED_REPLY_WINDOW' ||
        error.response?.data?.message?.includes('Reply window expired')) {
        const errorMessage = error.response?.data?.message || 'Reply window expired — subscribe to reply.';
        toast.error(errorMessage);
        setAutoReplyWindowExpiresAt(null);
        setReplyWindowExpiresAt(null);
        await loadMessages(); // Refresh to update state
      } else if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIBE_TO_REPLY') {
        toast.error(error.response.data.message);
        openPaymentGate(); // Open subscription modal
      } else if (error.response?.status === 403 &&
        (error.response?.data?.message?.includes('blocked') ||
          error.message?.includes('blocked'))) {
        setIsBlocked(true);
        toast.error('User is blocked. Unblock to send messages.');
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (imageFile) => {
    try {
      // Check payment gate for sending image (same cost as message)
      const canProceed = await checkSendMessage();
      if (!canProceed) {
        return; // Payment gate blocked the action
      }

      setSending(true);
      await chatService.sendImage(matchId, imageFile);
      await refreshBalance(); // Refresh balance after successful image
      await loadMessages();
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIBE_TO_REPLY') {
        toast.error(error.response.data.message);
        openPaymentGate();
      } else {
        toast.error('Failed to send image');
      }
    } finally {
      setSending(false);
    }
  };

  const handleGiftSent = async () => {
    // Refresh balance after sending gift
    await refreshBalance();
    // Reload messages to show the gift
    await loadMessages();
    // Small delay to ensure balance is updated
    setTimeout(() => {
      refreshBalance();
    }, 500);
  };

  // Format time remaining for display
  const formatTimeRemaining = () => {
    if (!timeRemaining) return null;
    const { hours, minutes, seconds } = timeRemaining;
    if (hours > 0) {
      return `Reply window — ${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      return `Reply window — ${minutes}m ${seconds}s left`;
    } else {
      return `Reply window — ${seconds}s left`;
    }
  };

  const formatChatTimeRemaining = () => {
    if (!chatTimeRemaining) return '';
    const { hours, minutes, seconds } = chatTimeRemaining;
    if (hours > 0) {
      return `Chat expires in — ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `Chat expires in — ${minutes}m ${seconds}s`;
    } else {
      return `Chat expires in — ${seconds}s`;
    }
  };

  // Calculate progress percentage (0-100)
  const getProgressPercentage = () => {
    if (!timeRemaining || !activeReplyWindow) return 0;
    const totalWindow = 12 * 60 * 60 * 1000; // 12 hours in ms
    const remaining = timeRemaining.total;
    return Math.max(0, Math.min(100, (remaining / totalWindow) * 100));
  };

  // Females have free access, so they don't have reply windows
  const activeReplyWindow = (user?.isPremium || isFemale) ? null : (autoReplyWindowExpiresAt || replyWindowExpiresAt);
  const isReplyWindowExpired = timeRemaining === null && activeReplyWindow !== null;

  // Check if the last message was sent by the current user
  // If so, they don't need to see the reply window (only the receiver does)
  // Filter out call events to get the actual last message
  const lastMessage = mergedMessages.length > 0
    ? [...mergedMessages].reverse().find(item => item.itemType === 'message')
    : null;
  const lastMessageIsFromMe = lastMessage && lastMessage.itemType === 'message' &&
    (lastMessage.sender?._id === user?._id || lastMessage.sender === user?._id);

  // Only show reply window if:
  // 1. User is not premium
  // 2. There's an active reply window
  // 3. The last message was NOT sent by the current user (they received it, so they need to reply)
  // 4. User is not a female (females have free access)
  const shouldShowReplyWindow = !isFemale && activeReplyWindow && !lastMessageIsFromMe;

  // Check if user is non-premium male (only they see chat expiration countdown)
  // Females have free access, so they don't see countdowns
  const isNonPremiumMaleForCountdown = !user?.isPremium && user?.gender === 'male' && !isFemale;
  const shouldShowChatCountdown = isNonPremiumMaleForCountdown && chatTimeRemaining;

  // Update GlobalNavBar bottom content with countdown
  // Note: Chat expiration timer is now shown in top navbar, not bottom bar
  // Only show reply window countdown in bottom bar
  useEffect(() => {
    // Don't show chat expiration countdown in bottom bar (it's in top navbar now)
    if (shouldShowReplyWindow && (timeRemaining || isReplyWindowExpired)) {
      // Show reply window countdown if no chat expiration countdown
      const { hours, minutes, seconds } = timeRemaining || { hours: 0, minutes: 0, seconds: 0 };
      let replyTimeText = '';
      if (isReplyWindowExpired) {
        replyTimeText = 'Reply window expired — Subscribe to reply';
      } else if (hours > 0) {
        replyTimeText = `⏰ ${hours}h ${minutes}m left to reply — Subscribe to unlock`;
      } else if (minutes > 0) {
        replyTimeText = `⏰ ${minutes}m ${seconds}s left to reply — Subscribe to unlock`;
      } else if (seconds > 0) {
        replyTimeText = `⏰ ${seconds}s left to reply — Subscribe to unlock`;
      } else {
        replyTimeText = 'Reply window expired — Subscribe to reply';
      }

      const progressPercentage = timeRemaining ? (timeRemaining.total / (12 * 60 * 60 * 1000) * 100) : 0;

      setBottomContent(
        <div className={`border-b px-4 py-3 flex-shrink-0 flex items-center w-full ${isReplyWindowExpired
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
          }`}>
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`text-sm font-bold ${isReplyWindowExpired ? 'text-red-600' : 'text-orange-600'}`}>
                {replyTimeText}
              </span>
            </div>
            {!isReplyWindowExpired && timeRemaining && (
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
                    style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                  />
                </div>
              </div>
            )}
            {isReplyWindowExpired && (
              <button
                onClick={() => navigate('/subscriptions')}
                className="px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all text-xs whitespace-nowrap"
              >
                Subscribe Now
              </button>
            )}
          </div>
        </div>
      );
    } else {
      setBottomContent(null);
    }

    return () => setBottomContent(null);
  }, [shouldShowChatCountdown, chatTimeRemaining, shouldShowReplyWindow, timeRemaining, isReplyWindowExpired]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Locked State (Expired Auto-Message or Expired Chat for non-premium males)
  // Females have free access, so they don't have chat expiration
  const isNonPremiumMaleForExpiration = !user?.isPremium && user?.gender === 'male' && !isFemale;
  const isChatExpired = isNonPremiumMaleForExpiration && chatTimeRemaining === null && chatExpirationTime;

  if (isLocked) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center shadow-inner mb-4">
          <LockClosedIcon className="w-10 h-10 text-gray-500" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Subscribe to see messages
          </h2>
          <p className="text-gray-600">
            {isChatExpired
              ? 'This chat has expired after 12 hours. Subscribe to continue messaging.'
              : 'This message expired. Subscribe to unlock and view messages from this profile.'}
          </p>
        </div>

        <button
          onClick={() => openPaymentGate()}
          className="px-8 py-3 bg-gradient-to-r from-velora-primary to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Subscribe
        </button>
      </div>
    );
  }

  // Check if reply is restricted (Auto-message active window + non-premium)
  const isReplyRestricted = autoReplyRequiresSubscription && !user?.isPremium;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 relative" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{
          minHeight: 0,
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingTop: '1rem',
          paddingBottom: '1rem',
          scrollBehavior: 'smooth',
          position: 'relative',
          willChange: 'scroll-position'
        }}
      >
        {mergedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-20 px-4">
            <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Start the conversation! 💬</p>
          </div>
        ) : (
          mergedMessages.map((item, index) => {
            if (item.itemType === 'call_event') {
              return (
                <CallEventMessage
                  key={item.id || `call-${index}`}
                  callEvent={item}
                  onMissedCallTap={handleMissedCallTap}
                  isCurrentUserCaller={item.isCaller !== undefined ? item.isCaller : (item.callerId === user._id)}
                />
              );
            }
            return (
              <MessageBubble
                key={item.messageId || item._id || `msg-${index}`}
                message={item}
                isMine={item.sender?._id === user?._id || item.sender === user?._id}
                index={index}
                onInvitationUpdate={loadMessages}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 bg-white/90 backdrop-blur-md flex-shrink-0 shadow-lg" style={{ position: 'relative', zIndex: 10 }}>
        {isBlocked ? (
          <div className="px-4 py-6 text-center bg-red-50 border-t-2 border-red-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-red-800 font-semibold text-lg mb-1">User blocked</p>
                <p className="text-red-600 text-sm">Unblock to send a msg</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <IceBreakerStrip
              matchId={matchId}
              groupId={null}
              onMessageSent={(newMessage) => {
                // Add message to the list
                setMessages(prev => [...prev, newMessage]);
                // Reload messages to ensure sync
                setTimeout(() => loadMessages(), 500);
              }}
            />
            <ChatInput
              onSend={handleSend}
              onSendImage={handleSendImage}
              onSendGift={() => setShowGiftModal(true)}
              disabled={sending || isReplyWindowExpired || isChatExpired}
              replyWindowExpired={isReplyWindowExpired}
              timeRemaining={timeRemaining}
              activeReplyWindow={activeReplyWindow}
            />
          </>
        )}
      </div>
      <GiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        matchId={matchId}
        onGiftSent={handleGiftSent}
      />

      {/* Call Confirmation Modal */}
      <AnimatePresence>
        {showCallConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCancelCall}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  {pendingCallType === 'video' ? (
                    <VideoCameraIcon className="w-10 h-10 text-white" />
                  ) : (
                    <PhoneIcon className="w-10 h-10 text-white" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {pendingCallType === 'video' ? 'Start Video Call?' : 'Start Voice Call?'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Call {otherUser?.name || 'User'}
                </p>

                {/* Call Rates and Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Rate:</span>
                    <span className="font-semibold text-gray-900">
                      {pendingCallType === 'video' ? '10' : '5'} coins/min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Initial reserve:</span>
                    <span className="font-semibold text-gray-900">
                      {pendingCallType === 'video' ? '10' : '5'} coins (1 min)
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    If the recipient is premium, free minutes may apply
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCall}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCall}
                    className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition-colors shadow-lg ${pendingCallType === 'video'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      }`}
                  >
                    {pendingCallType === 'video' ? 'Video Call' : 'Voice Call'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Call Confirmation Modal */}
      <AnimatePresence>
        {showReturnCallConfirm && (selectedMissedCall || pendingReturnCall) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleReturnCallCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <PhoneIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Return Call?
                </h3>
                <p className="text-gray-600 mb-6">
                  {pendingReturnCall
                    ? `The previous call to ${pendingReturnCall.calleeName || 'this user'} was missed. Do you want to place a return call and pay coins if the call is accepted?`
                    : 'This was a missed call. Do you want to return the call?'}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleReturnCallCancel}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReturnCallConfirm}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
                  >
                    Yes, Call
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

