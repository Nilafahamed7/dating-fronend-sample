import { createContext, useContext, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bars3Icon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import OnlineStatusToggle from './OnlineStatusToggle';
import { NotificationPanel } from '../notificationPanel';

// Create the NavBar Context
const NavBarContext = createContext(null);

// NavBar Provider Component
export function NavBarProvider({ children }) {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Global Navbar State
  const [navbarTitle, setNavbarTitle] = useState('');
  const [showBackButton, setShowBackButton] = useState(false);

  const [bottomContent, setBottomContent] = useState(null);
  const [callTrigger, setCallTrigger] = useState(null);
  const [navBarContent, setNavBarContent] = useState(null);
  const [homeLeftAction, setHomeLeftAction] = useState(null);
  const [homeRightAction, setHomeRightAction] = useState(null);

  const value = useMemo(
    () => ({
      showLeftSidebar,
      setShowLeftSidebar,
      showNotificationPanel,
      setShowNotificationPanel,
      navbarTitle,
      setNavbarTitle,
      showBackButton,
      setShowBackButton,
      bottomContent,
      setBottomContent,
      callTrigger,
      setCallTrigger,
      navBarContent,
      setNavBarContent,
      homeLeftAction,
      setHomeLeftAction,
      homeRightAction,
      setHomeRightAction,
    }),
    [
      showLeftSidebar,
      showNotificationPanel,
      navbarTitle,
      showBackButton,
      bottomContent,
      callTrigger,
      navBarContent,
      homeLeftAction,
      homeRightAction,
    ]
  );

  return <NavBarContext.Provider value={value}>{children}</NavBarContext.Provider>;
}

// Hook to use NavBar Context
export function useNavBarContext() {
  const context = useContext(NavBarContext);
  if (!context) {
    return {
      showLeftSidebar: false,
      setShowLeftSidebar: () => { },
      showNotificationPanel: false,
      setShowNotificationPanel: () => { },
      navbarTitle: '',
      setNavbarTitle: () => { },
      showBackButton: false,
      setShowBackButton: () => { },
      bottomContent: null,
      setBottomContent: () => { },
      callTrigger: null,
      setCallTrigger: () => { },
      navBarContent: null,
      setNavBarContent: () => { },
      homeLeftAction: null,
      setHomeLeftAction: () => { },
      homeRightAction: null,
      setHomeRightAction: () => { },
    };
  }
  return context;
}

// Global NavBar Component
function GlobalNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    showLeftSidebar,
    setShowLeftSidebar,
    showNotificationPanel,
    setShowNotificationPanel,
    navbarTitle,
    showBackButton,
    homeLeftAction,
    homeRightAction
  } = useNavBarContext();

  const path = location.pathname;

  // Don't show navbar on auth pages, admin pages, or complete-profile page
  const isAuthRoute = ['/login', '/signup'].includes(path);
  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';
  const isMarketingPage = path === '/' && !user; // Marketing home page for unauthenticated users
  const isStaticPage = ['/privacy-policy', '/terms-conditions', '/contact-us', '/contact', '/about', '/safety-policy', '/refund-policy'].includes(path);
  const isCompleteProfile = path === '/complete-profile';

  // Hide navbar completely on marketing page and static pages (they have their own headers)
  if (isMarketingPage || isStaticPage) {
    return null;
  }

  if (isAuthRoute || isAdminRoute || isCompleteProfile) {
    return null;
  }

  // Determine if back button should be shown on mobile
  // Show back button on mobile for all pages except main/home pages
  // Also respect the global showBackButton state
  const mainPages = ['/', '/home', '/matches', '/chat', '/calls', '/profile', '/wallet', '/groups', '/utility'];

  // Exact match for main pages to hide back button on mobile
  const isMainPage = mainPages.some(mainPath => path === mainPath);

  // On mobile: Show back button if NOT a main page OR if explicitly requested
  // On desktop: Back button is hidden (browser back used instead), always show menu
  const shouldShowBackOnMobile = !isMainPage || showBackButton;
  const shouldShowBackOnDesktop = false;

  const handleBack = () => {
    // Smart back navigation
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback navigation based on current section
      if (path.startsWith('/chat/')) {
        navigate('/chat');
      } else if (path.startsWith('/groups/')) {
        navigate('/groups');
      } else if (path.startsWith('/profile/')) {
        navigate('/profile');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Menu and Back button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Mobile: Show back button if shouldShowBackOnMobile is true */}
            {shouldShowBackOnMobile ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBack}
                className="lg:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </motion.button>
            ) : (
              // Mobile: Show menu button when back button is not shown (only if authenticated)
              user && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowLeftSidebar(prev => !prev);
                  }}
                  className="lg:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                  aria-expanded={showLeftSidebar}
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </motion.button>
              )
            )}

            {/* Desktop: Show back button if explicitly set, otherwise show menu */}
            {shouldShowBackOnDesktop ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBack}
                className="hidden lg:flex p-2 hover:bg-amber-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </motion.button>
            ) : (
              // Desktop: Show menu button (only if authenticated)
              user && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowLeftSidebar(prev => !prev);
                  }}
                  className="hidden lg:flex p-2 hover:bg-amber-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                  aria-expanded={showLeftSidebar}
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </motion.button>
              )
            )}

            {homeLeftAction ? (
              homeLeftAction
            ) : (
              navbarTitle && (
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate flex items-center gap-2">
                  {navbarTitle}
                </h1>
              )
            )}
          </div>

          {/* Right side - Notifications and Online Status Toggle (toggle is last/right-most) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {homeRightAction}
            <NotificationBell />
            <OnlineStatusToggle />
          </div>
        </div>
      </div>

      {/* Notification Panel - Rendered from top navbar */}
      <NotificationPanel
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />
    </nav>
  );
}

export default GlobalNavBar;
