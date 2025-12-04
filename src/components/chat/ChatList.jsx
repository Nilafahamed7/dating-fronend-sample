import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { matchService } from '../../services/matchService';
import { groupService } from '../../services/groupService';
import { pinService } from '../../services/pinService';
import { getSocket } from '../../services/socketService';
import { formatDate, getPlaceholderImage, getInitials } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { ChatBubbleLeftRightIcon, UserGroupIcon, InformationCircleIcon, PlusIcon, MagnifyingGlassIcon, UserPlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import PremiumBadge from '../common/PremiumBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';
import toast from 'react-hot-toast';
import CreateGroupModal from './CreateGroupModal';

export default function ChatList() {
  const { user } = useAuth();
  const { groups, loading: groupsLoading, presence } = useGroups();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [pinnedChats, setPinnedChats] = useState([]); // Combined pinned matches and groups
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [pinningChat, setPinningChat] = useState(null);
  const [maxPinned, setMaxPinned] = useState(3);
  const [pinnedSectionExpanded, setPinnedSectionExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'groups'
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const contextMenuRef = useRef(null);
  const loadDataRef = useRef(null);
  const placeholderImg = getPlaceholderImage(100, 100, 'No Photo');

  // Helper function to safely extract user avatar with fallbacks
  const getUserAvatar = (otherUser, profile = {}) => {
    // Try multiple sources for photo
    if (otherUser?.photo) return otherUser.photo;

    const photos = profile?.photos || otherUser?.photos || [];
    if (photos.length > 0) {
      const primary = photos.find(p => p.isPrimary);
      if (primary) return primary.url || primary;
      return photos[0]?.url || photos[0];
    }

    return null; // Will use placeholder with initials
  };

  // Helper function to safely extract user name with fallbacks
  const getUserName = (otherUser) => {
    if (!otherUser) return '';
    // Try multiple sources for name
    return otherUser.name || otherUser.username || '';
  };

  // Helper function to safely extract group avatar
  const getGroupAvatar = (group) => {
    return group?.avatar || null;
  };

  // Helper function to safely extract group name
  const getGroupName = (group) => {
    if (!group) return '';
    return group.name || '';
  };

  useEffect(() => {
    if (user?._id && loadDataRef.current) {
      loadDataRef.current();
    }
  }, [user?._id]);

  // Track previous tab to detect tab switches
  const prevTabRef = useRef(activeTab);

  // Reload data when switching to groups tab to ensure groups are visible
  useEffect(() => {
    // Only reload if we're switching TO the groups tab (not already on it)
    if (activeTab === 'groups' && prevTabRef.current !== 'groups' && user?._id && !loading && loadDataRef.current) {
      loadDataRef.current();
    }
    prevTabRef.current = activeTab;
  }, [activeTab, loading, user?._id]);

  // Update pinned chats when groups update (from context)
  useEffect(() => {
    // Update pinned chats when groups change
    setPinnedChats(prev => prev.map(pinnedChat => {
      if (pinnedChat.chatType === 'group' && pinnedChat.groupId) {
        const groupId = pinnedChat.groupId._id?.toString() || pinnedChat.groupId.toString();
        const contextGroup = groups.find(g => {
          const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
          return gId === groupId;
        });

        if (contextGroup) {
          return {
            ...pinnedChat,
            lastMessage: contextGroup.lastMessage,
            lastMessageAt: contextGroup.lastMessageAt,
          };
        }
      }
      return pinnedChat;
    }));
  }, [groups]);

  // Listen for match messages to update pinned chats
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMatchNewMessage = (data) => {
      // Update pinned chats if this match is pinned
      setPinnedChats(prev => prev.map(pinnedChat => {
        if (pinnedChat.chatType === 'match' && pinnedChat.matchId) {
          const matchId = pinnedChat.matchId._id?.toString() || pinnedChat.matchId.toString();
          if (matchId === data.matchId?.toString()) {
            return {
              ...pinnedChat,
              lastMessage: {
                text: data.message?.text,
                sender: data.message?.sender,
                createdAt: data.message?.createdAt,
              },
              lastMessageAt: data.message?.createdAt || new Date(),
            };
          }
        }
        return pinnedChat;
      }));

      // Also update regular matches list
      setMatches(prev => prev.map(match => {
        const matchId = match._id?.toString() || match.matchId?.toString();
        if (matchId === data.matchId?.toString()) {
          return {
            ...match,
            lastMessage: {
              text: data.message?.text,
            },
            lastMessageAt: data.message?.createdAt || new Date(),
          };
        }
        return match;
      }));
    };

    socket.on('new-message', handleMatchNewMessage);
    socket.on('message:sent', handleMatchNewMessage);

    return () => {
      socket.off('new-message', handleMatchNewMessage);
      socket.off('message:sent', handleMatchNewMessage);
    };
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel for better performance
      const loadPromises = [];

      // Load pinned chats
      if (user?._id) {
        loadPromises.push(
          pinService.getPinnedChats(user._id).catch(error => {
            return { data: [], maxPinned: 3 };
          })
        );
      } else {
        loadPromises.push(Promise.resolve({ data: [], maxPinned: 3 }));
      }

      // Load matches and invitations in parallel
      // Groups are loaded by GroupsContext, so we don't load them here
      loadPromises.push(
        matchService.getMatchList().catch(error => {
          return { matches: [], data: [] };
        })
      );

      // Invitations are handled via chat messages with type 'group_invitation'
      // No separate invitations endpoint needed - they come through chat
      loadPromises.push(Promise.resolve({ data: [] }));

      // Wait for all requests to complete
      const [pinnedResponse, matchResponse, invitationsResponse] = await Promise.all(loadPromises);

      // Process pinned chats
      const pinnedList = pinnedResponse.data || [];
      setMaxPinned(pinnedResponse.maxPinned || 3);
      setPinnedChats(pinnedList);

      // Process matches
      let matchesList = matchResponse.matches || matchResponse.data || [];
      const isNonPremiumMale = !user?.isPremium && user?.gender === 'male';

      // Filter out expired chats for non-premium males (backend should already filter, but double-check on frontend)
      if (isNonPremiumMale) {
        const now = new Date();
        matchesList = matchesList.filter(match => {
          // If match has chat expiration info, check if it's expired
          if (match.chatExpired || (match.chatTimerExpiresAt && new Date(match.chatTimerExpiresAt) < now)) {
            return false; // Exclude expired chats
          }
          return true;
        });
      }
      const isFemale = user?.gender === 'female';

      // Filter matches based on user segment
      let filteredMatches = matchesList;

      // For premium males: filter out fake users
      if (user?.isPremium && user?.gender === 'male') {
        filteredMatches = matchesList.filter(m => {
          const otherUser = m.user || m.otherUser || {};
          return !otherUser.isFake;
        });
      }
      // For non-premium males: show fake users but filter expired chats
      else if (isNonPremiumMale) {
        const now = new Date();
        filteredMatches = matchesList.filter(m => {
          // Filter out expired chats
          if (m.hiddenForRecipient) {
            return false;
          }
          // Check if chat timer expired for this user
          if (m.chatExpired || (m.chatTimerExpiresAt && new Date(m.chatTimerExpiresAt) < now)) {
            // Only filter if this chat is expired for the current user
            if (m.chatExpiredForUserId && m.chatExpiredForUserId.toString() === user?._id?.toString()) {
              return false;
            }
          }
          return true;
        });
      }
      // For females: filter out fake users
      else if (isFemale) {
        filteredMatches = matchesList.filter(m => {
          const otherUser = m.user || m.otherUser || {};
          return !otherUser.isFake;
        });
      }

      // Remove pinned matches from regular list
      const pinnedMatchIds = new Set(
        pinnedList
          .filter(p => p.chatType === 'match' && p.matchId)
          .map(p => p.matchId._id?.toString() || p.matchId.toString())
      );
      setMatches(filteredMatches.filter(m => {
        const matchId = m._id?.toString() || m.matchId?.toString();
        return !pinnedMatchIds.has(matchId);
      }));

      // Groups are managed by GroupsContext - no need to process them here
      // GroupsContext loads groups on mount and handles all real-time updates

      // Process invitations
      const invitationsList = invitationsResponse.data || [];
      setInvitations(invitationsList);

      // Groups are loaded by GroupsContext - no need to process them here
    } catch (error) {
      toast.error('Failed to load chats. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Update ref on every render to always have the latest loadData
  useEffect(() => {
    loadDataRef.current = loadData;
  });

  // Unified pin handler for both matches and groups - preserves full thread metadata
  const handlePinChat = async (threadId, chatType, isPinned) => {
    if (pinningChat) return;

      // Store original state for rollback
      const originalPinnedChats = [...pinnedChats];
      const originalMatches = [...matches];

    try {
      setPinningChat(threadId);

      // Check pin limit before pinning
      if (!isPinned && pinnedChats.length >= maxPinned) {
        toast.error(`You can only pin up to ${maxPinned} chats. Unpin another chat first.`);
        setPinningChat(null);
        return;
      }

      // Optimistic update - preserve full thread objects
      if (isPinned) {
        // Unpin - find the pinned chat with full metadata
        const pinnedChatIndex = pinnedChats.findIndex(p => {
          if (chatType === 'group') {
            return p.groupId?._id?.toString() === threadId || p.groupId?.toString() === threadId;
          } else {
            return p.matchId?._id?.toString() === threadId || p.matchId?.toString() === threadId;
          }
        });

        if (pinnedChatIndex >= 0) {
          const pinnedChat = pinnedChats[pinnedChatIndex];

          // Remove from pinned list
          setPinnedChats(prev => prev.filter((_, idx) => idx !== pinnedChatIndex));

          // Add back to regular list with full metadata preserved
          // Groups are managed by context, so we don't need to add them back here
          if (chatType === 'match' && pinnedChat?.matchId) {
            // Preserve the full match object
            setMatches(prev => [...prev, pinnedChat.matchId]);
          }
        }
      } else {
        // Pin - preserve full thread object
        if (chatType === 'group') {
          const groupToPin = groups.find(g => {
            const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
            return gId === threadId?.toString();
          });
          if (groupToPin) {
            // Create pinned entry with full group object preserved
            setPinnedChats(prev => [...prev, {
              chatType: 'group',
              groupId: groupToPin, // Full group object with all metadata
              pinnedAt: new Date(),
              lastMessage: groupToPin.lastMessage,
              lastMessageAt: groupToPin.lastMessageAt || groupToPin.updatedAt,
            }]);
            // Groups are managed by context - no need to filter here
            // The display will filter out pinned groups automatically
          }
        } else {
          const matchToPin = matches.find(m => {
            const matchId = m._id?.toString() || m.matchId?.toString();
            return matchId === threadId;
          });
          if (matchToPin) {
            // Create pinned entry with full match object preserved
            setPinnedChats(prev => [...prev, {
              chatType: 'match',
              matchId: matchToPin, // Full match object with all metadata
              pinnedAt: new Date(),
              lastMessage: matchToPin.lastMessage,
              lastMessageAt: matchToPin.lastMessageAt || matchToPin.updatedAt,
            }]);
            setMatches(prev => prev.filter(m => {
              const matchId = m._id?.toString() || m.matchId?.toString();
              return matchId !== threadId;
            }));
          }
        }
      }

      await pinService.pinChat(threadId);
      toast.success(isPinned ? 'Chat unpinned' : 'Chat pinned');
      setContextMenu(null);

      // Reload to sync with server (but keep optimistic UI until then)
      // Use a longer delay to avoid flashing - let optimistic update settle
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to pin chat';
      toast.error(errorMsg);

      // Revert optimistic update on error - restore exact previous state
      setPinnedChats([...originalPinnedChats]);
      setMatches([...originalMatches]);
    } finally {
      setPinningChat(null);
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone and will remove all messages and members.`)) {
      return;
    }

    try {
      await groupService.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      loadData(); // Reload groups list
      navigate('/chat'); // Navigate back to chat list
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete group';
      toast.error(errorMessage);
    }
  };

  const handleAcceptInvitation = async (groupId) => {
    try {
      // Premium check
      if (!user?.isPremium) {
        toast.error('Premium membership required to join groups. Please upgrade to accept invitations.');
        return;
      }

      // Accept invitation - this auto-joins without passkey
      await groupService.acceptInvitation(groupId);
      toast.success('Successfully joined the group!');

      // Remove from invitations immediately
      setInvitations(prev => prev.filter(inv => {
        const invGroupId = inv.groupId?._id?.toString() || inv.groupId?.toString();
        return invGroupId !== groupId?.toString();
      }));

      // Reload groups to show the newly joined group with a small delay
      setTimeout(() => {
        loadData();
      }, 300);
    } catch (error) {
      const errorCode = error.response?.data?.code;

      if (errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Premium membership required to join groups. Please upgrade.', { duration: 5000 });
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
          // Clear auth data and redirect after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }, 1500);
          return;
        }
      }

      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (groupId) => {
    try {
      await groupService.rejectInvitation(groupId);
      toast.success('Invitation declined');
      setInvitations(prev => prev.filter(inv => {
        const invGroupId = inv.groupId?._id?.toString() || inv.groupId?.toString();
        return invGroupId !== groupId?.toString();
      }));
    } catch (error) {
      toast.error('Failed to decline invitation');
    }
  };

  const handleContextMenu = (e, item, chatType = 'group') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      chatType,
    });
  };

  const handleLongPress = (e, item, chatType = 'group') => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      item,
      chatType,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const hasContent = matches.length > 0 || groups.length > 0 || pinnedChats.length > 0 || invitations.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        icon={ChatBubbleLeftRightIcon}
        title="No conversations yet"
        message="Match with someone or join a group to start chatting!"
      />
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.9 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
  };

  // Render a pinned chat item (works for both matches and groups)
  const renderPinnedChatItem = (pinnedChat) => {
    const isPinning = pinningChat && (
      (pinnedChat.chatType === 'group' && (pinningChat === pinnedChat.groupId?._id?.toString() || pinningChat === pinnedChat.groupId?.toString())) ||
      (pinnedChat.chatType === 'match' && (pinningChat === pinnedChat.matchId?._id?.toString() || pinningChat === pinnedChat.matchId?.toString()))
    );

    if (pinnedChat.chatType === 'group' && pinnedChat.groupId) {
      const group = pinnedChat.groupId;
      const groupAvatar = getGroupAvatar(group) || placeholderImg;
      const groupName = getGroupName(group);
      const lastMessage = pinnedChat.lastMessage || group.lastMessage;
      const lastMessageTime = pinnedChat.lastMessageAt || group.lastMessageAt || group.updatedAt;

      return (
        <motion.div
          key={`pinned-group-${group._id}`}
          variants={itemVariants}
          whileHover={{ scale: 1.03, x: 8 }}
          whileTap={{ scale: 0.97 }}
          onContextMenu={(e) => handleContextMenu(e, group, 'group')}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const timer = setTimeout(() => {
              handleLongPress(e, group, 'group');
            }, 500);
            e.currentTarget.dataset.timer = timer;
          }}
          onTouchEnd={(e) => {
            const timer = e.currentTarget.dataset.timer;
            if (timer) clearTimeout(timer);
          }}
        >
          <div className="relative group">
            <Link
              to={`/group/${group._id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:shadow-md transition-shadow relative border-l-4 border-velora-primary cursor-pointer"
            >
              <svg className="absolute top-2 right-2 w-4 h-4 text-velora-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            {groupAvatar ? (
              <img
                src={groupAvatar}
                alt={groupName}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  // Only fallback to placeholder if image fails to load
                  if (e.target.src !== placeholderImg) {
                    e.target.src = placeholderImg;
                  }
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 font-semibold text-lg">
                  {groupName ? getInitials(groupName) : 'G'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-velora-darkGray truncate flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  {groupName}
                </h3>
                {lastMessageTime && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDate(lastMessageTime)}
                  </span>
                )}
              </div>
              {lastMessage ? (
                <p className="text-sm text-gray-600 truncate">
                  {lastMessage.sender?.name || 'Someone'}: {lastMessage.text || 'Sent a message'}
                </p>
              ) : (
                <p className="text-sm text-gray-600 truncate">
                  {group.members?.length || 0} members
                </p>
              )}
            </div>
            </Link>
            {/* Pin button - visible on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const groupId = group._id?.toString();
                handlePinChat(groupId, 'group', true);
              }}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 z-10"
              title="Unpin chat"
              disabled={isPinning}
            >
              <svg className="w-4 h-4 text-velora-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>
          </div>
        </motion.div>
      );
    } else if (pinnedChat.chatType === 'match' && pinnedChat.matchId) {
      const match = pinnedChat.matchId;
      // Use the same structure as regular matches (user/otherUser fields)
      const otherUser = match.user || match.otherUser || {};

      // Extract profile data safely - check multiple sources
      const profile = otherUser.profile || otherUser.Profile || {};

      // Get avatar - use the same logic as regular matches
      const primaryPhoto = getUserAvatar(otherUser, profile);
      const displayName = getUserName(otherUser);

      // Ensure we have a valid name - if not, try to get from match structure
      const finalDisplayName = displayName || (match.userIds?.find(u => {
        const userIdStr = u._id?.toString() || u.toString();
        return userIdStr !== user?._id?.toString();
      })?.name) || '';

      const matchId = match.matchId || match._id;
      const lastMessage = pinnedChat.lastMessage || match.lastMessage;
      const lastMessageTime = pinnedChat.lastMessageAt || match.lastMessageAt || match.updatedAt;

      return (
        <motion.div
          key={`pinned-match-${matchId}`}
          variants={itemVariants}
          whileHover={{ scale: 1.03, x: 8 }}
          whileTap={{ scale: 0.97 }}
          onContextMenu={(e) => handleContextMenu(e, match, 'match')}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const timer = setTimeout(() => {
              handleLongPress(e, match, 'match');
            }, 500);
            e.currentTarget.dataset.timer = timer;
          }}
          onTouchEnd={(e) => {
            const timer = e.currentTarget.dataset.timer;
            if (timer) clearTimeout(timer);
          }}
        >
          <div className="relative group">
            <Link
              to={`/chat/${matchId}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:shadow-md transition-shadow relative border-l-4 border-velora-primary"
            >
              <svg className="absolute top-2 right-2 w-4 h-4 text-velora-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            {primaryPhoto ? (
              <img
                src={primaryPhoto}
                alt={finalDisplayName}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  // Only fallback to placeholder if image fails to load
                  if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
                    e.target.src = placeholderImg;
                  }
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 font-semibold text-lg">
                  {finalDisplayName ? getInitials(finalDisplayName) : 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-velora-darkGray truncate">
                    {finalDisplayName}
                  </h3>
                  <PremiumBadge
                    isPremium={otherUser.isPremium || otherUser.userId?.isPremium}
                    placement="inline"
                    size="sm"
                  />
                </div>
                {lastMessageTime && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDate(lastMessageTime)}
                  </span>
                )}
              </div>
              {lastMessage ? (
                <p className="text-sm text-gray-600 truncate">
                  {lastMessage.sender?.name || ''}: {lastMessage.text || ''}
                </p>
              ) : (
                <p className="text-sm text-gray-600 truncate">
                  New match!
                </p>
              )}
            </div>
            {match.unreadCount > 0 && (
              <div className="w-6 h-6 bg-velora-primary rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                {match.unreadCount > 9 ? '9+' : match.unreadCount}
              </div>
            )}
            </Link>
            {/* Pin button - visible on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const matchIdStr = matchId?.toString() || match._id?.toString();
                handlePinChat(matchIdStr, 'match', true);
              }}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 z-10"
              title="Unpin chat"
              disabled={isPinning}
            >
              <svg className="w-4 h-4 text-velora-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const renderGroupItem = (group, isPinned = false) => {
    const groupAvatar = getGroupAvatar(group);
    const groupName = getGroupName(group);
    const groupId = group._id?.toString();
    const isPinning = pinningChat === groupId;
    const isCurrentlyPinned = pinnedChats.some(p =>
      p.chatType === 'group' && (p.groupId?._id?.toString() === groupId || p.groupId?.toString() === groupId)
    );
    const lastMessage = group.lastMessage;
    const lastMessageTime = group.lastMessageAt || group.updatedAt;

    return (
      <motion.div
        key={group._id}
        variants={itemVariants}
        whileHover={{ scale: 1.03, x: 8 }}
        whileTap={{ scale: 0.97 }}
        onContextMenu={(e) => handleContextMenu(e, group, 'group')}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const timer = setTimeout(() => {
            handleLongPress(e, group, 'group');
          }, 500);
          e.currentTarget.dataset.timer = timer;
        }}
        onTouchEnd={(e) => {
          const timer = e.currentTarget.dataset.timer;
          if (timer) clearTimeout(timer);
        }}
        className="mb-2"
      >
        <Link
          to={`/group/${group._id}`}
          className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:shadow-md transition-shadow relative group cursor-pointer"
        >
          {groupAvatar ? (
            <img
              src={groupAvatar}
              alt={groupName}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                if (e.target.src !== placeholderImg) {
                  e.target.src = placeholderImg;
                }
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-500 font-semibold text-lg">
                {getInitials(groupName)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-velora-darkGray truncate flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                {groupName}
              </h3>
              {lastMessageTime && (
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatDate(lastMessageTime)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              {lastMessage ? (
                <p className="text-sm text-gray-600 truncate flex-1">
                  {lastMessage.sender?.name || 'Someone'}: {lastMessage.text || 'Sent a message'}
                </p>
              ) : (
                <p className="text-sm text-gray-600 truncate flex-1">
                  {group.memberCount || group.members?.length || 0} {group.memberCount === 1 || group.members?.length === 1 ? 'member' : 'members'}
                  {presence[group._id || group.id || group.groupId]?.onlineCount > 0 && (
                    <span className="text-green-600 font-medium ml-1">
                      ({presence[group._id || group.id || group.groupId].onlineCount} online)
                    </span>
                  )}
                </p>
              )}
              {/* Unread count badge */}
              {group.unreadCount > 0 && (
                <div className="w-6 h-6 bg-velora-primary rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0 ml-2">
                  {group.unreadCount > 9 ? '9+' : group.unreadCount}
                </div>
              )}
            </div>
          </div>
          {/* Action buttons - visible on hover */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {/* Delete button - only for creator */}
            {(group.createdBy?._id?.toString() === user?._id?.toString() ||
              group.createdBy?.toString() === user?._id?.toString()) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteGroup(group._id, groupName);
                }}
                className="p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="Delete Group"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
            {/* Invite button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                  navigate(`/group/${group._id}?action=invite`);
              }}
              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              title="Invite members"
            >
              <UserPlusIcon className="w-4 h-4 text-gray-400 hover:text-velora-primary" />
            </button>
            {/* Pin/Unpin button */}
            {(() => {
              const groupIdStr = group._id?.toString();
              const isPinned = pinnedChats.some(p =>
                p.chatType === 'group' && (p.groupId?._id?.toString() === groupIdStr || p.groupId?.toString() === groupIdStr)
              );
              if (isPinned) {
                return (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePinChat(groupIdStr, 'group', true);
                    }}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Unpin chat"
                    disabled={isPinning}
                  >
                    <svg className="w-4 h-4 text-velora-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </button>
                );
              } else {
                return (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePinChat(groupIdStr, 'group', false);
                    }}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title={pinnedChats.length >= maxPinned ? `Pin limit reached (${maxPinned})` : 'Pin chat'}
                    disabled={isPinning || pinnedChats.length >= maxPinned}
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-velora-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                );
              }
            })()}
            {(() => {
              const groupIdStr = group._id?.toString();
              const isPinned = pinnedChats.some(p =>
                p.chatType === 'group' && (p.groupId?._id?.toString() === groupIdStr || p.groupId?.toString() === groupIdStr)
              );
              if (isPinned) {
                return (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePinChat(groupIdStr, 'group', true);
                    }}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Unpin chat"
                    disabled={isPinning}
                  >
                    <svg className="w-4 h-4 text-velora-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                  </button>
                );
              } else {
                return (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePinChat(groupIdStr, 'group', false);
                    }}
                    className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title={pinnedChats.length >= maxPinned ? `Pin limit reached (${maxPinned})` : 'Pin chat'}
                    disabled={isPinning || pinnedChats.length >= maxPinned}
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-velora-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                );
              }
            })()}
          </div>
        </Link>
      </motion.div>
    );
  };

  // Filter pinned chats by active tab
  const pinnedForTab = activeTab === 'messages'
    ? pinnedChats.filter(p => p.chatType === 'match')
    : pinnedChats.filter(p => p.chatType === 'group');

  // Filter groups by search query and exclude pinned groups
  // Sort groups by lastMessageAt or updatedAt (most recent first)
  const pinnedGroupIds = new Set(
    pinnedChats
      .filter(p => p.chatType === 'group' && p.groupId)
      .map(p => {
        const groupId = p.groupId?._id?.toString() || p.groupId?.toString() || p.groupId?.id?.toString();
        return groupId;
      })
      .filter(Boolean)
  );

  const sortedGroups = [...groups].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const filteredGroups = sortedGroups.filter(group => {
    // Filter out pinned groups
    const groupId = group._id?.toString() || group.id?.toString() || group.groupId?.toString();
    if (pinnedGroupIds.has(groupId)) {
      return false;
    }

    // Apply search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const groupName = getGroupName(group).toLowerCase();
    return groupName.includes(query);
  });

  // Filter matches by search query
  const filteredMatches = matches.filter(match => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const otherUser = match.user || match.otherUser || {};
    const displayName = getUserName(otherUser).toLowerCase();
    return displayName.includes(query);
  });

  const handleCreateGroupSuccess = (newGroup) => {
    // Switch to groups tab if not already there
    if (activeTab !== 'groups') {
      setActiveTab('groups');
    }

    // Optimistically add the new group to the list immediately
    if (newGroup && newGroup._id) {
      // Ensure the group has the expected structure
      const formattedGroup = {
        ...newGroup,
        _id: newGroup._id,
        name: newGroup.name || '',
        members: newGroup.members || [],
        memberCount: newGroup.members?.length || 0,
        lastMessage: null,
        lastMessageAt: null,
        updatedAt: newGroup.updatedAt || newGroup.createdAt || new Date(),
        createdAt: newGroup.createdAt || new Date(),
      };

      // Groups are managed by GroupsContext - it will handle the new group via real-time events
      // No need to manually add it here
    }

    // GroupsContext will automatically pick up the new group via real-time events
    // No need to reload manually
  };

  return (
    <div className="relative">
      {/* Messages / Groups Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex gap-2 px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('messages');
              setSearchQuery('');
            }}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === 'messages'
                ? 'bg-velora-primary text-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => {
              setActiveTab('groups');
              setSearchQuery('');
              // The useEffect will handle loading groups when tab switches
            }}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === 'groups'
                ? 'bg-velora-primary text-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Groups
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'messages' ? 'Search messages...' : 'Search groups...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary text-sm"
            />
          </div>
        </div>

        {/* Create Group Button (Groups tab only) */}
        {activeTab === 'groups' && (() => {
          const canCreate = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);
          return (
            <div className="px-4 pb-2 space-y-2">
              {canCreate ? (
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Group
                </button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 text-center mb-2">
                    <strong>Premium Required</strong> for male users to create groups
                  </p>
                  <p className="text-xs text-yellow-700 text-center mb-2">
                    Only premium male users and all female users can create groups
                  </p>
                  <button
                    onClick={() => window.location.href = '/subscriptions'}
                    className="w-full px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <motion.div
        className="space-y-6 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          marginTop: 0,
          paddingTop: '0.5rem',
          marginBottom: 0,
          paddingBottom: 0,
        }}
      >
        {/* Pinned Chats Section (filtered by tab) */}
        {pinnedForTab.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                Pinned
                {pinnedChats.length >= maxPinned && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">
                    {pinnedChats.length}/{maxPinned}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setPinnedSectionExpanded(!pinnedSectionExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700"
                aria-label={pinnedSectionExpanded ? 'Collapse pinned' : 'Expand pinned'}
              >
                {pinnedSectionExpanded ? '−' : '+'}
              </button>
            </div>
            {pinnedSectionExpanded && (
              <div className="space-y-2">
                {pinnedForTab.map(pinnedChat => renderPinnedChatItem(pinnedChat))}
              </div>
            )}
          </div>
        )}

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
              Invitations
            </h2>
            {invitations.map((invitation) => {
              const group = invitation.groupId;
              const invitedBy = invitation.invitedBy;
              const invitationId = invitation._id?.toString() || `inv-${Math.random()}`;
              return (
                <motion.div
                  key={invitationId}
                  variants={itemVariants}
                  className="p-4 bg-white rounded-2xl"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={group?.avatar || placeholderImg}
                      alt={group?.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        if (e.target.src !== placeholderImg) {
                          e.target.src = placeholderImg;
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-velora-darkGray truncate">
                        {group?.name}
                      </h3>
                      {invitedBy && (
                        <p className="text-xs text-gray-500 truncate">
                          Invited by {invitedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user?.isPremium) {
                          toast.error('Premium membership required to join groups. Please upgrade to accept invitations.');
                          return;
                        }
                        handleAcceptInvitation(group._id);
                      }}
                      disabled={!user?.isPremium}
                      className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {user?.isPremium ? 'Accept' : 'Premium Required'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeclineInvitation(group._id);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'messages' ? (
          /* Individual Matches Section */
          loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredMatches.length > 0 ? (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                Messages {searchQuery && `(${filteredMatches.length})`}
              </h2>
            {filteredMatches.map((match) => {
              const otherUser = match.user || match.otherUser || {};
              const profile = otherUser.profile || otherUser.Profile || {};

              // Use safe helper functions
              const primaryPhoto = getUserAvatar(otherUser, profile);
              const displayName = getUserName(otherUser);

              const matchId = match.matchId || match._id;
              const userId = otherUser.id || otherUser._id;
              const matchIdStr = matchId?.toString() || match._id?.toString();

              const matchIdKey = match._id?.toString() || match.matchId?.toString() || `match-${Math.random()}`;
              return (
                <motion.div
                  key={matchIdKey}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, x: 8 }}
                  whileTap={{ scale: 0.97 }}
                  onContextMenu={(e) => handleContextMenu(e, match, 'match')}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const timer = setTimeout(() => {
                      handleLongPress(e, match, 'match');
                    }, 500);
                    e.currentTarget.dataset.timer = timer;
                  }}
                  onTouchEnd={(e) => {
                    const timer = e.currentTarget.dataset.timer;
                    if (timer) clearTimeout(timer);
                  }}
                  className="mb-2"
                  >
                  <div className="relative group">
                    <Link
                      to={`/chat/${matchId || userId}`}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl hover:shadow-md transition-shadow"
                    >
                    {primaryPhoto ? (
                      <img
                        src={primaryPhoto}
                        alt={displayName}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
                            e.target.src = placeholderImg;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 font-semibold text-lg">
                          {getInitials(displayName)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-velora-darkGray truncate">
                            {displayName}
                          </h3>
                          <PremiumBadge
                            isPremium={otherUser.isPremium || otherUser.userId?.isPremium}
                            placement="inline"
                            size="sm"
                          />
                          {match.autoReplyRequiresSubscription && !match.hiddenForRecipient && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wide">
                              Auto
                            </span>
                          )}
                        </div>
                        {match.lastMessageAt && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDate(match.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${match.hiddenForRecipient ? 'text-gray-400 italic flex items-center gap-1' : 'text-gray-600'}`}>
                        {match.hiddenForRecipient ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Locked — Subscribe to view
                          </>
                        ) : (
                          match.lastMessage?.text || 'New match!'
                        )}
                      </p>
                    </div>
                    {match.unreadCount > 0 && (
                      <div className="w-6 h-6 bg-velora-primary rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                        {match.unreadCount > 9 ? '9+' : match.unreadCount}
                      </div>
                    )}
                    </Link>
                    {/* Pin button - visible on hover */}
                    {(() => {
                      const matchIdStr = matchId?.toString() || match._id?.toString();
                      const isPinned = pinnedChats.some(p =>
                        p.chatType === 'match' && (p.matchId?._id?.toString() === matchIdStr || p.matchId?.toString() === matchIdStr)
                      );
                      if (!isPinned) {
                        return (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePinChat(matchIdStr, 'match', false);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 z-10"
                            title={pinnedChats.length >= maxPinned ? `Pin limit reached (${maxPinned})` : 'Pin chat'}
                            disabled={pinningChat === matchIdStr || pinnedChats.length >= maxPinned}
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-velora-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>
              );
            })}
          </div>
          ) : (
            <EmptyState
              icon={ChatBubbleLeftRightIcon}
              title={searchQuery ? "No messages found" : "No messages yet"}
              message={searchQuery ? "Try a different search term" : "Match with someone to start chatting!"}
            />
          )
        ) : (
          /* Groups Section */
          (loading || groupsLoading) ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                Groups {searchQuery && `(${filteredGroups.length})`}
              </h2>
              <div className="space-y-6">
                {filteredGroups.map(group => renderGroupItem(group, false))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={UserGroupIcon}
              title={searchQuery ? "No groups found" : "No groups yet"}
              message={searchQuery ? "Try a different search term" : "Create your first group to start chatting with multiple people!"}
              action={!searchQuery ? (
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="mt-4 px-6 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Group
                </button>
              ) : undefined}
            />
          )
        )}
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[150px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                const item = contextMenu.item;
                const chatType = contextMenu.chatType;
                let threadId, isPinned;

                if (chatType === 'group') {
                  threadId = item._id?.toString();
                  isPinned = pinnedChats.some(p =>
                    p.chatType === 'group' && (p.groupId?._id?.toString() === threadId || p.groupId?.toString() === threadId)
                  );
                } else {
                  threadId = item._id?.toString() || item.matchId?.toString();
                  isPinned = pinnedChats.some(p =>
                    p.chatType === 'match' && (p.matchId?._id?.toString() === threadId || p.matchId?.toString() === threadId)
                  );
                }

                handlePinChat(threadId, chatType, isPinned);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              disabled={pinningChat === (contextMenu.item._id?.toString() || contextMenu.item.matchId?.toString())}
              title={pinnedChats.length >= maxPinned ? `Pin limit reached (${maxPinned})` : 'Pin or unpin this chat'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              {(() => {
                const item = contextMenu.item;
                const chatType = contextMenu.chatType;
                let threadId;
                if (chatType === 'group') {
                  threadId = item._id?.toString();
                } else {
                  threadId = item._id?.toString() || item.matchId?.toString();
                }
                const isPinned = pinnedChats.some(p => {
                  if (chatType === 'group') {
                    return p.chatType === 'group' && (p.groupId?._id?.toString() === threadId || p.groupId?.toString() === threadId);
                  } else {
                    return p.chatType === 'match' && (p.matchId?._id?.toString() === threadId || p.matchId?.toString() === threadId);
                  }
                });
                return isPinned ? 'Unpin Chat' : 'Pin Chat';
              })()}
            </button>
            {contextMenu.chatType === 'group' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/group/${contextMenu.item._id}`);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <InformationCircleIcon className="w-4 h-4" />
                View Info
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={handleCreateGroupSuccess}
      />
    </div>
  );
}
