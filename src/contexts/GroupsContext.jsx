import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { groupService } from '../services/groupService';
import { useAuth } from './AuthContext';
import { getSocket, joinChatRoom, sendTypingStart } from '../services/socketService';

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
    const [loading, setLoading] = useState(true);
    const [presence, setPresence] = useState({});

    const loadGroups = useCallback(async () => {
        if (!user) {
            setGroups([]);
            setLoading(false);
            return;
        }

        try {
            // Don't set loading to true here to avoid flashing if it's a background refresh
            // Only set it if it's the initial load
            if (groups.length === 0) {
                setLoading(true);
            }

            const response = await groupService.listGroups();
            // Based on Groups.jsx usage:
            // response.groups -> public groups
            // response.joinedGroups -> joined groups
            setGroups(response.joinedGroups || []);
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    }, [user, groups.length]);

    // Initial load
    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    // Socket listeners for real-time updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !user) return;

        const handleGroupUpdate = () => {
            loadGroups();
        };

        // Listen for various group-related events
        // We reload the groups list when any of these happen to ensure consistency
        socket.on('group:created', handleGroupUpdate);
        socket.on('group:updated', handleGroupUpdate);
        socket.on('group:deleted', handleGroupUpdate);
        socket.on('group:member-added', handleGroupUpdate);
        socket.on('group:member-removed', handleGroupUpdate);
        socket.on('group:joined', handleGroupUpdate);
        socket.on('group:left', handleGroupUpdate);

        // Also listen for user resource updates as mentioned in AuthContext
        socket.on('user:resource-update', handleGroupUpdate);

        return () => {
            socket.off('group:created', handleGroupUpdate);
            socket.off('group:updated', handleGroupUpdate);
            socket.off('group:deleted', handleGroupUpdate);
            socket.off('group:member-added', handleGroupUpdate);
            socket.off('group:member-removed', handleGroupUpdate);
            socket.off('group:joined', handleGroupUpdate);
            socket.off('group:left', handleGroupUpdate);
            socket.off('user:resource-update', handleGroupUpdate);
        };
    }, [user, loadGroups]);

    const [groupMessages, setGroupMessages] = useState({});
    const [typing, setTyping] = useState({});

    // Implement real logic
    const loadGroupMessages = useCallback(async (groupId, limit = 50) => {
        try {
            const response = await groupService.getGroupMessages(groupId, { limit });
            let messages = [];
            if (response.success && response.messages) {
                messages = response.messages;
            } else if (response.data) {
                messages = response.data;
            } else if (Array.isArray(response)) {
                // Handle case where response is the array directly
                messages = response;
            }

            // Backend returns messages in ascending order (oldest first)
            // But chat logic might expect them as is, or we need to ensure correct order
            // Usually chat UI iterates and shows chronological. 
            // If we reverse, we might flip them. Let's keep original order if they are sorted by createdAt ASC.
            // The backend controller sorts by createdAt: 1 (Ascending).

            setGroupMessages(prev => ({
                ...prev,
                [groupId]: messages // Keep ascending order
            }));
            return messages;
        } catch (error) {
            console.error('Error loading group messages:', error);
            return [];
        }
    }, []);

    const updateGroup = useCallback((groupId, data) => {
        setGroups(prev => prev.map(g =>
            (g._id === groupId || g.id === groupId) ? { ...g, ...data } : g
        ));
    }, []);

    const subscribeToGroup = useCallback((groupId) => {
        if (!groupId) return;
        const roomId = `group:${groupId}`;
        joinChatRoom(roomId);
    }, []);

    const sendTypingIndicator = useCallback((groupId) => {
        sendTypingStart(`group:${groupId}`);
    }, []);

    // Listen for incoming messages globally for joined groups
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !user) return;

        const handleNewMessage = (message) => {
            // Check if it's a group message
            if (message.groupId || (message.conversationId && !message.matchId)) {
                let gId = message.groupId || message.conversationId;
                if (typeof gId === 'object') gId = gId.toString();

                setGroupMessages(prev => {
                    const currentMessages = prev[gId] || [];
                    // Avoid duplicates
                    if (currentMessages.some(m => m._id === message._id || (message.tempId && m.tempId === message.tempId))) {
                        // Update existing (e.g. status change)
                        return {
                            ...prev,
                            [gId]: currentMessages.map(m =>
                                (m._id === message._id || (message.tempId && m.tempId === message.tempId)) ? { ...m, ...message } : m
                            )
                        };
                    }
                    return {
                        ...prev,
                        [gId]: [...currentMessages, message]
                    };
                });
            }
        };

        const handleTypingStart = ({ userId, room }) => {
            if (room && room.startsWith('group:')) {
                const groupId = room.split(':')[1];
                if (userId !== user._id) {
                    setTyping(prev => ({
                        ...prev,
                        [groupId]: { ...prev[groupId], [userId]: Date.now() }
                    }));
                }
            }
        };

        socket.on('message:new', handleNewMessage);
        socket.on('group:message:new', handleNewMessage); // Compatibility

        // Legacy support if backend emits group:new-message
        socket.on('group:new-message', (data) => {
            // Backend emits { groupId, message: {...} } sometimes
            const msg = data.message || data;
            handleNewMessage(msg);
        });

        socket.on('typing:start', handleTypingStart);

        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('group:message:new', handleNewMessage);
            socket.off('group:new-message');
            socket.off('typing:start', handleTypingStart);
        };
    }, [user]);

    const addMessageOptimistically = useCallback((groupId, message) => {
        setGroupMessages(prev => ({
            ...prev,
            [groupId]: [...(prev[groupId] || []), message]
        }));
    }, []);

    const removeOptimisticMessage = useCallback((groupId, tempId) => {
        setGroupMessages(prev => ({
            ...prev,
            [groupId]: (prev[groupId] || []).filter(m => m._id !== tempId && m.id !== tempId)
        }));
    }, []);

    const value = {
        groups,
        loading,
        presence,
        groupMessages,
        typing,
        loadGroups,
        setPresence,
        loadGroupMessages,
        updateGroup,
        subscribeToGroup,
        sendTypingIndicator,
        addMessageOptimistically,
        removeOptimisticMessage
    };

    return (
        <GroupsContext.Provider value={value}>
            {children}
        </GroupsContext.Provider>
    );
};
