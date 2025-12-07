import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket, initializeSocket } from '../services/socketService';
import { useAuth } from './AuthContext';

const PresenceContext = createContext(null);

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
};

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  // Global presence store: userId -> { isOnline: boolean, updatedAt: Date }
  const [presenceMap, setPresenceMap] = useState({});

  // Update presence for a specific user
  const updatePresence = useCallback((userId, isOnline, updatedAt = null) => {
    if (!userId) return;
    
    const userIdStr = userId.toString();
    setPresenceMap(prev => ({
      ...prev,
      [userIdStr]: {
        isOnline: isOnline === true,
        updatedAt: updatedAt || new Date(),
      },
    }));
  }, []);

  // Get presence for a specific user
  const getPresence = useCallback((userId) => {
    if (!userId) return { isOnline: false };
    const userIdStr = userId.toString();
    return presenceMap[userIdStr] || { isOnline: false };
  }, [presenceMap]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;
    const userIdStr = userId.toString();
    return presenceMap[userIdStr]?.isOnline === true;
  }, [presenceMap]);

  // Initialize socket and subscribe to presence events
  useEffect(() => {
    if (!user?._id) return;

    // Initialize socket if not already connected
    const socket = initializeSocket(user._id);

    // Handle unified presence:userStatusChanged event
    const handlePresenceStatusChanged = (data) => {
      if (data && data.userId) {
        const isOnline = data.isOnline === true || data.onlineStatus === 'online';
        updatePresence(data.userId, isOnline, data.updatedAt ? new Date(data.updatedAt) : new Date());
      }
    };

    // Handle legacy events for backward compatibility
    const handleUserOnline = (data) => {
      if (data && data.userId) {
        updatePresence(data.userId, true, new Date());
      }
    };

    const handleUserOffline = (data) => {
      if (data && data.userId) {
        updatePresence(data.userId, false, new Date());
      }
    };

    const handlePresenceUpdate = (data) => {
      if (data && data.userId) {
        const isOnline = data.isOnline === true || data.onlineStatus === 'online';
        updatePresence(data.userId, isOnline, data.lastActiveAt ? new Date(data.lastActiveAt) : new Date());
      }
    };

    // Subscribe to all presence events
    socket.on('presence:userStatusChanged', handlePresenceStatusChanged);
    socket.on('presence:user:online', handleUserOnline);
    socket.on('presence:user:offline', handleUserOffline);
    socket.on('presence:update', handlePresenceUpdate);

    // Cleanup
    return () => {
      if (socket) {
        socket.off('presence:userStatusChanged', handlePresenceStatusChanged);
        socket.off('presence:user:online', handleUserOnline);
        socket.off('presence:user:offline', handleUserOffline);
        socket.off('presence:update', handlePresenceUpdate);
      }
    };
  }, [user?._id, updatePresence]);

  // Seed presence map from initial profile data (when profiles are loaded)
  // Only seeds if not already in map to preserve real-time updates
  // Real-time socket events will always take precedence over seeded data
  const seedPresenceFromProfiles = useCallback((profiles) => {
    if (!profiles || !Array.isArray(profiles)) return;
    
    setPresenceMap(prev => {
      const newPresenceMap = { ...prev };
      let hasChanges = false;
      
      profiles.forEach(profile => {
        const userId = profile.userId?._id || profile.userId || profile._id;
        if (userId) {
          const userIdStr = userId.toString();
          // Only seed if not already in map (preserve real-time updates)
          // This ensures real-time updates take precedence over initial data
          // If user is already in map from real-time events, don't overwrite
          if (!newPresenceMap[userIdStr] && profile.isOnline !== undefined) {
            // Only seed if profile explicitly has isOnline field
            // Backend now correctly returns isOnline: false for offline users
            newPresenceMap[userIdStr] = {
              isOnline: profile.isOnline === true, // Only true if explicitly true
              updatedAt: new Date(),
            };
            hasChanges = true;
          }
        }
      });
      
      return hasChanges ? newPresenceMap : prev;
    });
  }, []);

  const value = {
    presenceMap,
    updatePresence,
    getPresence,
    isUserOnline,
    seedPresenceFromProfiles,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
};

