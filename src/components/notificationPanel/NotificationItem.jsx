import { motion } from 'framer-motion';
import { HeartIcon, SparklesIcon, GiftIcon, BellIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, SparklesIcon as SparklesSolidIcon } from '@heroicons/react/24/solid';

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return <HeartSolidIcon className="w-5 h-5 text-red-500" />;
    case 'superlike':
      return <SparklesSolidIcon className="w-5 h-5 text-yellow-500" />;
    case 'gift':
      return <GiftIcon className="w-5 h-5 text-purple-500" />;
    case 'broadcast':
      return <BellIcon className="w-5 h-5 text-velora-primary" />;
    default:
      return <BellIcon className="w-5 h-5 text-gray-500" />;
  }
};

const getNotificationText = (notification) => {
  switch (notification.type) {
    case 'like':
      return `${notification.userName || 'Someone'}${notification.userAge ? `, ${notification.userAge}` : ''} liked your profile`;
    case 'superlike':
      return `${notification.userName || 'Someone'}${notification.userAge ? `, ${notification.userAge}` : ''} superliked your profile`;
    case 'gift':
      return `${notification.userName || 'Someone'}${notification.userAge ? `, ${notification.userAge}` : ''} sent you a gift`;
    case 'broadcast':
      return notification.body || notification.title || 'New broadcast notification';
    default:
      return notification.body || notification.title || 'New notification';
  }
};

export default function NotificationItem({ notification, onClick, index = 0 }) {
  const isUnread = !notification.isRead;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors border-l-4 ${
        isUnread
          ? 'bg-velora-primary/5 border-velora-primary hover:bg-velora-primary/10'
          : 'bg-white border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {notification.type === 'broadcast' && notification.imageUrl ? (
            <img
              src={notification.imageUrl}
              alt="Broadcast"
              className="w-12 h-12 rounded-lg object-cover border-2 border-velora-primary"
            />
          ) : notification.userPhoto ? (
            <img
              src={notification.userPhoto}
              alt={notification.userName || 'User'}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center">
              <span className="text-gray-700 font-bold text-lg">
                {notification.userName?.charAt(0)?.toUpperCase() || '📢'}
              </span>
            </div>
          )}
          {/* Type Icon */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {notification.type === 'broadcast' ? (
            <>
              <p className={`text-sm font-bold text-velora-primary mb-1 ${isUnread ? 'font-bold' : ''}`}>
                📢 {notification.title || 'Admin Message'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {notification.body || getNotificationText(notification)}
              </p>
            </>
          ) : (
            <>
              <p className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'} text-gray-900 mb-1`}>
                {getNotificationText(notification)}
              </p>
              {notification.type === 'gift' && notification.giftNote && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-700 italic">
                    💝 "{notification.giftNote}"
                  </p>
                </div>
              )}
            </>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {formatTimeAgo(notification.timestamp || notification.createdAt)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}






