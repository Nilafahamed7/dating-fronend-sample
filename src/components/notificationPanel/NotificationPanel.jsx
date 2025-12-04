import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { matchService } from '../../services/matchService';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../../services/socketService';
import NotificationItem from './NotificationItem';
import './notificationPanel.css';

export default function NotificationPanel({ isOpen, onClose, onNotificationsLoaded }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  // Debug: Log when panel state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[NotificationPanel] isOpen:', isOpen);
    }
  }, [isOpen]);

  // Group notifications by type
  const groupedNotifications = {
    likes: notifications.filter(n => n.type === 'like'),
    superlikes: notifications.filter(n => n.type === 'superlike'),
    gifts: notifications.filter(n => n.type === 'gift' || n.type === 'gift_received'),
    admin: notifications.filter(n => n.type === 'broadcast'),
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matchService.getNotifications();
      
      if (response.success) {
        const notifs = Array.isArray(response.data) ? response.data : [];
        // Sort by timestamp (newest first)
        const sortedNotifs = notifs.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setNotifications(sortedNotifs);
        
        if (onNotificationsLoaded) {
          onNotificationsLoaded(sortedNotifs);
        }
      } else {
        setNotifications([]);
        setError('Failed to load notifications');
      }
    } catch (error) {
      setNotifications([]);
      setError('No notifications available.');
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await matchService.markNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onNotificationsLoaded) {
        onNotificationsLoaded([]);
      }
    } catch (error) {
      // Silently fail
    }
  };

  // Load notifications and mark as read when panel opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      markAllAsRead();

      // Scroll to top
      if (contentRef.current) {
        setTimeout(() => {
          contentRef.current.scrollTop = 0;
        }, 100);
      }

      // Listen for new notifications
      const socket = getSocket();
      if (socket) {
        const handleNewNotification = () => {
          loadNotifications();
        };
        socket.on('new-notification', handleNewNotification);
        return () => {
          socket.off('new-notification', handleNewNotification);
        };
      }
    } else {
      setNotifications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification) => {
    const matchId = notification.matchId ||
                    notification.data?.matchId ||
                    notification.data?.conversationId ||
                    notification.conversationId;

    if (notification.type === 'broadcast') {
      if (notification.deepLink && notification.deepLink !== '/') {
        navigate(notification.deepLink);
      }
    } else if (notification.type === 'gift' || notification.type === 'gift_received') {
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else if (notification.userId) {
        navigate(`/matches`);
      }
    } else if (notification.type === 'like' || notification.type === 'superlike') {
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else {
        navigate(`/matches`);
      }
    } else if (notification.type === 'match') {
      navigate(`/chat/${matchId || notification.userId}`);
    } else if (notification.type === 'message' || notification.type === 'new_message') {
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else if (notification.userId || notification.data?.senderId) {
        const userId = notification.userId || notification.data?.senderId;
        navigate(`/chat/${userId}`);
      } else {
        navigate(`/matches`);
      }
    } else {
      if (matchId) {
        navigate(`/chat/${matchId}`);
      } else if (notification.userId) {
        navigate(`/matches`);
      }
    }

    onClose();
  };

  const renderSection = (title, items, icon) => {
    if (items.length === 0) return null;

    return (
      <div className="notification-section">
        <div className="notification-section-header">
          <span className="notification-section-icon">{icon}</span>
          <h3 className="notification-section-title">{title}</h3>
          <span className="notification-section-count">({items.length})</span>
        </div>
        <div className="notification-section-list">
          {items.map((notification, index) => (
            <NotificationItem
              key={`${notification._id || notification.type}-${notification.userId}-${notification.timestamp || index}`}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              index={index}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render using portal to avoid layout clipping
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="notification-backdrop"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{
              type: 'tween',
              duration: 0.3,
              ease: [0.2, 0.9, 0.2, 1],
            }}
            className="notification-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="notification-header">
              <h2 className="notification-title">Notifications</h2>
              <button
                onClick={onClose}
                className="notification-close-button"
                aria-label="Close notifications"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div ref={contentRef} className="notification-content">
              {loading ? (
                <div className="notification-loading">
                  <div className="notification-spinner"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="notification-error">
                  <p>{error}</p>
                  <button onClick={loadNotifications} className="notification-retry-button">
                    Try Again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <p className="notification-empty-title">No notifications yet</p>
                  <p className="notification-empty-text">
                    You'll see likes, superlikes, gifts, and admin messages here
                  </p>
                </div>
              ) : (
                <div className="notification-list">
                  {renderSection('Likes', groupedNotifications.likes, '❤️')}
                  {renderSection('Super Likes', groupedNotifications.superlikes, '⭐')}
                  {renderSection('Gifts', groupedNotifications.gifts, '🎁')}
                  {renderSection('Admin Messages', groupedNotifications.admin, '📢')}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

