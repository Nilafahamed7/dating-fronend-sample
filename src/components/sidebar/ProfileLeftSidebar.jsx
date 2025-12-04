import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import { subscriptionService } from '../../services/subscriptionService';
import { matchService } from '../../services/matchService';
import { safetyService } from '../../services/safetyService';
import { formatDate, getPlaceholderImage, getInitials, calculateAge } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  WalletIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
  StarIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  MapPinIcon,
  PhotoIcon,
  HeartIcon,
  Squares2X2Icon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowRightIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CheckBadgeIcon as CheckBadgeIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { profileViewersService } from '../../services/profileViewersService';
import ShareDatePlanModal from '../safety/ShareDatePlanModal';
import CheckInModal from '../safety/CheckInModal';
import AddTrustedContactModal from '../safety/AddTrustedContactModal';

export default function ProfileLeftSidebar({ isOpen, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const { groups, presence } = useGroups();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const isTogglingRef = useRef(false);
  const sidebarRef = useRef(null);
  const [stats, setStats] = useState({
    likesReceived: 0,
    superlikesReceived: 0,
    messagesReceived: 0,
  });
  const [viewerCount, setViewerCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [premiumStatus, setPremiumStatus] = useState({
    freeMinutesRemaining: 0,
    freeMinutesTotal: 100,
  });
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [showShareDatePlanModal, setShowShareDatePlanModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddTrustedContactModal, setShowAddTrustedContactModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onClose();
    } catch (error) {
      }
  };

  const handleActivateSubscription = async () => {
    try {
      setActivating(true);
      const response = await subscriptionService.activate();
      if (response.success) {
        toast.success('Subscription activated successfully!');
        updateUser({ ...user, isPremium: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to activate subscription';
      toast.error(message);
    } finally {
      setActivating(false);
    }
  };

  const menuItems = [
    ...(user?.role === 'admin'
      ? [
        {
          icon: Squares2X2Icon,
          label: 'Admin Controls',
          highlight: true,
          onClick: () => {
            navigate('/admin/dashboard');
            if (onClose) {
              onClose();
            }
          },
        },
      ]
      : []),
    {
      icon: ChartBarIcon,
      label: 'Progress',
      onClick: () => {
        navigate('/progress');
        if (onClose) {
          onClose();
        }
      },
    },
    ...(user?.gender === 'female'
      ? [
        {
          icon: TrophyIcon,
          label: 'Leadership',
          onClick: () => {
            navigate('/leadership');
            if (onClose) {
              onClose();
            }
          },
        },
      ]
      : []),
    {
      icon: WalletIcon,
      label: 'Wallet',
      onClick: () => {
        navigate('/wallet');
          if (onClose) {
            onClose();
        }
      },
    },
    {
      icon: Cog6ToothIcon,
      label: 'Settings',
      onClick: () => {
        navigate('/settings');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: ShieldCheckIcon,
      label: 'Account & Security',
      onClick: () => {
        navigate('/account-security');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: CurrencyDollarIcon,
      label: 'Subscriptions',
      onClick: () => {
        navigate('/subscriptions');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: SparklesIcon,
      label: 'Utility Hub',
      highlight: true,
      onClick: () => {
        navigate('/utility');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      type: 'divider',
      label: 'My Resources',
    },
    {
      icon: CalendarIcon,
      label: 'My Events',
      onClick: () => {
        navigate('/events');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: Squares2X2Icon,
      label: 'My Communities',
      onClick: () => {
        navigate('/communities');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: HeartIcon,
      label: 'My Dates',
      onClick: () => {
        navigate('/group-dates');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      type: 'divider',
      label: 'Create New',
    },
    {
      icon: UsersIcon,
      label: 'Create Group',
      onClick: () => {
        navigate('/groups/create');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: CalendarIcon,
      label: 'Create Event',
      onClick: () => {
        navigate('/events/create');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: Squares2X2Icon,
      label: 'Create Community',
      onClick: () => {
        navigate('/communities/create');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Create Forum',
      onClick: () => {
        navigate('/forums/create');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: HeartIcon,
      label: 'Create Group Date',
      onClick: () => {
        navigate('/group-dates/create');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: DocumentTextIcon,
      label: 'Support',
      onClick: () => {
        navigate('/support');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: ShieldCheckIcon,
      label: 'Privacy Settings',
      onClick: () => {
        navigate('/privacy-settings');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Forums',
      onClick: () => {
        navigate('/forums');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: DocumentTextIcon,
      label: 'Privacy Policy',
      onClick: () => {
        navigate('/privacy-policy');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: DocumentTextIcon,
      label: 'Terms & Conditions',
      onClick: () => {
        navigate('/terms-conditions');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: DocumentTextIcon,
      label: 'Refund Policy',
      onClick: () => {
        navigate('/refund-policy');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: PhoneIcon,
      label: 'Contact Us',
      onClick: () => {
        navigate('/contact-us');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: ShieldCheckIcon,
      label: 'Safety & Policy',
      onClick: () => {
        navigate('/safety-policy');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      type: 'divider',
      label: 'Safety',
    },
    {
      icon: CalendarIcon,
      label: 'Share Date Plan',
      onClick: () => {
        setShowShareDatePlanModal(true);
      },
    },
    {
      icon: CheckCircleIcon,
      label: 'Check-in After Date',
      onClick: () => {
        setShowCheckInModal(true);
      },
    },
    {
      icon: UsersIcon,
      label: 'Trusted Contacts',
      onClick: () => {
        navigate('/safety/trusted-contacts');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: UserGroupIcon,
      label: 'Add Trusted Contact',
      onClick: () => {
        setShowAddTrustedContactModal(true);
      },
    },
    {
      icon: ExclamationTriangleIcon,
      label: 'Emergency Alert',
      onClick: () => {
        navigate('/safety/emergency');
        if (onClose) {
          onClose();
        }
      },
    },
    {
      icon: DocumentTextIcon,
      label: 'My Date Safety History',
      onClick: () => {
        navigate('/safety/date-history');
        if (onClose) {
          onClose();
        }
      },
    },
  ];

  const userProfile = user?.profile || {};
  const primaryPhoto = userProfile.photos?.find(p => p.isPrimary) || userProfile.photos?.[0] || user?.photos?.[0];
  const allPhotos = userProfile.photos || user?.photos || [];
  const age = calculateAge(user?.dateOfBirth || userProfile.dob);
  const bio = userProfile.about || userProfile.bio || user?.bio || '';
  const interests = userProfile.interests || user?.interests || [];
  const location = userProfile.location || user?.location || {};
  const preferences = user?.preferences || userProfile.preferences || {};
  const isPhoneVerified = user?.isPhoneVerified || false;
  const isPhotoVerified = user?.isPhotoVerified || false;
  const photoVerificationStatus = user?.photoVerificationStatus || 'none';
  const gender = user?.gender || userProfile.gender || '';
  const religion = user?.religion || userProfile?.religion || '';

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    let completed = 0;
    const total = 9; // Updated to include religion

    if (user?.name && user.name.trim().length >= 2) completed++;
    if (user?.email) completed++;
    if (bio && bio.trim().length >= 10) completed++;
    if (allPhotos.length > 0) completed++;
    if (interests.length > 0) completed++;
    if (location?.city) completed++;
    if (religion && religion.trim().length > 0) completed++; // Added religion check
    if (isPhoneVerified) completed++;
    if (isPhotoVerified) completed++;

    const percentage = Math.round((completed / total) * 100);
    // If all required fields are complete, show 100%
    return Math.min(100, percentage);
  };

  const profileCompleteness = calculateProfileCompleteness();

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Check if user is authenticated (has token)
      const token = localStorage.getItem('token');
      if (!token) {
        // User not authenticated, skip API call
        return;
      }

      try {
        setLoadingStats(true);
        const response = await matchService.getUserStats();
        if (response.success) {
          // Handle both response.data and response.stats structures
          const statsData = response.data || response.stats || {};
          setStats({
            likesReceived: statsData.likesReceived || 0,
            superlikesReceived: statsData.superlikesReceived || 0,
            messagesReceived: statsData.messagesReceived || 0,
          });
        }
      } catch (error) {
        // Only log non-401 errors (401 means user is not authenticated, which is expected)
        if (error.response?.status !== 401) {
          }
        // Don't show error to user, just log it
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch premium status and free minutes
  useEffect(() => {
    const fetchPremiumStatus = async () => {
      if (!user?.isPremium) {
        setPremiumStatus({ freeMinutesRemaining: 0, freeMinutesTotal: 100 });
        setLoadingPremium(false);
        return;
      }

      // For premium males: calculate free minutes from premiumCallMinutesUsed (first 50 mins free)
      if (user?.gender?.toLowerCase() === 'male') {
        const premiumCallMinutesUsed = user?.premiumCallMinutesUsed || 0;
        const freeMinutesRemaining = Math.max(0, 50 - premiumCallMinutesUsed);
        setPremiumStatus({
          freeMinutesRemaining,
          freeMinutesTotal: 50,
        });
        setLoadingPremium(false);
        return;
      }

      // Check if user is authenticated (has token)
      const token = localStorage.getItem('token');
      if (!token) {
        // User not authenticated, use fallback values
        if (user?.freeIncomingMinutesRemaining !== undefined) {
          setPremiumStatus({
            freeMinutesRemaining: Math.max(0, Math.min(100, user.freeIncomingMinutesRemaining)),
            freeMinutesTotal: 100,
          });
        } else {
          setPremiumStatus({ freeMinutesRemaining: 0, freeMinutesTotal: 100 });
        }
        setLoadingPremium(false);
        return;
      }

      try {
        setLoadingPremium(true);
        const response = await subscriptionService.getPremiumStatus();
        if (response.success && response.active) {
          // Use response value or fallback to user object value
          const freeMinutes = response.freeMinutesRemaining ?? user?.freeIncomingMinutesRemaining ?? 0;
          const totalMinutes = response.freeMinutesTotal ?? 100;
          setPremiumStatus({
            freeMinutesRemaining: Math.max(0, Math.min(totalMinutes, freeMinutes)),
            freeMinutesTotal: totalMinutes,
          });
        } else if (user?.freeIncomingMinutesRemaining !== undefined) {
          // Fallback to user object if subscription service doesn't return it
          setPremiumStatus({
            freeMinutesRemaining: Math.max(0, Math.min(100, user.freeIncomingMinutesRemaining)),
            freeMinutesTotal: 100,
          });
        } else {
          setPremiumStatus({ freeMinutesRemaining: 0, freeMinutesTotal: 100 });
        }
      } catch (error) {
        // Only log non-401 errors (401 means user is not authenticated, which is expected)
        if (error.response?.status !== 401) {
          }
        // Fallback to user object value on error
        if (user?.freeIncomingMinutesRemaining !== undefined) {
          setPremiumStatus({
            freeMinutesRemaining: Math.max(0, Math.min(100, user.freeIncomingMinutesRemaining)),
            freeMinutesTotal: 100,
          });
        } else {
          setPremiumStatus({ freeMinutesRemaining: 0, freeMinutesTotal: 100 });
        }
      } finally {
        setLoadingPremium(false);
      }
    };

    if (user) {
      fetchPremiumStatus();

      // Refresh premium status after call ends
      const handleCallEnded = () => {
        setTimeout(() => {
          fetchPremiumStatus();
        }, 1000);
      };

      window.addEventListener('call-ended', handleCallEnded);

      // Refresh premium status every 60 seconds
      const interval = setInterval(fetchPremiumStatus, 60000);

      return () => {
        clearInterval(interval);
        window.removeEventListener('call-ended', handleCallEnded);
      };
    }
  }, [user]);

  // Handle Esc key to close sidebar on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Handle swipe left gesture to close drawer
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchStartX - touchEndX;

      // Swipe left (more than 50px) to close
      if (swipeDistance > 50) {
        onClose();
      }
    };

    const sidebar = sidebarRef.current;
    sidebar.addEventListener('touchstart', handleTouchStart);
    sidebar.addEventListener('touchend', handleTouchEnd);

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Desktop: Always visible - Part of layout flow */}
      <aside
        className="hidden lg:flex flex-col bg-white border-r border-gray-200 flex-shrink-0 min-w-0"
        style={{
          flex: '0 0 320px',
          maxWidth: '320px',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 0,
        }}
      >
        {/* Profile Section */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex-shrink-0 min-w-0 bg-white" style={{ minHeight: '200px', paddingTop: '16px' }}>
          <div className="relative flex flex-col items-center w-full min-w-0">
            {/* Profile Picture */}
            <div className="relative mb-4 flex flex-col items-center" style={{ minHeight: '120px', paddingTop: '0px' }}>
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-velora-primary shadow-lg" style={{ display: 'block' }}>
                {primaryPhoto?.url ? (
                  <img
                    src={primaryPhoto.url}
                    alt={user?.name || 'Profile'}
                    className="w-full h-full object-cover"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-velora-primary to-velora-secondary flex items-center justify-center text-xl lg:text-2xl font-bold text-black" style={{ width: '100%', height: '100%', display: 'flex' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}

                {/* Crown Icon for Premium - Attached to top-right of image */}
                {user?.isPremium && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0 right-0 bg-velora-primary rounded-full p-1.5 shadow-lg z-20 transform translate-x-1/4 -translate-y-1/4"
                    style={{ border: '2px solid white' }}
                  >
                    <svg
                      className="w-5 h-5 text-black"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                  </motion.div>
                )}
              </div>

              {/* Profile Completeness Badge - Attached below avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2 bg-velora-primary text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white z-10 relative"
              >
                {profileCompleteness}% Complete
              </motion.div>
            </div>

            {/* User Info */}
            <div className="text-center w-full min-w-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-black truncate max-w-full">
                  {user?.name || 'User'}
                </h3>
                {isPhoneVerified && (
                  <CheckBadgeIconSolid className="w-5 h-5 text-blue-500" title="Phone Verified" />
                )}
                {isPhotoVerified && (
                  <CheckBadgeIconSolid className="w-5 h-5 text-green-500" title="Photo Verified" />
                )}
                {!isPhoneVerified && !isPhotoVerified && (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" title="Verification Pending" />
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {age && (
                  <span className="text-sm text-gray-600">{age} years</span>
                )}
                {gender && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600 capitalize">{gender}</span>
                  </>
                )}
              </div>
              {location?.city && (
                <div className="flex items-center justify-center gap-1 mb-2">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {location.city}{location.country ? `, ${location.country}` : ''}
                  </p>
                </div>
              )}

              {/* Edit Button */}
              <motion.button
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-velora-primary hover:opacity-90 text-black rounded-lg text-sm font-semibold transition-all shadow-md"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain scroll-smooth min-h-0 min-w-0 custom-scrollbar relative"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >

          {/* Who Viewed My Profile */}
          <div className="p-4 lg:p-5 border-b border-gray-200">
            <button
              onClick={() => {
                navigate('/profile-viewers');
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              aria-label="Who viewed my profile"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <EyeIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">Who viewed my profile</span>
              </div>
              {viewerCount > 0 && (
                <span className="hidden lg:inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-velora-primary/20 text-velora-primary">
                  {viewerCount}
                </span>
              )}
              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
            </button>
          </div>

          {/* Leadership Panel - Only for females */}
          {user?.gender === 'female' && (
            <div className="p-4 lg:p-5 border-b border-gray-200">
              <button
                onClick={() => {
                  navigate('/leadership');
                  if (onClose) onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <TrophyIcon className="w-5 h-5 text-velora-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">Leadership</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Premium Features Card - Desktop Only */}
          <div className="p-4 lg:p-5 border-b border-gray-200">
            {user?.isPremium ? (
              <div className="bg-gradient-to-br from-velora-primary/10 to-velora-secondary/10 rounded-xl p-4 border border-velora-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-velora-primary" />
                  <h3 className="text-sm font-bold text-gray-900">Premium Features</h3>
                </div>

                {/* Free Call Minutes */}
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-1.5">Free call limit remaining:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {loadingPremium ? '...' : `${Math.max(0, premiumStatus.freeMinutesRemaining || 0)} / ${premiumStatus.freeMinutesTotal || 100} mins`}
                        </span>
                        <div className="flex-1 max-w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-velora-primary rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(0, ((premiumStatus.freeMinutesRemaining || 0) / (premiumStatus.freeMinutesTotal || 100)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Features List */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="truncate min-w-0">Unlimited Likes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="truncate min-w-0">Priority Match</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="truncate min-w-0">Free Calls (first 50 min)</span>
                  </div>
                </div>

                {/* Manage Link */}
                <button
                  onClick={() => {
                    navigate('/subscriptions');
                    if (onClose) onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-velora-primary hover:text-velora-secondary transition-colors"
                >
                  <span>Manage</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <StarIcon className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-900">Upgrade to Premium</h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Unlock free call minutes and more
                </p>
              <motion.button
                onClick={() => {
                    navigate('/subscriptions');
                    if (onClose) onClose();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                  className="w-full bg-velora-primary text-black px-3 py-2 rounded-lg font-semibold text-xs shadow-sm hover:shadow-md transition-all"
              >
                  Subscribe
              </motion.button>
            </div>
            )}
        </div>

          {/* Profile Stats */}
          <div className="p-4 lg:p-5 border-b border-gray-200">
            <div className="space-y-3">
              {/* Bio Preview */}
              {bio && (
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Bio</p>
                  <p className="text-sm text-gray-700 line-clamp-2 break-words">{bio}</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <PhotoIcon className="w-4 h-4 text-velora-primary" />
                    <span className="text-xs text-gray-500">Photos</span>
                  </div>
                  <p className="text-lg font-bold text-black">{allPhotos.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <HeartIcon className="w-4 h-4 text-velora-primary" />
                    <span className="text-xs text-gray-500">Interests</span>
                  </div>
                  <p className="text-lg font-bold text-black">{interests.length}</p>
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">Activity</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigate('/likes');
                      if (onClose) onClose();
                    }}
                    className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-100 hover:from-red-100 hover:to-pink-100 transition-colors w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-gray-600 font-medium">Likes Received</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {loadingStats ? '...' : stats.likesReceived}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/superlikes');
                      if (onClose) onClose();
                    }}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100 hover:from-blue-100 hover:to-purple-100 transition-colors w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StarIconSolid className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-600 font-medium">Superlikes Received</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {loadingStats ? '...' : stats.superlikesReceived}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/messages-received');
                      if (onClose) onClose();
                    }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100 hover:from-green-100 hover:to-emerald-100 transition-colors w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChatBubbleLeftIcon className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-600 font-medium">Messages Received</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {loadingStats ? '...' : stats.messagesReceived}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Interests */}
              {interests.length > 0 && (
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.slice(0, 4).map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-velora-primary/20 text-black text-xs font-medium rounded-full truncate max-w-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {interests.length > 4 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                        +{interests.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Status */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Verification</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {isPhoneVerified ? (
                      <CheckBadgeIconSolid className="w-4 h-4 text-blue-500" />
                    ) : (
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-xs ${isPhoneVerified ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      Phone
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPhotoVerified ? (
                      <CheckBadgeIconSolid className="w-4 h-4 text-green-500" />
                    ) : (
                      <PhotoIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-xs ${isPhotoVerified ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      Photo
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences Summary */}
              {preferences && (
                <div className="bg-velora-primary/5 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Search Preferences</p>
                  <div className="space-y-1 text-xs">
                    {preferences.ageRange && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="text-black font-medium">
                          {preferences.ageRange.min}-{preferences.ageRange.max}
                        </span>
                      </div>
                    )}
                    {preferences.distance && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance:</span>
                        <span className="text-black font-medium">{preferences.distance} km</span>
                      </div>
                    )}
                    {preferences.gender && preferences.gender !== 'all' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Looking for:</span>
                        <span className="text-black font-medium capitalize">{preferences.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-4 lg:p-5 space-y-1 border-t border-gray-200">
            {menuItems.map((item, index) => {
              // Handle divider items
              if (item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="px-4 py-2 border-t border-gray-200 mt-2 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                  </div>
                );
              }

              const Icon = item.icon;
              const isHighlight = item.highlight;
              return (
                  <motion.button
                  key={index}
                  onClick={item.onClick}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-w-0 ${
                    isHighlight
                      ? 'bg-gray-900 text-white shadow-md shadow-gray-400/30'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                      <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isHighlight ? 'text-white' : 'text-gray-600'
                          }`}
                      />
                  <span className="font-medium truncate min-w-0">{item.label}</span>
                  </motion.button>
              );
            })}
          </div>

          {/* Logout Button - Easily Accessible */}
          <div className="p-4 lg:p-5 pt-2 border-t border-gray-200">
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Log Out</span>
            </motion.button>
          </div>

          {/* Premium Banner */}
          <div className="p-4 lg:p-5 pt-4 pb-6 border-t border-gray-200">
            {user?.isPremium ? (
              <div className="bg-gradient-to-r from-velora-primary to-velora-secondary rounded-2xl p-4 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <StarIconSolid className="w-5 h-5" />
                    <h4 className="font-bold text-sm">You're Activated Membership</h4>
                  </div>
                  <p className="text-xs text-white/90 mb-3">Enjoy premium and match with unlimited profiles</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleActivateSubscription}
                    disabled={activating}
                    className="bg-white text-velora-primary px-4 py-2.5 rounded-lg font-bold text-sm w-full shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {activating ? 'Activating...' : 'Subscribed'}
                  </motion.button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              </div>
            ) : (
              <div className="bg-gradient-to-r from-velora-primary/20 to-velora-secondary/20 rounded-2xl p-4 border border-velora-primary/30 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <StarIcon className="w-5 h-5 text-velora-primary" />
                    <h4 className="font-bold text-sm text-black">Upgrade to Premium</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Enjoy premium features and unlimited matches</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigate('/subscriptions');
                      if (onClose) onClose();
                    }}
                    className="bg-velora-primary text-black px-4 py-2.5 rounded-lg font-bold text-sm w-full shadow-md"
                  >
                    Upgrade to Premium
                  </motion.button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-velora-primary/10 rounded-full -mr-16 -mt-16" />
              </div>
            )}
          </div>
          {/* Extra spacing to ensure premium box is partially visible at bottom */}
        </div>
      </aside>

      {/* Mobile: Hidden by default, opens as overlay drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - Single, lightweight backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed bg-black/12 z-[90] lg:hidden"
              style={{
                top: 'var(--top-navbar-height, 64px)',
                left: 0,
                right: 0,
                bottom: 'var(--bottom-navbar-height, 60px)',
                transition: 'opacity 260ms ease-out'
              }}
              aria-hidden="true"
            />

            {/* Mobile Sidebar Drawer */}
            <motion.aside
              ref={sidebarRef}
              initial={{ transform: 'translateX(-100%)' }}
              animate={{ transform: 'translateX(0)' }}
              exit={{ transform: 'translateX(-100%)' }}
              transition={{ duration: 0.26, ease: [0.2, 0.9, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="fixed left-0 bg-white shadow-2xl z-[91] flex flex-col overflow-hidden lg:hidden min-w-0"
              style={{
                width: '40vw',
                maxWidth: '420px',
                minWidth: '280px',
                top: 'var(--top-navbar-height, 64px)',
                bottom: 'var(--bottom-navbar-height, 60px)',
                height: 'calc(100vh - var(--top-navbar-height, 64px) - var(--bottom-navbar-height, 60px))',
                willChange: 'transform',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
            {/* Header with Close Button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 flex-shrink-0">
              <h2 className="text-lg font-bold text-black">My Profile</h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* Profile Section */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0" style={{ minHeight: '200px' }}>
              <div className="relative flex flex-col items-center w-full min-w-0">
                {/* Profile Picture */}
                <div className="relative mb-4 flex flex-col items-center" style={{ minHeight: '120px', paddingTop: '8px' }}>
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-velora-primary shadow-lg" style={{ display: 'block' }}>
                        {primaryPhoto?.url ? (
                          <img
                            src={primaryPhoto.url}
                            alt={user?.name || 'Profile'}
                            className="w-full h-full object-cover"
                            style={{ width: '100%', height: '100%', display: 'block' }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-velora-primary to-velora-secondary flex items-center justify-center text-xl font-bold text-black" style={{ width: '100%', height: '100%', display: 'flex' }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}

                        {/* Crown Icon for Premium - Attached to top-right of image */}
                        {user?.isPremium && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-0 right-0 bg-velora-primary rounded-full p-1.5 shadow-lg z-20 transform translate-x-1/4 -translate-y-1/4"
                            style={{ border: '2px solid white' }}
                          >
                            <svg
                              className="w-5 h-5 text-black"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                            </svg>
                          </motion.div>
                        )}
                      </div>

                  {/* Profile Completeness Badge - Attached below avatar */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-2 bg-velora-primary text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white z-10 relative"
                        >
                    {profileCompleteness}% Complete
                        </motion.div>
                    </div>

                    {/* User Info */}
                <div className="text-center w-full min-w-0">
                      <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-black truncate max-w-full">
                          {user?.name || 'User'}
                        </h3>
                        {isPhoneVerified && (
                          <CheckBadgeIconSolid className="w-5 h-5 text-blue-500" title="Phone Verified" />
                        )}
                        {isPhotoVerified && (
                          <CheckBadgeIconSolid className="w-5 h-5 text-green-500" title="Photo Verified" />
                        )}
                        {!isPhoneVerified && !isPhotoVerified && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" title="Verification Pending" />
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {age && (
                          <span className="text-sm text-gray-600">{age} years</span>
                        )}
                        {gender && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600 capitalize">{gender}</span>
                          </>
                        )}
                      </div>
                      {location?.city && (
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {location.city}{location.country ? `, ${location.country}` : ''}
                          </p>
                        </div>
                      )}

                      {/* Edit Button */}
                      <motion.button
                        onClick={() => { navigate('/profile'); onClose(); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 mx-auto px-4 py-2 bg-velora-primary hover:opacity-90 text-black rounded-lg text-sm font-semibold transition-all shadow-md"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit Profile
                      </motion.button>
                </div>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain scroll-smooth flex flex-col min-h-0 min-w-0 custom-scrollbar"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >

              {/* Who Viewed My Profile */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => {
                    navigate('/profile-viewers');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  aria-label="Who viewed my profile"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <EyeIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">Who viewed my profile</span>
                  </div>
                  {viewerCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-velora-primary/20 text-velora-primary">
                      {viewerCount}
                    </span>
                  )}
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                </button>
              </div>

              {/* Safety Features Section - Hidden on Mobile */}
              <div className="hidden lg:block p-4 border-b border-gray-200">
                <div className="mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Safety Features</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await safetyService.getTrustedContacts();
                        if (response.success) {
                          navigate('/safety/trusted-contacts', { state: { contacts: response.trustedContacts } });
                          onClose();
                        }
                      } catch (error) {
                        navigate('/safety/trusted-contacts');
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">Trusted Contacts</span>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Get user's current location if available
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              try {
                                await safetyService.sendEmergencyAlert({
                                  latitude: position.coords.latitude,
                                  longitude: position.coords.longitude,
                                  message: 'Emergency alert triggered',
                                });
                                toast.success('Emergency alert sent to trusted contacts');
                              } catch (error) {
                                toast.error(error.response?.data?.message || 'Failed to send emergency alert');
                              }
                            },
                            async () => {
                              // Location permission denied or unavailable
                              try {
                                await safetyService.sendEmergencyAlert({
                                  message: 'Emergency alert triggered',
                                });
                                toast.success('Emergency alert sent to trusted contacts');
                              } catch (error) {
                                toast.error(error.response?.data?.message || 'Failed to send emergency alert');
                              }
                            }
                          );
                        } else {
                          // Geolocation not supported
                          try {
                            await safetyService.sendEmergencyAlert({
                              message: 'Emergency alert triggered',
                            });
                            toast.success('Emergency alert sent to trusted contacts');
                          } catch (error) {
                            toast.error(error.response?.data?.message || 'Failed to send emergency alert');
                          }
                        }
                      } catch (error) {
                        toast.error('Failed to send emergency alert');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors group border border-red-200 bg-red-50/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-red-700 truncate">Emergency Alert</span>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await safetyService.getDateHistory();
                        if (response.success) {
                          navigate('/safety/date-history', { state: { history: response.dateHistory, alerts: response.emergencyAlerts } });
                          onClose();
                        }
                      } catch (error) {
                        navigate('/safety/date-history');
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <CalendarIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">Date History</span>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                  </button>
                </div>
              </div>

              {/* Leadership Panel - Mobile - Only for females */}
              {user?.gender === 'female' && (
                <div className="p-4 border-b border-gray-200">
                  <button
                    onClick={() => {
                      navigate('/leadership');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <TrophyIcon className="w-5 h-5 text-velora-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">Leadership</span>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                  </button>
                </div>
              )}

              {/* Premium Features Card - Mobile */}
              <div className="p-4 border-b border-gray-200">
                {user?.isPremium ? (
                  <div className="bg-gradient-to-br from-velora-primary/10 to-velora-secondary/10 rounded-xl p-4 border border-velora-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <SparklesIcon className="w-5 h-5 text-velora-primary" />
                      <h3 className="text-sm font-bold text-gray-900">Premium Features</h3>
                    </div>

                    {/* Free Call Minutes */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1.5">Free call limit remaining:</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">
                              {loadingPremium ? '...' : `${Math.max(0, premiumStatus.freeMinutesRemaining || 0)} / ${premiumStatus.freeMinutesTotal || 100} mins free`}
                            </span>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-velora-primary rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, ((premiumStatus.freeMinutesRemaining || 0) / (premiumStatus.freeMinutesTotal || 100)) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Premium Features List */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate min-w-0">Unlimited Likes</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate min-w-0">Priority Match</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate min-w-0">Free Calls (first 50 min)</span>
                      </div>
                    </div>

                    {/* Manage Link */}
                    <button
                      onClick={() => {
                        navigate('/subscriptions');
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-velora-primary hover:text-velora-secondary transition-colors"
                    >
                      <span>Manage</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-gray-900">Upgrade to Premium</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      Unlock free call minutes and more
                    </p>
                      <motion.button
                        onClick={() => {
                        navigate('/subscriptions');
                            onClose();
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      className="w-full bg-velora-primary text-black px-3 py-2 rounded-lg font-semibold text-xs shadow-sm hover:shadow-md transition-all"
                      >
                      Subscribe
                      </motion.button>
                    </div>
                )}
                </div>

                {/* Profile Stats */}
              <div className="p-4 border-b border-gray-200">
                  <div className="space-y-3">
                    {/* Bio Preview */}
                    {bio && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bio</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{bio}</p>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <PhotoIcon className="w-4 h-4 text-velora-primary" />
                          <span className="text-xs text-gray-500">Photos</span>
                        </div>
                        <p className="text-lg font-bold text-black">{allPhotos.length}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <HeartIcon className="w-4 h-4 text-velora-primary" />
                          <span className="text-xs text-gray-500">Interests</span>
                        </div>
                        <p className="text-lg font-bold text-black">{interests.length}</p>
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">Activity</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            navigate('/likes');
                            onClose();
                          }}
                          className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-100 hover:from-red-100 hover:to-pink-100 transition-colors w-full text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HeartIconSolid className="w-5 h-5 text-red-500" />
                              <span className="text-xs text-gray-600 font-medium">Likes Received</span>
                            </div>
                            <span className="text-lg font-bold text-red-600">
                              {loadingStats ? '...' : stats.likesReceived}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/superlikes');
                            onClose();
                          }}
                          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100 hover:from-blue-100 hover:to-purple-100 transition-colors w-full text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StarIconSolid className="w-5 h-5 text-blue-500" />
                              <span className="text-xs text-gray-600 font-medium">Superlikes Received</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">
                              {loadingStats ? '...' : stats.superlikesReceived}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/messages-received');
                            onClose();
                          }}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100 hover:from-green-100 hover:to-emerald-100 transition-colors w-full text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ChatBubbleLeftIcon className="w-5 h-5 text-green-500" />
                              <span className="text-xs text-gray-600 font-medium">Messages Received</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              {loadingStats ? '...' : stats.messagesReceived}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Interests */}
                    {interests.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Interests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {interests.slice(0, 4).map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-velora-primary/20 text-black text-xs font-medium rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                          {interests.length > 4 && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                              +{interests.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Verification Status */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Verification</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {isPhoneVerified ? (
                            <CheckBadgeIconSolid className="w-4 h-4 text-blue-500" />
                          ) : (
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-xs ${isPhoneVerified ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            Phone
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isPhotoVerified ? (
                            <CheckBadgeIconSolid className="w-4 h-4 text-green-500" />
                          ) : (
                            <PhotoIcon className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-xs ${isPhotoVerified ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                            Photo
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preferences Summary */}
                    {preferences && (
                      <div className="bg-velora-primary/5 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">Search Preferences</p>
                        <div className="space-y-1 text-xs">
                          {preferences.ageRange && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Age:</span>
                              <span className="text-black font-medium">
                                {preferences.ageRange.min}-{preferences.ageRange.max}
                              </span>
                            </div>
                          )}
                          {preferences.distance && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Distance:</span>
                              <span className="text-black font-medium">{preferences.distance} km</span>
                            </div>
                          )}
                          {preferences.gender && preferences.gender !== 'all' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Looking for:</span>
                              <span className="text-black font-medium capitalize">{preferences.gender}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Menu */}
              <div className="p-4 space-y-1 border-t border-gray-200">
                  {menuItems.map((item, index) => {
                    // Handle divider items
                    if (item.type === 'divider') {
                      return (
                        <div key={`divider-${index}`} className="px-4 py-2 border-t border-gray-200 mt-2 mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        </div>
                      );
                    }

                    const Icon = item.icon;
                    const isHighlight = item.highlight;
                    return (
                        <motion.button
                      key={index}
                      onClick={item.onClick}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-w-0 ${
                        isHighlight
                            ? 'bg-gray-900 text-white shadow-md shadow-gray-400/30'
                              : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isHighlight ? 'text-white' : 'text-gray-600'
                                }`}
                            />
                      <span className="font-medium truncate min-w-0">{item.label}</span>
                        </motion.button>
                    );
                  })}
                </div>

                {/* Logout Button - Easily Accessible */}
              <div className="p-4 pt-2 border-t border-gray-200">
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Log Out</span>
                  </motion.button>
                </div>

              {/* Premium Banner */}
              <div className="p-4 pt-4 pb-6 border-t border-gray-200">
                  {user?.isPremium ? (
                    <div className="bg-gradient-to-r from-velora-primary to-velora-secondary rounded-2xl p-4 text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <StarIconSolid className="w-5 h-5" />
                          <h4 className="font-bold text-sm">You're Activated Membership</h4>
                        </div>
                        <p className="text-xs text-white/90 mb-3">Enjoy premium and match with unlimited profiles</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleActivateSubscription}
                          disabled={activating}
                          className="bg-white text-velora-primary px-4 py-2.5 rounded-lg font-bold text-sm w-full shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {activating ? 'Activating...' : 'Subscribed'}
                        </motion.button>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-velora-primary/20 to-velora-secondary/20 rounded-2xl p-4 border border-velora-primary/30 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <StarIcon className="w-5 h-5 text-velora-primary" />
                          <h4 className="font-bold text-sm text-black">Upgrade to Premium</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">Enjoy premium features and unlimited matches</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            navigate('/subscriptions');
                            onClose();
                          }}
                          className="bg-velora-primary text-black px-4 py-2.5 rounded-lg font-bold text-sm w-full shadow-md"
                        >
                          Upgrade to Premium
                        </motion.button>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-velora-primary/10 rounded-full -mr-16 -mt-16" />
                    </div>
                  )}
                </div>
              {/* Extra spacing to ensure button is visible */}
              <div className="h-6"></div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Safety Feature Modals */}
      {showShareDatePlanModal && (
        <ShareDatePlanModal
          isOpen={showShareDatePlanModal}
          onClose={() => setShowShareDatePlanModal(false)}
        />
      )}
      {showCheckInModal && (
        <CheckInModal
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
        />
      )}
      {showAddTrustedContactModal && (
        <AddTrustedContactModal
          isOpen={showAddTrustedContactModal}
          onClose={() => setShowAddTrustedContactModal(false)}
        />
      )}
    </>
  );
}

