import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { profileViewersService } from '../services/profileViewersService';
import { EyeIcon, UserCircleIcon, MapPinIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProfileViewers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const isPremium = user?.isPremium === true;

  useEffect(() => {
    if (user) {
      loadViewers();
    }
  }, [page, user]);

  const loadViewers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileViewersService.getProfileViewers(page, 20);

      if (response.success) {
        setCount(response.count || 0);
        setViewers(response.viewers || []);
        setTotalPages(response.totalPages || 1);
      } else {
        setError(response.message || 'Failed to load viewers');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load profile viewers');
      toast.error('Failed to load profile viewers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    navigate('/subscriptions');
  };

  const handleViewProfile = (viewerId) => {
    navigate(`/profile/${viewerId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredViewers = viewers.filter((viewer) =>
    viewer.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <EyeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load viewers</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadViewers}
            className="px-6 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Non-premium users see count + Subscribe CTA
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-velora-primary/10 rounded-full mb-4">
                  <EyeIcon className="w-10 h-10 text-velora-primary" />
                </div>
                <div className="text-6xl md:text-7xl font-bold text-velora-primary mb-2">
                  {count}
                </div>
                <p className="text-lg text-gray-600">
                  {count === 1 ? 'person has' : 'people have'} viewed your profile
                </p>
              </div>

              <div className="mb-8">
                <p className="text-gray-700 mb-2">
                  Subscribe to Premium to see who viewed your profile.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={handleSubscribe}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-velora-primary text-black rounded-lg font-bold text-lg shadow-md hover:opacity-90 transition-all"
                >
                  Subscribe
                </motion.button>
                <motion.button
                  onClick={() => navigate(-1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-all"
                >
                  Back
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Premium users see full list
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Who viewed my profile
          </h1>
          <p className="text-gray-600">
            {count} {count === 1 ? 'person has' : 'people have'} viewed your profile
          </p>
        </div>

        {/* Search */}
        {viewers.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
            />
          </div>
        )}

        {/* Viewers List */}
        {loading && page === 1 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredViewers.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 md:p-12 text-center">
            <EyeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No viewers yet
            </h3>
            <p className="text-gray-600">
              No one has viewed your profile yet. Share your profile to get more views!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredViewers.map((viewer, index) => (
              <motion.div
                key={viewer.userId || `viewer-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 md:p-5"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {viewer.avatar ? (
                      <img
                        src={viewer.avatar}
                        alt={viewer.name}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {viewer.name || 'Unknown User'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {viewer.age && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {viewer.age}
                        </span>
                      )}
                      {viewer.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                          {viewer.location}
                        </span>
                      )}
                      {viewer.viewedAt && (
                        <span className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {formatDate(viewer.viewedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  {viewer.userId && (
                    <motion.button
                      onClick={() => handleViewProfile(viewer.userId)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-all text-sm md:text-base"
                      aria-label={`View ${viewer.name || 'user'}'s profile`}
                    >
                      View Profile
                      <ArrowRightIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

