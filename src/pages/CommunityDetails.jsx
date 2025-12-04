import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import { UsersIcon, HeartIcon, ChatBubbleLeftRightIcon, PlusIcon, UserPlusIcon, UserMinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { communityService } from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityDetails() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, [communityId]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      // Load feed which gives us posts
      const feedResponse = await communityService.getCommunityPosts(communityId);
      setFeed(feedResponse?.feed || []);

      // Check if user is joined by checking my communities
      try {
        const myCommunitiesResponse = await communityService.getMyCommunities();
        const myCommunities = myCommunitiesResponse?.myCommunities || [];
        const joined = myCommunities.some(c =>
          (c.id === communityId || c.mongoId === communityId || c._id === communityId)
        );
        setIsJoined(joined);
      } catch (error) {
        }

      // Try to get community info from explore endpoint
      try {
        const communitiesResponse = await communityService.listCommunities();
        const communities = communitiesResponse?.communities || [];
        const foundCommunity = communities.find(c =>
          (c.id === communityId || c.mongoId === communityId || c._id === communityId)
        );
        if (foundCommunity) {
          setCommunity({
            name: foundCommunity.name,
            members: foundCommunity.members,
            joined: foundCommunity.joined,
            visibility: foundCommunity.visibility,
            icon: foundCommunity.icon,
            creatorId: foundCommunity.creatorId,
          });
          // Check if current user is creator
          setIsCreator(foundCommunity.creatorId === currentUser?._id);
        }
      } catch (error) {
        }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      await communityService.joinCommunity(communityId);
      toast.success('Joined community successfully!');
      setIsJoined(true);
      loadCommunityData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join community');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      setJoining(true);
      await communityService.leaveCommunity(communityId);
      toast.success('Left community successfully');
      setIsJoined(false);
      loadCommunityData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave community');
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error('Please enter post content');
      return;
    }

    try {
      setPosting(true);
      await communityService.createPost(communityId, { content: postContent });
      toast.success('Post created successfully!');
      setPostContent('');
      setShowPostForm(false);
      loadCommunityData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone and will delete all posts and members.')) {
      return;
    }

    try {
      setDeleting(true);
      await communityService.deleteCommunity(communityId);
      toast.success('Community deleted successfully!');
      navigate('/communities');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete community');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Community Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{community?.name || 'Community'}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  {community?.members || 0} members
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isJoined ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLeave}
                  disabled={joining}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-60"
                >
                  <UserMinusIcon className="w-5 h-5" />
                  {joining ? 'Leaving...' : 'Leave'}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex items-center gap-2 px-4 py-2 bg-velora-primary text-black rounded-lg hover:opacity-90 transition disabled:opacity-60"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  {joining ? 'Joining...' : 'Join'}
                </motion.button>
              )}
              {isCreator && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteCommunity}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-5 h-5" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Create Post Button (only if joined) */}
        {isJoined && (
          <div className="mb-6">
            {!showPostForm ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPostForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-velora-primary text-black rounded-lg hover:opacity-90 transition font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                Create Post
              </motion.button>
            ) : (
              <form onSubmit={handleCreatePost} className="bg-white rounded-xl shadow-md p-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent resize-none"
                  rows={4}
                  maxLength={4000}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-500">{postContent.length}/4000</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPostForm(false);
                        setPostContent('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={posting || !postContent.trim()}
                      className="px-4 py-2 bg-velora-primary text-black rounded-lg hover:opacity-90 transition disabled:opacity-60"
                    >
                      {posting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Feed Posts */}
        <div className="space-y-4">
          {feed.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
              {isJoined ? 'No posts yet. Be the first to post!' : 'Join the community to see posts'}
            </div>
          ) : (
            feed.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{post.user || 'Member'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()} at{' '}
                      {new Date(post.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <HeartIcon className="w-5 h-5" />
                    {post.likes || 0}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    {post.comments || 0} comments
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

