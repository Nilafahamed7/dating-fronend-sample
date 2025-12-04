import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon, PhotoIcon, GiftIcon } from '@heroicons/react/24/outline';

export default function ChatInput({ onSend, onSendImage, onSendGift, disabled, replyWindowExpired = false, timeRemaining = null, activeReplyWindow = null }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && onSendImage) {
      onSendImage(file);
    }
    e.target.value = '';
  };

  const isDisabled = disabled || replyWindowExpired;

  // Format time remaining for display
  const formatTimeRemaining = () => {
    if (!timeRemaining) return null;
    const { hours, minutes, seconds } = timeRemaining;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Calculate progress percentage (0-100)
  const getProgressPercentage = () => {
    if (!timeRemaining || !activeReplyWindow) return 0;
    const totalWindow = 12 * 60 * 60 * 1000; // 12 hours in ms
    const remaining = timeRemaining.total;
    return Math.max(0, Math.min(100, (remaining / totalWindow) * 100));
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* Show timer for non-premium users with active reply window */}
      {!replyWindowExpired && timeRemaining && activeReplyWindow && (
        <div className="mb-3 px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-orange-700">
              ⏰ {formatTimeRemaining()} left to reply
            </p>
            <span className="text-xs text-orange-600 font-medium">
              Subscribe to unlock unlimited replies
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <motion.button
            type="button"
            onClick={() => navigate('/subscriptions')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md text-sm"
          >
            Subscribe Now
          </motion.button>
        </div>
      )}
      {replyWindowExpired && (
        <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-semibold text-center mb-2">
            ⏰ Reply window expired — subscribe to reply.
          </p>
          <motion.button
            type="button"
            onClick={() => navigate('/subscriptions')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md"
          >
            Subscribe Now
          </motion.button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          whileHover={{ scale: isDisabled ? 1 : 1.1 }}
          whileTap={{ scale: isDisabled ? 1 : 0.9 }}
          className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all disabled:opacity-50"
        >
          <PhotoIcon className="w-6 h-6" />
        </motion.button>
        {onSendGift && (
          <motion.button
            type="button"
            onClick={onSendGift}
            disabled={isDisabled}
            whileHover={{ scale: isDisabled ? 1 : 1.1 }}
            whileTap={{ scale: isDisabled ? 1 : 0.9 }}
            className="p-3 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all disabled:opacity-50"
          >
            <GiftIcon className="w-6 h-6" />
          </motion.button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*,video/*"
          className="hidden"
        />

        <div className={`flex-1 relative transition-all ${isFocused ? 'scale-105' : ''}`}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={replyWindowExpired ? "Reply window expired" : "Type a message..."}
            disabled={isDisabled}
            className={`w-full px-5 py-3 bg-gray-50 border-2 rounded-full focus:outline-none transition-all disabled:opacity-50 ${
              isFocused
                ? 'border-purple-400 bg-white shadow-lg'
                : 'border-transparent hover:bg-gray-100'
            }`}
          />
        </div>

        <motion.button
          type="submit"
          disabled={!message.trim() || isDisabled}
          whileHover={{ scale: (!message.trim() || isDisabled) ? 1 : 1.1 }}
          whileTap={{ scale: (!message.trim() || isDisabled) ? 1 : 0.9 }}
          className={`p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            message.trim() && !isDisabled
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg hover:shadow-xl hover:from-yellow-500 hover:to-yellow-600'
              : 'bg-gray-200'
          }`}
        >
          <PaperAirplaneIcon className={`w-6 h-6 ${message.trim() && !isDisabled ? 'text-white' : 'text-gray-400'}`} />
        </motion.button>
      </div>
    </form>
  );
}

