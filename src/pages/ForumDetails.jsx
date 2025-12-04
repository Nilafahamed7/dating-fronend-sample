import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import { forumService } from '../services/forumService';
import { useAuth } from '../contexts/AuthContext';
import { ChatBubbleLeftRightIcon, HandThumbUpIcon, UserCircleIcon, ClockIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';
import PremiumBadge from '../components/common/PremiumBadge';

export default function ForumDetails() {
  const { forumId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForumDetails();
  }, [forumId]);

  const loadForumDetails = async () => {
    try {
      setLoading(true);
      const response = await forumService.getForumDetails(forumId);
      setForum(response.forum);
      setPosts(response.posts || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load forum details');
      navigate('/forums');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSubmitting(true);
      await forumService.addForumPost(forumId, newPost);
      toast.success('Post added successfully!');
      setNewPost('');
      loadForumDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      await forumService.replyToPost(postId, replyText);
      toast.success('Reply added successfully!');
      setReplyText('');
      setReplyingTo(null);
      loadForumDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (postId) => {
    try {
      await forumService.reactToPost(postId, '👍');
      loadForumDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to react');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="text-center py-20">
          <p className="text-gray-600">Forum not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Forum Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{forum.title}</h1>
          {forum.description && (
            <p className="text-gray-600 mb-4">{forum.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              {posts.length} posts
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              {formatDate(forum.createdAt)}
            </div>
          </div>
        </div>

        {/* Add New Post */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add a Post</h2>
          <form onSubmit={handleAddPost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 resize-none transition-colors"
              rows={4}
            />
            <div className="flex justify-end mt-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || !newPost.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                {submitting ? 'Posting...' : 'Post'}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{post.author?.name || 'Anonymous'}</p>
                      <PremiumBadge
                        isPremium={post.author?.isPremium}
                        placement="inline"
                        size="sm"
                      />
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center gap-4 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReact(post._id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {post.reactions?.some(r => r.user === user?._id) ? (
                      <HandThumbUpIconSolid className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <HandThumbUpIcon className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {post.reactions?.length || 0}
                    </span>
                  </motion.button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === post._id ? null : post._id)}
                    className="text-sm font-medium text-gray-600 hover:text-yellow-600 transition-colors"
                  >
                    Reply
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === post._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pl-8 border-l-4 border-yellow-500"
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 resize-none transition-colors"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(post._id)}
                        disabled={submitting || !replyText.trim()}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {submitting ? 'Replying...' : 'Reply'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="mt-4 space-y-3 pl-8 border-l-4 border-gray-200">
                    {post.replies.map((reply) => (
                      <div key={reply._id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserCircleIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-gray-800">{reply.author?.name || 'Anonymous'}</p>
                              <PremiumBadge
                                isPremium={reply.author?.isPremium}
                                placement="inline"
                                size="sm"
                              />
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap pl-11">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

