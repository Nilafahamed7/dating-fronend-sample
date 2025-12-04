import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forumService } from '../services/forumService';
import PageContainer from '../components/common/PageContainer';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import { ChatBubbleLeftRightIcon, TagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CreateForum() {
  const navigate = useNavigate();
  const { setNavBarContent } = useNavBarContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    visibility: 'public',
  });

  useEffect(() => {
    setNavBarContent({
      title: 'Create Forum',
      showBack: true,
    });
  }, [setNavBarContent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Forum title is required');
      return;
    }

    try {
      setLoading(true);

      const forumData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      const response = await forumService.createForum(forumData);

      toast.success('Forum created successfully!');
      navigate(`/forums/${response.forumId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create forum');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50" fullWidth={false} maxWidth="3xl" padding={true}>
      <div className="w-full max-w-3xl mx-auto py-4 lg:py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Create New Forum</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Forum Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter forum title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Describe what this forum is about..."
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Invite only</option>
                <option value="premium">Premium - Premium members only</option>
              </select>
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
                placeholder="e.g., technology, lifestyle, hobbies"
              />
              <p className="mt-2 text-sm text-gray-500">Separate multiple tags with commas</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Forum'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/forums')}
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

