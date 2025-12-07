import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { matchService } from '../services/matchService';
import { profileService } from '../services/profileService';
import { publicService } from '../services/publicService';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { usePresence } from '../contexts/PresenceContext';
import { usePaymentGate } from '../hooks/usePaymentGate';
import SwipeStack from '../components/swipe/SwipeStack';
import ProfileGrid from '../components/profile/ProfileGrid';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import PageContainer from '../components/common/PageContainer';
import FilterModal from '../components/filters/FilterModal';
import ProfileLeftSidebar from '../components/sidebar/ProfileLeftSidebar';
import { FunnelIcon, Squares2X2Icon, RectangleStackIcon, SparklesIcon, UserCircleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { calculateAge, calculateDistance } from '../utils/helpers';
import { useSearchParams } from 'react-router-dom';

export default function Home() {
  const { user, updateUser } = useAuth();
  const { presenceMap, isUserOnline, seedPresenceFromProfiles } = usePresence();
  const location = useLocation();
  const navigate = useNavigate();
  const { checkLike, checkSuperlike, refreshBalance, ACTION_COSTS } = usePaymentGate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'swipe'
  const [showFilters, setShowFilters] = useState(false);
  // Use global sidebar state from NavBarContext
  const { showLeftSidebar, setShowLeftSidebar } = useNavBarContext();

  // Close sidebar when navigating away from home page (only if route actually changed)
  const prevPathnameForSidebarRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameForSidebarRef.current !== location.pathname && location.pathname !== '/') {
      if (showLeftSidebar) {
        setShowLeftSidebar(false);
      }
    }
    prevPathnameForSidebarRef.current = location.pathname;
  }, [location.pathname, setShowLeftSidebar, showLeftSidebar]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedProfileForGift, setSelectedProfileForGift] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [showSuperLikeSplash, setShowSuperLikeSplash] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [showIncognitoConfirm, setShowIncognitoConfirm] = useState(false);
  const navBarContext = useNavBarContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Online filter state - read from URL query param
  const [onlineFilter, setOnlineFilter] = useState(() => {
    return searchParams.get('online') === 'true';
  });

  // Auto-set gender filter to opposite gender based on logged-in user
  const getOppositeGender = (userGender) => {
    if (userGender === 'male') return 'female';
    if (userGender === 'female') return 'male';
    return 'all'; // If gender is 'other' or undefined, show all
  };

  // On desktop, sidebars are always visible, so we don't need to track state
  // But on mobile, we need to control visibility
  const [filters, setFilters] = useState({
    ageRange: { min: 18, max: 50 },
    distance: 50,
    gender: user?.gender ? getOppositeGender(user.gender) : 'all',
    interests: [],
    religions: [],
    relationGoals: [],
  });

  // Memoize navbar actions to prevent infinite loops
  // Note: Mobile menu icon is now handled globally in GlobalNavBar
  const homeLeftAction = useMemo(() => null, []); // No left action needed - global menu icon handles it

  const homeRightAction = useMemo(() => (
    <motion.button
      onClick={() => {
        const newMode = viewMode === 'grid' ? 'swipe' : 'grid';
        setViewMode(newMode);
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-2 hover:bg-velora-primary/10 rounded-full transition-colors relative z-10"
      title={viewMode === 'grid' ? 'Switch to Swipe View' : 'Switch to Grid View'}
      type="button"
      aria-label={viewMode === 'grid' ? 'Switch to Swipe View' : 'Switch to Grid View'}
    >
      {viewMode === 'grid' ? (
        <RectangleStackIcon className="w-6 h-6 text-velora-darkGray hover:text-velora-primary transition-colors" />
      ) : (
        <Squares2X2Icon className="w-6 h-6 text-velora-darkGray hover:text-velora-primary transition-colors" />
      )}
    </motion.button>
  ), [viewMode]);

  // Update navbar actions when on home page - single effect with guards
  const prevPathnameRef = useRef(location.pathname);
  const prevViewModeRef = useRef(viewMode);
  const prevShowLeftSidebarRef = useRef(showLeftSidebar);

  // Set navbar actions immediately when component mounts or when on home page
  useEffect(() => {
    if (!navBarContext) return;

    if (location.pathname === '/') {
      // Always set actions when on home page
      navBarContext.setHomeLeftAction(homeLeftAction);
      navBarContext.setHomeRightAction(homeRightAction);
    }
  }, [location.pathname, homeLeftAction, homeRightAction, navBarContext]);

  // Update navbar actions when viewMode or sidebar changes
  useEffect(() => {
    if (!navBarContext) return;

    const pathnameChanged = prevPathnameRef.current !== location.pathname;
    const viewModeChanged = prevViewModeRef.current !== viewMode;
    const sidebarChanged = prevShowLeftSidebarRef.current !== showLeftSidebar;

    if (location.pathname === '/') {
      // Update if something changed
      if (pathnameChanged || viewModeChanged || sidebarChanged) {
        navBarContext.setHomeLeftAction(homeLeftAction);
        navBarContext.setHomeRightAction(homeRightAction);
      }
    } else if (pathnameChanged) {
      // Clear actions when navigating away from home page
      navBarContext.setHomeLeftAction(null);
      navBarContext.setHomeRightAction(null);
    }

    // Update refs
    prevPathnameRef.current = location.pathname;
    prevViewModeRef.current = viewMode;
    prevShowLeftSidebarRef.current = showLeftSidebar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, viewMode, showLeftSidebar, navBarContext, homeLeftAction, homeRightAction]);

  // Sync incognito state to window for API interceptor
  useEffect(() => {
    window.__incognitoMode = isIncognito;
    // Clear incognito on page unload or navigation
    return () => {
      window.__incognitoMode = false;
    };
  }, [isIncognito]);

  // Clear incognito when filters modal closes or user logs out
  useEffect(() => {
    if (!showFilters && isIncognito) {
      // Keep incognito active even when filter modal closes
      // Only clear on explicit disable or page refresh
    }
  }, [showFilters, isIncognito]);

  // Presence tracking is now handled by PresenceContext - no need for local socket setup here

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadSuggestions();
      getCurrentLocation();
      // Update gender filter to opposite gender when user loads
      const oppositeGender = getOppositeGender(user.gender);
      setFilters(prev => ({
        ...prev,
        gender: oppositeGender,
      }));
    }
    // Clear incognito when user changes (logout/login)
    if (!user) {
      setIsIncognito(false);
    }
  }, [user?._id, user?.gender]); // Reload when user changes (e.g., after login)

  useEffect(() => {
    // Reload suggestions when filters change (but not on initial mount)
    if (!loading) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Reload user profile when navigating back to home page
  // This ensures the sidebar reflects any profile updates immediately
  useEffect(() => {
    if (location.pathname === '/') {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const loadUserProfile = async () => {
    try {
      const response = await profileService.getMyProfile();
      if (response.data) {
        // Update AuthContext with complete profile data
        const updatedUserData = {
          ...user,
          ...response.data,
          profile: response.data.profile,
          preferences: response.data.preferences,
        };
        updateUser(updatedUserData);
      }
    } catch (error) {
      }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          }
      );
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      // Always fetch all profiles - we'll filter client-side for real-time updates
      // This ensures we have all profiles available for real-time presence filtering
      const response = await matchService.getSuggestions({});
      // Backend returns: { success: true, matches: [...] }
      // matchService already returns response.data, so response is { success: true, matches: [...] }
      let apiProfiles = [];

      if (response && response.matches && Array.isArray(response.matches)) {
        apiProfiles = response.matches;
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        apiProfiles = response;
      } else if (response && response.data && Array.isArray(response.data.matches)) {
        // Fallback: if response structure is nested
        apiProfiles = response.data.matches;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Fallback: if response.data is directly an array
        apiProfiles = response.data;
      }

      // Don't apply filters here - let filteredProfiles useMemo handle it
      // This ensures all profiles are available and filters can be changed without reloading
      setProfiles(apiProfiles);
      
      // Seed presence map from initial profile data (presence context will handle real-time updates)
      if (apiProfiles && Array.isArray(apiProfiles)) {
        seedPresenceFromProfiles(apiProfiles);
      }
    } catch (error) {
      // On error, show empty state
      setProfiles([]);
      toast.error('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback((profileList) => {
    if (!profileList || !Array.isArray(profileList)) {
      return [];
    }

    return profileList.filter((profile) => {
      if (!profile) return false;

      // Exclude profiles that have been disliked
      if (profile.currentAction === 'dislike') {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        const name = (profile.name || profile.userId?.name || '').toLowerCase();
        const bio = (profile.bio || profile.about || '').toLowerCase();
        const city = (profile.location?.city || profile.city || '').toLowerCase();
        const interests = Array.isArray(profile.interests)
          ? profile.interests.map(i => String(i).toLowerCase())
          : [];

        const matchesSearch =
          name.includes(searchLower) ||
          bio.includes(searchLower) ||
          city.includes(searchLower) ||
          interests.some(interest => interest.includes(searchLower));

        if (!matchesSearch) {
          return false;
        }
      }

      // Age filter
      const age = calculateAge(profile.dob || profile.dateOfBirth);
      if (age !== null && age !== undefined) {
        if (age < filters.ageRange.min || age > filters.ageRange.max) {
          return false;
        }
      }

      // Gender filter (case-insensitive)
      // Note: Backend already filters by opposite gender, but we apply frontend filter as well
      // to ensure consistency. If filter is 'all', show all profiles (backend handles filtering)
      if (filters.gender !== 'all') {
        const profileGender = String(profile.gender || profile.userId?.gender || '').toLowerCase();
        const filterGender = String(filters.gender).toLowerCase();
        if (profileGender !== filterGender) {
          return false;
        }
      }

      // Distance filter (only apply if location is available)
      if (currentUserLocation && profile.location?.coordinates) {
        const coords = profile.location.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          const distance = calculateDistance(
            currentUserLocation.lat,
            currentUserLocation.lng,
            coords[1], // longitude
            coords[0]  // latitude
          );
          if (distance !== null && distance !== undefined && distance > filters.distance) {
            return false;
          }
        }
      }

      // Interests filter (case-insensitive, handles both arrays and strings)
      if (filters.interests.length > 0) {
        const profileInterests = Array.isArray(profile.interests)
          ? profile.interests
          : (profile.interests ? [profile.interests] : []);

        if (profileInterests.length === 0) {
          return false; // No interests to match
        }

        const profileInterestsLower = profileInterests.map(i => String(i).toLowerCase().trim());
        const filterInterestsLower = filters.interests.map(i => String(i).toLowerCase().trim());

        const hasMatchingInterest = filterInterestsLower.some((interest) =>
          profileInterestsLower.includes(interest)
        );

        if (!hasMatchingInterest) {
          return false;
        }
      }

      // Religion filter (case-insensitive)
      if (filters.religions && filters.religions.length > 0) {
        const profileReligion = String(profile.religion || '').toLowerCase().trim();
        if (!profileReligion) {
          return false; // No religion to match
        }

        const filterReligionsLower = filters.religions.map(r => String(r).toLowerCase().trim());
        const hasMatchingReligion = filterReligionsLower.includes(profileReligion);

        if (!hasMatchingReligion) {
          return false;
        }
      }

      // Relationship Goals filter (case-insensitive)
      if (filters.relationGoals && filters.relationGoals.length > 0) {
        const profileGoals = Array.isArray(profile.lookingFor || profile.goals)
          ? (profile.lookingFor || profile.goals)
          : (profile.lookingFor || profile.goals ? [profile.lookingFor || profile.goals] : []);

        if (profileGoals.length === 0) {
          return false; // No goals to match
        }

        const profileGoalsLower = profileGoals.map(g => String(g).toLowerCase().trim());
        const filterGoalsLower = filters.relationGoals.map(g => String(g).toLowerCase().trim());

        const hasMatchingGoal = filterGoalsLower.some((goal) =>
          profileGoalsLower.includes(goal)
        );

        if (!hasMatchingGoal) {
          return false;
        }
      }

      // Online filter - only show online users if filter is enabled
      // Use presence context as source of truth (real-time updates)
      if (onlineFilter) {
        const userId = profile.userId?._id || profile.userId || profile._id;
        // Check presence context first (real-time), fallback to profile data (initial load)
        const isOnline = isUserOnline(userId) || profile.isOnline === true;
        if (!isOnline) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, filters, currentUserLocation, onlineFilter, isUserOnline]);

  // Apply search and filters to profiles
  // Include presenceMap in dependencies so it reacts to real-time presence changes
  const filteredProfiles = useMemo(() => {
    return applyFilters(profiles);
  }, [profiles, searchQuery, filters, currentUserLocation, onlineFilter, presenceMap, isUserOnline]);

  // Handle online filter toggle - use client-side filtering for real-time updates
  const handleOnlineFilterToggle = (newValue) => {
    setOnlineFilter(newValue);
    // Update URL query param
    if (newValue) {
      searchParams.set('online', 'true');
    } else {
      searchParams.delete('online');
    }
    setSearchParams(searchParams);
    
    // For real-time updates, we use client-side filtering
    // Only reload from server if we don't have profiles yet
    if (profiles.length === 0) {
      loadSuggestions();
    }
    // Otherwise, filteredProfiles useMemo will handle the filtering in real-time
  };

  const handleSwipe = async (profile, action) => {
    try {
      const userId = profile.userId?._id || profile.userId || profile._id;

      if (action === 'like' || action === 'right') {
        // Normal likes are free - no payment gate check needed
        const response = await matchService.likeUser(userId);
        // Update profile's currentAction
        setProfiles(prev => prev.map(p => {
          const profileUserId = p.userId?._id || p.userId || p._id;
          if (profileUserId === userId) {
            return { ...p, currentAction: 'like' };
          }
          return p;
        }));
        if (response.matchStatus === 'matched') {
          toast.success('It\'s a match! 🎉');
        } else {
          toast.success('Liked! ❤️');
        }
      } else if (action === 'superlike') {
        // Check payment gate for superlike action (coins for non-premium, free for premium)
        const canProceed = await checkSuperlike();
        if (!canProceed) {
          const requiredCoins = ACTION_COSTS.superlike;
          throw new Error(`Insufficient coins. Required: ${requiredCoins} coins`); // Throw error to prevent advancement
        }

        const response = await matchService.superlikeUser(userId);
        await refreshBalance(); // Refresh balance after successful action

        // Update profile's currentAction
        setProfiles(prev => prev.map(p => {
          const profileUserId = p.userId?._id || p.userId || p._id;
          if (profileUserId === userId) {
            return { ...p, currentAction: 'superlike' };
          }
          return p;
        }));

        // Show splash effect instead of toast for super like
        setShowSuperLikeSplash(true);
        setTimeout(() => setShowSuperLikeSplash(false), 2000);

        if (response.matchStatus === 'matched') {
          toast.success('It\'s a match! 🎉');
        }
        // Removed toast for super like - splash effect replaces it
      } else if (action === 'gift') {
        // Check if user is premium
        if (!user?.isPremium) {
          toast.error('Sending gifts requires a premium subscription. Please subscribe first.');
          navigate('/subscriptions');
          return;
        }

        // For gift, we need to check if users are matched first
        try {
          const statusResponse = await matchService.getMatchStatus(userId);
          if (statusResponse.success && statusResponse.data && statusResponse.data.matchId && statusResponse.data.isMatched) {
            // Users are matched, open gift modal
            setSelectedProfileForGift(profile);
            setShowGiftModal(true);
            loadGifts();
          } else {
            toast.error('You can only send gifts to matched users. Match with this user first!');
          }
        } catch (error) {
          toast.error('Unable to check match status. Please try again.');
        }
      } else if (action === 'dislike' || action === 'left' || action === 'pass') {
        // Dislike is free, no payment gate needed
        await matchService.dislikeUser(userId);
        // Remove disliked profile from the list immediately so it doesn't show again
        setProfiles(prev => prev.filter(p => {
          const profileUserId = p.userId?._id || p.userId || p._id;
          return profileUserId !== userId;
        }));
        // Don't show toast for dislikes to keep it clean
      }
    } catch (error) {
      // Show user-friendly error message
      let errorMessage = 'Failed to process swipe';
      if (error.message?.includes('Insufficient coins') || error.message === 'Payment gate blocked the action') {
        // Use the error message as-is if it contains coin information
        errorMessage = error.message.includes('Required:')
          ? error.message
          : `Insufficient coins. Required: ${ACTION_COSTS.superlike} coins`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      // Dismiss any existing toasts first to prevent duplicates
      toast.dismiss();
      toast.error(errorMessage);
      // Re-throw error so SwipeStack knows action failed
      throw error;
    }
  };

  const handleApplyFilters = async (newFilters) => {
    try {
      setFilters(newFilters);

      // Don't save preferences to backend if incognito mode is active
      if (isIncognito) {
        toast.success('Filters applied (not saved - Incognito mode active)');
        return;
      }

      // Save preferences to backend (matching backend structure)
      const preferences = {
        ageRange: {
          min: newFilters.ageRange.min,
          max: newFilters.ageRange.max,
        },
        distance: newFilters.distance,
        gender: newFilters.gender,
      };

      // Update preferences in backend
      await profileService.updateProfile({
        preferences,
        interests: newFilters.interests || [],
        religion: newFilters.religions && newFilters.religions.length > 0 ? newFilters.religions[0] : undefined,
        lookingFor: newFilters.relationGoals && newFilters.relationGoals.length > 0 ? newFilters.relationGoals[0] : undefined,
      });

      // Update user context
      if (user) {
        updateUser({
          ...user,
          preferences,
          interests: newFilters.interests || [],
        });
      }

      toast.success('Filters applied!');
    } catch (error) {
      toast.error('Failed to save filters. Using local filters only.');
    }
  };

  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const response = await publicService.getGifts();
      if (response.success) {
        setGifts(response.gifts || []);
      }
    } catch (error) {
      toast.error('Failed to load gifts');
    } finally {
      setLoadingGifts(false);
    }
  };

  const handleSendGift = async (giftType) => {
    if (!selectedProfileForGift) return;

    try {
      const userId = selectedProfileForGift.userId?._id || selectedProfileForGift.userId || selectedProfileForGift._id;

      // Get match status to get matchId
      const statusResponse = await matchService.getMatchStatus(userId);
      if (!statusResponse.success || !statusResponse.data?.matchId) {
        toast.error('Unable to find match. Please try again.');
        return;
      }

      const matchId = statusResponse.data.matchId;
      await chatService.sendGift(matchId, giftType);
      await refreshBalance();

      toast.success('Gift sent successfully! 🎁');
      setShowGiftModal(false);
      setSelectedProfileForGift(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send gift';
      toast.error(errorMessage);
      }
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.ageRange.min !== 18 || filters.ageRange.max !== 50) count++;
    if (filters.distance !== 50) count++;
    if (filters.gender !== 'all') count++;
    if (filters.interests.length > 0) count++;
    return count;
  };

  return (
    <div
      className="bg-gradient-to-br from-velora-gray via-white to-velora-gray/50 relative flex flex-1 min-w-0"
      style={{
        display: 'flex',
        flexDirection: 'row',
        flex: '1 1 auto',
        minHeight: 0,
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Super Like Splash Effect - Global for all views */}
      <AnimatePresence>
        {showSuperLikeSplash && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            {/* Radial burst effect */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-600/30 blur-3xl"
            />

            {/* Multiple star particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1,
                  rotate: 0
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos((i * 30) * Math.PI / 180) * 200,
                  y: Math.sin((i * 30) * Math.PI / 180) * 200,
                  opacity: [0, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut",
                  delay: i * 0.05
                }}
                className="absolute"
              >
                <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </motion.div>
            ))}

            {/* Central super like text with glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 50 }}
              animate={{
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1, 0],
                y: [50, 0, 0, -30]
              }}
              transition={{
                duration: 2,
                times: [0, 0.3, 0.7, 1],
                ease: "easeOut"
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: 3,
                  ease: "easeInOut"
                }}
                className="text-7xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl"
                style={{
                  textShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(168, 85, 247, 0.6)',
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.9))'
                }}
              >
                SUPER LIKE!
              </motion.div>

              {/* Sparkle effect around text */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    x: Math.cos((i * 45) * Math.PI / 180) * 80,
                    y: Math.sin((i * 45) * Math.PI / 180) * 80,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.3 + i * 0.1,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full"
                  style={{
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)'
                  }}
                />
              ))}
            </motion.div>

            {/* Circular wave effect */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 2.5],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut"
              }}
              className="absolute w-full h-full max-w-md max-h-md rounded-full border-8 border-blue-500"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 2.5],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 1.5,
                delay: 0.3,
                ease: "easeOut"
              }}
              className="absolute w-full h-full max-w-md max-h-md rounded-full border-8 border-purple-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-96 h-96 bg-velora-primary/5 rounded-full blur-3xl"
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Layout Container - Responsive Grid */}
      <div
        className="flex flex-col lg:flex-row w-full h-full flex-1 relative z-10 min-w-0"
        style={{
          display: 'flex',
          flex: '1 1 auto',
          minHeight: 0,
          minWidth: 0, // Allow flex container to shrink
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden', // Prevent overflow
        }}
      >
        {/* Desktop Sidebar - Always visible on desktop, hidden on mobile */}
        {/* Mobile sidebar (slide-in) only shows when menu icon is clicked (isOpen=true) */}
        <ProfileLeftSidebar
          isOpen={showLeftSidebar}
          onClose={() => setShowLeftSidebar(false)}
          isHomePage={true}
        />

        {/* Main Content Area - Header (fixed), Main (scrollable), Footer (fixed) */}
        <div
          className="flex flex-col flex-1 relative z-10 min-w-0"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: 0,
            minWidth: 0, // Allow flex item to shrink below content size
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
        {/* NavBar actions are handled by GlobalNavBar via context */}

        {/* Main Content Area - Scrollable container between fixed navbars */}
        <PageContainer
          className="bg-gradient-to-br from-velora-gray via-white to-velora-gray/50"
          fullWidth={true}
          padding={true}
        >
          <div className="w-full" style={{ position: 'relative', zIndex: 1 }}>
          {/* Search Bar with Filter */}
          <motion.div
            className="px-4 pt-4 pb-3 flex-shrink-0 bg-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.1
            }}
          >
            <div className="relative flex items-center gap-3">
              {/* Online Filter Toggle - Segmented Control */}
              <motion.div
                className="flex items-center bg-white rounded-full border-2 border-gray-300 overflow-hidden shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleOnlineFilterToggle(false)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all relative ${
                    !onlineFilter
                      ? 'bg-velora-primary text-velora-black'
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label="Show all profiles"
                  aria-pressed={!onlineFilter}
                >
                  All
                </button>
                <div className="w-px h-6 bg-gray-300" />
                <button
                  onClick={() => handleOnlineFilterToggle(true)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
                    onlineFilter
                      ? 'bg-velora-primary text-velora-black'
                      : 'bg-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label="Show only online profiles"
                  aria-pressed={onlineFilter}
                >
                  <span>Online</span>
                  {onlineFilter && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-[#25D366] rounded-full"
                    />
                  )}
                </button>
              </motion.div>
              
              <motion.div
                className="flex-1 relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <MagnifyingGlassIcon className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </motion.div>
                <motion.input
                  type="text"
                  placeholder="Start Your Search for the Perfect Partner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-3.5 bg-transparent border-2 border-gray-300 rounded-2xl text-black placeholder-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-velora-primary/50 focus:border-velora-primary transition-all"
                  whileFocus={{
                    scale: 1.02,
                    borderColor: "#FFD700",
                    boxShadow: "0 0 0 3px rgba(255, 215, 0, 0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              </motion.div>
              <motion.button
                onClick={() => setShowFilters(true)}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  boxShadow: [
                    "0 4px 15px rgba(0,0,0,0.1)",
                    "0 8px 20px rgba(255, 215, 0, 0.3)",
                    "0 4px 15px rgba(0,0,0,0.1)"
                  ]
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="relative p-3.5 bg-velora-primary hover:opacity-90 rounded-2xl transition-all shadow-md"
              >
                <FunnelIcon className="w-6 h-6 text-black" />
                {activeFilterCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-black text-velora-primary text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {activeFilterCount()}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Results Grid Container - Visible and properly positioned */}
          <motion.div
            className="px-4 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              width: '100%',
              minHeight: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
          {viewMode === 'grid' ? (
            <ProfileGrid
              profiles={filteredProfiles}
              onAction={handleSwipe}
              currentUserLocation={currentUserLocation}
              loading={loading}
              presenceMap={presenceMap}
              onlineFilter={onlineFilter}
            />
          ) : (
            <SwipeStack
              profiles={filteredProfiles}
              onSwipe={handleSwipe}
              currentUserLocation={currentUserLocation}
              loading={loading}
            />
          )}
          </motion.div>
          </div>
        </PageContainer>
        </div>
      </div>

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        isIncognito={isIncognito}
        onIncognitoChange={setIsIncognito}
        isPremium={user?.isPremium || false}
        showIncognitoConfirm={showIncognitoConfirm}
        onShowIncognitoConfirm={setShowIncognitoConfirm}
      />

      {/* Gift Modal */}
      <AnimatePresence>
        {showGiftModal && selectedProfileForGift && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Send a Gift</h2>
                <button
                  onClick={() => {
                    setShowGiftModal(false);
                    setSelectedProfileForGift(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {loadingGifts ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-velora-primary"></div>
                  </div>
                ) : gifts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No gifts available</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {gifts.map((gift, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendGift(gift.title)}
                        className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-200 hover:border-pink-400 transition-all flex flex-col items-center gap-2 relative"
                      >
                        {gift.icon && (
                          <span className="text-4xl">{gift.icon}</span>
                        )}
                        <span className="font-semibold text-gray-900 text-sm">{gift.title}</span>
                        {gift.description && (
                          <span className="text-xs text-gray-600 text-center">{gift.description}</span>
                        )}
                        {gift.price > 0 && (
                          <span className="absolute top-2 right-2 bg-white text-velora-primary text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            {gift.price} coins
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

