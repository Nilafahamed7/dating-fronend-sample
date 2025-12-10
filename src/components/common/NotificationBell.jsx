import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { notificationService } from '../../services/notificationService';
import { useNavBarContext } from './GlobalNavBar';
import { getSocket } from '../../services/socketService';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const { showNotificationPanel, setShowNotificationPanel } = useNavBarContext();

    const loadUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
        }
    };

    useEffect(() => {
        // Load initial count
        loadUnreadCount();

        // Listen for real-time notification updates via socket
        const socket = getSocket();
        if (socket) {
            // Listen for new notifications
            const handleNewNotification = (notification) => {
                // Increment unread count
                setUnreadCount(prev => prev + 1);
            };

            // Listen for notifications marked as read
            const handleNotificationsRead = (data) => {
                // Update unread count from server
                setUnreadCount(data.unreadCount || 0);
            };

            socket.on('new-notification', handleNewNotification);
            socket.on('notifications-read', handleNotificationsRead);

            return () => {
                socket.off('new-notification', handleNewNotification);
                socket.off('notifications-read', handleNotificationsRead);
            };
        }

        // Fallback: Poll for new notifications every 30 seconds if socket not available
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Refresh count when panel closes (in case notifications were marked as read)
    useEffect(() => {
        if (!showNotificationPanel) {
            // Small delay to ensure backend has processed the mark-as-read request
            const timeout = setTimeout(() => {
                loadUnreadCount();
            }, 500);
            return () => clearTimeout(timeout);
        } else {
            // When panel opens, immediately set count to 0 (optimistic update)
            // All notifications will be marked as read when panel opens
            setUnreadCount(0);
        }
    }, [showNotificationPanel]);

    const handleClick = () => {
        setShowNotificationPanel(true);
    };

    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClick}
                className="relative p-2 text-gray-600 hover:text-velora-primary transition-colors"
                aria-label="Open notifications"
            >
                {unreadCount > 0 ? (
                    <BellSolidIcon className="w-6 h-6 text-velora-primary" />
                ) : (
                    <BellIcon className="w-6 h-6" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </motion.button>
        </div>
    );
}
