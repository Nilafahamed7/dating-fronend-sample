import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, ArrowLeftIcon, BellIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import OnlineStatusToggle from './OnlineStatusToggle';

// Create the NavBar Context
const NavBarContext = createContext(null);

// NavBar Provider Component
export function NavBarProvider({ children }) {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [profileTitle, setProfileTitle] = useState(null);
  const [profileShowBack, setProfileShowBack] = useState(false);
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
      profileTitle,
      setProfileTitle,
      profileShowBack,
      setProfileShowBack,
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
      profileTitle,
      profileShowBack,
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
    // Return default values if context is not available (for components outside provider)
    return {
      showLeftSidebar: false,
      setShowLeftSidebar: () => { },
      showNotificationPanel: false,
      setShowNotificationPanel: () => { },
      profileTitle: null,
      setProfileTitle: () => { },
      profileShowBack: false,
      setProfileShowBack: () => { },
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
    profileTitle,
    profileShowBack,
    setProfileShowBack,
    homeLeftAction,
    homeRightAction
  } = useNavBarContext();

  const path = location.pathname;

  // Get navbar content based on route
  const getNavBarContent = useCallback(() => {
    // Use profileTitle if set (for create pages)
    if (profileTitle) {
      return {
        title: profileTitle,
        showBack: profileShowBack,
      };
    }

    // Route-specific content
    if (path === '/') {
      return { title: 'Discover', showBack: false };
    }
    if (path === '/matches') {
      return { title: 'Matches', showBack: false };
    }
    if (path.startsWith('/chat')) {
      return { title: 'Chat', showBack: path !== '/chat' };
    }
    if (path === '/calls') {
      return { title: 'Calls', showBack: false };
    }
    if (path === '/profile' || path.startsWith('/profile/')) {
      return { title: 'Profile', showBack: path !== '/profile' };
    }
    if (path === '/events' || path.startsWith('/events/')) {
      return { title: 'Events', showBack: path !== '/events' };
    }
    if (path === '/forums' || path.startsWith('/forums/')) {
      return { title: 'Forums', showBack: path !== '/forums' };
    }
    if (path === '/wallet') {
      return { title: 'Wallet', showBack: false };
    }
    if (path === '/withdraw-requests') {
      return { title: 'Withdraw Requests', showBack: false };
    }
    if (path.startsWith('/events/create')) {
      return { title: 'Create Event', showBack: true };
    }
    if (path.startsWith('/forums/create')) {
      return { title: 'Create Forum', showBack: true };
    }
    if (path.startsWith('/groups/create')) {
      return { title: 'Create Group', showBack: true };
    }
    if (path.startsWith('/communities/create')) {
      return { title: 'Create Community', showBack: true };
    }
    if (path.startsWith('/group-dates/create')) {
      return { title: 'Create Group Date', showBack: true };
    }

    return { title: '', showBack: false };
  }, [location.pathname, profileTitle, profileShowBack]);

  const navContent = getNavBarContent();
  const showBack = navContent.showBack || profileShowBack;
  const title = navContent.title || '';

  // Don't show navbar on auth pages, admin pages, or complete-profile page
  const isAuthRoute = ['/login', '/signup'].includes(path);
  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login';
  const isStaticPage = ['/privacy-policy', '/terms-conditions', '/contact-us', '/safety-policy', '/refund-policy'].includes(path);
  const isCompleteProfile = path === '/complete-profile';

  // Show navbar on static pages with back button and hamburger
  if (isStaticPage) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left side - Back button and Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLeftSidebar(prev => !prev);
                }}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
                aria-expanded={showLeftSidebar}
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {path === '/privacy-policy' && 'Privacy Policy'}
                {path === '/terms-conditions' && 'Terms & Conditions'}
                {path === '/contact-us' && 'Contact Us'}
                {path === '/safety-policy' && 'Safety Policy'}
                {path === '/refund-policy' && 'Refund Policy'}
              </h1>
            </div>

            {/* Right side - Notifications and Online Status Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <NotificationBell />
              <OnlineStatusToggle />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (isAuthRoute || isAdminRoute || isCompleteProfile) {
    return null;
  }

  // Determine if back button should be shown on mobile
  // Show back button on mobile for all pages except main/home pages
  const mainPages = ['/', '/home', '/matches', '/chat', '/calls', '/profile', '/wallet'];
  const isMainPage = mainPages.some(mainPath => {
    if (mainPath === '/chat') {
      return path === '/chat'; // Only exact match for /chat
    }
    if (mainPath === '/profile') {
      return path === '/profile'; // Only exact match for /profile
    }
    return path === mainPath;
  });

  // On mobile, show back button if not on a main page OR if explicitly set to show back
  // On desktop, only show back if explicitly set
  const shouldShowBackOnMobile = !isMainPage || showBack;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Menu and Back button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Mobile: Show back button if shouldShowBackOnMobile is true */}
            {shouldShowBackOnMobile ? (
              <button
                onClick={() => {
                  // Check if there's history to go back to
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    // If no history, navigate to home
                    navigate('/home');
                  }
                }}
                className="lg:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
            ) : (
              // Mobile: Show menu button when back button is not shown
              <button
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
              </button>
            )}

            {/* Desktop: Show back button if explicitly set, otherwise show menu */}
            {showBack ? (
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/home');
                  }
                }}
                className="hidden lg:flex p-2 hover:bg-amber-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
            ) : (
              <button
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
              </button>
            )}
            {homeLeftAction ? (
              homeLeftAction
            ) : (
              title && (
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate flex items-center gap-2">
                  {title === 'Discover' && (
                    <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-velora-primary" />
                  )}
                  {title}
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
    </nav>
  );
}

export default GlobalNavBar;
