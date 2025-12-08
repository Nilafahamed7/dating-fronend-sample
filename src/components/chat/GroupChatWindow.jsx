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
    setNavbarTitle,
    setShowBackButton,
    setHomeRightAction,
  } = useNavBarContext();

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ... (loadGroupData and loadMessages functions remain unchanged)

  // ... (useEffect for initial loading remains unchanged)

  // ... (useEffect for socket listeners remains unchanged)

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

