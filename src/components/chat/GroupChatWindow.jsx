import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { groupChatService } from '../../services/groupChatService';
import { chatService } from '../../services/chatService';
import { getSocket } from '../../services/socketService';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import IceBreakerStrip from './IceBreakerStrip';
import GroupInfoDrawer from './GroupInfoDrawer';
import PasskeyJoinModal from './PasskeyJoinModal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavBarContext } from '../common/GlobalNavBar';
import { InformationCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { getPlaceholderImage } from '../../utils/helpers';

export default function GroupChatWindow({ groupId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const messagesEndRef = useRef(null);
  const placeholderImg = getPlaceholderImage(100, 100, 'No Photo');

  const {
    setProfileTitle,
    setProfileShowBack,
    setHomeLeftAction,
    setHomeRightAction,
  } = useNavBarContext();

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const response = await groupChatService.getGroupInfo(groupId);
      if (response.success && response.data) {
        setGroup(response.data);
        // Check if current user is a member
        const memberIds = response.data.members?.map(m => m._id?.toString() || m.toString()) || [];
        setIsMember(memberIds.includes(user?._id?.toString()));
      } else {
        toast.error('Failed to load group data');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setIsMember(false);
        toast.error('You do not have access to this group');
      } else if (error.response?.status === 404) {
        toast.error('Group not found. It may have been deleted.');
        navigate('/chat');
      } else {
        toast.error('Failed to load group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await groupChatService.getGroupMessages(groupId);
      if (response.success) {
        setMessages(response.data || []);
        scrollToBottom();
      } else {
        setMessages([]);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Don't show toast here as loadGroupData will handle it
        setMessages([]);
      } else {
        setMessages([]);
      }
    }
  };

  useEffect(() => {
    if (groupId) {
      // EAGER LOADING: Load group data and messages in parallel for faster display
      const loadData = async () => {
        try {
          // Start both requests in parallel
          const [groupDataPromise, messagesPromise] = await Promise.allSettled([
            loadGroupData(),
            loadMessages(), // Load messages immediately, don't wait for group data
          ]);

          // If group data failed but messages succeeded, still show messages
          if (groupDataPromise.status === 'rejected') {
            }

          // If messages failed, retry after group data loads
          if (messagesPromise.status === 'rejected' && groupDataPromise.status === 'fulfilled') {
            setTimeout(() => loadMessages(), 500);
          }
        } catch (error) {
          // Fallback: try sequential loading
          await loadGroupData();
          loadMessages();
        }
      };

      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !groupId) return;

    // Join group room for real-time updates
    socket.emit('join-group', groupId);

    const handleNewMessage = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        setMessages(prev => {
          // Avoid duplicates - check by _id
          const messageId = data.message?._id?.toString();
          if (!messageId) return prev; // Skip if no valid ID

          const exists = prev.some(m => {
            const existingId = m._id?.toString();
            return existingId && existingId === messageId;
          });

          if (exists) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    };

    const handleMemberJoined = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        // Update group data immediately with new member info
        if (data.group) {
          setGroup(prev => prev ? { ...prev, ...data.group } : data.group);
        } else {
          loadGroupData(); // Fallback: reload group to get updated member list
        }
      }
    };

    const handleMemberLeft = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        loadGroupData(); // Reload group to get updated member list
        if (data.userId?.toString() === user?._id?.toString()) {
          // User left, redirect to chat list
          navigate('/chat');
        }
      }
    };

    const handleGroupDeleted = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        // Group was deleted, redirect to chat list
        toast.error('This group has been deleted');
        navigate('/chat');
      }
    };

    const handleGroupMembers = (data) => {
      // Handle member updates from group channel
      if (data.groupId?.toString() === groupId?.toString()) {
        if (data.action === 'joined' || data.action === 'left') {
          loadGroupData(); // Reload to get updated member list
        }
      }
    };

    socket.on('group:new-message', handleNewMessage);
    socket.on('group:member-joined', handleMemberJoined);
    socket.on('group:member-left', handleMemberLeft);
    socket.on('group:deleted', handleGroupDeleted);
    socket.on('group:members', handleGroupMembers);

    return () => {
      socket.emit('leave-group', groupId);
      socket.off('group:new-message', handleNewMessage);
      socket.off('group:member-joined', handleMemberJoined);
      socket.off('group:member-left', handleMemberLeft);
      socket.off('group:deleted', handleGroupDeleted);
      socket.off('group:members', handleGroupMembers);
    };
  }, [groupId, user?._id, navigate]);

  // Update navbar
  useEffect(() => {
    if (group) {
      setProfileTitle(null);
      setProfileShowBack(true);

      setHomeLeftAction(
        <div className="flex items-center gap-2 sm:gap-3 ml-2">
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px] flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-gray-400" />
              {group.name}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">
                {group.members?.length || 0} members
              </span>
              {/* Show online count */}
              {group.members && (
                <span className="text-xs text-green-600 font-medium">
                  {group.members.filter(m => m.isOnline === true).length} online
                </span>
              )}
            </div>
          </div>
          {/* Members avatars preview (first 3) */}
          {group.members && group.members.length > 0 && (
            <div className="flex -space-x-2">
              {group.members.slice(0, 3).map((member, idx) => (
                <div key={member._id?.toString() || `member-${idx}`} className="relative">
                  <img
                    src={member.photos?.[0]?.url || getPlaceholderImage(32, 32, member.name)}
                    alt={member.name}
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    title={member.name}
                  />
                  {member.isOnline === true && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
              ))}
              {group.members.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  +{group.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      );

      setHomeRightAction(
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setShowInfoDrawer(true)}
            className="p-2 text-gray-700 hover:bg-amber-100 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Group Info"
            title="Group Info"
          >
            <InformationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      );
    }

    return () => {
      setProfileTitle(null);
      setProfileShowBack(false);
      setHomeLeftAction(null);
      setHomeRightAction(null);
    };
  }, [group, setProfileTitle, setProfileShowBack, setHomeLeftAction, setHomeRightAction]);

  const handleSendMessage = async (text) => {
    if (!isMember) {
      toast.error('You must join this group to send messages');
      return;
    }

    // Premium check: Only premium users can send messages in groups
    if (!user?.isPremium) {
      toast.error('Premium membership required to send messages in groups. Please upgrade to send messages.');
      return;
    }

    try {
      setSending(true);
      const response = await chatService.sendMessage(null, text, groupId);
      if (response.success && response.data) {
        setMessages(prev => {
          // Avoid duplicates - the message might already be added via socket
          const messageId = response.data._id?.toString();
          if (!messageId) return prev;

          const exists = prev.some(m => {
            const existingId = m._id?.toString();
            return existingId && existingId === messageId;
          });

          if (exists) return prev;
          return [...prev, response.data];
        });
        scrollToBottom();
      }
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || 'Failed to send message';

      if (errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Premium membership required to send messages in groups. Please upgrade.', { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const handleLeaveGroup = () => {
    loadGroupData();
    loadMessages();
  };

  const handleJoinSuccess = () => {
    // Reload group data to update membership status
    loadGroupData();
    loadMessages();
    setShowPasskeyModal(false);
  };

  if (loading && !group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!group && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Group not found or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-velora-gray" style={{ minHeight: 0 }}>
      {/* Banner if not a member */}
      {!isMember && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-800 font-medium">
              You must join this group to send messages.
            </p>
            <button
              onClick={() => setShowPasskeyModal(true)}
              className="ml-4 px-4 py-1.5 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
            >
              Join Group
            </button>
          </div>
        </div>
      )}

      {/* Banner if member but not premium (read-only) */}
      {isMember && !user?.isPremium && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 font-medium">
              You can read messages, but premium is required to send messages.
            </p>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="ml-4 px-3 py-1 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message._id || `msg-${index}-${message.createdAt || Date.now()}`}
              message={message}
              isOwn={message.sender?._id?.toString() === user?._id?.toString()}
              index={index}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ice-Breaker Strip */}
      {isMember && (
        <IceBreakerStrip
          matchId={null}
          groupId={groupId}
          onMessageSent={(newMessage) => {
            // Add message to the list
            setMessages(prev => [...prev, newMessage]);
            // Reload messages to ensure sync
            setTimeout(() => loadMessages(), 500);
          }}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!isMember || !user?.isPremium || sending}
        replyWindowExpired={false}
        placeholder={!user?.isPremium && isMember ? 'Premium required to send messages' : undefined}
      />

      {/* Group Info Drawer */}
      <GroupInfoDrawer
        groupId={groupId}
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        onLeave={handleLeaveGroup}
      />

      {/* Passkey Join Modal */}
      {showPasskeyModal && (
        <PasskeyJoinModal
          isOpen={showPasskeyModal}
          onClose={() => setShowPasskeyModal(false)}
          groupId={groupId}
          groupName={group?.name || 'Group'}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}

