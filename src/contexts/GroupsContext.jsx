import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { groupService } from '../services/groupService';
import { getSocket } from '../services/socketService';
import { useAuth } from './AuthContext';

const GroupsContext = createContext(null);

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within GroupsProvider');
  }
  return context;
};

export const GroupsProvider = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState({}); // { groupId: [messages] }
  const [loading, setLoading] = useState(false);
  const [presence, setPresence] = useState({}); // { groupId: { onlineCount, members } }
  const [typing, setTyping] = useState({}); // { groupId: { userId: timestamp } }
  const subscriptionsRef = useRef(new Set()); // Track subscribed group rooms
  const typingTimeoutsRef = useRef({}); // Track typing indicator timeouts

  // Normalize message format from backend to consistent frontend format
  const normalizeMessage = useCallback((msg) => {
    if (!msg) {
      return null;
    }

    // Don't filter out messages - even if text is empty, it might be a system message or image
    const normalized = {
      _id: msg._id || msg.messageId || msg.id,
      messageId: msg.messageId || msg._id || msg.id,
      id: msg.id || msg.messageId || msg._id,
      text: msg.text || msg.message || '',
      message: msg.message || msg.text || '',
      sender: msg.sender ? {
        _id: msg.sender._id || msg.sender.id,
        id: msg.sender.id || msg.sender._id,
        name: msg.sender.name || 'Unknown',
        ...msg.sender
      } : null,
      senderId: msg.senderId || msg.sender?._id || msg.sender?.id,
      senderName: msg.senderName || msg.sender?.name || 'Unknown',
      imageUrl: msg.imageUrl,
      messageType: msg.messageType || 'text',
      isSystemMessage: msg.isSystemMessage || msg.messageType === 'system',
      reactions: msg.reactions || [],
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };

    // Log if message has no text and no image (might be an issue)
    if (!normalized.text && !normalized.imageUrl && !normalized.isSystemMessage) {
      }

    return normalized;
  }, []);

  // Update presence for a group
  const updatePresence = useCallback(async (groupId) => {
    try {
      const response = await groupService.getGroupDetails(groupId);
      if (response.success && response.group) {
        // Presence info will come from socket events
        // For now, just track member count
        setPresence(prev => ({
          ...prev,
          [groupId]: {
            onlineCount: 0, // Will be updated via socket
            memberCount: response.group.memberCount || 0,
          },
        }));
      }
    } catch (error) {
      }
  }, []);

  // Subscribe to a group's real-time channels
  const subscribeToGroup = useCallback((groupId) => {
    const socket = getSocket();
    if (!socket || !socket.connected || !groupId) return;

    if (subscriptionsRef.current.has(groupId)) {
      return; // Already subscribed
    }

    subscriptionsRef.current.add(groupId);

    // Join group room (ensure string format for consistency)
    const normalizedGroupIdForSocket = groupId?.toString();
    socket.emit('join-group', normalizedGroupIdForSocket);
    // Set up listeners for this group
    const handleNewMessage = (data) => {
      const normalizedGroupId = groupId?.toString();
      if (data.groupId?.toString() === normalizedGroupId && data.message) {
        setGroupMessages(prev => {
          const existing = prev[normalizedGroupId] || [];
          const messageId = (data.message._id || data.message.messageId || data.message.id)?.toString();

          // De-duplicate by message ID
          if (messageId && existing.some(m => {
            const mId = (m._id || m.messageId || m.id)?.toString();
            return mId === messageId;
          })) {
            return prev;
          }

          // Normalize the new message
          const normalizedMessage = normalizeMessage(data.message);
          return {
            ...prev,
            [normalizedGroupId]: [...existing, normalizedMessage],
          };
        });

        // Update last message in groups list and increment unread count if message is not from current user
        setGroups(prev => {
          const updated = prev.map(g => {
            const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
            if (gId === groupId?.toString()) {
              const isFromCurrentUser = data.message?.sender?._id?.toString() === user?._id?.toString() ||
                                       data.message?.sender?.toString() === user?._id?.toString();

              return {
                ...g,
                lastMessage: {
                  text: data.message?.text || data.message?.message,
                  sender: data.message?.sender,
                  createdAt: data.message?.createdAt,
                },
                lastMessageAt: data.message?.createdAt || new Date(),
                // Increment unread count if message is not from current user
                unreadCount: isFromCurrentUser ? (g.unreadCount || 0) : ((g.unreadCount || 0) + 1),
              };
            }
            return g;
          });

          // Re-sort by lastMessageAt after update
          return updated.sort((a, b) => {
            const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });
        });
      }
    };

    const handleMemberJoined = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        setGroups(prev => prev.map(g => {
          const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
          if (gId === groupId?.toString()) {
            return {
              ...g,
              memberCount: (g.memberCount || 0) + 1,
              members: data.group?.members || g.members,
            };
          }
          return g;
        }));

        // Update presence
        updatePresence(groupId);
      }
    };

    const handleMemberLeft = (data) => {
      if (data.groupId?.toString() === groupId?.toString()) {
        setGroups(prev => prev.map(g => {
          const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
          if (gId === groupId?.toString()) {
            return {
              ...g,
              memberCount: Math.max(0, (g.memberCount || 0) - 1),
            };
          }
          return g;
        }));

        // Update presence
        updatePresence(groupId);
      }
    };

    const handleTyping = (data) => {
      if (data.groupId?.toString() === groupId?.toString() && data.userId?.toString() !== user?._id?.toString()) {
        setTyping(prev => ({
          ...prev,
          [groupId]: {
            ...(prev[groupId] || {}),
            [data.userId]: Date.now(),
          },
        }));

        // Clear typing indicator after 3 seconds
        if (typingTimeoutsRef.current[`${groupId}-${data.userId}`]) {
          clearTimeout(typingTimeoutsRef.current[`${groupId}-${data.userId}`]);
        }
        typingTimeoutsRef.current[`${groupId}-${data.userId}`] = setTimeout(() => {
          setTyping(prev => {
            const groupTyping = prev[groupId] || {};
            const { [data.userId]: removed, ...rest } = groupTyping;
            return {
              ...prev,
              [groupId]: Object.keys(rest).length > 0 ? rest : undefined,
            };
          });
        }, 3000);
      }
    };

    socket.on('group:new-message', handleNewMessage);
    socket.on('group:member-joined', handleMemberJoined);
    socket.on('group:member-left', handleMemberLeft);
    socket.on('group:typing', handleTyping);

    // Store handlers for cleanup
    socket._groupHandlers = socket._groupHandlers || {};
    socket._groupHandlers[groupId] = {
      handleNewMessage,
      handleMemberJoined,
      handleMemberLeft,
      handleTyping,
    };
  }, [user?._id, normalizeMessage]);

  // Unsubscribe from a group
  const unsubscribeFromGroup = useCallback((groupId) => {
    const socket = getSocket();
    if (!socket || !groupId) return;

    subscriptionsRef.current.delete(groupId);
    socket.emit('leave-group', groupId);

    // Remove handlers
    if (socket._groupHandlers?.[groupId]) {
      const handlers = socket._groupHandlers[groupId];
      socket.off('group:new-message', handlers.handleNewMessage);
      socket.off('group:member-joined', handlers.handleMemberJoined);
      socket.off('group:member-left', handlers.handleMemberLeft);
      socket.off('group:typing', handlers.handleTyping);
      delete socket._groupHandlers[groupId];
    }
  }, []);

  // Load user's groups on mount and when user changes
  const loadGroups = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await groupService.listGroups();
      // Backend returns { groups: [...], joinedGroups: [...] }
      // Use joinedGroups as the primary source for user's groups
      const groupsList = response.joinedGroups || response.groups || [];

      // Sort groups by lastMessageAt or updatedAt (most recent first) for consistent ordering
      const sortedGroups = [...groupsList].sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      // Deduplicate by group ID (prefer server data)
      const uniqueGroups = [];
      const seenIds = new Set();
      sortedGroups.forEach(group => {
        const groupId = group._id?.toString() || group.id?.toString() || group.groupId?.toString();
        if (groupId && !seenIds.has(groupId)) {
          seenIds.add(groupId);
          uniqueGroups.push(group);
        }
      });

      setGroups(uniqueGroups);

      // Subscribe to all joined groups for real-time updates
      const socket = getSocket();
      if (socket && socket.connected) {
        uniqueGroups.forEach(group => {
          const groupId = group._id || group.id || group.groupId;
          if (groupId && !subscriptionsRef.current.has(groupId)) {
            subscribeToGroup(groupId);
          }
        });
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  }, [user?._id, subscribeToGroup]);

  // Load messages for a specific group
  const loadGroupMessages = useCallback(async (groupId, limit = 50) => {
    if (!groupId) {
      return [];
    }

    try {
      const normalizedId = groupId.toString();
      const response = await groupService.getGroupMessages(normalizedId, { page: 1, limit });
      if (response.success) {
        const rawMessages = response.messages || response.data || [];
        if (rawMessages.length > 0) {
          } else {
          }

        // Normalize all messages to consistent format
        const normalizedMessages = rawMessages.map(normalizeMessage).filter(Boolean);

        // Always set messages, even if empty array - this ensures the key exists
        setGroupMessages(prev => {
          const updated = {
            ...prev,
            [normalizedId]: normalizedMessages,
          };
          return updated;
        });

        return normalizedMessages;
      } else {
        }
      return [];
    } catch (error) {
      return [];
    }
  }, [normalizeMessage]);

  // Add a group optimistically (when joining)
  const addGroupOptimistically = useCallback((groupData) => {
    const groupId = groupData._id || groupData.id || groupData.groupId;
    if (!groupId) return;

    setGroups(prev => {
      const exists = prev.some(g => {
        const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
        return gId === groupId?.toString();
      });

      let updatedGroups;
      if (exists) {
        // Update existing group, prefer server data
        updatedGroups = prev.map(g => {
          const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
          if (gId === groupId?.toString()) {
            // Merge: prefer server data (groupData) but keep optimistic fields if needed
            return { ...g, ...groupData, _syncing: false };
          }
          return g;
        });
      } else {
        // Add new group
        updatedGroups = [{ ...groupData, _syncing: true }, ...prev];
      }

      // Re-sort after update
      return updatedGroups.sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    });

    // Subscribe to real-time updates
    subscribeToGroup(groupId);

    // Load messages in parallel
    loadGroupMessages(groupId);
  }, [subscribeToGroup, loadGroupMessages]);

  // Remove a group (when leaving or deleted)
  const removeGroup = useCallback((groupId) => {
    setGroups(prev => prev.filter(g => {
      const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
      return gId !== groupId?.toString();
    }));
    unsubscribeFromGroup(groupId);
    setGroupMessages(prev => {
      const { [groupId]: removed, ...rest } = prev;
      return rest;
    });
  }, [unsubscribeFromGroup]);

  // Update a group (prefer server canonical data)
  const updateGroup = useCallback((groupId, updates) => {
    setGroups(prev => {
      const updated = prev.map(g => {
        const gId = g._id?.toString() || g.id?.toString() || g.groupId?.toString();
        if (gId === groupId?.toString()) {
          // Merge updates, prefer server data (updates) for authoritative fields
          return { ...g, ...updates };
        }
        return g;
      });

      // Re-sort after update
      return updated.sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    });
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((groupId) => {
    const socket = getSocket();
    if (socket && socket.connected && groupId) {
      socket.emit('group:typing', { groupId, userId: user?._id });
    }
  }, [user?._id]);

  // Load groups on mount and when user changes
  useEffect(() => {
    if (user?._id) {
      loadGroups();
    }
  }, [user?._id, loadGroups]);

  // Set up socket connection listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => {
      // Re-subscribe to all groups on reconnect
      groups.forEach(group => {
        const groupId = group._id || group.id || group.groupId;
        if (groupId) {
          subscribeToGroup(groupId);
        }
      });
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [groups, subscribeToGroup]);

  // Listen for user resource updates (group joined/left)
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?._id) return;

    const handleUserResourceUpdate = (data) => {
      if (data.type === 'group-joined' && data.group && data.userId === user._id?.toString()) {
        const groupId = data.groupId?.toString();
        if (groupId) {
          addGroupOptimistically({
            ...data.group,
            _id: data.group._id || groupId,
            name: data.group.groupName || data.group.name,
          });
        }
      } else if (data.type === 'group-left' && data.groupId) {
        removeGroup(data.groupId);
      } else if (data.type === 'group-updated' && data.group) {
        updateGroup(data.groupId, data.group);
      }
    };

    socket.on('user:resource-update', handleUserResourceUpdate);

    return () => {
      socket.off('user:resource-update', handleUserResourceUpdate);
    };
  }, [user?._id, addGroupOptimistically, removeGroup, updateGroup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));

      // Unsubscribe from all groups
      subscriptionsRef.current.forEach(groupId => {
        unsubscribeFromGroup(groupId);
      });
    };
  }, [unsubscribeFromGroup]);

  const value = {
    groups,
    groupMessages,
    loading,
    presence,
    typing,
    loadGroups,
    loadGroupMessages,
    addGroupOptimistically,
    removeGroup,
    updateGroup,
    subscribeToGroup,
    unsubscribeFromGroup,
    updatePresence,
    sendTypingIndicator,
  };

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
};

