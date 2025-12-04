import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageContainer from '../components/common/PageContainer';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import { groupDateService } from '../services/groupDateService';
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function CreateGroupDate() {
  const navigate = useNavigate();
  const { setNavBarContent } = useNavBarContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'group',
    location: '',
    date: '',
    time: '',
    participantsLimit: 4,
    notes: '',
    visibility: 'public',
  });

  useEffect(() => {
    setNavBarContent({
      title: 'Create Group Date',
      showBack: true,
    });
  }, [setNavBarContent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.location || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const payload = {
        title: formData.title,
        type: formData.type,
        location: formData.location,
        date: dateTime.toISOString(),
        participantsLimit: parseInt(formData.participantsLimit),
        notes: formData.notes,
        visibility: formData.visibility,
      };

      const response = await groupDateService.createGroupDate(payload);
      toast.success('Group date created successfully!');
      navigate('/group-dates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50" fullWidth={false} maxWidth="2xl" padding={true}>
      <div className="w-full max-w-2xl mx-auto py-4 lg:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Coffee & Chat"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="group">Group Date</option>
                <option value="double">Double Date</option>
                <option value="activity">Activity</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="w-4 h-4 inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Central Park Cafe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Participants Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UsersIcon className="w-4 h-4 inline mr-1" />
                Max Participants
              </label>
              <input
                type="number"
                name="participantsLimit"
                value={formData.participantsLimit}
                onChange={handleChange}
                min="2"
                max="20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="friends">Friends Only</option>
                <option value="matches">Matches Only</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional details about the group date..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/group-dates')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group Date'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </PageContainer>
  );
}

