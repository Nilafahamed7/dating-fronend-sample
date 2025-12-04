import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, FunnelIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { GENDERS } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profileService';

export default function FilterModal({ isOpen, onClose, onApply, currentFilters, isIncognito, onIncognitoChange, isPremium, showIncognitoConfirm, onShowIncognitoConfirm }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    ageRange: { min: 18, max: 50 },
    distance: 50,
    gender: 'all',
    interests: [],
    religions: [],
    relationGoals: [],
  });
  const [availableInterests, setAvailableInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [interestsError, setInterestsError] = useState(null);
  const interestsCacheRef = useRef(null);

  const [availableReligions, setAvailableReligions] = useState([]);
  const [loadingReligions, setLoadingReligions] = useState(false);
  const [religionsError, setReligionsError] = useState(null);
  const religionsCacheRef = useRef(null);

  const [availableRelationGoals, setAvailableRelationGoals] = useState([]);
  const [loadingRelationGoals, setLoadingRelationGoals] = useState(false);
  const [relationGoalsError, setRelationGoalsError] = useState(null);
  const relationGoalsCacheRef = useRef(null);

  // Load all filter data from API when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInterests();
      loadReligions();
      loadRelationGoals();

      // Lock body scroll when drawer is open
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore body scroll when drawer closes
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Load interests from admin-managed API
  const loadInterests = async () => {
    // Use cached interests if available (in-memory cache for session)
    if (interestsCacheRef.current) {
      setAvailableInterests(interestsCacheRef.current);
      return;
    }

    try {
      setLoadingInterests(true);
      setInterestsError(null);
      const response = await profileService.getInterests();

      // Handle different response structures
      // New format: { interests: [{ id, name, icon, popularityRank }] }
      // Old format: { interests: ['Interest1', 'Interest2'] }
      let interestsList = response?.interests || response?.data?.interests || [];

      // If interests are objects, extract names; if strings, use as-is
      if (interestsList.length > 0 && typeof interestsList[0] === 'object') {
        // New format with full structure
        interestsList = interestsList.map(item => item.name || item.title || item);
      }

      if (Array.isArray(interestsList) && interestsList.length > 0) {
        setAvailableInterests(interestsList);
        // Cache in memory for the session
        interestsCacheRef.current = interestsList;
      } else {
        setAvailableInterests([]);
        setInterestsError('empty');
      }
    } catch (error) {
      setInterestsError('error');
      setAvailableInterests([]);
    } finally {
      setLoadingInterests(false);
    }
  };

  useEffect(() => {
    if (currentFilters) {
      setFilters({
        ageRange: currentFilters.ageRange || { min: 18, max: 50 },
        distance: currentFilters.distance || 50,
        gender: currentFilters.gender || 'all',
        interests: currentFilters.interests || [],
        religions: currentFilters.religions || [],
        relationGoals: currentFilters.relationGoals || [],
      });
    }
  }, [currentFilters, isOpen]);

  const handleInterestToggle = (interest) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleReligionToggle = (religion) => {
    setFilters((prev) => ({
      ...prev,
      religions: prev.religions.includes(religion)
        ? prev.religions.filter((r) => r !== religion)
        : [...prev.religions, religion],
    }));
  };

  const handleRelationGoalToggle = (goal) => {
    setFilters((prev) => ({
      ...prev,
      relationGoals: prev.relationGoals.includes(goal)
        ? prev.relationGoals.filter((g) => g !== goal)
        : [...prev.relationGoals, goal],
    }));
  };

  // Load religions from admin-managed API
  const loadReligions = async () => {
    if (religionsCacheRef.current) {
      setAvailableReligions(religionsCacheRef.current);
      return;
    }

    try {
      setLoadingReligions(true);
      setReligionsError(null);
      const response = await profileService.getReligions();

      let religionsList = response?.religions || response?.data?.religions || [];

      if (religionsList.length > 0 && typeof religionsList[0] === 'object') {
        religionsList = religionsList.map(item => item.name || item.title || item);
      }

      if (Array.isArray(religionsList) && religionsList.length > 0) {
        setAvailableReligions(religionsList);
        religionsCacheRef.current = religionsList;
      } else {
        setAvailableReligions([]);
        setReligionsError('empty');
      }
    } catch (error) {
      setReligionsError('error');
      setAvailableReligions([]);
    } finally {
      setLoadingReligions(false);
    }
  };

  // Load relation goals from admin-managed API
  const loadRelationGoals = async () => {
    if (relationGoalsCacheRef.current) {
      setAvailableRelationGoals(relationGoalsCacheRef.current);
      return;
    }

    try {
      setLoadingRelationGoals(true);
      setRelationGoalsError(null);
      const response = await profileService.getRelationGoals();

      let goalsList = response?.goals || response?.data?.goals || [];

      if (goalsList.length > 0 && typeof goalsList[0] === 'object') {
        goalsList = goalsList.map(item => item.name || item.title || item);
      }

      if (Array.isArray(goalsList) && goalsList.length > 0) {
        setAvailableRelationGoals(goalsList);
        relationGoalsCacheRef.current = goalsList;
      } else {
        setAvailableRelationGoals([]);
        setRelationGoalsError('empty');
      }
    } catch (error) {
      setRelationGoalsError('error');
      setAvailableRelationGoals([]);
    } finally {
      setLoadingRelationGoals(false);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      ageRange: { min: 18, max: 50 },
      distance: 50,
      gender: 'all',
      interests: [],
      religions: [],
      relationGoals: [],
    };
    setFilters(resetFilters);
    // Apply reset filters immediately
    onApply(resetFilters);
    onClose();
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.ageRange.min !== 18 || filters.ageRange.max !== 50) count++;
    if (filters.distance !== 50) count++;
    if (filters.gender !== 'all') count++;
    if (filters.interests.length > 0) count++;
    if (filters.religions.length > 0) count++;
    if (filters.relationGoals.length > 0) count++;
    return count;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Drawer - Slides from right - Full height */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              mass: 0.5
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white shadow-2xl z-[101] overflow-hidden flex flex-col"
            style={{
              position: 'fixed',
              right: 0,
              top: 'var(--navbar-height, 64px)',
              bottom: 'var(--bottom-nav-height, 64px)',
              width: '50vw',
              maxWidth: '50vw',
              minWidth: '300px',
              height: 'calc(100vh - var(--navbar-height, 64px) - var(--bottom-nav-height, 64px))',
              maxHeight: 'calc(100vh - var(--navbar-height, 64px) - var(--bottom-nav-height, 64px))',
              margin: 0,
              padding: 0
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-velora-primary/10 to-velora-secondary/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-velora-primary rounded-xl shadow-lg">
                  <FunnelIcon className="w-5 h-5 md:w-6 md:h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-black">Filter & Show</h2>
                  {activeFilterCount() > 0 && (
                    <p className="text-xs md:text-sm text-gray-600">
                      {activeFilterCount()} active filter{activeFilterCount() !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            {/* Scrollable Content Area */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
              style={{
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              <div className="p-4 md:p-6 space-y-6 md:space-y-8" style={{ paddingBottom: '1rem' }}>
              {/* Incognito Mode Control */}
              <div className="bg-gradient-to-r from-velora-primary/5 to-velora-secondary/5 rounded-xl p-4 border-2 border-velora-primary/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-bold text-black">Incognito Mode</h3>
                      {isPremium ? (
                        <CheckBadgeIcon className="w-5 h-5 text-velora-primary" title="Premium Feature" />
                      ) : (
                        <LockClosedIcon className="w-5 h-5 text-gray-400" title="Premium Only" />
                      )}
                      {!isPremium && (
                        <span className="text-xs font-semibold text-velora-primary bg-velora-primary/20 px-2 py-0.5 rounded-full">
                          Premium only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      When enabled, searches and views are not saved. Some features (saved searches, recommendations) will be disabled.
                    </p>
                    {isIncognito && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-velora-primary/20 rounded-lg border border-velora-primary/30">
                        <div className="w-2 h-2 bg-velora-primary rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-black">Incognito active — ephemeral session</span>
                      </div>
                    )}
                  </div>
                  <label
                    className={`relative inline-flex items-center cursor-pointer ${!isPremium ? 'opacity-60' : ''}`}
                    role="switch"
                    aria-checked={isIncognito}
                    aria-disabled={!isPremium}
                    aria-describedby="incognito-description"
                  >
                    <input
                      type="checkbox"
                      checked={isIncognito}
                      disabled={!isPremium}
                      onChange={(e) => {
                        if (!isPremium) {
                          toast.error('Incognito is a premium-only feature. Upgrade to enable.');
                          return;
                        }
                        if (e.target.checked && !isIncognito) {
                          // First time enabling - show confirmation
                          onShowIncognitoConfirm(true);
                        } else {
                          onIncognitoChange(e.target.checked);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-velora-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-velora-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                  </label>
                </div>
                {!isPremium && (
                  <motion.button
                    onClick={() => {
                      navigate('/subscriptions');
                      onClose();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-3 px-4 py-2 bg-velora-primary text-black font-semibold rounded-lg hover:opacity-90 transition-all text-sm"
                  >
                    Upgrade to Premium
                  </motion.button>
                )}
              </div>

              {/* Age Range */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-black">Age Range</label>
                  <span className="text-velora-primary font-bold">
                    {filters.ageRange.min} - {filters.ageRange.max}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-sm text-gray-600 mb-2 block">Minimum Age: {filters.ageRange.min}</label>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={filters.ageRange.min}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          ageRange: {
                            ...prev.ageRange,
                            min: Math.min(Number(e.target.value), prev.ageRange.max - 1),
                          },
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-velora-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>18</span>
                      <span>100</span>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-sm text-gray-600 mb-2 block">Maximum Age: {filters.ageRange.max}</label>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={filters.ageRange.max}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          ageRange: {
                            ...prev.ageRange,
                            max: Math.max(Number(e.target.value), prev.ageRange.min + 1),
                          },
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-velora-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>18</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distance Range */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-black">Distance Range</label>
                  <span className="text-velora-primary font-bold">{filters.distance.toFixed(1)} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="0.5"
                  value={filters.distance}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, distance: Number(e.target.value) }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-velora-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>500 km</span>
                </div>
              </div>

              {/* Search Preference */}
              <div>
                <label className="text-lg font-semibold text-black mb-4 block">Search Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {['all', ...GENDERS].map((gender) => (
                    <motion.button
                      key={gender}
                      onClick={() => setFilters((prev) => ({ ...prev, gender }))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-3 rounded-full font-semibold transition-all border-2 ${
                        filters.gender === gender
                          ? 'bg-velora-primary text-black border-velora-primary shadow-lg'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-velora-primary/50'
                      }`}
                    >
                      {gender === 'all' ? 'Both' : gender.toUpperCase()}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Interests - Dynamically Loaded */}
              <div>
                <label className="text-lg font-semibold text-black mb-4 block" id="interests-label">
                  Interests
                </label>
                <div
                  role="group"
                  aria-labelledby="interests-label"
                  aria-live="polite"
                  aria-busy={loadingInterests}
                  className="flex flex-wrap gap-2"
                >
                  {loadingInterests ? (
                    // Skeleton loading state
                    <>
                      {[...Array(12)].map((_, index) => (
                        <div
                          key={`skeleton-${index}`}
                          className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"
                          aria-hidden="true"
                        />
                      ))}
                      <span className="sr-only">Loading interests…</span>
                    </>
                  ) : interestsError === 'error' ? (
                    // Error state
                    <div className="w-full py-4 px-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 text-center">
                        Unable to load interests — try again later.
                      </p>
                    </div>
                  ) : interestsError === 'empty' || availableInterests.length === 0 ? (
                    // Empty state
                    <div className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        No interests available right now.
                      </p>
                    </div>
                  ) : (
                    // Interests list
                    availableInterests.map((interest) => {
                      const isSelected = filters.interests.includes(interest);
                      return (
                        <motion.button
                          key={interest}
                          onClick={() => handleInterestToggle(interest)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleInterestToggle(interest);
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          role="button"
                          aria-pressed={isSelected}
                          aria-label={`${interest} interest${isSelected ? ', selected' : ''}`}
                          tabIndex={0}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-velora-primary focus:ring-offset-2 ${
                            isSelected
                              ? 'bg-velora-primary text-black shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {interest}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Religion - Dynamically Loaded */}
              <div>
                <label className="text-lg font-semibold text-black mb-4 block" id="religions-label">
                  Religion
                </label>
                <div
                  role="group"
                  aria-labelledby="religions-label"
                  aria-live="polite"
                  aria-busy={loadingReligions}
                  className="flex flex-wrap gap-2"
                >
                  {loadingReligions ? (
                    <>
                      {[...Array(8)].map((_, index) => (
                        <div
                          key={`religion-skeleton-${index}`}
                          className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"
                          aria-hidden="true"
                        />
                      ))}
                      <span className="sr-only">Loading religions…</span>
                    </>
                  ) : religionsError === 'error' ? (
                    <div className="w-full py-4 px-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 text-center">
                        Unable to load religions — try again later.
                      </p>
                    </div>
                  ) : religionsError === 'empty' || availableReligions.length === 0 ? (
                    <div className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        No religions available right now.
                      </p>
                    </div>
                  ) : (
                    availableReligions.map((religion) => {
                      const isSelected = filters.religions.includes(religion);
                      return (
                        <motion.button
                          key={religion}
                          onClick={() => handleReligionToggle(religion)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleReligionToggle(religion);
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          role="button"
                          aria-pressed={isSelected}
                          aria-label={`${religion} religion${isSelected ? ', selected' : ''}`}
                          tabIndex={0}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-velora-primary focus:ring-offset-2 ${
                            isSelected
                              ? 'bg-velora-primary text-black shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {religion}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Relationship Goals - Dynamically Loaded */}
              <div>
                <label className="text-lg font-semibold text-black mb-4 block" id="relation-goals-label">
                  Relationship Goals
                </label>
                <div
                  role="group"
                  aria-labelledby="relation-goals-label"
                  aria-live="polite"
                  aria-busy={loadingRelationGoals}
                  className="flex flex-wrap gap-2"
                >
                  {loadingRelationGoals ? (
                    <>
                      {[...Array(8)].map((_, index) => (
                        <div
                          key={`goal-skeleton-${index}`}
                          className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"
                          aria-hidden="true"
                        />
                      ))}
                      <span className="sr-only">Loading relationship goals…</span>
                    </>
                  ) : relationGoalsError === 'error' ? (
                    <div className="w-full py-4 px-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 text-center">
                        Unable to load relationship goals — try again later.
                      </p>
                    </div>
                  ) : relationGoalsError === 'empty' || availableRelationGoals.length === 0 ? (
                    <div className="w-full py-4 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 text-center">
                        No relationship goals available right now.
                      </p>
                    </div>
                  ) : (
                    availableRelationGoals.map((goal) => {
                      const isSelected = filters.relationGoals.includes(goal);
                      return (
                        <motion.button
                          key={goal}
                          onClick={() => handleRelationGoalToggle(goal)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRelationGoalToggle(goal);
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          role="button"
                          aria-pressed={isSelected}
                          aria-label={`${goal} relationship goal${isSelected ? ', selected' : ''}`}
                          tabIndex={0}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-velora-primary focus:ring-offset-2 ${
                            isSelected
                              ? 'bg-velora-primary text-black shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {goal}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div
              className="flex flex-col sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
              }}
            >
              <motion.button
                onClick={handleReset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 md:px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="Reset all filters"
              >
                Reset
              </motion.button>
              <motion.button
                onClick={handleApply}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 md:px-6 py-3 bg-velora-primary text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:ring-offset-2"
                aria-label="Apply selected filters"
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>

          {/* Incognito Confirmation Modal */}
          <AnimatePresence>
            {showIncognitoConfirm && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onShowIncognitoConfirm(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[102]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="fixed inset-0 z-[103] flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-velora-primary/20 rounded-lg">
                        <LockClosedIcon className="w-6 h-6 text-velora-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-black">Enable Incognito Mode?</h3>
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Incognito enabled — your activity will not be stored. This is temporary for this session only.
                    </p>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => onShowIncognitoConfirm(false)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          onIncognitoChange(true);
                          onShowIncognitoConfirm(false);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 bg-velora-primary text-black font-bold rounded-lg hover:opacity-90 transition-all"
                      >
                        Got it
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

