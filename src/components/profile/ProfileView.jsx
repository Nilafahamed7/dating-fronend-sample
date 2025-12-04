import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { calculateAge, calculateDistance, getPlaceholderImage } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { matchService } from '../../services/matchService';
import { chatService } from '../../services/chatService';
import { publicService } from '../../services/publicService';
import { profileService } from '../../services/profileService';
import PhotoCarousel from '../swipe/PhotoCarousel';
import PremiumBadge from '../common/PremiumBadge';
import ProfileVideo from './ProfileVideo';
import {
  CheckBadgeIcon,
  MapPinIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  GiftIcon,
  EllipsisVerticalIcon,
  StarIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import {
  ShieldExclamationIcon,
  FlagIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfileView({ profile, isOwn = false }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [matchStatus, setMatchStatus] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSuperLikeSplash, setShowSuperLikeSplash] = useState(false);
  const [photos, setPhotos] = useState([]);

  // Check if current user is premium (needed for photo filtering) - Declare early
  const isCurrentUserPremium = currentUser?.isPremium || false;

  // Handle both backend response structure and direct profile object
  const profileData = profile?.profile || profile;
  const userData = {
    _id: profile?.userId || profile?._id,
    name: profile?.name || profileData?.userId?.name || profile?.userId?.name,
    email: profile?.email || profile?.userId?.email,
    phone: profile?.phone || profile?.userId?.phone,
    dateOfBirth: profileData?.dob || profile?.dateOfBirth || profile?.userId?.dateOfBirth,
    isPhoneVerified: profile?.userId?.isPhoneVerified || profile?.isPhoneVerified || false,
    isPhotoVerified: profile?.verification?.isPhotoVerified || profile?.userId?.isPhotoVerified || profile?.isPhotoVerified || false,
    photoVerificationStatus: profile?.verification?.status || profile?.userId?.photoVerificationStatus || profile?.photoVerificationStatus || 'none',
    isPremium: profile?.userId?.isPremium || profile?.isPremium || false,
    gender: profileData?.gender || profile?.gender || profile?.userId?.gender || '',
  };

  const age = profile?.age || calculateAge(userData.dateOfBirth);

  // Initialize photos from profile data
  useEffect(() => {
    const initialPhotos = profileData?.photos || profile?.photos || [];
    setPhotos(initialPhotos);
  }, [profileData, profile]);

  const placeholderImg = getPlaceholderImage(400, 600, 'No Photo');
  const mainPhoto = (photos[0]?.url && !photos[0]?.requiresPayment) || photos[0]?.isPaid ? photos[0]?.url : placeholderImg;
  const bio = profileData?.about || profile?.bio || profile?.about || '';
  const religion = profile?.religion || profileData?.religion || profile?.userId?.religion || userData?.religion || '';
  const maritalStatus = profileData?.maritalStatus || profile?.maritalStatus || '';
  const interests = profileData?.interests || profile?.interests || [];
  const location = profileData?.location || profile?.location || {};
  const preferences = profile?.preferences || {};
  const goals = preferences?.goals || [];
  const isPhoneVerified = userData.isPhoneVerified;
  const isPhotoVerified = userData.isPhotoVerified;
  const isPremium = userData.isPremium;
  const gender = userData.gender;

  // Check match status when viewing other profiles
  useEffect(() => {
    if (!isOwn && userData._id) {
      checkMatchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwn, userData._id]);

  // Load gifts when modal opens
  useEffect(() => {
    if (showGiftModal && gifts.length === 0) {
      loadGifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGiftModal]);

  const checkMatchStatus = async () => {
    try {
      const response = await matchService.getMatchStatus(userData._id);
      if (response.success && response.data) {
        setMatchStatus(response.data.status || (response.data.isMatched ? 'matched' : 'none'));
        setMatchId(response.data.matchId || null);
      } else {
        setMatchStatus('none');
        setMatchId(null);
      }
    } catch (error) {
      setMatchStatus('none');
      setMatchId(null);
    }
  };

  // Check if user has already liked or superliked this profile
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    const fetchCurrentAction = async () => {
      if (!isOwn && userData._id) {
        try {
          const response = await matchService.getMatchStatus(userData._id);
          if (response.success && response.data) {
            setCurrentAction(response.data.currentAction || null);
          }
        } catch (error) {
          }
      }
    };
    fetchCurrentAction();
  }, [isOwn, userData._id]);

  const hasLiked = currentAction === 'like' || currentAction === 'superlike';

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

  // Calculate distance if we have current user location
  const currentUserLocation = currentUser?.location?.coordinates
    ? { lat: currentUser.location.coordinates[1], lng: currentUser.location.coordinates[0] }
    : null;

  const distance = location?.coordinates && currentUserLocation
    ? calculateDistance(
        currentUserLocation.lat,
        currentUserLocation.lng,
        location.coordinates[1], // longitude
        location.coordinates[0]  // latitude
      )
    : null;

  const handleAction = async (action) => {
    if (isOwn) return;

    try {
      const userId = userData._id;
      if (action === 'like') {
        await matchService.likeUser(userId);
        // Update current action
        setCurrentAction('like');
        toast.success('Liked!');
        await checkMatchStatus();
      } else if (action === 'dislike') {
        await matchService.dislikeUser(userId);
        toast.success('Passed');
        await checkMatchStatus();
      } else if (action === 'superlike') {
        // Super like: Premium users get it free, non-premium users need coins (handled by backend)
        await matchService.superlikeUser(userId);
        // Update current action
        setCurrentAction('superlike');
        // Show splash effect instead of toast
        setShowSuperLikeSplash(true);
        setTimeout(() => setShowSuperLikeSplash(false), 2000);
        await checkMatchStatus();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Action failed';
      toast.error(message);
    }
  };

  const handleMessage = async () => {
    const userId = userData._id;

    // If we already have a matchId, use it
    if (matchId) {
      navigate(`/chat/${matchId}`);
      return;
    }

    // Otherwise, get the match status first to get the matchId
    try {
      // Dismiss any existing toasts first
      toast.dismiss();
      const response = await matchService.getMatchStatus(userId);
      if (response.success && response.data && response.data.matchId) {
        navigate(`/chat/${response.data.matchId}`);
      } else {
        // If no match exists, show error
        toast.dismiss();
        toast.error('You need to match with this user first before messaging', {
          duration: 4000,
          style: {
            zIndex: 99999,
          },
        });
      }
    } catch (error) {
      toast.error('Unable to start chat. Please try again.');
    }
  };

  const handleSendGift = async (giftType) => {
    if (!matchId) {
      toast.error('You can only send gifts to matched users');
      setShowGiftModal(false);
      return;
    }

    if (!isCurrentUserPremium) {
      toast.error('Sending gifts is only available for premium users');
      setShowGiftModal(false);
      return;
    }

    try {
      const response = await chatService.sendGift(matchId, giftType);
      if (response.success) {
        toast.success(`🎁 ${response.message || 'Gift sent successfully!'}`);
        setShowGiftModal(false);
        // Refresh match status to ensure everything is up to date
        await checkMatchStatus();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send gift';
      toast.error(message);
    }
  };

  const handleBlockUser = async () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking');
      return;
    }

    try {
      setBlocking(true);
      const response = await matchService.blockUser(userData._id, blockReason.trim());
      if (response.success) {
        toast.success('User blocked successfully');
        setShowBlockModal(false);
        setBlockReason('');
        // Navigate away or refresh
        navigate('/home');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setBlocking(false);
    }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim()) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      setReporting(true);
      const response = await matchService.reportUser(userData._id, reportReason.trim(), reportDetails.trim() || undefined);
      if (response.success) {
        toast.success('User reported successfully. Thank you for helping keep our community safe.');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report user');
    } finally {
      setReporting(false);
    }
  };

  const isMatched = matchStatus === 'matched' || matchId !== null;

  // Interest emoji mapping
  const getInterestEmoji = (interest) => {
    const emojiMap = {
      'Travel': '🏞️',
      'Hiking': '🥾',
      'Yoga': '🧘‍♀️',
      'Music': '🎵',
      'Food': '🍕',
      'Sports': '⚽',
      'Movies': '🎬',
      'Reading': '📚',
      'Art': '🎨',
      'Photography': '📸',
      'Dancing': '💃',
      'Cooking': '👨‍🍳',
      'Fitness': '💪',
      'Gaming': '🎮',
      'Technology': '💻',
      'Fashion': '👗',
      'Beauty': '💄',
      'Pets': '🐾',
      'Nature': '🌲',
      'Adventure': '🏔️',
      'Writing': '✍️',
      'Meditation': '🧘',
      'Shopping': '🛍️',
      'Comedy': '😂',
      'Theater': '🎭',
      'Wine': '🍷',
      'Coffee': '☕',
    };
    return emojiMap[interest] || '❤️';
  };

  return (
    <div className="max-w-7xl mx-auto relative pb-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left Column - Photo Gallery (Larger on Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100 relative sticky top-24 transform transition-all duration-300 hover:shadow-3xl hover:scale-[1.01]">
              {photos.length > 0 ? (
                <PhotoCarousel
                  photos={photos}
                  profileUserId={userData._id}
                  profileOwner={userData}
                  className="aspect-[3/4] max-h-[600px] sm:max-h-[650px] lg:max-h-[850px] xl:max-h-[900px]"
                />
              ) : (
                <div className="relative aspect-[3/4] max-h-[600px] sm:max-h-[650px] lg:max-h-[850px] xl:max-h-[900px] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center">
                  <img
                    src={placeholderImg}
                    alt={userData.name || 'Profile'}
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Profile Video Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <ProfileVideo
                userId={userData._id}
                isOwn={isOwn}
              />
            </motion.div>
          </motion.div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl p-6 lg:p-8 xl:p-10 border-2 border-gray-100 relative overflow-hidden transform transition-all duration-300 hover:shadow-3xl"
            >
              {/* Decorative gradient background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-velora-primary/10 to-velora-secondary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/50 to-pink-100/50 rounded-full blur-2xl -ml-24 -mb-24" />
              <div className="relative z-10">
              {/* Name, Age, Verification */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    {userData.name || 'User'}
                  </h1>
                  {age && (
                    <span className="text-2xl lg:text-3xl font-bold text-gray-500">({age})</span>
                  )}
                  <PremiumBadge
                    isPremium={isPremium}
                    placement="inline"
                    size="md"
                  />
                  {isPhotoVerified && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckBadgeIcon className="w-7 h-7 text-green-500 flex-shrink-0 drop-shadow-lg" title="Photo Verified" />
                    </motion.div>
                  )}
                </div>

                {/* Distance */}
                {distance && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 text-gray-700 mb-4 bg-gradient-to-r from-velora-primary/10 to-velora-secondary/10 px-4 py-2 rounded-full w-fit border border-velora-primary/20"
                  >
                    <MapPinIcon className="w-5 h-5 text-velora-primary" />
                    <span className="font-semibold text-base">{distance.toFixed(2)} KM away</span>
                  </motion.div>
                )}
              </div>

            {/* Bio */}
            {bio && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-velora-primary to-velora-secondary rounded-full"></span>
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed text-base lg:text-lg pl-3">
                  {bio}
                </p>
              </div>
            )}

            {/* Religion, Location, and Marital Status - Prominent Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
              {/* Religion */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold flex items-center gap-1">
                  <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                  Religion
                </h3>
                <p className="text-base font-bold text-gray-900">
                  {religion || 'Not specified'}
                </p>
              </motion.div>

              {/* Location */}
              {location?.city ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3 text-blue-500" />
                    Location
                  </h3>
                  <p className="text-base font-bold text-gray-900">
                    {location.city}{location.state ? `, ${location.state}` : ''}
                  </p>
                  {location.country && (
                    <p className="text-sm text-gray-600 mt-1">{location.country}</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3 text-blue-500" />
                    Location
                  </h3>
                  <p className="text-base font-bold text-gray-500">
                    Not specified
                  </p>
                </motion.div>
              )}

              {/* Marital Status */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold flex items-center gap-1">
                  <span className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
                  Marital Status
                </h3>
                <p className="text-base font-bold text-gray-900">
                  {maritalStatus || 'Not specified'}
                </p>
              </motion.div>
            </div>

            {/* Interests */}
            {interests.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
                  Interests
                </h3>
                <div className="flex flex-wrap gap-3 pl-3">
                  {interests.map((interest, index) => (
                    <motion.span
                      key={index}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="px-4 py-2.5 bg-gradient-to-r from-velora-primary/10 via-velora-secondary/10 to-velora-primary/10 hover:from-velora-primary/20 hover:via-velora-secondary/20 hover:to-velora-primary/20 rounded-full text-gray-800 font-semibold text-sm transition-all shadow-md hover:shadow-lg border border-velora-primary/20"
                    >
                      {interest} {getInterestEmoji(interest)}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Relationship Goals */}
            {goals.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-pink-500 to-red-500 rounded-full"></span>
                  Relationship Goals
                </h3>
                <div className="flex flex-wrap gap-3 pl-3">
                  {goals.map((goal, index) => (
                    <motion.span
                      key={index}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="px-4 py-2.5 bg-gradient-to-r from-pink-100 via-purple-100 to-pink-100 hover:from-pink-200 hover:via-purple-200 hover:to-pink-200 rounded-full text-gray-800 font-semibold text-sm transition-all shadow-md hover:shadow-lg border border-pink-300/30"
                    >
                      {goal} 💖
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {gender && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">Gender</p>
                  <p className="text-base font-bold text-gray-900 capitalize">{gender}</p>
                </motion.div>
              )}
              {userData.dateOfBirth && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">Date of Birth</p>
                  <p className="text-base font-bold text-gray-900">
                    {new Date(userData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide font-bold">Verification Status</p>
                <div className="flex flex-wrap gap-2">
                  {isPhoneVerified && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Phone Verified</span>
                  )}
                  {isPhotoVerified && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Photo Verified</span>
                  )}
                  {isPremium && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Premium Member</span>
                  )}
                  {!isPhoneVerified && !isPhotoVerified && !isPremium && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Not Verified</span>
                  )}
                </div>
              </motion.div>
            </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gift Selection Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Send a Gift</h2>
              <button
                onClick={() => setShowGiftModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingGifts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                </div>
              ) : gifts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No gifts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        <span className="absolute top-2 right-2 bg-velora-primary text-black text-xs font-bold px-2 py-1 rounded-full">
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

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <NoSymbolIcon className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Block User</h2>
              </div>
              <p className="text-gray-600">Are you sure you want to block {userData.name}? You won't be able to see each other's profiles or messages.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Why are you blocking this user?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBlockUser}
                  disabled={blocking}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                >
                  {blocking ? 'Blocking...' : 'Block User'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <FlagIcon className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Report User</h2>
              </div>
              <p className="text-gray-600">Help us keep the community safe by reporting inappropriate behavior.</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Harassment or bullying">Harassment or bullying</option>
                  <option value="Spam or scam">Spam or scam</option>
                  <option value="Fake profile">Fake profile</option>
                  <option value="Asking for money">Asking for money</option>
                  <option value="Underage user">Underage user</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Please provide more information about this report..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{reportDetails.length}/1000 characters</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDetails('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReportUser}
                  disabled={reporting || !reportReason.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                >
                  {reporting ? 'Reporting...' : 'Submit Report'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
