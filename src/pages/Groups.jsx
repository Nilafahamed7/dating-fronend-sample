import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx

import { PlusIcon, UsersIcon, ChatBubbleLeftRightIcon, XMarkIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { groupService } from '../services/groupService';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../contexts/GroupsContext';

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups: joinedGroups, loadGroups } = useGroups();
  const [activeTab, setActiveTab] = useState('joined'); // 'joined' or 'discover'
  const [publicGroups, setPublicGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [passkey, setPasskey] = useState('');
  const [joining, setJoining] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    loadGroups();
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  // Check if user can create/join groups
  const canCreateOrJoin = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);

  useEffect(() => {
    loadPublicGroups();
    loadGroups(); // Load joined groups from context
  }, []);

  const loadPublicGroups = async () => {
    try {
      setLoading(true);
      const response = await groupService.listGroups();
      // Backend returns { groups: [...], joinedGroups: [...] }
      setPublicGroups(response.groups || []);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (groupId) => {
    setSelectedGroupId(groupId);
    setPasskey('');
    setShowPasskeyModal(true);
  };

  const handleJoinGroup = async () => {
    if (!passkey.trim()) {
      toast.error('Please enter the passkey');
      return;
    }

    try {
      setJoining(true);
      const response = await groupService.joinGroup(selectedGroupId, passkey.trim());
      if (response.success) {
        toast.success('Joined group successfully');
        setShowPasskeyModal(false);
        setPasskey('');
        setSelectedGroupId(null);
        // Reload groups and navigate to chat
        await loadGroups();
        navigate(`/group/${selectedGroupId}`);
      }
    } catch (error) {
      // Handle 403 - Premium required
      if (error.response?.status === 403 && error.response?.data?.code === 'PREMIUM_REQUIRED') {
        toast.error('Only premium male users and all female users can join groups. Please upgrade to premium.');
        setTimeout(() => navigate('/subscriptions'), 2000);
        return;
      }

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
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 1500);
          return;
        }
      }

      toast.error(error.response?.data?.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  // Check if user is member of a group
  const isMember = (groupId) => {
    return joinedGroups.some(g => {
      const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
      return gId === groupId?.toString();
    });
  };

  // Handle group click - open chat if member, show join/locked if not
  const handleGroupClick = (group) => {
    const groupId = group._id || group.groupId;
    if (isMember(groupId)) {
      // Member: open chat directly
      navigate(`/group/${groupId}`);
    } else if (canCreateOrJoin) {
      // Not member but allowed: show join modal
      handleJoinClick(groupId);
    } else {
      // Not allowed: show locked message
      toast.error('Only premium male users and all female users can join groups. Please upgrade to premium.');
      setTimeout(() => navigate('/subscriptions'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex">

      <div className="flex-1 relative z-10 flex flex-col min-w-0">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10" style={{ paddingTop: 'calc(var(--navbar-height, 64px) + 1.5rem + env(safe-area-inset-top, 0px))' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Groups</h1>
              </div>
              {canCreateOrJoin && (
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-5 py-3 rounded-2xl hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm sm:text-base shadow-md hover:shadow-lg font-semibold"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Create Group</span>
                  <span className="sm:hidden">Create</span>
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('joined')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'joined'
                    ? 'border-b-2 border-velora-primary text-velora-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Joined Groups ({joinedGroups.length})
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'discover'
                    ? 'border-b-2 border-velora-primary text-velora-primary'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Discover ({publicGroups.length})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
                <p className="text-gray-500 mt-4 text-sm lg:text-base">Loading groups...</p>
              </div>
            ) : activeTab === 'joined' ? (
              // Joined Groups Tab
              joinedGroups.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
                  <UsersIcon className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                  <p className="text-gray-600 text-lg lg:text-xl font-semibold mb-2">No joined groups</p>
                  <p className="text-gray-500 text-sm lg:text-base">Join or create a group to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                  {joinedGroups.map((group) => {
                    const groupId = group._id || group.id || group.groupId;
                    const groupName = group.name || group.groupName || 'Unnamed Group';
                    const lastMessage = group.lastMessage;
                    return (
                      <motion.div
                        key={groupId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(`/group/${groupId}`)}
                        className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                      >
                        <div className="p-5 sm:p-6 lg:p-8">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 line-clamp-2">{groupName}</h3>
                          {group.description && (
                            <p className="text-gray-600 mb-5 line-clamp-2 text-sm sm:text-base lg:text-lg">{group.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm lg:text-base text-gray-500 mb-4">
                            <UsersIcon className="w-5 h-5" />
                            <span>{group.memberCount || group.members?.length || 0} members</span>
                          </div>
                          {lastMessage && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-1">
                              {lastMessage.sender?.name || 'Someone'}: {lastMessage.text || lastMessage.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              Open Chat
                            </span>
                            {group.unreadCount > 0 && (
                              <span className="w-6 h-6 bg-velora-primary rounded-full flex items-center justify-center text-xs font-bold text-black">
                                {group.unreadCount > 9 ? '9+' : group.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : (
              // Discover Tab
              publicGroups.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
                  <UsersIcon className="w-20 h-20 mx-auto text-gray-400 mb-6" />
                  <p className="text-gray-600 text-lg lg:text-xl font-semibold mb-2">No public groups available</p>
                  <p className="text-gray-500 text-sm lg:text-base">Be the first to create a group!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                  {publicGroups.map((group) => {
                    const groupId = group._id || group.groupId;
                    const groupName = group.name || group.groupName || 'Unnamed Group';
                    const member = isMember(groupId);
                    const showLocked = !canCreateOrJoin && !member;

                    return (
                      <motion.div
                        key={groupId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="p-5 sm:p-6 lg:p-8">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 line-clamp-2">{groupName}</h3>
                          {group.description && (
                            <p className="text-gray-600 mb-5 line-clamp-2 text-sm sm:text-base lg:text-lg">{group.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm lg:text-base text-gray-500 mb-6">
                            <UsersIcon className="w-5 h-5" />
                            <span>{group.memberCount || group.members?.length || 0} members</span>
                          </div>
                          <div className="flex gap-3">
                            {member ? (
                              <button
                                onClick={() => navigate(`/group/${groupId}`)}
                                className="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-all text-sm font-semibold"
                              >
                                Open Chat
                              </button>
                            ) : showLocked ? (
                              <button
                                onClick={() => {
                                  toast.error('Only premium male users and all female users can join groups. Please upgrade to premium.');
                                  setTimeout(() => navigate('/subscriptions'), 2000);
                                }}
                                className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-xl hover:bg-gray-500 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                              >
                                <LockClosedIcon className="w-4 h-4" />
                                Locked — Upgrade
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => navigate(`/group/${groupId}`)}
                                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all text-sm font-semibold"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleJoinClick(groupId)}
                                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm font-semibold"
                                >
                                  Join
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Passkey Modal */}
      {showPasskeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <KeyIcon className="w-6 h-6 text-yellow-500" />
                Enter Passkey
              </h3>
              <button
                onClick={() => {
                  setShowPasskeyModal(false);
                  setPasskey('');
                  setSelectedGroupId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Please enter the passkey to join this group. The passkey should be provided by the group creator.
            </p>
            <div className="mb-4">
              <label htmlFor="passkey-input" className="block text-sm font-semibold text-gray-700 mb-2">
                Passkey
              </label>
              <input
                id="passkey-input"
                type="text"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinGroup();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasskeyModal(false);
                  setPasskey('');
                  setSelectedGroupId(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinGroup}
                disabled={joining || !passkey.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

