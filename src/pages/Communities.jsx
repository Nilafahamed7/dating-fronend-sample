import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import ProfileLeftSidebar from '../components/sidebar/ProfileLeftSidebar';
import { PlusIcon, UsersIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { communityService } from '../services/communityService';

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await communityService.listCommunities();
      // Backend returns { success: true, communities: [...] }
      setCommunities(response?.communities || []);
    } catch (error) {
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      await communityService.joinCommunity(communityId);
      toast.success('Joined community successfully');
      loadCommunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join community');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex">
      <ProfileLeftSidebar isOpen={showLeftSidebar} onClose={() => setShowLeftSidebar(false)} />

      <div className="flex-1 relative z-10 flex flex-col min-w-0">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6" style={{ paddingTop: 'calc(var(--navbar-height, 64px) + 1rem + env(safe-area-inset-top, 0px))' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Communities</h1>
              </div>
              <button
                onClick={() => navigate('/communities/create')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2.5 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Create Community</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading communities...</div>
            ) : communities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No communities available</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {communities.map((community) => {
                  const communityId = community.mongoId || community.id || community._id || community.communityId;
                  return (
                    <motion.div
                      key={communityId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 line-clamp-2">{community.name}</h3>
                        {community.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">{community.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="w-4 h-4" />
                            {community.members || community.memberCount || 0} members
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/communities/${community.id || communityId}`)}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleJoinCommunity(community.id || communityId)}
                            className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2.5 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm font-medium"
                          >
                            {community.joined ? 'Joined' : 'Join'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

