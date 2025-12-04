import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import LoadingSpinner from '../components/common/LoadingSpinner';
import { groupService } from '../services/groupService';
import { getSocket } from '../services/socketService';
import { useGroups } from '../contexts/GroupsContext';
import { UserGroupIcon, LockClosedIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function JoinGroup() {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { addGroupOptimistically } = useGroups();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passkey, setPasskey] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (shareCode) {
      loadGroupInfo();
    }
  }, [shareCode]);

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      const response = await groupService.getGroupByShareCode(shareCode);
      setGroup(response.group);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Group not found');
      // Redirect to groups page after a delay
      setTimeout(() => navigate('/groups'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();

    if (!passkey.trim()) {
      toast.error('Please enter the group passkey');
      return;
    }

    const groupId = group?.id || group?._id;
    if (!groupId) {
      toast.error('Group information not available');
      return;
    }

    try {
      setJoining(true);

      // OPTIMISTIC UI: Immediately subscribe to group chat and set up for real-time updates
      const socket = getSocket();
      if (socket && socket.connected) {
        // Join group room immediately for real-time updates
        socket.emit('join-group', groupId);
        }

      // Make the join request
      const response = await groupService.joinGroupByShareCode(shareCode, passkey);

      if (response.success) {
        const finalGroupId = response.groupId || groupId;

        // OPTIMISTIC UI: Add group to context immediately
        if (response.group) {
          addGroupOptimistically({
            ...response.group,
            _id: response.group._id || finalGroupId,
            name: response.group.groupName || response.group.name,
          });
        }

        // Ensure socket subscription is active
        if (socket && socket.connected) {
          socket.emit('join-group', finalGroupId);
        }

        toast.success('Successfully joined the group!');

        // Navigate to group detail page immediately
        // The group will appear in Chat → Groups tab via context
        navigate(`/group/${finalGroupId}`);
      }
    } catch (error) {
      // Handle 401 errors - check if it's a token issue
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || '';
        const isTokenError =
          errorMessage.includes('token') ||
          errorMessage.includes('authorized') ||
          errorMessage.includes('session') ||
          errorMessage.includes('Not authorized');

        if (isTokenError) {
          toast.error('Your session has expired. Please log in again.');
          // Clear auth data and redirect after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 1500);
          return;
        }
      }

      const message = error.response?.data?.message || 'Failed to join group';
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600 mb-4">
            The group you're trying to join doesn't exist or the link is invalid.
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="px-6 py-2 bg-velora-primary text-black font-bold rounded-lg hover:opacity-90 transition"
          >
            Browse Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}

      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          {/* Group Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
              <UserGroupIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Group Info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-gray-600 mb-4">{group.description}</p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                {group.memberCount} members
              </div>
              <div className="flex items-center gap-1">
                <LockClosedIcon className="w-4 h-4" />
                {group.privacy === 'private' ? 'Private' : 'Public'}
              </div>
            </div>

            {group.createdBy && (
              <p className="text-sm text-gray-500 mt-2">
                Created by {group.createdBy.name}
              </p>
            )}
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {group.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Already a member */}
          {group.isMember ? (
            <div className="text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                <p className="text-green-700 font-medium">
                  You're already a member of this group!
                </p>
              </div>
              <button
                onClick={() => navigate(`/group/${group.id}`)}
                className="w-full px-6 py-3 bg-velora-primary text-black font-bold rounded-xl hover:opacity-90 transition shadow-lg"
              >
                Open Group
              </button>
            </div>
          ) : (
            <>
              {/* Join Form */}
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Group Passkey
                  </label>
                  <input
                    type="text"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter passkey to join"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ask the group creator for the passkey
                  </p>
                </div>

                <motion.button
                  type="submit"
                  disabled={joining || !passkey.trim()}
                  whileHover={{ scale: joining ? 1 : 1.02 }}
                  whileTap={{ scale: joining ? 1 : 0.98 }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Joining...
                    </span>
                  ) : (
                    'Join Group'
                  )}
                </motion.button>
              </form>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 text-center">
                  💡 The passkey was shared when you received the invitation
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Additional Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/groups')}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            Browse other groups →
          </button>
        </div>
      </div>
    </div>
  );
}

