import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HomeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PhoneIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/solid';
import {
  HomeIcon as HomeIconOutline,
  HeartIcon as HeartIconOutline,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconOutline,
  UserIcon as UserIconOutline,
  PhoneIcon as PhoneIconOutline,
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline,
} from '@heroicons/react/24/outline';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef(null);
  const lastNavigationPathRef = useRef(null);

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

  const navItems = [
    { path: '/', icon: HomeIcon, iconOutline: HomeIconOutline, label: 'Discover' },
    { path: '/matches', icon: HeartIcon, iconOutline: HeartIconOutline, label: 'Matches' },
    { path: '/chat', icon: ChatBubbleLeftRightIcon, iconOutline: ChatBubbleLeftRightIconOutline, label: 'Chat' },
    { path: '/utility', icon: WrenchScrewdriverIcon, iconOutline: WrenchScrewdriverIconOutline, label: 'Utility' },
    { path: '/calls', icon: PhoneIcon, iconOutline: PhoneIconOutline, label: 'Calls' },
    { path: '/profile', icon: UserIcon, iconOutline: UserIconOutline, label: 'Profile' },
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
          const isActive = location.pathname === item.path ||
            (item.path === '/chat' && location.pathname.startsWith('/chat/'));
          const Icon = isActive ? item.icon : item.iconOutline;

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
    </>
  );
}

