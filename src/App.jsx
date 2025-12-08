import { useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { CallProvider } from './contexts/CallContext';
import { GroupsProvider } from './contexts/GroupsContext';
import FCMNotificationProvider from './components/common/FCMNotificationProvider';
import DeepLinkHandler from './components/common/DeepLinkHandler';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import BottomNav from './components/common/BottomNav';
import GlobalNavBar, { NavBarProvider } from './components/common/GlobalNavBar';
import { useNavBarContext } from './components/common/GlobalNavBar';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProfileLeftSidebar from './components/sidebar/ProfileLeftSidebar';
import { initNavbarHeight } from './utils/navbarHeight';

// Lazy load heavy components to prevent crashes and improve performance
const MarketingHome = lazy(() => import('./pages/MarketingHome'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Home = lazy(() => import('./pages/Home'));
const Matches = lazy(() => import('./pages/Matches'));
const Chat = lazy(() => import('./pages/Chat'));
const Calls = lazy(() => import('./pages/Calls'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileViewers = lazy(() => import('./pages/ProfileViewers'));
const Settings = lazy(() => import('./pages/Settings'));
const Wallet = lazy(() => import('./pages/Wallet'));
const WithdrawRequests = lazy(() => import('./pages/WithdrawRequests'));
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUserList = lazy(() => import('./pages/admin/AdminUserList'));
const AdminFakeUsers = lazy(() => import('./pages/admin/AdminFakeUsers'));
const AdminFakeUserForm = lazy(() => import('./pages/admin/AdminFakeUserForm'));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans'));
const AdminCoinPackages = lazy(() => import('./pages/admin/AdminCoinPackages'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminIcebreakers = lazy(() => import('./pages/admin/AdminIcebreakers'));
const AdminPages = lazy(() => import('./pages/admin/AdminPages'));
const AdminForums = lazy(() => import('./pages/admin/AdminForums'));
const AdminChats = lazy(() => import('./pages/admin/AdminChats'));
const AdminGifts = lazy(() => import('./pages/admin/AdminGifts'));
const AdminGiftManagement = lazy(() => import('./pages/admin/AdminGiftManagement'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));
const AdminVerificationReview = lazy(() => import('./pages/admin/AdminVerificationReview'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminCoins = lazy(() => import('./pages/admin/AdminCoins'));
const Events = lazy(() => import('./pages/Events'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Forums = lazy(() => import('./pages/Forums'));
const CreateForum = lazy(() => import('./pages/CreateForum'));
const ForumDetails = lazy(() => import('./pages/ForumDetails'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const JoinGroup = lazy(() => import('./pages/JoinGroup'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityDetails = lazy(() => import('./pages/CommunityDetails'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const GroupDates = lazy(() => import('./pages/GroupDates'));
const CreateGroupDate = lazy(() => import('./pages/CreateGroupDate'));
const GroupDateDetails = lazy(() => import('./pages/GroupDateDetails'));
const Utility = lazy(() => import('./pages/Utility'));
const Support = lazy(() => import('./pages/Support'));
const SupportTicketDetails = lazy(() => import('./pages/SupportTicketDetails'));
const PrivacySettings = lazy(() => import('./pages/PrivacySettings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Contact = lazy(() => import('./pages/Contact'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const About = lazy(() => import('./pages/About'));
const SafetyPolicy = lazy(() => import('./pages/SafetyPolicy'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const Leadership = lazy(() => import('./pages/Leadership'));
const TrustedContactsPage = lazy(() => import('./pages/safety/TrustedContactsPage'));
const EmergencyAlertPage = lazy(() => import('./pages/safety/EmergencyAlertPage'));
const DateHistoryPage = lazy(() => import('./pages/safety/DateHistoryPage'));
const AdminBroadcastNotifications = lazy(() => import('./pages/admin/AdminBroadcastNotifications'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen" style={{
    paddingTop: 'var(--top-navbar-height, 64px)',
    paddingBottom: 'var(--bottom-navbar-height, 60px)',
  }}>
    <LoadingSpinner />
  </div>
);

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  }
};

// Global Sidebar Component - Available on all pages (except Home, Matches, Chat, Profile, Admin)
function GlobalSidebar() {
  const navBarContext = useNavBarContext();
  const location = useLocation();

  // Provide default values if context is not available
  const showLeftSidebar = navBarContext?.showLeftSidebar ?? false;
  const setShowLeftSidebar = navBarContext?.setShowLeftSidebar ?? (() => { });

  // Don't render sidebar on these pages:
  // - Home page (has its own sidebar in the layout)
  // - Matches page
  // - Chat page (list or detail)
  // - Profile page
  // - Create pages (groups, forums, events, etc.)
  // - Auth pages (login, signup, etc.)
  // - Admin pages (all admin routes)
  const isHomePage = location.pathname === '/';
  const isMatchesPage = location.pathname === '/matches';
  const isChatPage = location.pathname.startsWith('/chat');
  const isProfilePage = location.pathname.startsWith('/profile');
  const isCreatePage = location.pathname.includes('/create') ||
    location.pathname.includes('/groups/create') ||
    location.pathname.includes('/forums/create') ||
    location.pathname.includes('/events/create') ||
    location.pathname.includes('/group-dates/create') ||
    location.pathname.includes('/communities/create');
  const isAuthRoute = location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname.startsWith('/admin/login') ||
    location.pathname === '/privacy-policy' ||
    location.pathname === '/terms-conditions' ||
    location.pathname === '/contact-us' ||
    location.pathname === '/contact' ||
    location.pathname === '/about' ||
    location.pathname === '/refund-policy' ||
    location.pathname === '/safety-policy';
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  const isCompleteProfile = location.pathname === '/complete-profile';

  // Close sidebar when route changes (only if context is available and route actually changed)
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (navBarContext && setShowLeftSidebar && prevPathnameRef.current !== location.pathname) {
      const currentSidebarState = navBarContext.showLeftSidebar;
      if (currentSidebarState) {
        setShowLeftSidebar(false);
      }
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, navBarContext, setShowLeftSidebar]);

  // Handle case where context might not be available yet
  if (!navBarContext) {
    return null;
  }

  // Exclude home page (has its own sidebar), auth and admin routes, static pages, and complete profile page
  // Sidebar should be available on all other pages
  const isStaticPage = location.pathname === '/privacy-policy' ||
    location.pathname === '/terms-conditions' ||
    location.pathname === '/contact-us' ||
    location.pathname === '/contact' ||
    location.pathname === '/about' ||
    location.pathname === '/refund-policy' ||
    location.pathname === '/safety-policy';
  
  if (isHomePage || isAuthRoute || isAdminRoute || isCompleteProfile || isStaticPage) {
    return null;
  }

  return (
    <ProfileLeftSidebar
      isOpen={showLeftSidebar}
      onClose={() => setShowLeftSidebar(false)}
      isHomePage={false}
    />
  );
}

// Page wrapper component that ensures proper layout
const PageWrapper = ({ children }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {children}
  </div>
);

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.5
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll main content area, not window
    const mainElement = document.querySelector('main[class*="overflow-y-auto"]');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);

  return null;
}

// Conditional Home Route - Shows MarketingHome for unauthenticated, Home for authenticated
function ConditionalHomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    // Show marketing home for unauthenticated users
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        <Suspense fallback={<PageLoader />}>
          <MarketingHome />
        </Suspense>
      </motion.div>
    );
  }

  // Show app home for authenticated users
  return (
    <ProtectedRoute>
      <PageWrapper>
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        </motion.div>
      </PageWrapper>
    </ProtectedRoute>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}
              >
                <Login />
              </motion.div>
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/signup" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            style={{
              margin: 0,
              padding: 0,
              height: 'calc(var(--vh, 1vh) * 100)',
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              touchAction: 'none'
            }}
          >
            <Signup />
          </motion.div>
        } />
        <Route path="/complete-profile" element={
          <ProtectedRoute requireProfileCompletion={false}>
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
              style={{
                margin: 0,
                padding: 0,
                minHeight: '100vh',
                overflow: 'visible',
                height: 'auto'
              }}
            >
              <Suspense fallback={<PageLoader />}>
                <CompleteProfile />
              </Suspense>
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/privacy-policy" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <PrivacyPolicy />
          </motion.div>
        } />
        <Route path="/terms-conditions" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <TermsAndConditions />
          </motion.div>
        } />
        <Route path="/contact-us" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ContactUs />
          </motion.div>
        } />
        <Route path="/contact" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Suspense fallback={<PageLoader />}>
              <Contact />
            </Suspense>
          </motion.div>
        } />
        <Route path="/refund-policy" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Suspense fallback={<PageLoader />}>
              <RefundPolicy />
            </Suspense>
          </motion.div>
        } />
        <Route path="/about" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Suspense fallback={<PageLoader />}>
              <About />
            </Suspense>
          </motion.div>
        } />
        <Route path="/safety/trusted-contacts" element={
          <ProtectedRoute>
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <TrustedContactsPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/safety/emergency" element={
          <ProtectedRoute>
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <EmergencyAlertPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/safety/date-history" element={
          <ProtectedRoute>
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DateHistoryPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/safety-policy" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <SafetyPolicy />
          </motion.div>
        } />
        <Route
          path="/"
          element={<ConditionalHomeRoute />}
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Matches />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Chat />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/group/:groupId/invite/:inviteToken"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Chat />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/group/:groupId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Chat />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:matchId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Chat />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/utility"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 auto',
                    minHeight: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Utility />
                </motion.div>
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calls"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Calls />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Profile />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Profile />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile-viewers"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <ProfileViewers />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <ProgressPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leadership"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Leadership />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Settings />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Wallet />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdraw-requests"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 auto',
                    minHeight: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <WithdrawRequests />
                </motion.div>
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-security"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <AccountSecurity />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Subscriptions />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Events />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <EventDetail />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <CreateEvent />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forums"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Forums />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forums/create"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <CreateForum />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/forums/:forumId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <ForumDetails />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Groups />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/create"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <CreateGroup />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <GroupDetails />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/group/:groupId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <GroupDetails />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/join-group/:shareCode"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <JoinGroup />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Communities />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/create"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <CreateCommunity />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:communityId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <CommunityDetails />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-dates"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <GroupDates />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-dates/create"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <CreateGroupDate />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-dates/:id"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <GroupDateDetails />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Support />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/support/:ticketId"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <SupportTicketDetails />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy-settings"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <PrivacySettings />
              </motion.div>
            </ProtectedRoute>
          }
        />
        {/* Admin Routes */}
        <Route path="/admin/login" element={
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            <AdminLogin />
          </motion.div>
        } />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUserList />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <AdminProtectedRoute>
              <AdminVerifications />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/verifications/:id"
          element={
            <AdminProtectedRoute>
              <AdminVerificationReview />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/fake-users"
          element={
            <AdminProtectedRoute>
              <AdminFakeUsers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/fake-users/create"
          element={
            <AdminProtectedRoute>
              <AdminFakeUserForm />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/fake-users/edit/:id"
          element={
            <AdminProtectedRoute>
              <AdminFakeUserForm />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <AdminProtectedRoute>
              <AdminPlans />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/coin-packages"
          element={
            <AdminProtectedRoute>
              <AdminCoinPackages />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminProtectedRoute>
              <AdminEvents />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/forums"
          element={
            <AdminProtectedRoute>
              <AdminForums />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/icebreakers"
          element={
            <AdminProtectedRoute>
              <AdminIcebreakers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/pages"
          element={
            <AdminProtectedRoute>
              <AdminPages />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/chats"
          element={
            <AdminProtectedRoute>
              <AdminChats />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/gifts"
          element={
            <AdminProtectedRoute>
              <AdminGifts />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/gift-management"
          element={
            <AdminProtectedRoute>
              <AdminGiftManagement />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminProtectedRoute>
              <AdminPayments />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminProtectedRoute>
              <AdminWithdrawals />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/coins"
          element={
            <AdminProtectedRoute>
              <AdminCoins />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/push-notifications"
          element={
            <AdminProtectedRoute>
              <AdminBroadcastNotifications />
            </AdminProtectedRoute>
          }
        />
        {/* Catch-all route must be LAST - after all other routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function MainLayoutContainer() {
  const location = useLocation();
  const { user } = useAuth();

  // Check if navbar should be shown (same logic as GlobalNavBar)
  const isAuthRoute = ['/login', '/signup'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  const isMarketingPage = location.pathname === '/' && !user; // Marketing home page for unauthenticated users
  const isStaticPage = ['/privacy-policy', '/terms-conditions', '/contact-us', '/contact', '/about', '/safety-policy', '/refund-policy'].includes(location.pathname);
  const isCompleteProfile = location.pathname === '/complete-profile';
  const shouldShowNavbar = !isAuthRoute && !isAdminRoute && !isStaticPage && !isCompleteProfile && !isMarketingPage;

  return (
    <div
      className="flex flex-1 min-h-0 overflow-hidden w-full"
      style={{
        display: 'flex',
        flexDirection: 'row',
        flex: '1 1 auto',
        minHeight: 0,
        width: '100%',
        maxWidth: '100%',
        marginTop: shouldShowNavbar ? 'var(--top-navbar-height, 64px)' : '0',
        height: shouldShowNavbar
          ? 'calc(100vh - var(--top-navbar-height, 64px) - var(--bottom-navbar-height, 60px))'
          : '100vh',
        gap: 0,
        position: 'relative',
      }}
    >
      {/* Global Left Sidebar - Available on all pages, controlled by navbar menu icon */}
      <GlobalSidebar />
      {/* Main Content Area */}
      <MainContentWrapper>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </ErrorBoundary>
      </MainContentWrapper>
    </div>
  );
}

function ConditionalBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdminRoute = useMemo(() => {
    return location.pathname.startsWith('/admin');
  }, [location.pathname]);

  const isAuthRoute = useMemo(() => {
    return location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname.startsWith('/admin/login');
  }, [location.pathname]);

  const isMarketingPage = location.pathname === '/' && !user;
  const isStaticPage = ['/privacy-policy', '/terms-conditions', '/contact-us', '/contact', '/about', '/safety-policy', '/refund-policy'].includes(location.pathname);
  const isCompleteProfile = location.pathname === '/complete-profile';

  // Don't render BottomNav on admin routes, auth pages, marketing pages, static pages, or complete-profile page
  if (isAdminRoute || isAuthRoute || isCompleteProfile || isMarketingPage || isStaticPage) {
    return null;
  }

  return <BottomNav />;
}

// Main content wrapper that ensures proper layout structure with padding
// Pages inside handle their own scrolling via PageContainer or CSS
function MainContentWrapper({ children }) {
  const location = useLocation();
  const navBarContext = useNavBarContext();

  const isAdminRoute = useMemo(() => {
    return location.pathname.startsWith('/admin');
  }, [location.pathname]);

  const isAuthRoute = useMemo(() => {
    return location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname.startsWith('/admin/login');
  }, [location.pathname]);

  const isCompleteProfile = location.pathname === '/complete-profile';

  // Pages that should have left padding for sidebar on desktop
  // Sidebar is shown on all pages except home, auth, and admin (see GlobalSidebar)
  // On desktop, sidebar is always visible when shouldShowSidebar is true
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';
  const isMarketingPage = location.pathname === '/' && !user;
  const shouldShowSidebar = !isHomePage && !isAuthRoute && !isAdminRoute && !isCompleteProfile && !isMarketingPage;
  const showLeftSidebar = navBarContext?.showLeftSidebar ?? false;
  // On desktop, sidebar is always visible, so we need padding when shouldShowSidebar is true
  // On mobile, sidebar is only visible when showLeftSidebar is true

  const shouldShowBottomNav = !isAdminRoute && !isAuthRoute && !isCompleteProfile && !isMarketingPage;

  return (
    <div
      className="main-content-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: shouldShowBottomNav ? 'calc(var(--bottom-navbar-height, 60px) + env(safe-area-inset-bottom, 0px))' : 0,
        transition: 'none', // Prevent layout shifts during route changes
      }}
    >
      {children}
    </div>
  );
}

function App() {
  // Initialize navbar height tracking
  useEffect(() => {
    const cleanup = initNavbarHeight();
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <PresenceProvider>
        <CallProvider>
          <GroupsProvider>
            <Router>
            <FCMNotificationProvider>
            <DeepLinkHandler />
            <ScrollToTop />
          <div
            className="App"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              maxHeight: '100vh',
              width: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            <ErrorBoundary>
              <NavBarProvider>
                {/* Global NavBar - Rendered once, stays mounted across routes - NEVER remounts */}
                <GlobalNavBar />
                {/* Main Layout Container - Flex row on desktop for sidebar + content */}
                <MainLayoutContainer />
                {/* BottomNav rendered conditionally - hidden on admin routes - NEVER remounts */}
                <ConditionalBottomNav />
              </NavBarProvider>
            </ErrorBoundary>
          </div>
          <Toaster
            position="top-center"
            containerStyle={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              pointerEvents: 'none',
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                maxWidth: '400px',
                wordWrap: 'break-word',
                lineHeight: '1.5',
                pointerEvents: 'auto',
                zIndex: 999999,
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  zIndex: 999999,
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  zIndex: 999999,
                },
              },
            }}
          />
            </FCMNotificationProvider>
            </Router>
          </GroupsProvider>
        </CallProvider>
      </PresenceProvider>
    </AuthProvider>
  );
}

export default App;
