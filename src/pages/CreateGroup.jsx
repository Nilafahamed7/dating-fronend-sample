import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { matchService } from '../services/matchService';
import PageContainer from '../components/common/PageContainer';
import { useNavBarContext } from '../components/common/GlobalNavBar';
import { UsersIcon, TagIcon, LockClosedIcon, KeyIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CreateGroup() {
  const navigate = useNavigate();
  const { setNavBarContent } = useNavBarContext();
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    privacy: 'public',
    tags: '',
    passkey: '',
  });

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    setNavBarContent({
      title: 'Create Group',
      showBack: true,
    });
  }, [setNavBarContent]);

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await matchService.getMatchList();
      setMatches(response.matches || []);
    } catch (error) {
      } finally {
      setLoadingMatches(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (!formData.passkey.trim()) {
      toast.error('Passkey is required');
      return;
    }

    if (formData.passkey.length < 4 || formData.passkey.length > 20) {
      toast.error('Passkey must be between 4 and 20 characters');
      return;
    }

    try {
      setLoading(true);
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag)
        : [];

      const response = await groupService.createGroup({
        groupName: formData.groupName.trim(),
        description: formData.description.trim(),
        privacy: formData.privacy,
        tags: tagsArray,
        passkey: formData.passkey.trim(),
        inviteUsers: selectedUsers, // Send selected users for invitation
      });

      if (response.success) {
        toast.success('Group created successfully!');

        if (selectedUsers.length > 0) {
          toast.success(`Invitations sent to ${selectedUsers.length} user(s) via chat!`, {
            duration: 4000,
          });
        } else {
          toast.success(`Your group passkey is: ${response.passkey}. Share this with people who want to join.`, {
            duration: 6000,
          });
        }

        navigate('/groups');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create group';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50" fullWidth={false} maxWidth="2xl" padding={true}>
      <div className="w-full max-w-2xl mx-auto py-4 lg:py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700 mb-2">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="groupName"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
              required
              maxLength={150}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={2000}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              placeholder="Describe your group..."
            />
          </div>

          <div>
            <label htmlFor="privacy" className="block text-sm font-semibold text-gray-700 mb-2">
              Privacy
            </label>
            <select
              id="privacy"
              name="privacy"
              value={formData.privacy}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label htmlFor="passkey" className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5" />
                Passkey <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              id="passkey"
              name="passkey"
              value={formData.passkey}
              onChange={handleChange}
              required
              minLength={4}
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter a passkey (4-20 characters)"
            />
            <p className="mt-2 text-xs text-gray-500">
              Users will need this passkey to join your group. Share it with people you want to invite.
            </p>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Tags
              </div>
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter tags separated by commas (e.g., sports, fitness, outdoor)"
            />
            <p className="mt-2 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Invite Users Section */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowInviteSection(!showInviteSection)}
              className="flex items-center gap-2 text-gray-700 font-semibold hover:text-yellow-600 transition-colors mb-4"
            >
              <UserPlusIcon className="w-5 h-5" />
              Invite Matched Users (Optional)
              <span className="text-sm font-normal text-gray-500">
                {selectedUsers.length > 0 && `(${selectedUsers.length} selected)`}
              </span>
            </button>

            {showInviteSection && (
              <div className="space-y-3">
                {loadingMatches ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                    <p className="text-gray-500 mt-2 text-sm">Loading matches...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No matches found. Match with users to invite them.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-2xl p-4">
                    {matches.map((match) => {
                      const user = match.user || {};
                      const userId = user.id || user._id;
                      const isSelected = selectedUsers.includes(userId);

                      return (
                        <div
                          key={userId}
                          onClick={() => toggleUserSelection(userId)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-yellow-100 border-2 border-yellow-500'
                              : 'bg-white border-2 border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={user.photo || 'https://via.placeholder.com/50'}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{user.name}</h4>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-yellow-500 border-yellow-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Selected users will receive an invitation via chat with "Join" and "Reject" buttons.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/groups')}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

