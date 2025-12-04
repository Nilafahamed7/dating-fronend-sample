import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { presenceService } from '../../services/presenceService';
import { getSocket } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import queueToast from '../../utils/toastQueue';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function PresenceToggle({ user: userProp, onPresenceChange }) {
  // Read from central store (AuthContext) as authoritative source
  const { user: userFromStore, updateUser } = useAuth();
  const user = userFromStore || userProp;
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingState, setPendingState] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceTimerRef = useRef(null);
  const pendingRequestRef = useRef(null); // Queue for rapid toggles
  const isUpdatingRef = useRef(false); // Track update state in ref to avoid stale closures

  // Update local state when central store changes (but don't override if we're in the middle of an update)
  useEffect(() => {
    if (user?.isOnline !== undefined && !isUpdatingRef.current) {
      setIsOnline(user.isOnline);
    }
  }, [user?.isOnline]);

  // Subscribe to socket updates for current user's presence
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?._id) return;

    const handlePresenceUpdate = (data) => {
      // Only handle updates for the current user
      const currentUserId = user._id || user.userId;
      if (data.userId === currentUserId) {
        // Server is authoritative - update UI to match server state
        // Only update if we're not currently updating (to avoid conflicts)
        if (!isUpdatingRef.current) {
          setIsOnline((currentState) => {
            // Only update if state actually changed
            if (data.isOnline !== currentState) {
              // Update central store
              const updatedUser = { ...user, isOnline: data.isOnline };
              if (updateUser) {
                updateUser(updatedUser);
              }
              if (onPresenceChange) {
                onPresenceChange(data.isOnline);
              }
              // Show toast if state changed from what we expected
              queueToast.default('Presence updated by server', {
                duration: 2000,
              });
              return data.isOnline;
            }
            return currentState;
          });
        }
      }
    };

    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [user?._id, user?.userId, onPresenceChange]);

  // Handle Esc key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showConfirmModal) {
        setShowConfirmModal(false);
        setPendingState(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showConfirmModal]);

  const handleToggle = () => {
    // Prevent action if already updating
    if (isUpdatingRef.current) {
      // Queue the toggle request
      pendingRequestRef.current = !isOnline;
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const newState = !isOnline;

    // Only show confirmation when turning OFF
    if (!newState) {
      setPendingState(newState);
      setShowConfirmModal(true);
    } else {
      // Turn ON immediately without confirmation - optimistic update
      const previousState = isOnline;
      setIsOnline(true); // Optimistic update - UI switches immediately
      // Update central store optimistically
      const updatedUser = { ...user, isOnline: true };
      if (updateUser) {
        updateUser(updatedUser);
      }
      if (onPresenceChange) {
        onPresenceChange(true);
      }
      handleUpdatePresence(true, previousState);
    }
  };

  const handleUpdatePresence = async (newState, previousStateOverride = null) => {
    // Prevent duplicate calls
    if (isUpdatingRef.current) {
      pendingRequestRef.current = newState;
      return;
    }

    // Store previous state for potential revert
    const previousState = previousStateOverride !== null ? previousStateOverride : isOnline;

    // Set updating flags immediately
    isUpdatingRef.current = true;
    setIsUpdating(true);

    try {
      const response = await presenceService.updatePresence(newState);

      if (response.success) {
        // Confirm optimistic update (already set in handleToggle)
        setIsOnline(newState);

        // Update central store immediately
        const updatedUser = { ...user, isOnline: newState };
        if (updateUser) {
          updateUser(updatedUser);
        }
        if (onPresenceChange) {
          onPresenceChange(newState);
        }

        // Show success toast via queue
        queueToast.success(newState ? 'You are now online' : 'You are now offline', {
          duration: 2000,
        });

        // Broadcast presence via socket
        const socket = getSocket();
        if (socket && socket.connected && user?._id) {
          socket.emit('presence:update', {
            userId: user._id || user.userId,
            isOnline: newState
          });
        }

        // Check if server returned different state (reconciliation)
        if (response.data?.isOnline !== undefined && response.data.isOnline !== newState) {
          // Server is authoritative - update to server state
          const serverState = response.data.isOnline;
          setIsOnline(serverState);
          const serverUpdatedUser = { ...user, isOnline: serverState };
          if (updateUser) {
            updateUser(serverUpdatedUser);
          }
          if (onPresenceChange) {
            onPresenceChange(serverState);
          }
          queueToast.default('Presence updated by server', {
            duration: 2000,
          });
        }
      } else {
        throw new Error(response.message || 'Failed to update presence');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update presence';
      queueToast.error(errorMessage, {
        duration: 3000,
      });
      // Revert UI on error - update central store back to previous state
      setIsOnline(previousState);
      const revertedUser = { ...user, isOnline: previousState };
      if (updateUser) {
        updateUser(revertedUser);
      }
      if (onPresenceChange) {
        onPresenceChange(previousState);
      }
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);

      // Process queued request if any
      if (pendingRequestRef.current !== null) {
        const queuedState = pendingRequestRef.current;
        pendingRequestRef.current = null;
        // Small delay to ensure previous request is fully processed
        setTimeout(() => {
          const queuedPreviousState = isOnline;
          setIsOnline(queuedState);
          handleUpdatePresence(queuedState, queuedPreviousState);
        }, 100);
        return;
      }

      // Short debounce: disable toggle for 300ms after action to prevent rapid clicks
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
      }, 300);
    }
  };

  const handleConfirm = async () => {
    if (isUpdatingRef.current || pendingState === null) return;

    const stateToUpdate = pendingState;
    const previousState = isOnline;
    setShowConfirmModal(false);
    setPendingState(null);

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Optimistic update - update UI immediately for smooth experience
    setIsOnline(stateToUpdate);
    // Update central store optimistically
    const updatedUser = { ...user, isOnline: stateToUpdate };
    if (updateUser) {
      updateUser(updatedUser);
    }
    if (onPresenceChange) {
      onPresenceChange(stateToUpdate);
    }

    await handleUpdatePresence(stateToUpdate, previousState);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingState(null);
  };

  const isDisabled = isUpdating || debounceTimerRef.current !== null;

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed ${
          isOnline
            ? 'bg-green-50 hover:bg-green-100 border border-green-200'
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
        aria-label={isOnline ? 'Online - Click to go offline' : 'Offline - Click to go online'}
        aria-pressed={isOnline}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {isUpdating && (
            <svg
              className="animate-spin h-3 w-3 text-gray-400 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {!isUpdating && (
            <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
          )}
          <span className={`text-sm font-medium truncate transition-colors duration-200 ${
            isOnline ? 'text-green-700' : 'text-gray-600'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {isOnline && !isUpdating && (
          <svg
            className="w-4 h-4 text-green-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        )}
      </button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="modal-title" className="text-xl font-bold text-gray-900">
                    Go Offline
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <p className="text-gray-700 mb-6">
                  Go offline? You will not receive calls while offline.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Yes, Go Offline'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

