import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageContainer from '../components/common/PageContainer';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import { communityService } from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';

export default function CreateCommunity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setNavBarContent } = useNavBarContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    visibility: 'public',
    icon: '',
    topics: '',
  });

  useEffect(() => {
    setNavBarContent({
      title: 'Create Community',
      showBack: true,
    });
  }, [setNavBarContent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Community name is required');
      return;
    }

    try {
      setLoading(true);

      // Format tags and topics as arrays
      const tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      const topics = formData.topics
        ? formData.topics.split(',').map(topic => topic.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        visibility: formData.visibility,
        icon: formData.icon.trim() || undefined,
        topics: topics.length > 0 ? topics : undefined,
      };

      const response = await communityService.createCommunity(payload);

      if (response.success) {
        toast.success('Community created successfully!');
        navigate(`/communities/${response.communityId || response.mongoId}`);
      }
    } catch (error) {
      const message = error.response?.data?.message ||
                     error.response?.data?.errors?.[0]?.message ||
                     'Failed to create community';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50" fullWidth={false} maxWidth="2xl" padding={true}>
      <div className="w-full max-w-2xl mx-auto py-4 lg:py-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a New Community</h2>

          {!user?.isPremium && !user?.isPhotoVerified && user?.role !== 'admin' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Only verified users or premium members can create communities. Please verify your photo or upgrade to premium.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Community Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={150}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="Enter community name"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.name.length}/150 characters</p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent resize-none"
                placeholder="Describe your community..."
              />
              <p className="mt-1 text-xs text-gray-500">{formData.description.length}/2000 characters</p>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="e.g., dating, relationships, social"
              />
              <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
            </div>

            <div>
              <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-2">
                Topics (comma-separated)
              </label>
              <input
                type="text"
                id="topics"
                name="topics"
                value={formData.topics}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="e.g., first dates, long distance, casual"
              />
              <p className="mt-1 text-xs text-gray-500">Separate topics with commas</p>
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
                Icon URL (optional)
              </label>
              <input
                type="url"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="flex gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/communities')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-6 py-3 bg-velora-primary text-black rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating...' : 'Create Community'}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

