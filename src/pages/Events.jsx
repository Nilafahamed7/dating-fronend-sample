import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
// NavBar and Sidebar removed - using GlobalNavBar and GlobalSidebar from App.jsx
import { PlusIcon, CalendarIcon, MapPinIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, my-events, nearby
  const [userLocation, setUserLocation] = useState(null);
  const scrollContainerRef = useRef(null);

  // Get user location when filter is 'nearby'
  useEffect(() => {
    if (filter === 'nearby') {
      if (!userLocation) {
        // Request location permission
        getCurrentLocation();
      } else {
        // If we already have location (or attempted), load events
        loadEvents();
      }
    } else {
      // For other filters, load events immediately
      loadEvents();
      // Reset location when switching away from nearby
      setUserLocation(null);
    }
  }, [filter]);

  // Reload events when location is obtained for nearby filter
  useEffect(() => {
    if (filter === 'nearby' && userLocation !== null) {
      loadEvents();
    }
  }, [userLocation]);

  // Scroll to top when component mounts or filter changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filter]);

  // Scroll to top on initial mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          // If geolocation fails, backend will try to use profile location
          setUserLocation({ latitude: null, longitude: null });
        }
      );
    } else {
      // Geolocation not supported, backend will try profile location
      setUserLocation({ latitude: null, longitude: null });
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      let response;
      if (filter === 'my-events') {
        response = await eventService.getMyEvents();
        // Combine and remove duplicates based on event ID
        const allEvents = [...(response.joinedEvents || []), ...(response.createdEvents || [])];
        const uniqueEvents = Array.from(
          new Map(allEvents.map(event => [event.id || event.mongoId, event])).values()
        );
        setEvents(uniqueEvents);
      } else if (filter === 'nearby') {
        // If we have location, use it; otherwise let backend try profile location
        const params = userLocation?.latitude && userLocation?.longitude
          ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }
          : {};
        response = await eventService.getNearbyEvents(params);
        setEvents(response.events || []);
      } else {
        response = await eventService.listEvents();
        setEvents(response.events || []);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load events';
      toast.error(errorMessage);

      // If nearby events fail due to location, suggest enabling location
      if (filter === 'nearby' && errorMessage.includes('latitude and longitude')) {
        toast.error('Please enable location access or set your location in your profile');
      }

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await eventService.joinEvent(eventId);
      toast.success('Joined event successfully');
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join event');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col w-full">
      {/* Sidebar removed - using GlobalSidebar from App.jsx */}
      {/* NavBar removed - using GlobalNavBar from App.jsx */}

      {/* Main Content Area - Full width on right side */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6" style={{ paddingTop: '1rem' }}>
        {/* Header with Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Events</h1>
          </div>
          <button
            onClick={() => navigate('/events/create')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2.5 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'my-events', 'nearby'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base whitespace-nowrap ${
                filter === f
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {f === 'all' ? 'All Events' : f === 'my-events' ? 'My Events' : 'Nearby'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No events found</p>
            <p className="text-gray-500 text-sm mt-2">Create your first event to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id || event.mongoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 line-clamp-2">{event.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{formatDate(event.date)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="break-words">
                          {event.location}
                          {event.distance && (
                            <span className="text-yellow-600 font-medium ml-1">({event.distance} away)</span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{event.participants || event.attendees || 0} participants</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id || event.mongoId}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </button>
                    {filter !== 'my-events' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinEvent(event.id || event.mongoId);
                        }}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2.5 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm font-medium"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

