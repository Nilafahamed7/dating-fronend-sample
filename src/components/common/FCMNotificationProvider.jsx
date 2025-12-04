import { useFCMNotifications } from '../../hooks/useFCMNotifications';
import FullScreenNotification from '../notifications/FullScreenNotification';

/**
 * Provider component to initialize FCM notifications
 * Should be placed inside AuthProvider to access user context
 */
export default function FCMNotificationProvider({ children }) {
  const { fullScreenNotification, setFullScreenNotification } = useFCMNotifications();

  return (
    <>
      {children}
      {fullScreenNotification && (
        <FullScreenNotification
          notification={fullScreenNotification}
          onClose={() => setFullScreenNotification(null)}
        />
      )}
    </>
  );
}

