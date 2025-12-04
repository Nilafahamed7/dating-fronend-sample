import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { matchService } from '../services/matchService';
import PageContainer from '../components/common/PageContainer';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import { CalendarIcon, MapPinIcon, UsersIcon, TagIcon, PhotoIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { setProfileTitle, setProfileShowBack } = useNavBarContext();
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventType: 'offline',
    visibility: 'public',
    locationName: '',
    locationDetails: {
      address: '',
      city: '',
      country: '',
      virtualLink: '',
    },
    date: '',
    endDate: '',
    maxParticipants: '',
    tags: '',
    interestTags: '',
  });

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    setProfileTitle('Create Event');
    setProfileShowBack(true);

    // Cleanup on unmount
    return () => {
      setProfileTitle(null);
      setProfileShowBack(false);
    };
  }, [setProfileTitle, setProfileShowBack]);

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await matchService.getMatchList();
      if (response.matches && Array.isArray(response.matches)) {
        setMatches(response.matches);
      }
    } catch (error) {
      // Don't show error toast, just silently fail
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('locationDetails.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        locationDetails: {
          ...formData.locationDetails,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const toggleInvitee = (userId) => {
    setSelectedInvitees((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!formData.date) {
      toast.error('Event date is required');
      return;
    }

    if (formData.eventType === 'offline' && !formData.locationName.trim()) {
      toast.error('Location is required for offline events');
      return;
    }

    if (formData.eventType === 'online' && !formData.locationDetails.virtualLink.trim()) {
      toast.error('Virtual link is required for online events');
      return;
    }

    try {
      setLoading(true);

      const eventData = {
        title: formData.title.trim(),
        eventType: formData.eventType,
        visibility: formData.visibility,
        date: new Date(formData.date).toISOString(),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : 0,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        interestTags: formData.interestTags ? formData.interestTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      // Add optional fields only if they have values
      if (formData.description.trim()) {
        eventData.description = formData.description.trim();
      }
      if (formData.category.trim()) {
        eventData.category = formData.category.trim();
      }
      if (formData.locationName.trim()) {
        eventData.locationName = formData.locationName.trim();
      }

      // Add locationDetails if any field has a value
      const locationDetails = {};
      if (formData.locationDetails.address.trim()) {
        locationDetails.address = formData.locationDetails.address.trim();
      }
      if (formData.locationDetails.city.trim()) {
        locationDetails.city = formData.locationDetails.city.trim();
      }
      if (formData.locationDetails.country.trim()) {
        locationDetails.country = formData.locationDetails.country.trim();
      }
      if (formData.locationDetails.virtualLink.trim()) {
        locationDetails.virtualLink = formData.locationDetails.virtualLink.trim();
      }
      if (Object.keys(locationDetails).length > 0) {
        eventData.locationDetails = locationDetails;
      }

      // For offline events, add location with default coordinates
      // Note: In production, you should use a geocoding service to get actual coordinates
      if (formData.eventType === 'offline') {
        eventData.location = {
          latitude: 0, // Default - should be replaced with actual geocoding
          longitude: 0, // Default - should be replaced with actual geocoding
        };
      }

      if (formData.endDate) {
        eventData.endDate = new Date(formData.endDate).toISOString();
      }

      const response = await eventService.createEvent(eventData);

      // Send invitations if any users are selected
      if (selectedInvitees.length > 0) {
        try {
          const eventId = response.eventId || response.mongoId;
          await eventService.inviteToEvent(eventId, selectedInvitees, inviteMessage || undefined);
          toast.success(`Event created and ${selectedInvitees.length} invitation(s) sent!`);
        } catch (inviteError) {
          toast.success('Event created successfully, but some invitations failed to send');
        }
      } else {
        toast.success('Event created successfully!');
      }

      navigate(`/events/${response.eventId || response.mongoId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50" fullWidth={false} maxWidth="3xl" padding={true}>
      <div className="w-full max-w-3xl mx-auto py-4 lg:py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Create New Event</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Describe your event..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Social, Networking, Sports"
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="offline">Offline (In-person)</option>
                <option value="online">Online (Virtual)</option>
              </select>
            </div>

            {/* Location for Offline Events */}
            {formData.eventType === 'offline' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleChange}
                  required={formData.eventType === 'offline'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., Central Park, Coffee Shop"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Address</label>
                    <input
                      type="text"
                      name="locationDetails.address"
                      value={formData.locationDetails.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
                    <input
                      type="text"
                      name="locationDetails.city"
                      value={formData.locationDetails.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Country</label>
                    <input
                      type="text"
                      name="locationDetails.country"
                      value={formData.locationDetails.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Virtual Link for Online Events */}
            {formData.eventType === 'online' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Virtual Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="locationDetails.virtualLink"
                  value={formData.locationDetails.virtualLink}
                  onChange={handleChange}
                  required={formData.eventType === 'online'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date & Time</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* Visibility and Max Participants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="0 = unlimited"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., networking, social, fun"
              />
            </div>

            {/* Interest Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Tags (comma-separated)</label>
              <input
                type="text"
                name="interestTags"
                value={formData.interestTags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., travel, music, sports"
              />
            </div>

            {/* Invite Participants */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Invite Participants</h3>
                  <p className="text-sm text-gray-600 mt-1">Invite your matches to join this event</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteSection(!showInviteSection)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-xl hover:bg-yellow-600 transition font-medium"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  {showInviteSection ? 'Hide' : 'Show'} Matches
                </button>
              </div>

              {showInviteSection && (
                <div className="space-y-4">
                  {loadingMatches ? (
                    <div className="text-center py-8 text-gray-500">Loading matches...</div>
                  ) : matches.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No matches found. Start matching to invite people to your events!
                    </div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-2">
                        {matches.map((match) => {
                          const user = match.user || match.otherUser || match;
                          const userId = user._id || user.userId || match.userId;
                          const userName = user.name || 'Unknown User';
                          const userPhoto = user.photo || user.photos?.[0]?.url || user.primaryPhoto?.url;
                          const isSelected = selectedInvitees.includes(userId);

                          return (
                            <div
                              key={userId}
                              onClick={() => toggleInvitee(userId)}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                                isSelected
                                  ? 'bg-yellow-100 border-2 border-yellow-500'
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <div className="relative">
                                {userPhoto ? (
                                  <img
                                    src={userPhoto}
                                    alt={userName}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{userName}</p>
                                {user.age && <p className="text-sm text-gray-500">{user.age} years</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedInvitees.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">
                              Selected: {selectedInvitees.length} {selectedInvitees.length === 1 ? 'person' : 'people'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedInvitees([])}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Clear all
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Invitation Message (Optional)
                            </label>
                            <textarea
                              value={inviteMessage}
                              onChange={(e) => setInviteMessage(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="Add a personal message to your invitation..."
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

