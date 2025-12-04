import { useState, useEffect } from 'react';
import { presenceService } from '../../services/presenceService';
import { getSocket } from '../../services/socketService';

/**
 * PresenceIndicator - Displays binary "Online" or "Offline" status
 *
 * @param {Object} props
 * @param {string} props.userId - The user ID to check presence for
 * @param {boolean} props.showDot - Whether to show a colored dot indicator (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.textClassName - CSS classes for the text
 */
export default function PresenceIndicator({ userId, showDot = true, className = '', textClassName = '' }) {
  const [onlineStatus, setOnlineStatus] = useState('offline'); // 'online' | 'offline'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOnlineStatus('offline');
      setIsLoading(false);
      return;
    }

    // Fetch initial presence
    const fetchPresence = async () => {
      try {
        const response = await presenceService.getPresence(userId);
        if (response.success && response.data) {
          // Use onlineStatus if available, fallback to isOnline
          const status = response.data.onlineStatus || (response.data.isOnline ? 'online' : 'offline');
          setOnlineStatus(status);
        } else {
          // Default to offline if fetch fails
          setOnlineStatus('offline');
        }
      } catch (error) {
        // Default to offline on error
        setOnlineStatus('offline');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresence();

    // Listen for real-time presence updates via socket
    const socket = getSocket();
    const handlePresenceUpdate = (data) => {
      if (data.userId === userId || data.userId?.toString() === userId?.toString()) {
        // Use onlineStatus if available, fallback to isOnline
        const status = data.onlineStatus || (data.isOnline ? 'online' : 'offline');
        setOnlineStatus(status);
        setIsLoading(false);
      }
    };

    if (socket) {
      socket.on('presence:update', handlePresenceUpdate);
    }

    return () => {
      if (socket) {
        socket.off('presence:update', handlePresenceUpdate);
      }
    };
  }, [userId]);

  // Don't show anything while loading (or show offline as default)
  const isOnline = onlineStatus === 'online';
  const displayText = isOnline ? 'Online' : 'Offline';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {showDot && (
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
          aria-hidden="true"
        />
      )}
      <span
        className={`text-xs font-medium ${
          isOnline ? 'text-green-600' : 'text-gray-500'
        } ${textClassName}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {displayText}
      </span>
    </div>
  );
}

