import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HomeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BellIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import {
  HomeIcon as HomeIconOutline,
  HeartIcon as HeartIconOutline,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconOutline,
  UserIcon as UserIconOutline,
  BellIcon as BellIconOutline,
  PhoneIcon as PhoneIconOutline,
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline,
} from '@heroicons/react/24/outline';
import NotificationPanel from '../notifications/NotificationPanel';
import { matchService } from '../../services/matchService';
import { useNavBarContext } from './GlobalNavBar';
import toast from 'react-hot-toast';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotificationPanel, setShowNotificationPanel } = useNavBarContext();
  // Sync local state with context state
  const [showNotifications, setShowNotifications] = useState(showNotificationPanel);

  // Sync local state with context state
  useEffect(() => {
    setShowNotifications(showNotificationPanel);
  }, [showNotificationPanel]);

  // Update context when local state changes
  const handleSetShowNotifications = (value) => {
    setShowNotifications(value);
    setShowNotificationPanel(value);
  };
  const [unreadCount, setUnreadCount] = useState(0);
  const [optimisticUnreadCount, setOptimisticUnreadCount] = useState(0);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef(null);
  const lastNavigationPathRef = useRef(null);

  // Track if notifications panel has ever been opened - badge should never show after first open
  const [hasEverOpenedPanel, setHasEverOpenedPanel] = useState(() => {
    return localStorage.getItem('notificationsPanelOpened') === 'true';
  });

  // Navigation handler - memoized with proper debouncing and idempotency
  const handleNavigation = useCallback((event, path) => {
    // Stop event propagation to prevent other handlers
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Get current path at the time of click (avoid stale closure)
    const currentPath = location.pathname;

    // Check if already on target route - if so, just scroll to top
    const isSameRoute = path === '/chat'
      ? (currentPath === '/chat' || currentPath.startsWith('/chat/'))
      : path === '/matches'
      ? (currentPath === '/matches')
      : currentPath === path;

    if (isSameRoute) {
      // Already on this route, just scroll to top
      const mainContent = document.querySelector('.page-container main, .main-content-wrapper > main, main.scrollable-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // Idempotency guard: prevent navigation if already navigating to the same path
    if (isNavigating && lastNavigationPathRef.current === path) {
      return; // Already navigating to this path
    }

    // If navigating to different path, cancel previous and proceed
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Set navigating state immediately (idempotency guard)
    setIsNavigating(true);
    lastNavigationPathRef.current = path;
    handleSetShowNotifications(false);

    // Scroll to top immediately
    requestAnimationFrame(() => {
      const mainContent = document.querySelector('.page-container main, .main-content-wrapper > main, main.scrollable-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    });

    // Navigate immediately - use setTimeout(0) to ensure state is set but navigate as soon as possible
    setTimeout(() => {
      try {
        // Use navigate with replace: false for proper history
        navigate(path, { replace: false });
      } catch (error) {
        // Fallback: try direct navigation only if React Router fails
        try {
          window.location.href = path;
        } catch (fallbackError) {
          // Reset state even if navigation fails
          setIsNavigating(false);
          lastNavigationPathRef.current = null;
        }
      }
    }, 0);

    // Reset navigating state after navigation completes (debounce: 500ms for reliability)
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      lastNavigationPathRef.current = null;
      navigationTimeoutRef.current = null;
    }, 500);
  }, [isNavigating, location.pathname, navigate]);

  // Track previous pathname to detect actual route changes
  const prevPathnameRef = useRef(location.pathname);

  // Reset navigation state when route actually changes
  useEffect(() => {
    // Only run if pathname actually changed
    if (prevPathnameRef.current === location.pathname) {
      return;
    }

    // Update ref
    const previousPath = prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;

    // Reset navigating state immediately when route changes
    setIsNavigating(false);
    lastNavigationPathRef.current = null;

    // Clear any pending timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Only focus if we actually navigated (not initial load)
    if (previousPath) {
      // Focus main content for accessibility after navigation
      const timeoutId = setTimeout(() => {
        try {
          const mainContent = document.querySelector('.page-container main, .main-content-wrapper > main, main.scrollable-content');
          if (mainContent && document.activeElement !== mainContent) {
            if (!mainContent.hasAttribute('tabindex')) {
              mainContent.setAttribute('tabindex', '-1');
            }
            mainContent.focus({ preventScroll: true });
          }
        } catch (error) {
          // Silently fail if focus fails
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Load unread notification count - use refs to avoid dependencies
  const showNotificationsRef = useRef(showNotifications);
  const hasEverOpenedPanelRef = useRef(hasEverOpenedPanel);

  // Keep refs in sync with state
  useEffect(() => {
    showNotificationsRef.current = showNotifications;
  }, [showNotifications]);

  useEffect(() => {
    hasEverOpenedPanelRef.current = hasEverOpenedPanel;
  }, [hasEverOpenedPanel]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await matchService.getNotifications();
      const unread = response.success
        ? (response.data || []).filter(n => !n.isRead).length
        : 0;

      // Update unread count only if changed
      setUnreadCount(prev => prev !== unread ? unread : prev);

      // Update optimistic count in a single batch
      // If panel has ever been opened, badge should never show (keep at 0)
      // Otherwise, update optimistic count only if panel is closed
      const panelOpened = hasEverOpenedPanelRef.current;
      const panelOpen = showNotificationsRef.current;

      setOptimisticUnreadCount(prev => {
        if (panelOpened) {
          return 0; // Always 0 if panel was opened
        }
        if (!panelOpen) {
          return unread; // Update if panel is closed
        }
        return prev; // Keep previous if panel is open
      });
    } catch (error) {
      setUnreadCount(0);
      const panelOpened = hasEverOpenedPanelRef.current;
      setOptimisticUnreadCount(prev => panelOpened ? 0 : prev);
    }
  }, []); // No dependencies - uses refs to access current values

  // Load unread count on mount and set up interval - only run once
  useEffect(() => {
    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount, loadUnreadCount is stable

  // Track if we've already marked notifications as read for this panel open
  const hasMarkedAsReadRef = useRef(false);

  // Handle notification panel open - mark all as read immediately with optimistic UI
  useEffect(() => {
    // Reset flag when panel closes
    if (!showNotifications) {
      hasMarkedAsReadRef.current = false;
      return;
    }

    // Only run if panel is opening, we're not already marking as read, and we haven't marked as read yet
    if (isMarkingAsRead || hasMarkedAsReadRef.current) {
      return;
    }

    // Mark that we're processing this panel open
    hasMarkedAsReadRef.current = true;

    // Mark that panel has been opened - badge should never show again
    const wasOpenedBefore = hasEverOpenedPanelRef.current;
    if (!wasOpenedBefore) {
      setHasEverOpenedPanel(true);
      hasEverOpenedPanelRef.current = true;
      localStorage.setItem('notificationsPanelOpened', 'true');
    }

    // Optimistic UI: immediately hide badge permanently
    setOptimisticUnreadCount(0);
    setIsMarkingAsRead(true);

    // Mark all notifications as read on backend
    const markAsRead = async () => {
      try {
        const response = await matchService.markNotificationsAsRead();
        // Update unread count from server response
        const serverUnreadCount = response.unreadCount || 0;
        setUnreadCount(serverUnreadCount);
        // Keep optimistic count at 0 - badge should never show after panel is opened
        setOptimisticUnreadCount(0);

        // Refresh to get latest state (but don't update optimistic count if panel was opened)
        const refreshResponse = await matchService.getNotifications();
        if (refreshResponse.success) {
          const unread = (refreshResponse.data || []).filter(n => !n.isRead).length;
          setUnreadCount(unread);
          // Keep optimistic count at 0 since panel was opened
          setOptimisticUnreadCount(0);
        }
      } catch (error) {
        // Even on error, keep badge hidden if panel was opened
        setOptimisticUnreadCount(0);
        toast.error('We couldn\'t save your notification state. Please try again.');
      } finally {
        setIsMarkingAsRead(false);
      }
    };
    markAsRead();
    // Only depend on showNotifications and isMarkingAsRead
  }, [showNotifications, isMarkingAsRead]);

  // Callback to update unread count when notifications are loaded - memoized to prevent recreating
  const handleNotificationsLoaded = useCallback((notifications) => {
    // Always update the count accurately for backend logic
    const unread = (notifications || []).filter(n => !n.isRead).length;
    setUnreadCount(unread);

    // If panel has ever been opened, badge should never show (keep at 0)
    // Otherwise, update optimistic count only if panel is closed
    // Use functional update and refs to avoid stale closure
    setOptimisticUnreadCount(prev => {
      const panelOpened = hasEverOpenedPanelRef.current;
      if (panelOpened) {
        return 0;
      }
      return showNotificationsRef.current ? prev : unread;
    });
  }, []); // No dependencies - uses refs to access current values

  const navItems = [
    { path: '/', icon: HomeIcon, iconOutline: HomeIconOutline, label: 'Discover' },
    { path: '/matches', icon: HeartIcon, iconOutline: HeartIconOutline, label: 'Matches' },
    { path: '/chat', icon: ChatBubbleLeftRightIcon, iconOutline: ChatBubbleLeftRightIconOutline, label: 'Chat' },
    { path: '/utility', icon: WrenchScrewdriverIcon, iconOutline: WrenchScrewdriverIconOutline, label: 'Utility' },
    { path: '/calls', icon: PhoneIcon, iconOutline: PhoneIconOutline, label: 'Calls' },
    { path: '/profile', icon: UserIcon, iconOutline: UserIconOutline, label: 'Profile' },
    { type: 'notification', icon: BellIcon, iconOutline: BellIconOutline, label: 'Notifications' },
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg bottom-navbar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          width: '100%',
          maxWidth: '100%',
          height: 'var(--bottom-navbar-height, 60px)',
          maxHeight: 'var(--bottom-navbar-height, 60px)',
          minHeight: 'var(--bottom-navbar-height, 60px)',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          overflow: 'hidden',
          transform: 'translateZ(0) translateY(0)',
          visibility: 'visible',
          opacity: 1,
          pointerEvents: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxSizing: 'border-box',
          touchAction: 'manipulation',
          isolation: 'isolate',
        }}
      >
      <div className="flex justify-around items-center w-full h-full" style={{
        height: 'var(--bottom-navbar-height, 60px)',
        flexDirection: 'row',
        overflow: 'hidden',
        pointerEvents: 'auto',
        flex: '0 0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 10001,
      }}>
        {navItems.map((item, index) => {
          const isActive = item.type === 'notification'
            ? showNotifications
            : (location.pathname === item.path ||
               (item.path === '/chat' && location.pathname.startsWith('/chat/')));
          const Icon = isActive ? item.icon : item.iconOutline;

          if (item.type === 'notification') {
            return (
              <motion.div
                key="notification"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                className="relative"
                style={{
                  flex: '0 0 auto',
                  height: '100%',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSetShowNotifications(!showNotifications)}
                  aria-expanded={showNotifications}
                  aria-haspopup="dialog"
                  aria-label={`Notifications${optimisticUnreadCount > 0 ? `, ${optimisticUnreadCount} unread` : ' (all read)'}`}
                  aria-current={isActive ? 'true' : undefined}
                  tabIndex={0}
                  className={`flex flex-col items-center justify-center h-full relative no-underline w-full ${
                    isActive ? 'text-velora-primary' : 'text-gray-400'
                  } transition-colors`}
                style={{
                  textDecoration: 'none',
                  minHeight: '44px',
                  minWidth: '44px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-velora-primary/10 rounded-full -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    key={showNotifications ? 'active' : 'inactive'}
                    animate={isActive ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0]
                    } : {
                      scale: 1,
                      rotate: 0
                    }}
                    transition={isActive ? {
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2
                    } : {
                      duration: 0.2
                    }}
                    whileHover={!isActive ? {
                      scale: 1.2,
                      rotate: [0, -10, 10, 0],
                      transition: { duration: 0.3 }
                    } : {}}
                    className="relative"
                    style={{ width: '24px', height: '24px' }} // Fixed size to prevent layout shift
                  >
                    <div style={{ position: 'relative', width: '24px', height: '24px', pointerEvents: 'none' }}>
                      <Icon className="w-6 h-6" />
                      {/* Badge: NEVER show if panel has ever been opened */}
                      {/* Once panel is opened once, badge should never appear again */}
                      {item.type === 'notification' && optimisticUnreadCount > 0 && !hasEverOpenedPanel && (
                        <motion.span
                          key={`badge-${optimisticUnreadCount}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: showNotifications ? 0 : 1,
                            opacity: showNotifications ? 0 : 1
                          }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg z-10"
                          aria-hidden="true"
                          style={{
                            visibility: showNotifications ? 'hidden' : 'visible',
                            pointerEvents: 'none',
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            minWidth: '16px',
                            height: '16px',
                            lineHeight: '16px',
                            // Ensure badge doesn't affect navbar height
                            transform: 'translateZ(0)',
                          }}
                        >
                          {optimisticUnreadCount > 9 ? '9+' : optimisticUnreadCount}
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                  <motion.span
                    className="text-xs mt-1 font-medium no-underline"
                    style={{ textDecoration: 'none' }}
                    animate={isActive ? {
                      fontWeight: 700,
                      scale: 1.1
                    } : {
                      fontWeight: 500,
                      scale: 1
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                </button>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
              className="relative"
              style={{
                flex: '0 0 auto',
                height: '100%',
                minWidth: '44px',
                minHeight: '44px',
                pointerEvents: 'auto'
              }}
            >
              <button
                type="button"
                onClick={(event) => {
                  // Prevent any default behavior
                  event.stopPropagation();
                  event.preventDefault();

                  // Always try to navigate - handleNavigation has its own guards
                  handleNavigation(event, item.path);
                }}
                onMouseDown={(event) => {
                  // Prevent text selection and other default behaviors
                  event.stopPropagation();
                  if (isNavigating) {
                    event.preventDefault();
                  }
                }}
                onTouchStart={(event) => {
                  // Prevent touch scrolling and other default behaviors
                  event.stopPropagation();
                  if (isNavigating) {
                    event.preventDefault();
                  }
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
                disabled={isNavigating}
                className={`flex flex-col items-center justify-center h-full relative no-underline w-full ${
                  isActive ? 'text-velora-primary' : 'text-gray-400'
                } transition-colors ${isNavigating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                style={{
                  textDecoration: 'none',
                  pointerEvents: isNavigating ? 'none' : 'auto',
                  cursor: isNavigating ? 'wait' : 'pointer',
                  minHeight: '44px',
                  minWidth: '44px',
                  padding: '4px 8px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  zIndex: 10002,
                  touchAction: 'manipulation',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-velora-primary/10 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={isActive ? {
                    scale: [1, 1.3, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: isActive ? Infinity : 0,
                    repeatDelay: 2
                  }}
                  style={{
                    pointerEvents: 'none',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <motion.span
                  className="text-xs mt-1 font-medium no-underline"
                  style={{
                    textDecoration: 'none',
                    pointerEvents: 'none',
                  }}
                  animate={isActive ? {
                    fontWeight: 700,
                    scale: 1.1
                  } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              </button>
            </motion.div>
          );
        })}
      </div>
      </motion.nav>
      {/* Notification Panel - Rendered here to control visibility */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => {
          handleSetShowNotifications(false);
        }}
        onNotificationsLoaded={handleNotificationsLoaded}
      />
    </>
  );
}

