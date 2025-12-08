import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentGate } from '../hooks/usePaymentGate';
import { profileService } from '../services/profileService';
import ProfileView from '../components/profile/ProfileView';
import ProfileEdit from '../components/profile/ProfileEdit';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import PageContainer from '../components/common/PageContainer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Profile() {
  const { userId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { refreshBalance } = usePaymentGate();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const isOwnProfile = !userId || userId === user?._id;
  const navBarContext = useNavBarContext();

  // Extract setters to avoid depending on the entire context object
  const setNavbarTitle = navBarContext?.setNavbarTitle;
  const setShowBackButton = navBarContext?.setShowBackButton;
  const setHomeRightAction = navBarContext?.setHomeRightAction;

  // Define loadProfile before useEffect that uses it
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const ownProfile = !userId || userId === user?._id;

      let response;
      if (ownProfile) {
        response = await profileService.getMyProfile();
      } else if (userId) {
        response = await profileService.viewProfile(userId);
        // Refresh balance after viewing profile (backend deducts coins)
        await refreshBalance();
      } else {
        // No userId and not own profile - can't load
        setLoading(false);
        return;
      }

      if (response?.data) {
        setProfile(response.data);
      } else {
        throw new Error('No profile data received');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile';
      toast.dismiss();
      toast.error(errorMessage);
      if (error.response?.status === 400) {
        // If insufficient coins, navigate back after a delay
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
      // Set profile to null on error so we show "Profile not found"
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId, user?._id, refreshBalance, navigate]);

  // Load profile on mount and when userId changes - SINGLE useEffect
  useEffect(() => {
    // If not authenticated and trying to view own profile, redirect to login
    if (!isAuthenticated && isOwnProfile) {
      navigate('/login');
      return;
    }

    // Load profile immediately if we have the necessary data
    if (isAuthenticated || userId) {
      loadProfile();
    } else if (!user && !userId) {
      // If user is not loaded yet and no userId, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthenticated, isOwnProfile]); // Only depend on these to avoid infinite loops

  const handleSave = useCallback(() => {
    setEditing(false);
    // Reload profile after save
    loadProfile();
  }, [loadProfile]);

  // Memoize the edit button to prevent recreating on every render
  const editButton = useMemo(() => (
    <motion.button
      onClick={() => setEditing(true)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-2 hover:bg-velora-primary/10 rounded-full transition-colors"
    >
      <PencilIcon className="w-6 h-6 text-velora-darkGray" />
    </motion.button>
  ), []); // Empty deps - button doesn't depend on any props

  // Track previous values to prevent unnecessary updates
  const prevTitleRef = useRef(null);
  const prevShowBackRef = useRef(null);
  const prevRightActionRef = useRef(null);

  // Update navbar title and actions based on profile state
  useEffect(() => {
    if (!setNavbarTitle || !setShowBackButton || !setHomeRightAction) {
      return;
    }

    // Only update navbar if profile is loaded
    if (!profile) {
      // Clear navbar when profile is not loaded
      if (prevTitleRef.current !== null) {
        setNavbarTitle('');
        prevTitleRef.current = null;
      }
      // Clear right action
      if (prevRightActionRef.current !== null) {
        setHomeRightAction(null);
        prevRightActionRef.current = null;
      }
      return;
    }

    const title = isOwnProfile ? (editing ? 'Edit Profile' : 'Profile') : (profile?.userId?.name || profile?.name || 'Profile');
    const showBack = !isOwnProfile || editing; // Show back button when editing or viewing other profile
    const rightAction = isOwnProfile && !editing ? editButton : null;

    // Only update if values actually changed
    if (prevTitleRef.current !== title) {
      setNavbarTitle(title);
      prevTitleRef.current = title;
    }

    if (prevShowBackRef.current !== showBack) {
      setShowBackButton(showBack);
      prevShowBackRef.current = showBack;
    }

    // For rightAction, compare by checking if both are null or both are not null
    const rightActionChanged = (prevRightActionRef.current === null) !== (rightAction === null);
    if (rightActionChanged || prevRightActionRef.current !== rightAction) {
      setHomeRightAction(rightAction);
      prevRightActionRef.current = rightAction;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isOwnProfile, editing]); // Removed setters and editButton from deps to prevent loops

  // Cleanup: Clear right action when component unmounts
  useEffect(() => {
    return () => {
      if (setHomeRightAction) {
        setHomeRightAction(null);
      }
    };
  }, [setHomeRightAction]);

  // Show loading state
  if (loading) {
    return (
      <PageContainer className="bg-gray-50" fullWidth={true} padding={true}>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  // Show error state if profile failed to load
  if (!profile && !loading) {
    return (
      <PageContainer className="bg-gray-50" fullWidth={true} padding={true}>
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
          <p className="text-gray-600 text-lg">Profile not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-velora-primary text-white rounded-lg hover:bg-velora-primary/90 transition"
          >
            Go Back
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50" style={{ height: '100%', width: '100%' }}>
      <PageContainer className="bg-gray-50" fullWidth={true} padding={true}>
        {editing ? (
          <ProfileEdit profile={profile} onSave={handleSave} />
        ) : (
          <ProfileView profile={profile} isOwn={isOwnProfile} />
        )}
      </PageContainer>
    </div>
  );
}

