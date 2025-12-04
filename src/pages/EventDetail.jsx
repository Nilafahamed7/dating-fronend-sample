import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
// NavBar removed - using GlobalNavBar from App.jsx
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  TagIcon,
  EyeIcon,
  UserIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PremiumBadge from '../components/common/PremiumBadge';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventDetails(id);
      setEvent(response.event);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    try {
      setJoining(true);
      await eventService.joinEvent(id);
      toast.success('Joined event successfully!');
      loadEventDetails(); // Reload to update participant count
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join event');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await eventService.deleteEvent(id);
      toast.success('Event deleted successfully!');
      navigate('/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const isHost = event.hostId?.toString() === user?._id?.toString() || event.host === user?.name;
  const isParticipant = event.participants?.some(p => p.id?.toString() === user?._id?.toString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h1>
            {event.category && (
              <div className="flex items-center gap-2 text-yellow-100">
                <TagIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{event.category}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Start Date & Time</p>
                  <p className="font-medium text-gray-800">{formatDate(event.date)}</p>
                </div>
              </div>

              {event.endDate && (
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">End Date & Time</p>
                    <p className="font-medium text-gray-800">{formatDate(event.endDate)}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{event.location}</p>
                    {event.locationDetails?.address && (
                      <p className="text-xs text-gray-500 mt-1">{event.locationDetails.address}</p>
                    )}
                    {(event.locationDetails?.city || event.locationDetails?.country) && (
                      <p className="text-xs text-gray-500">
                        {[event.locationDetails.city, event.locationDetails.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {event.locationDetails?.virtualLink && (
                      <a
                        href={event.locationDetails.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-yellow-600 hover:text-yellow-700 underline mt-1 block"
                      >
                        Join Virtual Event
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <UsersIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="font-medium text-gray-800">
                    {event.participants?.length || 0}
                    {event.maxParticipants > 0 ? ` / ${event.maxParticipants}` : ''} {event.participants?.length === 1 ? 'person' : 'people'}
                  </p>
                </div>
              </div>

              {event.radius && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Radius</p>
                    <p className="font-medium text-gray-800">{event.radius}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <EyeIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Visibility</p>
                  <p className="font-medium text-gray-800 capitalize">{event.visibility || 'Public'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Host</p>
                  <p className="font-medium text-gray-800">{event.host || 'Unknown'}</p>
                </div>
              </div>

              {event.eventType && (
                <div className="flex items-start gap-3">
                  <TagIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Event Type</p>
                    <p className="font-medium text-gray-800 capitalize">{event.eventType}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {((event.tags && event.tags.length > 0) || (event.interestTags && event.interestTags.length > 0)) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags?.map((tag, index) => (
                    <span
                      key={`tag-${index}`}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {event.interestTags?.map((tag, index) => (
                    <span
                      key={`interest-${index}`}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Participants List */}
            {event.participants && event.participants.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Participants</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-800">{participant.name}</p>
                          <PremiumBadge
                            isPremium={participant.isPremium}
                            placement="inline"
                            size="sm"
                          />
                        </div>
                        {participant.checkedIn && (
                          <p className="text-xs text-green-600">Checked in</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              {!isHost && !isParticipant && (
                <button
                  onClick={handleJoinEvent}
                  disabled={joining}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'Joining...' : 'Join Event'}
                </button>
              )}
              {isParticipant && (
                <div className="flex-1 bg-green-50 text-green-700 px-6 py-3 rounded-xl text-center font-semibold">
                  You're participating in this event
                </div>
              )}
              {isHost && (
                <>
                  <div className="flex-1 bg-yellow-50 text-yellow-700 px-6 py-3 rounded-xl text-center font-semibold">
                    You're hosting this event
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteEvent}
                    disabled={deleting}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="w-5 h-5" />
                    {deleting ? 'Deleting...' : 'Delete Event'}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

