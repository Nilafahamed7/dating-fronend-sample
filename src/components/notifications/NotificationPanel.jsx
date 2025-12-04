import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XMarkIcon, HeartIcon, SparklesIcon, GiftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, SparklesIcon as SparklesSolidIcon } from '@heroicons/react/24/solid';
import { matchService } from '../../services/matchService';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../../services/socketService';
// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

export default function NotificationPanel({ isOpen: externalIsOpen, onClose, onNotificationsLoaded }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [contentRef, setContentRef] = useState(null);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const navigate = useNavigate();

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onClose ? onClose : setInternalIsOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Note: We do NOT lock body scroll here because the main content should still be scrollable
  // The notification panel is a fixed overlay that doesn't affect page layout

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Focus management
    const focusableElements = panelRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    // Focus first element when panel opens
    if (closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }

    // Handle tab trapping
    const handleTab = (e) => {
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

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, handleClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matchService.getNotifications();
      if (response.success) {
        const notifs = Array.isArray(response.data) ? response.data : [];
        // Sort notifications by timestamp (newest first) - most recent at top
        const sortedNotifs = notifs.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return timeB - timeA; // Descending order (newest first)
        });
        // Use actual read state from server (don't force to read)
        setNotifications(sortedNotifs);
        // Notify parent component about loaded notifications (for unread count)
        if (onNotificationsLoaded) {
          onNotificationsLoaded(sortedNotifs);
        }
      } else {
        setNotifications([]);
        setError('Failed to load notifications');
        if (onNotificationsLoaded) {
          onNotificationsLoaded([]);
        }
      }
    } catch (error) {
      setNotifications([]);
      setError('No notifications available.');
      if (onNotificationsLoaded) {
        onNotificationsLoaded([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Scroll content to top when panel opens - ensure it's at the very top
      // Use multiple attempts to ensure scroll happens
      const scrollToTop = () => {
        if (contentRef) {
          contentRef.scrollTop = 0;
          // Force scroll to top
          contentRef.scrollTo({ top: 0, behavior: 'instant' });
        }
      };

      // Immediate scroll
      scrollToTop();

      // Also scroll after a small delay to ensure DOM is ready
      setTimeout(scrollToTop, 100);
      setTimeout(scrollToTop, 300);

      // Load notifications when panel opens
      loadNotifications();

      // Mark all notifications as read immediately when panel opens
      const markAsRead = async () => {
        try {
          const response = await matchService.markNotificationsAsRead();
          // Update local state to show all as read
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          // Notify parent to update badge - pass empty array to indicate all read
          if (onNotificationsLoaded) {
            onNotificationsLoaded([]); // Empty array means all read
          }
        } catch (error) {
          // Show user-friendly error toast
          if (error.response?.data?.message) {
            // Only show toast if there's a meaningful error message
            // For now, just log - user can retry by closing and reopening
          }
        }
      };

      // Mark as read immediately when panel opens (before loading completes)
      markAsRead();

      // Listen for real-time notifications via socket
      const socket = getSocket();
      if (socket) {
        const handleNewNotification = (notification) => {
          // Reload notifications to get updated list with user info
          loadNotifications();
        };

        socket.on('new-notification', handleNewNotification);

        // Refresh notifications every 30 seconds when panel is open
        const interval = setInterval(() => {
          loadNotifications();
        }, 30000);

        return () => {
          clearInterval(interval);
          socket.off('new-notification', handleNewNotification);
        };
      } else {
        // Fallback: Refresh notifications every 30 seconds when panel is open
        const interval = setInterval(() => {
          loadNotifications();
        }, 30000);
        return () => clearInterval(interval);
      }
    } else {
      // Clear notifications when panel closes to save memory
      setNotifications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contentRef]);

  const handleNotificationClick = (notification) => {
    // All notifications are already marked as read when panel opens
    // Just navigate to the appropriate page

    // Check if this is an icebreaker notification (can be type 'new_message' with ice-breaker in title/body)
    const isIcebreaker = notification.type === 'icebreaker' ||
                         notification.type === 'ice-breaker' ||
                         notification.type === 'ice_breaker' ||
                         (notification.title && notification.title.toLowerCase().includes('ice-breaker')) ||
                         (notification.body && notification.body.toLowerCase().includes('ice-breaker'));

    // Extract matchId from notification data or direct field
    const matchId = notification.matchId ||
                    notification.data?.matchId ||
                    notification.data?.conversationId ||
                    notification.conversationId;

    // Navigate to chat window for user notifications, icebreaker prompts, and gifts
    if (notification.type === 'broadcast') {
      // Navigate to deep link if available
      if (notification.deepLink && notification.deepLink !== '/') {
        navigate(notification.deepLink);
      }
    } else if (notification.type === 'gift' || notification.type === 'gift_received') {
      // Navigate to chat with the user
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else if (notification.userId) {
        // If no matchId, try to find match or navigate to matches
        navigate(`/matches`);
      }
    } else if (notification.type === 'like' || notification.type === 'superlike') {
      // Navigate to chat if there's a match, otherwise to matches page
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else {
        navigate(`/matches`);
      }
    } else if (notification.type === 'match') {
      // Navigate to chat window
      navigate(`/chat/${matchId || notification.userId}`);
    } else if (notification.type === 'message' || notification.type === 'new_message' || isIcebreaker) {
      // Navigate to chat window for messages and icebreaker prompts
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else if (notification.userId || notification.data?.senderId) {
        // Try to navigate using userId or senderId
        const userId = notification.userId || notification.data?.senderId;
        navigate(`/chat/${userId}`);
      } else {
        navigate(`/matches`);
      }
    } else {
      // For any other user notification, try to navigate to chat if matchId exists
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else if (notification.userId) {
        // Fallback to matches page if no matchId
        navigate(`/matches`);
      }
    }

    // Close panel after navigation
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <HeartSolidIcon className="w-5 h-5 text-red-500" />;
      case 'superlike':
        return <SparklesSolidIcon className="w-5 h-5 text-yellow-500" />;
      case 'gift':
        return <GiftIcon className="w-5 h-5 text-purple-500" />;
      case 'broadcast':
        return <BellIcon className="w-5 h-5 text-velora-primary" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.userName}${notification.userAge ? `, ${notification.userAge}` : ''} liked your profile`;
      case 'superlike':
        return `${notification.userName}${notification.userAge ? `, ${notification.userAge}` : ''} superliked your profile`;
      case 'gift':
        return `${notification.userName}${notification.userAge ? `, ${notification.userAge}` : ''} sent you a gift`;
      case 'broadcast':
        return notification.body || notification.title || 'New broadcast notification';
      default:
        return notification.body || notification.title || 'New notification';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Only render button if not externally controlled
  const showButton = externalIsOpen === undefined;

  return (
    <>
      {/* Notification Bell Button - Only show if not externally controlled */}
      {showButton && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2.5 bg-white hover:bg-gray-50 rounded-full transition-all shadow-md"
        >
          <BellIcon className="w-6 h-6 text-gray-700" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      )}

      {/* Notification Panel - Right-side slide-over drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Subtle overlay, does NOT create white space */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: 'ease-out' }}
              onClick={handleClose}
              className="fixed z-[59]"
              style={{
                top: 'var(--navbar-height, 64px)',
                bottom: 'var(--bottom-nav-height, 64px)',
                left: 0,
                right: 0,
                background: 'rgba(0, 0, 0, 0.12)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto',
                // Ensure backdrop doesn't block bottom navbar (z-index 10000)
                zIndex: 59,
              }}
              aria-hidden="true"
            />

            {/* Panel - Fixed right-side drawer, anchored to navbars */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{
                type: 'tween',
                duration: 0.22,
                ease: [0.2, 0.9, 0.2, 1],
                opacity: { duration: 0.16 }
              }}
              className="fixed right-0 bg-white shadow-2xl z-[60] flex flex-col w-full md:w-[360px]"
              style={{
                top: 'var(--navbar-height, 64px)',
                bottom: 'var(--bottom-nav-height, 64px)',
                maxWidth: '420px',
                minWidth: '280px',
                height: 'calc(100vh - var(--navbar-height, 64px) - var(--bottom-nav-height, 64px))',
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                willChange: 'transform, opacity',
                borderRadius: '8px 0 0 0',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Notifications"
              aria-hidden={!isOpen}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-velora-primary/10 to-velora-primary/5 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                <button
                  ref={closeButtonRef}
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-velora-primary focus:ring-offset-2"
                  aria-label="Close notifications"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content - Scrollable inside panel only */}
              <div
                ref={(ref) => {
                  setContentRef(ref);
                  // Ensure scroll is at top when ref is set
                  if (ref && isOpen) {
                    setTimeout(() => {
                      ref.scrollTop = 0;
                      ref.scrollTo({ top: 0, behavior: 'instant' });
                    }, 0);
                  }
                }}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{
                  scrollBehavior: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  minHeight: 0,
                  maxHeight: '100%',
                }}
                aria-live="polite"
                aria-label="Notifications list"
                tabIndex={-1}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-velora-primary"></div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-4">
                    <BellIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-center">{error}</p>
                    <button
                      onClick={loadNotifications}
                      className="mt-4 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Try Again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <BellIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No notifications yet</p>
                    <p className="text-sm mt-2">You'll see likes, superlikes, and gifts here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={`${notification.type}-${notification.userId}-${notification.timestamp}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          handleNotificationClick(notification);
                        }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* User Photo or Broadcast Image */}
                          <div className="relative flex-shrink-0">
                            {notification.type === 'broadcast' && notification.imageUrl ? (
                              <img
                                src={notification.imageUrl}
                                alt="Broadcast"
                                className="w-12 h-12 rounded-lg object-cover border-2 border-velora-primary"
                              />
                            ) : notification.userPhoto ? (
                              <img
                                src={notification.userPhoto}
                                alt={notification.userName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-semibold">
                                  {notification.userName?.charAt(0)?.toUpperCase() || '📢'}
                                </span>
                              </div>
                            )}
                            {/* Notification Type Icon */}
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            {notification.type === 'broadcast' ? (
                              <>
                                <p className="text-sm font-bold text-velora-primary mb-1">
                                  📢 {notification.title || 'Broadcast'}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {notification.body || getNotificationText(notification)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-900">
                                  {getNotificationText(notification)}
                                </p>
                                {notification.type === 'gift' && notification.giftNote && (
                                  <p className="text-xs text-gray-600 mt-1 italic">
                                    "{notification.giftNote}"
                                  </p>
                                )}
                              </>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notification.timestamp || notification.createdAt)}
                            </p>
                          </div>

                          {/* No unread indicator - all notifications appear as read */}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

