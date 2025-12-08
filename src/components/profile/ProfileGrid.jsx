import ProfileGridCard from './ProfileGridCard';
import EmptyState from '../common/EmptyState';
import { HeartIcon } from '@heroicons/react/24/outline';
import { usePresence } from '../../contexts/PresenceContext';

export default function ProfileGrid({ profiles, currentUserLocation, onAction, loading, presenceMap: propPresenceMap = {}, onlineFilter = false }) {
  const { isUserOnline, presenceMap: contextPresenceMap } = usePresence();
  
  // Use context presence map (authoritative) - it's always up-to-date with real-time events
  const presenceMap = contextPresenceMap || propPresenceMap;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-velora-gray border-t-velora-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    // Show specific message for online filter
    if (onlineFilter) {
      return (
        <EmptyState
          icon={HeartIcon}
          title="No one is online right now"
          message="Try switching to 'All' profiles to see more people, or check back later!"
        />
      );
    }
    
    return (
      <EmptyState
        icon={HeartIcon}
        title="No profiles found"
        message="Try adjusting your filters or check back later!"
      />
    );
  }

  return (
    <div className="w-full" style={{ position: 'relative', zIndex: 1 }}>
      {/* Profile Grid - Responsive: 1 col mobile, 2 tablet, 3 desktop, 4 xl */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6"
        style={{
          display: 'grid',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {profiles.map((profile, index) => {
          const userId = profile.userId?._id || profile.userId || profile._id;
          // Presence context is AUTHORITATIVE - if user is marked offline in context, they're offline
          // Only check profile data if not in presence context yet (initial load)
          const userIdStr = userId?.toString();
          const presenceData = presenceMap[userIdStr];
          const isOnline = presenceData 
            ? presenceData.isOnline === true  // If in presence context, use that (authoritative)
            : (profile.isOnline === true);    // Otherwise, use profile data (initial load only)
          return (
            <ProfileGridCard
              key={profile._id || profile.userId?._id || index}
              profile={profile}
              currentUserLocation={currentUserLocation}
              onAction={onAction}
              index={index}
              isOnline={isOnline}
            />
          );
        })}
      </div>
    </div>
  );
}
