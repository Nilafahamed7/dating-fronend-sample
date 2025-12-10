import { motion } from 'framer-motion';

export default function NotificationItem({ notification, onClick, index }) {
  if (!notification) return null;

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return '❤️';
      case 'superlike':
        return '⭐';
      case 'gift':
      case 'gift_received':
        return '🎁';
      case 'broadcast':
        return '📢';
      case 'match':
        return '💕';
      case 'message':
      case 'new_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationTitle = () => {
    if (notification.title) return notification.title;
    
    switch (notification.type) {
      case 'like':
        return 'New Like';
      case 'superlike':
        return 'New Super Like';
      case 'gift':
      case 'gift_received':
        return 'New Gift';
      case 'broadcast':
        return 'Admin Message';
      case 'match':
        return 'New Match';
      case 'message':
      case 'new_message':
        return 'New Message';
      default:
        return 'Notification';
    }
  };

  const getNotificationBody = () => {
    if (notification.body) return notification.body;
    if (notification.message) return notification.message;
    if (notification.text) return notification.text;
    
    switch (notification.type) {
      case 'like':
        return 'Someone liked your profile';
      case 'superlike':
        return 'Someone super liked your profile';
      case 'gift':
        return 'You received a gift';
      case 'gift_received':
        return 'You received a gift';
      case 'broadcast':
        return notification.message || 'New admin message';
      case 'match':
        return 'You have a new match!';
      case 'message':
      case 'new_message':
        return 'You have a new message';
      default:
        return 'You have a new notification';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const timestamp = notification.timestamp || notification.createdAt || notification.updatedAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
    >
      <div className="notification-item-icon">
        {getNotificationIcon()}
      </div>
      <div className="notification-item-content">
        <div className="notification-item-header">
          <h4 className="notification-item-title">{getNotificationTitle()}</h4>
          <span className="notification-item-time">{formatTimestamp(timestamp)}</span>
        </div>
        <p className="notification-item-body">{getNotificationBody()}</p>
      </div>
      {!notification.isRead && (
        <div className="notification-item-dot" />
      )}
    </motion.div>
  );
}



