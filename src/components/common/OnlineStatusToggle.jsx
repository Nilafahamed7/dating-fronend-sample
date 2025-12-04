import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { presenceService } from '../../services/presenceService';
import { getSocket } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function OnlineStatusToggle() {
  const { user, updateUser } = useAuth();

  // Initialize state from user context
  const getInitialState = () => {
    if (!user) return false;
    return user.onlineStatus === 'online' || user.isOnline === true;
  };

  const [isOnline, setIsOnline] = useState(getInitialState);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingState, setPendingState] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceTimerRef = useRef(null);
  const pendingRequestRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const toggleButtonRef = useRef(null);
  const modalRef = useRef(null);

  // Update local state when user changes (only if not currently updating)
  useEffect(() => {
    // Only sync from user context if we're not in the middle of an update
    if (isUpdatingRef.current) return;

    const currentStatus = user?.onlineStatus || (user?.isOnline ? 'online' : 'offline');
    if (currentStatus) {
      const shouldBeOnline = currentStatus === 'online';
      // Only update if state differs to avoid unnecessary re-renders
      if (isOnline !== shouldBeOnline) {
        setIsOnline(shouldBeOnline);
      }
    }
  }, [user?.onlineStatus, user?.isOnline, isOnline]);

  // Track socket updates separately to avoid render-time state updates
  const socketUpdateRef = useRef(null);

  // Subscribe to socket updates - Always active listener for real-time sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?._id) return;

    const currentUserId = user._id || user.userId;

    const handlePresenceUpdate = (data) => {
      // Only process updates for current user
      if (data.userId !== currentUserId) return;

      // Get new status from socket event
      const newStatus = data.onlineStatus || (data.isOnline ? 'online' : 'offline');
      const newIsOnline = newStatus === 'online';

      // Store update in ref for processing in separate effect
      socketUpdateRef.current = { newStatus, newIsOnline };

      // Update state using functional setState to avoid stale closure
      setIsOnline((currentIsOnline) => {
        // Only update if status actually changed
        if (currentIsOnline !== newIsOnline) {
          return newIsOnline;
        }
        return currentIsOnline;
      });
    };

    socket.on('presence:update', handlePresenceUpdate);
    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [user?._id, user?.userId]);

  // Separate effect to update user context when socket update occurs
  useEffect(() => {
    if (socketUpdateRef.current && updateUser && user) {
      const { newStatus, newIsOnline } = socketUpdateRef.current;
      const updatedUser = { ...user, onlineStatus: newStatus, isOnline: newIsOnline };
      updateUser(updatedUser);
      socketUpdateRef.current = null; // Clear after processing
    }
  }, [isOnline, updateUser, user]);

  const handleCancel = useCallback(() => {
    setShowConfirmModal(false);
    setPendingState(null);
    // Focus will be restored by useEffect cleanup
  }, []);

  // Handle Esc key and prevent background scroll
  useEffect(() => {
    if (!showConfirmModal) return;

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    // Trap focus in modal
    const modalElement = modalRef.current;
    if (modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      modalElement.addEventListener('keydown', handleTabKey);
      window.addEventListener('keydown', handleEsc);

      // Focus first element after a brief delay to ensure modal is rendered
      setTimeout(() => {
        firstElement?.focus();
      }, 100);

      return () => {
        document.body.style.overflow = originalOverflow;
        modalElement.removeEventListener('keydown', handleTabKey);
        window.removeEventListener('keydown', handleEsc);
        // Restore focus to toggle button
        setTimeout(() => {
          toggleButtonRef.current?.focus();
        }, 100);
      };
    }

    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEsc);
      setTimeout(() => {
        toggleButtonRef.current?.focus();
      }, 100);
    };
  }, [showConfirmModal, handleCancel]);

  const handleToggle = () => {
    // Allow toggle even if updating - queue the request
    if (isUpdatingRef.current) {
      pendingRequestRef.current = !isOnline;
      // Still show modal so user can confirm
      setPendingState(!isOnline);
      setShowConfirmModal(true);
      return;
    }

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const newState = !isOnline;

    // Show confirmation for both ON and OFF
    setPendingState(newState);
    setShowConfirmModal(true);
  };

  const handleUpdatePresence = async (newState, previousStateOverride = null) => {
    // Prevent concurrent updates
    if (isUpdatingRef.current) {
      pendingRequestRef.current = newState;
      return;
    }

    const previousState = previousStateOverride !== null ? previousStateOverride : isOnline;
    isUpdatingRef.current = true;
    setIsUpdating(true);

    try {
      const response = await presenceService.updatePresence(newState);

      if (response.success) {
        const newStatus = newState ? 'online' : 'offline';
        // State is already updated optimistically in handleConfirm
        // Just ensure it matches server response
        const serverStatus = response.data?.onlineStatus || newStatus;
        const serverIsOnline = serverStatus === 'online';

        // Sync with server response (should match optimistic update)
        if (isOnline !== serverIsOnline) {
          setIsOnline(serverIsOnline);
          const updatedUser = { ...user, onlineStatus: serverStatus, isOnline: serverIsOnline };
          if (updateUser) {
            updateUser(updatedUser);
          }
        }

        // Broadcast via socket for real-time sync to other devices/users
        const socket = getSocket();
        if (socket && socket.connected && user?._id) {
          socket.emit('presence:update', {
            userId: user._id || user.userId,
            onlineStatus: serverStatus,
            isOnline: serverIsOnline
          });
        }
      } else {
        throw new Error(response.message || 'Failed to update presence');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update presence';
      toast.error(`Could not update status — ${errorMessage}. Please try again.`, {
        duration: 4000,
        position: 'bottom-center',
      });

      // Revert to previous state on error
      setIsOnline(previousState);
      const revertedUser = { ...user, onlineStatus: previousState ? 'online' : 'offline', isOnline: previousState };
      if (updateUser) {
        updateUser(revertedUser);
      }
    } finally {
      // Always reset updating flags
      isUpdatingRef.current = false;
      setIsUpdating(false);

      // Process any queued requests
      if (pendingRequestRef.current !== null) {
        const queuedState = pendingRequestRef.current;
        pendingRequestRef.current = null;
        // Process queued request after a brief delay
        setTimeout(() => {
          handleUpdatePresence(queuedState, isOnline);
        }, 100);
        return;
      }

      // Brief debounce to prevent rapid clicks (but don't block toggle)
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
      }, 200);
    }
  };

  const handleConfirm = async () => {
    if (pendingState === null) return;

    const stateToUpdate = pendingState;
    const previousState = isOnline;

    // Close modal immediately
    setShowConfirmModal(false);
    setPendingState(null);

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // CRITICAL: Optimistically update UI IMMEDIATELY (before API call)
    // This ensures toggle and label update instantly without waiting for server
    setIsOnline(stateToUpdate);
    const newStatus = stateToUpdate ? 'online' : 'offline';
    const updatedUser = { ...user, onlineStatus: newStatus, isOnline: stateToUpdate };
    if (updateUser) {
      updateUser(updatedUser);
    }

    // Show toast immediately
    toast.success(stateToUpdate ? 'You are now Online — Calls enabled.' : 'You are now Offline — Calls will be missed.', {
      duration: 3000,
      position: 'bottom-center',
    });

    // Update backend in background (non-blocking)
    // If there's already an update in progress, queue this one
    handleUpdatePresence(stateToUpdate, previousState).catch((error) => {
      // Error handling is done in handleUpdatePresence
      });
  };

  // Only disable toggle during active network request (brief spinner)
  // Don't disable for debounce - allow immediate toggling
  const isDisabled = isUpdating;

  return (
    <>
      <div className="flex items-center gap-2 group">
        {/* Toggle Switch */}
        <div className="relative">
          <label
            className={`relative inline-flex items-center cursor-pointer ${isDisabled ? 'opacity-60' : ''}`}
            role="switch"
            aria-checked={isOnline}
            aria-disabled={isDisabled}
          >
            <input
              ref={toggleButtonRef}
              type="checkbox"
              checked={isOnline}
              disabled={isDisabled}
              onChange={handleToggle}
              className="sr-only peer"
              aria-label={isOnline ? 'Online - Click to go offline' : 'Offline - Click to go online'}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-velora-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
          {isUpdating && (
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <svg
                className="animate-spin h-3 w-3 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Persistent Label */}
        <span
          className={`text-sm font-medium transition-colors duration-200 ${
            isOnline ? 'text-green-600' : 'text-gray-500'
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          Set your availability — block calls when Offline
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Rendered via Portal to document.body for proper centering */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfirmModal && (
            <>
              {/* Backdrop - Full viewport coverage */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancel}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10000,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)'
                }}
              />
              {/* Modal Content - Centered using transform */}
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10001,
                  width: '100%',
                  maxWidth: '28rem',
                  padding: '1rem',
                  pointerEvents: 'auto'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    aria-describedby="modal-description"
                    className="bg-white rounded-2xl shadow-2xl w-full p-6"
                  >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${pendingState ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {pendingState ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    <h3 id="modal-title" className="text-xl font-bold text-black">
                      {pendingState ? 'Go Online?' : 'Go Offline?'}
                    </h3>
                  </div>
                  <p id="modal-description" className="text-gray-600 mb-6 leading-relaxed">
                    {pendingState
                      ? 'Are you sure you want to appear Online?'
                      : 'Are you sure? When you go Offline, you will not receive calls.'}
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleCancel}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                      aria-label="Cancel"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleConfirm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isUpdating}
                      className={`flex-1 px-4 py-3 font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 ${
                        pendingState
                          ? 'bg-green-500 text-white'
                          : 'bg-velora-primary text-black'
                      }`}
                      aria-label={pendingState ? 'Confirm go online' : 'Confirm go offline'}
                    >
                      {isUpdating ? 'Updating...' : 'Confirm'}
                    </motion.button>
                  </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

