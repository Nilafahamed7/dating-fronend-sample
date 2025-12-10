import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { groupChatService } from '../../services/groupChatService';
import { chatService } from '../../services/chatService';
import { getSocket, joinChatRoom, leaveChatRoom, sendChatMessage, sendTypingStart, sendTypingStop, sendReadReceipt } from '../../services/socketService';
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
    setNavbarTitle,
    setShowBackButton,
    setHomeRightAction,
  } = useNavBarContext();

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadGroupData = async () => {
    try {
      const response = await groupChatService.getGroupInfo(groupId);
      if (response && response.success) {
        setGroup(response.data);
        // Check membership
        const member = response.data.members?.find(m => m.user._id === user._id || m.user === user._id);
        setIsMember(member && member.status === 'active');
      }
    } catch (error) {
      console.error('Failed to load group info:', error);
      toast.error('Failed to load group info');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await groupChatService.getGroupMessages(groupId);
      if (response && response.success) {
        setMessages(response.data || []);

        // Emit read receipts for unread messages not from me
        const unreadMessageIds = (response.data || [])
          .filter(msg => msg.sender?._id !== user._id && !msg.isRead)
          .map(msg => msg._id);

        if (unreadMessageIds.length > 0) {
          sendReadReceipt(`group:${groupId}`, groupId, unreadMessageIds);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (groupId && user) {
      loadGroupData();
      loadMessages();
    }
  }, [groupId, user?._id]);

  // Socket Listeners
  useEffect(() => {
    if (groupId) {
      const roomId = `group:${groupId}`;
      joinChatRoom(roomId);

      const socket = getSocket();
      if (socket) {
        socket.on('message:new', (newMessage) => {
          // Verify it belongs to this group
          if (newMessage.groupId === groupId || newMessage.conversationId === groupId) {
            setMessages(prev => {
              const existingIndex = prev.findIndex(m => m._id === newMessage._id || (newMessage.tempId && m.tempId === newMessage.tempId));

              if (existingIndex !== -1) {
                // Message exists (likely optimistic). Update it.
                const updatedMessages = [...prev];
                updatedMessages[existingIndex] = {
                  ...updatedMessages[existingIndex],
                  ...newMessage,
                  status: 'delivered'
                };
                return updatedMessages;
              }
              return [...prev, newMessage];
            });
            scrollToBottom();

            // Mark as read if not my message
            if (newMessage.sender?._id !== user._id) {
              sendReadReceipt(roomId, groupId, [newMessage._id]);
            }
          }
        });

        socket.on('message:delivered', ({ tempId, messageId }) => {
          setMessages(prev => prev.map(msg =>
            (msg.tempId === tempId || msg._id === messageId)
              ? { ...msg, _id: messageId, status: 'delivered' }
              : msg
          ));
        });

        socket.on('message:seen', ({ conversationId }) => {
          if (conversationId === groupId) {
            setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
          }
        });
      }

      return () => {
        leaveChatRoom(roomId);
        if (socket) {
          socket.off('message:new');
          socket.off('message:delivered');
          socket.off('message:seen');
        }
      };
    }
  }, [groupId, user?._id]);

  // Update navbar
  useEffect(() => {
    if (group) {
      setNavbarTitle(group.name);
      setShowBackButton(true);

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
      setNavbarTitle('');
      setShowBackButton(false);
      setHomeRightAction(null);
    };
  }, [group, setNavbarTitle, setShowBackButton, setHomeRightAction]);

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

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      tempId: tempId,
      sender: user,
      text: text,
      messageType: 'text',
      groupId: groupId,
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'sending'
    };

    try {
      setSending(true);
      // Optimistic Update
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      // Send via Socket
      await sendChatMessage({
        groupId,
        text,
        tempId
      });

      // Stop typing
      sendTypingStop(`group:${groupId}`);

    } catch (error) {
      console.error("Send Error", error);
      // Mark message as failed
      setMessages(prev => prev.map(msg =>
        msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
      ));
      toast.error(error.message || 'Failed to send');
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
              isMine={message.sender?._id?.toString() === user?._id?.toString()}
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
        onTypingStart={() => {
          if (isMember) {
            sendTypingStart(`group:${groupId}`);
          }
        }}
        onTypingStop={() => {
          if (isMember) {
            sendTypingStop(`group:${groupId}`);
          }
        }}
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
