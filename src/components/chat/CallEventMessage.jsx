import { motion } from 'framer-motion';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { formatMessageTimestamp } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

export default function CallEventMessage({ callEvent, onMissedCallTap, isCurrentUserCaller }) {
  const { user } = useAuth();

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMissed = callEvent.status === 'missed';
  const isCancelled = callEvent.status === 'cancelled' || callEvent.status === 'rejected';
  // Mark as completed if status is explicitly one of these - don't default to failed
  const isCompleted = callEvent.status === 'completed' ||
                      callEvent.status === 'ended' ||
                      callEvent.status === 'success' ||
                      callEvent.status === 'paid' ||
                      callEvent.status === 'unpaid_pending';
  // Only mark as failed if status is explicitly 'failed' or 'failed_billing'
  const isFailed = callEvent.status === 'failed' || callEvent.status === 'failed_billing';
  // Trust server's authoritative callType (voice or video, no mixed)
  const isVideo = callEvent.callType === 'video';
  const duration = formatDuration(callEvent.durationSeconds);
  const billedCoins = callEvent.billedCoins || 0;
  const receiverShare = callEvent.receiverShare || callEvent.girlShareCoins || 0;
  const adminShare = callEvent.adminShare || 0;

  // Determine if current user is the caller or receiver
  const currentUserId = user?._id?.toString();
  // Use initiatorId/receiverId if available, otherwise fallback to callerId/calleeId
  const callerId = callEvent.initiatorId || callEvent.callerId?._id?.toString() || callEvent.callerId?.toString();
  const calleeId = callEvent.receiverId || callEvent.calleeId?._id?.toString() || callEvent.calleeId?.toString();
  const isCaller = isCurrentUserCaller !== undefined
    ? isCurrentUserCaller
    : (currentUserId === callerId || currentUserId === callEvent.initiatorId);
  const isReceiver = !isCaller;

  // Determine if current user is the payer (only payer sees "coins deducted")
  // Receiver sees "received coins" if they got a share
  const isPayer = callEvent.payerId ? (callEvent.payerId.toString() === currentUserId) : isCaller;

  // Determine display text based on status and user role
  let displayText = '';
  let isClickable = false;

  if (isCompleted) {
    // Show "Outgoing" or "Incoming" prefix for completed calls
    const callDirection = isCaller ? 'Outgoing' : 'Incoming';
    const callTypeLabel = isVideo ? 'video call' : 'voice call';
    displayText = `${callDirection} ${callTypeLabel}${duration ? ` • ${duration}` : ''}`;
  } else if (isMissed) {
    // Receiver sees "Missed call", caller sees "Cancelled call"
    if (isReceiver) {
      displayText = 'Missed call';
      isClickable = true;
    } else if (isCaller) {
      displayText = 'Cancelled call';
    } else {
      displayText = 'Missed call';
    }
  } else if (isCancelled) {
    // Cancelled calls: show direction
    const callDirection = isCaller ? 'Outgoing' : 'Incoming';
    displayText = `${callDirection} call cancelled`;
  } else if (isFailed) {
    displayText = `${isVideo ? 'Video' : 'Voice'} call failed`;
  } else {
    // For other statuses (pending, ringing, etc.), show direction
    const callDirection = isCaller ? 'Outgoing' : 'Incoming';
    displayText = `${callDirection} ${isVideo ? 'video' : 'voice'} call`;
  }

  const handleClick = () => {
    if (isClickable && onMissedCallTap) {
      onMissedCallTap(callEvent);
    }
  };

  return (
    <motion.div
      className="flex justify-center my-3 px-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`inline-flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm ${
          (isMissed || isCancelled)
            ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 cursor-pointer hover:from-red-100 hover:to-rose-100 transition-all'
            : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          {isVideo ? (
            <VideoCameraIcon className="w-4 h-4" />
          ) : (
            <PhoneIcon className="w-4 h-4" />
          )}
          <span className="font-semibold">{displayText}</span>
          <span className="text-xs text-gray-500">
            {formatMessageTimestamp(callEvent.timestamp || callEvent.startedAt || callEvent.createdAt)}
          </span>
        </div>
        {/* Show coins deducted for payer, received coins for receiver */}
        {(isCompleted || (callEvent.durationSeconds > 0 && billedCoins > 0)) && (
          <div className="flex flex-col gap-1.5 items-center">
            {/* Payer sees coins deducted */}
            {isPayer && billedCoins > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                <span>💰</span>
                <span>{billedCoins} coins deducted</span>
              </div>
            )}
            {/* Receiver sees coins received */}
            {!isPayer && receiverShare > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                <span>💰</span>
                <span>{receiverShare} coins received</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}




import { formatMessageTimestamp } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

export default function CallEventMessage({ callEvent, onMissedCallTap, isCurrentUserCaller }) {
  const { user } = useAuth();

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMissed = callEvent.status === 'missed';
  const isCancelled = callEvent.status === 'cancelled' || callEvent.status === 'rejected';
  // Mark as completed if status is explicitly one of these - don't default to failed
  const isCompleted = callEvent.status === 'completed' ||
                      callEvent.status === 'ended' ||
                      callEvent.status === 'success' ||
                      callEvent.status === 'paid' ||
                      callEvent.status === 'unpaid_pending';
  // Only mark as failed if status is explicitly 'failed' or 'failed_billing'
  const isFailed = callEvent.status === 'failed' || callEvent.status === 'failed_billing';
  // Trust server's authoritative callType (voice or video, no mixed)
  const isVideo = callEvent.callType === 'video';
  const duration = formatDuration(callEvent.durationSeconds);
  const billedCoins = callEvent.billedCoins || 0;
  const receiverShare = callEvent.receiverShare || callEvent.girlShareCoins || 0;
  const adminShare = callEvent.adminShare || 0;

  // Determine if current user is the caller or receiver
  const currentUserId = user?._id?.toString();
  // Use initiatorId/receiverId if available, otherwise fallback to callerId/calleeId
  const callerId = callEvent.initiatorId || callEvent.callerId?._id?.toString() || callEvent.callerId?.toString();
  const calleeId = callEvent.receiverId || callEvent.calleeId?._id?.toString() || callEvent.calleeId?.toString();
  const isCaller = isCurrentUserCaller !== undefined
    ? isCurrentUserCaller
    : (currentUserId === callerId || currentUserId === callEvent.initiatorId);
  const isReceiver = !isCaller;

  // Determine if current user is the payer (only payer sees "coins deducted")
  // Receiver sees "received coins" if they got a share
  const isPayer = callEvent.payerId ? (callEvent.payerId.toString() === currentUserId) : isCaller;

  // Determine display text based on status and user role
  let displayText = '';
  let isClickable = false;

  if (isCompleted) {
    // Show "Outgoing" or "Incoming" prefix for completed calls
    const callDirection = isCaller ? 'Outgoing' : 'Incoming';
    const callTypeLabel = isVideo ? 'video call' : 'voice call';
    displayText = `${callDirection} ${callTypeLabel}${duration ? ` • ${duration}` : ''}`;
  } else if (isMissed) {
    // Receiver sees "Missed call", caller sees "Cancelled call"
    if (isReceiver) {
      displayText = 'Missed call';
      isClickable = true;
    } else if (isCaller) {
      displayText = 'Cancelled call';
    } else {
      displayText = 'Missed call';
    }
  } else if (isCancelled) {
    // Cancelled calls: show direction
    const callDirection = isCaller ? 'Outgoing' : 'Incoming';
    displayText = `${callDirection} call cancelled`;
  } else if (isFailed) {
    displayText = `${isVideo ? 'Video' : 'Voice'} call failed`;
  } else {
    // For other statuses (pending, ringing, etc.), show direction
    const callDirection = isCaller ? 'Outgoing' : 'Incoming';
    displayText = `${callDirection} ${isVideo ? 'video' : 'voice'} call`;
  }

  const handleClick = () => {
    if (isClickable && onMissedCallTap) {
      onMissedCallTap(callEvent);
    }
  };

  return (
    <motion.div
      className="flex justify-center my-3 px-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`inline-flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm ${
          (isMissed || isCancelled)
            ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 cursor-pointer hover:from-red-100 hover:to-rose-100 transition-all'
            : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          {isVideo ? (
            <VideoCameraIcon className="w-4 h-4" />
          ) : (
            <PhoneIcon className="w-4 h-4" />
          )}
          <span className="font-semibold">{displayText}</span>
          <span className="text-xs text-gray-500">
            {formatMessageTimestamp(callEvent.timestamp || callEvent.startedAt || callEvent.createdAt)}
          </span>
        </div>
        {/* Show coins deducted for payer, received coins for receiver */}
        {(isCompleted || (callEvent.durationSeconds > 0 && billedCoins > 0)) && (
          <div className="flex flex-col gap-1.5 items-center">
            {/* Payer sees coins deducted */}
            {isPayer && billedCoins > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                <span>💰</span>
                <span>{billedCoins} coins deducted</span>
              </div>
            )}
            {/* Receiver sees coins received */}
            {!isPayer && receiverShare > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                <span>💰</span>
                <span>{receiverShare} coins received</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

