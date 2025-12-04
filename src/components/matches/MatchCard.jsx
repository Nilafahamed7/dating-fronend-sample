import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDate, calculateAge, getPlaceholderImage } from '../../utils/helpers';
import PremiumBadge from '../common/PremiumBadge';

export default function MatchCard({ match, index = 0 }) {
  // Backend returns: { matchId, user: { id, name, photo }, since }
  const otherUser = match.user || match.otherUser || {};
  const profile = otherUser.profile || otherUser.Profile || {};
  const photos = profile.photos || otherUser.photos || [];
  const primaryPhoto = otherUser.photo || photos.find(p => p.isPrimary) || photos[0];
  const age = calculateAge(profile.dob || otherUser.dateOfBirth);
  const placeholderImg = getPlaceholderImage(100, 100, 'No Photo');

  // Get match ID for chat navigation
  const matchId = match.matchId || match._id;
  const userId = otherUser.id || otherUser._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{
        scale: 1.03,
        y: -8,
        rotateY: 2,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 20
        }
      }}
      whileTap={{ scale: 0.97 }}
      style={{ perspective: 1000 }}
    >
      <Link
        to={`/chat/${matchId || userId}`}
        className="block bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300"
      >
      <div className="flex items-center gap-4">
        <motion.div
          className="relative flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        >
          <motion.img
            src={primaryPhoto?.url || primaryPhoto || placeholderImg}
            alt={otherUser.name || 'Match'}
            className="w-20 h-20 rounded-full object-cover border-4 border-velora-primary/20"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: index * 0.1 + 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            onError={(e) => {
              // Prevent infinite loop - only set placeholder if current src is not already placeholder
              if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
                e.target.src = placeholderImg;
              }
            }}
          />
          {match.unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-velora-primary rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: index * 0.1 + 0.3,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              <motion.span
                animate={{
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {match.unreadCount > 9 ? '9+' : match.unreadCount}
              </motion.span>
            </motion.div>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-velora-darkGray truncate">
                {otherUser.name}
              </h3>
              <PremiumBadge
                isPremium={otherUser.isPremium || otherUser.userId?.isPremium}
                placement="inline"
                size="sm"
              />
            </div>
            {(match.since || match.matchedAt) && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatDate(match.since || match.matchedAt)}
              </span>
            )}
          </div>

          {age && (
            <p className="text-sm text-gray-600 mb-1">{age} years old</p>
          )}

          {match.lastMessage && (
            <p className="text-sm text-gray-500 truncate">
              {match.lastMessage.text || 'New match!'}
            </p>
          )}

          {!match.lastMessage && (
            <p className="text-sm text-velora-primary font-medium">
              New match! Say hi 👋
            </p>
          )}
        </div>
      </div>
    </Link>
    </motion.div>
  );
}

