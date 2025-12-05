import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import { UsersIcon, ChatBubbleLeftRightIcon, UserPlusIcon, XMarkIcon, TrashIcon, KeyIcon, LockClosedIcon, InformationCircleIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { groupService } from '../services/groupService';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../contexts/GroupsContext';
import { matchService } from '../services/matchService';
import { getSocket } from '../services/socketService';
import PremiumBadge from '../components/common/PremiumBadge';
import { formatDate, formatMessageTimestamp, getPlaceholderImage, getInitials } from '../utils/helpers';

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    groups,
    groupMessages,
    loadGroupMessages,
    updateGroup,
    subscribeToGroup,
    presence,
    typing,
    sendTypingIndicator,
    loadGroups,
    addMessageOptimistically,
    removeOptimisticMessage,
  } = useGroups();
  const [group, setGroup] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  // Check if user can create/join groups
  const canCreateOrJoin = currentUser?.gender === 'female' || (currentUser?.gender === 'male' && currentUser?.isPremium === true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserIds, setInviteUserIds] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [sending, setSending] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPasskey, setJoinPasskey] = useState('');
  const [joining, setJoining] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get messages from context - normalize groupId for key matching
  const normalizedGroupId = groupId?.toString();
  // Ensure we always get an array, even if the key doesn't exist yet
  const messages = (normalizedGroupId && groupMessages && groupMessages[normalizedGroupId])
    ? (Array.isArray(groupMessages[normalizedGroupId]) ? groupMessages[normalizedGroupId] : [])
    : [];

  // Debug logging - more detailed
  useEffect(() => {
    if (normalizedGroupId) {
      console.debug('GroupDetails Debug:', {
        groupId: normalizedGroupId,
        isMember,
        loading,
        messagesCount: messages.length,
        groupExists: !!group,
        groupInContext: groups.some(g => {
          const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
          return gId === normalizedGroupId;
        }),
      });
    }
  }, [normalizedGroupId, groupMessages, messages, isMember, loading, group, canCreateOrJoin, groups]);

  // Sync group from context or load if not available
  useEffect(() => {
    if (!groupId) {
      console.debug('No groupId provided');
      return;
    }

    console.debug('Checking for group in context...', { groupId, groupsCount: groups.length });

    const contextGroup = groups.find(g => {
      const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
      return gId === groupId?.toString();
    });

    if (contextGroup) {
      console.debug('Group found in context, setting up...', contextGroup);
      setGroup(contextGroup);
      // If group is in joinedGroups context, user is definitely a member
      setIsMember(true); // Groups in context are joined groups
      const creator = contextGroup.createdBy?.id || contextGroup.createdBy?._id;
      setIsCreator(creator === currentUser?._id);
      setLoading(false);
      // Load messages and subscribe since user is a member
      if (normalizedGroupId) {
        // Subscribe to real-time updates first
        console.debug('Subscribing to group:', normalizedGroupId);
        subscribeToGroup(normalizedGroupId);
        // Load messages immediately with retry logic
        const loadMessagesWithRetry = async (retries = 3) => {
          try {
            console.debug('Loading messages for group:', normalizedGroupId);
            const loadedMessages = await loadGroupMessages(normalizedGroupId, 50);
            console.debug('Messages loaded:', loadedMessages?.length || 0);
            setMessagesLoaded(true);
            if (loadedMessages && loadedMessages.length > 0) {
              // Messages loaded successfully
            }
            setTimeout(() => scrollToBottom(), 300);
          } catch (error) {
            console.error('Error loading messages:', error);
            // Error loading messages - retry if attempts remaining
            if (retries > 0) {
              console.debug(`Retrying message load, ${retries} attempts remaining`);
              setTimeout(() => loadMessagesWithRetry(retries - 1), 1000);
            } else {
              toast.error('Failed to load messages. Please refresh.');
            }
          }
        };
        loadMessagesWithRetry();
        loadGroupMembers();
      }
    } else {
      // Not in context - need to check server for membership
      console.debug('Group not in context, loading from server...');
      loadGroupDetails();
    }
  }, [groupId, groups, currentUser?._id, normalizedGroupId, subscribeToGroup, loadGroupMessages]);

  // Subscribe to real-time updates when group is loaded and user is a member
  // Note: Messages are loaded in the sync effect above, this just ensures subscription
  useEffect(() => {
    if (normalizedGroupId && isMember && !loading && group) {
      subscribeToGroup(normalizedGroupId);
    }
  }, [normalizedGroupId, isMember, loading, group, subscribeToGroup]);

  // Set up real-time message listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !groupId) return;

    const handleNewMessage = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        // Messages are already handled by GroupsContext
        // Scroll to bottom when new message arrives
        scrollToBottom();
      }
    };

    const handleMemberJoined = (data) => {
      if (data.groupId?.toString() === groupId?.toString() && isMember) {
        // Reload members when someone joins
        loadGroupMembers();
      }
    };

    const handleMemberLeft = (data) => {
      if (data.groupId?.toString() === groupId?.toString() && isMember) {
        // Reload members when someone leaves
        loadGroupMembers();
      }
    };

    socket.on('group:new-message', handleNewMessage);
    socket.on('group:member-joined', handleMemberJoined);
    socket.on('group:member-left', handleMemberLeft);

    return () => {
      socket.off('group:new-message', handleNewMessage);
      socket.off('group:member-joined', handleMemberJoined);
      socket.off('group:member-left', handleMemberLeft);
    };
  }, [groupId, isMember]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const loadGroupDetails = async () => {
    try {
      console.debug('Loading group details from server...', groupId);
      setLoading(true);
      const response = await groupService.getGroupDetails(groupId);
      console.debug('Group details response:', response);
      const groupData = response.group || response.data;
      if (!groupData) {
        console.error('No group data in response');
        toast.error('Group not found');
        navigate('/groups');
        return;
      }
      setGroup(groupData);

      // Check membership: server returns isMember field, or check if group is in joinedGroups
      const memberStatus = groupData.isMember !== undefined
        ? groupData.isMember
        : groups.some(g => {
            const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
            return gId === groupId?.toString();
          });
      
      console.debug('Member status:', memberStatus, { isMember: groupData.isMember, inGroups: groups.some(g => {
        const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
        return gId === groupId?.toString();
      })});
      
      setIsMember(memberStatus);

      // Check if current user is the creator
      const creator = groupData.createdBy?.id || groupData.createdBy?._id;
      setIsCreator(creator === currentUser?._id);

      // Update group in context
      updateGroup(groupId, groupData);

      // Only load messages and members if user is a member
      if (memberStatus) {
        setIsMember(true);
        const targetGroupId = normalizedGroupId || groupId;
        console.debug('User is member, subscribing and loading messages for:', targetGroupId);
        // Subscribe first, then load messages
        subscribeToGroup(targetGroupId);
        // Load messages immediately with error handling
        try {
          const loadedMessages = await loadGroupMessages(targetGroupId, 50);
          console.debug('Messages loaded in loadGroupDetails:', loadedMessages?.length || 0);
          setMessagesLoaded(true);
          if (loadedMessages && loadedMessages.length > 0) {
            // Messages loaded successfully
          }
          loadGroupMembers();
          // Scroll to bottom after messages load
          setTimeout(() => scrollToBottom(), 300);
        } catch (msgError) {
          console.error('Error loading messages in loadGroupDetails:', msgError);
          toast.error('Failed to load messages. Please try again.');
        }
      } else {
        console.debug('User is not a member');
        setIsMember(false);
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load group details';
      toast.error(errorMessage);
      if (error.response?.status === 404) {
        navigate('/groups');
      }
    } finally {
      setLoading(false);
      console.debug('Loading complete, isMember:', isMember);
    }
  };

  const loadGroupMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await groupService.getGroupMembers(groupId);
      if (response.success && response.members) {
        setMembers(response.members);
      }
    } catch (error) {
      // Don't show error toast for members, it's not critical
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await matchService.getMatchList();
      if (response.success && response.matches) {
        setMatches(response.matches || []);
      }
    } catch (error) {
      }
  };

  const handleInvite = async () => {
    if (selectedInvitees.length === 0 && !inviteUserIds.trim()) {
      toast.error('Please select users or enter user IDs to invite');
      return;
    }

    try {
      setInviting(true);
      let userIds = [...selectedInvitees];

      // Parse user IDs from text input (comma or newline separated)
      if (inviteUserIds.trim()) {
        const parsedIds = inviteUserIds
          .split(/[,\n]/)
          .map(id => id.trim())
          .filter(id => id.length > 0);
        userIds = [...userIds, ...parsedIds];
      }

      // Remove duplicates
      userIds = [...new Set(userIds)];

      // Send invitations via chat to each user
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const userId of userIds) {
        try {
          await groupService.sendGroupInviteViaChat(groupId, userId);
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = error.response?.data?.message || `Failed to invite user ${userId}`;
          errors.push(errorMsg);
        }
      }

      // Reload groups after inviting to update the list
      if (successCount > 0) {
        setTimeout(() => loadGroups(), 500);
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} invitation(s) via chat!`);
      }
      if (errorCount > 0) {
        errors.forEach(err => toast.error(err, { duration: 3000 }));
      }

      // Close modal and reset
      if (successCount > 0) {
        setShowInviteModal(false);
        setInviteUserIds('');
        setSelectedInvitees([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  const toggleInvitee = (userId) => {
    setSelectedInvitees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleJoinGroup = async () => {
    if (!joinPasskey.trim()) {
      toast.error('Please enter the passkey');
      return;
    }

    try {
      setJoining(true);
      const response = await groupService.joinGroup(groupId, joinPasskey.trim());
      if (response.success) {
        toast.success('Successfully joined the group!');
        setShowJoinModal(false);
        setJoinPasskey('');
        // Reload group details to show member status
        await loadGroupDetails();
        // Reload groups list
        loadGroups();
        // Load members now that user is a member
        loadGroupMembers();
        // Load messages now that user is a member
        const loadedMessages = await loadGroupMessages(groupId, 20);
        // Scroll to bottom after messages load
        setTimeout(() => scrollToBottom(), 300);
      }
    } catch (error) {
      // Handle 403 - Premium required
      if (error.response?.status === 403 && error.response?.data?.code === 'PREMIUM_REQUIRED') {
        toast.error('Only premium male users and all female users can join groups. Please upgrade to premium.');
        setShowJoinModal(false);
        setTimeout(() => navigate('/subscriptions'), 2000);
        return;
      }

      const errorMessage = error.response?.data?.message || 'Failed to join group';
      toast.error(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone and will delete all messages and members.')) {
      return;
    }

    try {
      setDeleting(true);
      await groupService.deleteGroup(groupId);
      toast.success('Group deleted successfully!');
      navigate('/groups');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newMessage.trim()) {
      return; // Empty message, do nothing
    }
    
    if (sending) {
      return; // Already sending, prevent duplicate sends
    }
    
    if (!normalizedGroupId) {
      toast.error('Group ID not found. Please refresh the page.');
      return;
    }
    
    if (!isMember) {
      toast.error('You must be a member to send messages');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Create optimistic message
    const optimisticMessage = {
      _id: `temp-${Date.now()}-${Math.random()}`,
      messageId: `temp-${Date.now()}-${Math.random()}`,
      id: `temp-${Date.now()}-${Math.random()}`,
      text: messageText,
      message: messageText,
      sender: { _id: currentUser._id, name: currentUser.name },
      senderId: currentUser._id,
      senderName: currentUser.name,
      messageType: 'text',
      isSystemMessage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _optimistic: true, // Mark as optimistic
    };

    // Add optimistic message to UI immediately via context
    addMessageOptimistically(normalizedGroupId, optimisticMessage);
    scrollToBottom();

    try {
      setSending(true);
      const response = await groupService.sendGroupMessage(normalizedGroupId, messageText);
      
      if (response.success && response.data) {
        // Replace optimistic message with server response
        const serverMessage = {
          _id: response.data._id || response.data.messageId || response.data.id,
          messageId: response.data._id || response.data.messageId || response.data.id,
          id: response.data._id || response.data.messageId || response.data.id,
          text: response.data.text || response.data.message || messageText,
          message: response.data.message || response.data.text || messageText,
          sender: response.data.sender || { _id: currentUser._id, name: currentUser.name },
          senderId: response.data.senderId || currentUser._id,
          senderName: response.data.sender?.name || currentUser.name,
          messageType: response.data.messageType || 'text',
          isSystemMessage: response.data.isSystemMessage || false,
          createdAt: response.data.createdAt || new Date(),
          updatedAt: response.data.updatedAt || new Date(),
        };

        // Replace optimistic message with server message via context
        // Remove optimistic first
        removeOptimisticMessage(normalizedGroupId, optimisticMessage._id);
        // Add server message (socket might have already added it, but this ensures it's there)
        addMessageOptimistically(normalizedGroupId, serverMessage);
        scrollToBottom();
      } else {
        // Remove optimistic message on failure
        removeOptimisticMessage(normalizedGroupId, optimisticMessage._id);
        toast.error(response.message || 'Failed to send message');
        setNewMessage(messageText); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      removeOptimisticMessage(normalizedGroupId, optimisticMessage._id);
      
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 1500);
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to send messages to this group.');
      } else if (error.response?.status === 422) {
        toast.error('Invalid message. Please check your input.');
      } else {
        toast.error(errorMessage);
      }
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    // Send typing indicator (use normalized groupId)
    if (e.target.value.trim() && normalizedGroupId) {
      sendTypingIndicator(normalizedGroupId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator every 2 seconds while typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(normalizedGroupId);
      }, 2000);
    }
  };

  // Get typing users for this group (use normalized groupId)
  const typingUsers = (normalizedGroupId && typing[normalizedGroupId]) || {};
  const typingUserIds = Object.keys(typingUsers).filter(userId => {
    const timestamp = typingUsers[userId];
    return Date.now() - timestamp < 3000; // Only show if typed within last 3 seconds
  });

  // Get presence info for this group (use normalized groupId)
  const groupPresence = (normalizedGroupId && presence[normalizedGroupId]) || {};
  const onlineCount = groupPresence.onlineCount || 0;

  // Get user avatar helper
  const getUserAvatar = (user) => {
    if (user?.photo) return user.photo;
    if (user?.photos && user.photos.length > 0) {
      const primary = user.photos.find(p => p.isPrimary);
      if (primary) return primary.url || primary;
      return user.photos[0]?.url || user.photos[0];
    }
    return null;
  };

  // Get user name helper
  const getUserName = (user) => {
    return user?.name || user?.user?.name || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-velora-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-velora-primary text-white rounded-lg hover:opacity-90"
          >
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      {group && (
        <>
          {/* Compact Group Header - Fixed at top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-velora-primary/10 via-purple-50 to-pink-50 shadow-lg border-b-2 border-velora-primary/20 px-4 py-3 flex-shrink-0"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-velora-primary to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0">
                  {(group.name || group.groupName)?.charAt(0)?.toUpperCase() || 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{group.name || group.groupName}</h1>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <UsersIcon className="w-3 h-3" />
                      <span className="font-semibold">{group.memberCount || group.members?.length || 0} members</span>
                      {onlineCount > 0 && (
                        <span className="text-green-600 font-medium ml-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          {onlineCount} online
                        </span>
                      )}
                    </div>
                    {group.privacy && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <ShieldCheckIcon className="w-3 h-3" />
                        <span className="capitalize">{group.privacy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {isMember && (isCreator || canCreateOrJoin) && (
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {(isCreator || canCreateOrJoin) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowInviteModal(true);
                        loadMatches();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-velora-primary text-black rounded-lg hover:opacity-90 transition font-semibold text-sm shadow-md"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Invite</span>
                    </motion.button>
                  )}
                  {isCreator && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteGroup}
                      disabled={deleting}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-sm shadow-md"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{deleting ? 'Deleting...' : 'Delete'}</span>
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Content Area - Full Screen */}
          <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
              {/* Group Members Sidebar - Always Visible */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 shadow-lg flex-shrink-0"
              >
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-velora-primary/10 via-purple-50 to-pink-50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-velora-primary" />
                    Members ({members.length || 0})
                  </h2>
                  {group.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{group.description}</p>
                  )}
                  {group.createdBy && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <span>Created by</span>
                      <span className="font-semibold text-gray-900">{group.createdBy.name}</span>
                      <PremiumBadge
                        isPremium={group.createdBy.isPremium}
                        placement="inline"
                        size="xs"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loadingMembers ? (
                    <div className="text-center py-8 text-gray-500">Loading members...</div>
                  ) : members.length > 0 ? (
                    <div className="space-y-2">
                      {members.map((member) => {
                          const memberUser = member.user || member;
                          const memberId = memberUser._id || memberUser.id || member.userId;
                          const memberName = getUserName(memberUser);
                          const memberAvatar = getUserAvatar(memberUser);
                          const isOwner = member.role === 'owner' || member.role === 'admin';
                          const isCurrentUser = memberId?.toString() === currentUser?._id?.toString();
                          const placeholderImg = getPlaceholderImage(40, 40, getInitials(memberName));

                        return (
                          <motion.div
                            key={memberId}
                            whileHover={{ scale: 1.02, x: 2 }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-velora-primary/5 hover:to-purple-50 transition-all cursor-pointer border border-transparent hover:border-velora-primary/20"
                          >
                            <div className="relative">
                              {memberAvatar ? (
                                <img
                                  src={memberAvatar}
                                  alt={memberName}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-velora-primary/30 shadow-md"
                                  onError={(e) => {
                                    if (e.target.src !== placeholderImg) {
                                      e.target.src = placeholderImg;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-velora-primary to-purple-500 flex items-center justify-center text-white font-bold border-2 border-velora-primary/30 shadow-md">
                                  {getInitials(memberName)}
                                </div>
                              )}
                              {presence[groupId]?.onlineUsers?.includes(memberId?.toString()) && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900 truncate text-sm">
                                  {memberName}
                                  {isCurrentUser && <span className="text-velora-primary ml-1">(You)</span>}
                                </p>
                                {isOwner && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
                                    {member.role === 'owner' ? '👑 Owner' : '⭐ Admin'}
                                  </span>
                                )}
                                <PremiumBadge
                                  isPremium={memberUser.isPremium || memberUser.user?.isPremium}
                                  placement="inline"
                                  size="xs"
                                />
                              </div>
                              {memberUser.bio && (
                                <p className="text-xs text-gray-600 truncate mt-1">{memberUser.bio}</p>
                              )}
                              {member.joinedAt && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Joined {formatDate(member.joinedAt)}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No members found
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Mobile Members Toggle Button */}
              <div className="lg:hidden fixed bottom-20 right-4 z-30">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMembers(!showMembers)}
                  className="w-14 h-14 bg-gradient-to-r from-velora-primary to-purple-500 text-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <UsersIcon className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Mobile Members Sidebar with Backdrop */}
              <AnimatePresence>
                {showMembers && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowMembers(false)}
                      className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    />
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="lg:hidden fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
                      style={{ top: '60px' }}
                    >
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-velora-primary/5 to-purple-50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-velora-primary" />
                      Members
                    </h2>
                    <button
                      onClick={() => setShowMembers(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingMembers ? (
                      <div className="text-center py-8 text-gray-500">Loading members...</div>
                    ) : members.length > 0 ? (
                      <div className="space-y-2">
                        {members.map((member) => {
                          const memberUser = member.user || member;
                          const memberId = memberUser._id || memberUser.id || member.userId;
                          const memberName = getUserName(memberUser);
                          const memberAvatar = getUserAvatar(memberUser);
                          const isOwner = member.role === 'owner' || member.role === 'admin';
                          const isCurrentUser = memberId?.toString() === currentUser?._id?.toString();
                          const placeholderImg = getPlaceholderImage(40, 40, getInitials(memberName));

                          return (
                            <motion.div
                              key={memberId}
                              whileHover={{ scale: 1.02, x: 2 }}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-velora-primary/5 hover:to-purple-50 transition-all"
                            >
                              <div className="relative">
                                {memberAvatar ? (
                                  <img
                                    src={memberAvatar}
                                    alt={memberName}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-velora-primary/30 shadow-md"
                                    onError={(e) => {
                                      if (e.target.src !== placeholderImg) {
                                        e.target.src = placeholderImg;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-velora-primary to-purple-500 flex items-center justify-center text-white font-bold border-2 border-velora-primary/30 shadow-md">
                                    {getInitials(memberName)}
                                  </div>
                                )}
                                {presence[groupId]?.onlineUsers?.includes(memberId?.toString()) && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 truncate text-sm">
                                    {memberName}
                                    {isCurrentUser && <span className="text-velora-primary ml-1">(You)</span>}
                                  </p>
                                  {isOwner && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
                                      {member.role === 'owner' ? '👑 Owner' : '⭐ Admin'}
                                    </span>
                                  )}
                                  <PremiumBadge
                                    isPremium={memberUser.isPremium || memberUser.user?.isPremium}
                                    placement="inline"
                                    size="xs"
                                  />
                                </div>
                                {memberUser.bio && (
                                  <p className="text-xs text-gray-600 truncate mt-1">{memberUser.bio}</p>
                                )}
                                {member.joinedAt && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Joined {formatDate(member.joinedAt)}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No members found
                      </div>
                    )}
                  </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Chat Section - Full Height */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-velora-primary/10 via-purple-50 to-pink-50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="w-6 h-6 text-velora-primary" />
                        Group Chat
                      </h2>
                      {group.description && (
                        <p className="text-sm text-gray-600 hidden lg:block truncate max-w-md">{group.description}</p>
                      )}
                    </div>
                    {group.privacy === 'private' && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
                        <LockClosedIcon className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white"
                    style={{
                      minHeight: '300px',
                      maxHeight: 'calc(100vh - 300px)',
                      height: '100%',
                      overflowY: 'auto',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                      {!isMember ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          {canCreateOrJoin ? (
                            <>
                              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mb-4" />
                              <p className="text-gray-500 text-lg font-medium mb-2">Join to View Messages</p>
                              <p className="text-gray-400 text-sm mb-6">You need to join this group to view and send messages.</p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowJoinModal(true)}
                                className="px-8 py-3 bg-gradient-to-r from-velora-primary to-purple-500 text-white rounded-xl hover:opacity-90 transition font-semibold shadow-lg"
                              >
                                Join Group
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <LockClosedIcon className="w-16 h-16 text-gray-400 mb-4" />
                              <p className="text-gray-500 text-lg font-medium mb-2">Premium Required</p>
                              <p className="text-gray-400 text-sm mb-6">
                                Only premium male users and all female users can join groups. Upgrade to premium to join this group and start chatting.
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/subscriptions')}
                                className="px-8 py-3 bg-gradient-to-r from-velora-primary to-purple-500 text-white rounded-xl hover:opacity-90 transition font-semibold shadow-lg"
                              >
                                Upgrade to Premium
                              </motion.button>
                            </>
                          )}
                        </div>
                      ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-velora-primary mb-4"></div>
                          <p className="text-gray-500 text-lg font-medium">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-gray-500 text-lg font-medium">No messages yet</p>
                          <p className="text-gray-400 text-sm mt-2">Start the conversation by sending a message below!</p>
                        </div>
                      ) : (
                        <div className="space-y-6 w-full">
                          {messages.map((msg, idx) => {
                            const isSystemMessage = msg.isSystemMessage || msg.messageType === 'system';
                            const senderId = msg.sender?._id || msg.sender?.id || msg.senderId;
                            const isCurrentUserMessage = senderId?.toString() === currentUser?._id?.toString();
                            const senderName = msg.sender?.name || msg.senderName || 'Unknown';
                            const senderAvatar = getUserAvatar(msg.sender);
                            const placeholderImg = getPlaceholderImage(40, 40, getInitials(senderName));
                            const prevMessage = idx > 0 ? messages[idx - 1] : null;
                            const showSenderInfo = !prevMessage ||
                              prevMessage.sender?._id?.toString() !== senderId?.toString() ||
                              (msg.createdAt && prevMessage?.createdAt && new Date(msg.createdAt) - new Date(prevMessage.createdAt) > 300000);

                            if (isSystemMessage) {
                              return (
                                <div key={msg._id || msg.messageId || msg.id || `system-${idx}`} className="flex items-center justify-center py-2 w-full">
                                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {msg.text || msg.message || 'System message'}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <motion.div
                                key={msg._id || msg.messageId || msg.id || `msg-${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 mb-2 ${isCurrentUserMessage ? 'flex-row-reverse' : ''}`}
                              >
                                {showSenderInfo && (
                                  <div className="flex-shrink-0">
                                    {senderAvatar ? (
                                      <img
                                        src={senderAvatar}
                                        alt={senderName}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-velora-primary/30"
                                        onError={(e) => {
                                          if (e.target.src !== placeholderImg) {
                                            e.target.src = placeholderImg;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-velora-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-velora-primary/30">
                                        {getInitials(senderName)}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!showSenderInfo && <div className="w-10"></div>}

                                <div className={`flex-1 ${isCurrentUserMessage ? 'flex flex-col items-end' : ''}`}>
                                  {showSenderInfo && (
                                    <div className={`flex items-center gap-2 mb-1 ${isCurrentUserMessage ? 'flex-row-reverse' : ''}`}>
                                      <span className="font-semibold text-sm text-gray-900">{senderName}</span>
                                      {msg.createdAt && (
                                        <span className="text-xs text-gray-500">
                                          {formatMessageTimestamp(msg.createdAt)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div
                                    className={`inline-block max-w-[75%] rounded-2xl px-4 py-2 ${
                                      isCurrentUserMessage
                                        ? 'bg-gradient-to-r from-velora-primary to-purple-500 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {msg.text || msg.message}
                                    </p>
                                    {msg.imageUrl && (
                                      <img
                                        src={msg.imageUrl}
                                        alt="Shared image"
                                        className="mt-2 rounded-lg max-w-full h-auto"
                                      />
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}

                      {/* Typing indicator */}
                      {typingUserIds.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-sm text-gray-500 italic pl-13"
                        >
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          </div>
                          {typingUserIds.length === 1 ? 'Someone is typing...' : `${typingUserIds.length} people are typing...`}
                        </motion.div>
                      )}
                  </div>

                  {/* Message Composer - Only show for members */}
                  {!loading && isMember ? (
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex-shrink-0 z-10">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={handleMessageChange}
                          placeholder="Type a message..."
                          disabled={sending || !normalizedGroupId}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-900"
                          autoFocus={false}
                          aria-label="Type a message"
                        />
                        <motion.button
                          type="submit"
                          disabled={sending || !newMessage.trim() || !normalizedGroupId}
                          whileHover={!sending && newMessage.trim() && normalizedGroupId ? { scale: 1.05 } : {}}
                          whileTap={!sending && newMessage.trim() && normalizedGroupId ? { scale: 0.95 } : {}}
                          className="px-6 py-3 bg-gradient-to-r from-velora-primary to-purple-500 text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md flex-shrink-0"
                          aria-label="Send message"
                        >
                          {sending ? 'Sending...' : 'Send'}
                        </motion.button>
                      </div>
                    </form>
                  ) : !loading && !isMember ? (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-gray-500 text-sm">
                      Join the group to send messages
                    </div>
                  ) : null}
                </motion.div>
              </div>
            </div>

            {/* Join Group Modal */}
            {showJoinModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <KeyIcon className="w-6 h-6 text-yellow-500" />
                      Enter Passkey to Join
                    </h3>
                    <button
                      onClick={() => {
                        setShowJoinModal(false);
                        setJoinPasskey('');
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
                    <label htmlFor="join-passkey-input" className="block text-sm font-semibold text-gray-700 mb-2">
                      Passkey
                    </label>
                    <input
                      id="join-passkey-input"
                      type="text"
                      value={joinPasskey}
                      onChange={(e) => setJoinPasskey(e.target.value)}
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
                        setShowJoinModal(false);
                        setJoinPasskey('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinGroup}
                      disabled={joining || !joinPasskey.trim()}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining ? 'Joining...' : 'Join Group'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Invite Users to Group</h2>
                      <p className="text-sm text-gray-500 mt-1">Invitations will be sent via chat</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteUserIds('');
                        setSelectedInvitees([]);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1">
                    {/* Invite from Matches */}
                    {matches.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Matches</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {matches.map((match) => {
                            const otherUser = match.user || match;
                            const userId = otherUser._id || otherUser.id;
                            const isSelected = selectedInvitees.includes(userId);
                            return (
                              <motion.button
                                key={userId}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleInvitee(userId)}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                  isSelected
                                    ? 'border-velora-primary bg-velora-primary/10'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-800">
                                      {otherUser.name || 'Unknown User'}
                                    </span>
                                    <PremiumBadge
                                      isPremium={otherUser.isPremium || otherUser.userId?.isPremium}
                                      placement="inline"
                                      size="sm"
                                    />
                                  </div>
                                  {isSelected && (
                                    <span className="text-velora-primary font-semibold">Selected</span>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Manual User ID Input */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Or Enter User IDs</h3>
                      <textarea
                        value={inviteUserIds}
                        onChange={(e) => setInviteUserIds(e.target.value)}
                        placeholder="Enter user IDs separated by commas or new lines&#10;e.g., 507f1f77bcf86cd799439011, 507f191e810c19729de860ea"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent resize-none"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {selectedInvitees.length > 0 && `${selectedInvitees.length} match(es) selected. `}
                        Enter user IDs manually (comma or newline separated)
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteUserIds('');
                        setSelectedInvitees([]);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleInvite}
                      disabled={inviting || (selectedInvitees.length === 0 && !inviteUserIds.trim())}
                      className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                    >
                      {inviting ? 'Inviting...' : 'Send Invites'}
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}
    </div>
  );
}

