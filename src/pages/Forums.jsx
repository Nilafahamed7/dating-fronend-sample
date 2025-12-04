import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { forumService } from '../services/forumService';
// NavBar removed - using GlobalNavBar from App.jsx

import { PlusIcon, ChatBubbleLeftRightIcon, TagIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Forums() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all'); // all, trending, new
  const [deletingForums, setDeletingForums] = useState(new Set());
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    loadForums();
  }, [filter]);

  // Scroll to top when component mounts or filter changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filter]);

  // Scroll to top on initial mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const loadForums = async () => {
    try {
      setLoading(true);
      const response = await forumService.listForums({ filter, page: 1, limit: 50 });
      setForums(response.forums || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load forums');
      setForums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForum = async (forumId, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete

    if (!window.confirm('Are you sure you want to delete this forum? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingForums(prev => new Set(prev).add(forumId));
      await forumService.deleteForum(forumId);
      toast.success('Forum deleted successfully!');
      loadForums(); // Reload the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete forum');
    } finally {
      setDeletingForums(prev => {
        const newSet = new Set(prev);
        newSet.delete(forumId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex">
      {/* Left Sidebar - Profile */}

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col min-w-0">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10" style={{ paddingTop: 'calc(var(--navbar-height, 64px) + 1.5rem + env(safe-area-inset-top, 0px))' }}>
            {/* Header with Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Forums</h1>
              </div>
              <button
                onClick={() => navigate('/forums/create')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-5 py-3 rounded-2xl hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm sm:text-base shadow-md hover:shadow-lg font-semibold"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Create Forum</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['all', 'trending', 'new'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl transition-all capitalize text-sm sm:text-base whitespace-nowrap font-medium ${filter === f
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
              </div>
            ) : forums.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
                <ChatBubbleLeftRightIcon className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                <p className="text-gray-600 text-lg lg:text-xl font-semibold mb-2">No forums found</p>
                <p className="text-gray-500 text-sm lg:text-base">Create your first forum to get started!</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                {forums.map((forum) => {
                  const isCreator = forum.createdBy === user?._id;
                  const isDeleting = deletingForums.has(forum.forumId);
                  return (
                    <motion.div
                      key={forum.forumId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl shadow-md p-5 sm:p-6 lg:p-8 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/forums/${forum.forumId}`)}
                        >
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 line-clamp-2">{forum.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <ClockIcon className="w-4 h-4" />
                            {formatDate(forum.lastActivityAt)}
                          </div>
                          {isCreator && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleDeleteForum(forum.forumId, e)}
                              disabled={isDeleting}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              title="Delete Forum"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/forums/${forum.forumId}`)}
                      >
                        {forum.description && (
                          <p className="text-gray-600 mb-5 line-clamp-2 text-sm sm:text-base lg:text-lg">{forum.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-xs sm:text-sm lg:text-base text-gray-500">
                            <div className="flex items-center gap-2">
                              <ChatBubbleLeftRightIcon className="w-5 h-5" />
                              {forum.postCount || 0} posts
                            </div>
                            {forum.tags && forum.tags.length > 0 && (
                              <div className="flex items-center gap-2">
                                <TagIcon className="w-5 h-5" />
                                <span className="line-clamp-1">{forum.tags.slice(0, 3).join(', ')}</span>
                              </div>
                            )}
                          </div>
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

