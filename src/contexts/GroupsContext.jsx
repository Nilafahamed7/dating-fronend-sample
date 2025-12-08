import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { groupService } from '../services/groupService';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socketService';

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

    const value = {
        groups,
        loading,
        presence,
        loadGroups,
        setPresence // Expose this if needed, though usually managed internally or via socket
    };

    return (
        <GroupsContext.Provider value={value}>
            {children}
        </GroupsContext.Provider>
    );
};
