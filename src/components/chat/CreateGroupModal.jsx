import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, UserPlusIcon, LockClosedIcon, GlobeAltIcon, KeyIcon, TagIcon } from '@heroicons/react/24/outline';
import { groupService } from '../../services/groupService';
import { matchService } from '../../services/matchService';
import { getPlaceholderImage, getInitials } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';

export default function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addGroupOptimistically, loadGroups } = useGroups();
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    avatar: null,
    privacy: 'public', // 'public' or 'private'
    passkey: '',
  });
  const [availableTags, setAvailableTags] = useState([
    'Dating', 'Friendship', 'Networking', 'Hobbies', 'Sports', 'Travel',
    'Food', 'Music', 'Movies', 'Books', 'Fitness', 'Art', 'Technology',
    'Business', 'Education', 'Entertainment', 'Lifestyle', 'Health'
  ]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen && showInviteSection) {
      loadMatches();
    }
  }, [isOpen, showInviteSection]);

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await matchService.getMatchList();
      const matchesList = response.matches || response.data || [];
      // Filter out fake users
      setMatches(matchesList.filter(m => {
        const otherUser = m.user || m.otherUser || {};
        return !otherUser.isFake;
      }));
    } catch (error) {
      toast.error('Failed to load matches');
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  const addTag = (tag) => {
    if (!tag || !tag.trim()) return;

    const trimmedTag = tag.trim();
    if (formData.tags.includes(trimmedTag)) {
      toast.error('Tag already added');
      return;
    }

    if (formData.tags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag],
    }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Permission check: Only premium males and all females can create groups
    const canCreate = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);
    if (!canCreate) {
      toast.error('Only premium male users and all female users can create groups. Please upgrade to premium.');
      setTimeout(() => {
        handleClose();
        window.location.href = '/subscriptions';
      }, 2000);
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (formData.name.trim().length < 3) {
      toast.error('Group name must be at least 3 characters');
      return;
    }

    if (formData.name.trim().length > 150) {
      toast.error('Group name must be less than 150 characters');
      return;
    }

    if (formData.description && formData.description.length > 2000) {
      toast.error('Description must be less than 2000 characters');
      return;
    }

    // Passkey is REQUIRED
    if (!formData.passkey || !formData.passkey.trim()) {
      toast.error('Passkey is required to create a group');
      return;
    }

    if (formData.passkey.trim().length < 4 || formData.passkey.trim().length > 20) {
      toast.error('Passkey must be between 4 and 20 characters');
      return;
    }

    try {
      setLoading(true);

      // Prepare group data for backend
      const groupData = {
        groupName: formData.name.trim(),
        description: formData.description.trim() || undefined,
        privacy: formData.privacy,
        passkey: formData.passkey.trim(),
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        inviteUsers: selectedUsers.length > 0 ? selectedUsers : undefined,
      };

      const response = await groupService.createGroup(groupData);

      if (response.success) {
        toast.success('Group created successfully!');
        toast.success('Remember to share the passkey with people you want to invite!', { duration: 5000 });

        // Reload groups to get the new group with full details
        await loadGroups();

        // Navigate to the new group
        if (response.groupId) {
          navigate(`/group/${response.groupId}`);
        }

        // Pass the created group to the success handler
        onSuccess?.(response);
        handleClose();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create group';
      const errorCode = error.response?.data?.code;

      if (errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Premium membership required to create groups. Please upgrade.', { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', tags: [], avatar: null, privacy: 'public', passkey: '' });
    setSelectedUsers([]);
    setShowInviteSection(false);
    setTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  const placeholderImg = getPlaceholderImage(100, 100, 'No Photo');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Create Group</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Permission Check */}
            {(() => {
              const canCreate = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);
              if (!canCreate) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Premium Required:</strong> Only premium male users and all female users can create groups.
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          window.location.href = '/subscriptions';
                        }}
                        className="ml-1 underline font-semibold"
                      >
                        Upgrade now
                      </button>
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Group Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={150}
                minLength={3}
                disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter group name"
              />
            </div>

            {/* Description */}
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
                disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Describe your group (optional)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </div>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-velora-primary/20 text-velora-primary rounded-full text-sm"
                  >
                    {tag}
                    <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true)) || !tagInput.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {availableTags.filter(tag => !formData.tags.includes(tag)).slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-semibold text-gray-700 mb-2">
                Group Avatar (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {formData.avatar ? (
                    <img
                      src={URL.createObjectURL(formData.avatar)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-2xl">📷</span>
                  )}
                </div>
                <label className="flex-1">
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-center text-sm">
                    Choose Image
                  </div>
                </label>
              </div>
            </div>

            {/* Passkey - REQUIRED */}
            <div>
              <label htmlFor="passkey" className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-4 h-4" />
                  Passkey <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="password"
                id="passkey"
                name="passkey"
                value={formData.passkey}
                onChange={handleChange}
                required
                maxLength={20}
                minLength={4}
                disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter a passkey (4-20 characters, required)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Users will need this passkey to join your group. Share it with people you want to invite.
              </p>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={handleChange}
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    className="w-5 h-5 text-velora-primary focus:ring-velora-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Public (anyone with passkey can join)
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={handleChange}
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    className="w-5 h-5 text-velora-primary focus:ring-velora-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2">
                    <LockClosedIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Private (invite only)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Invite Members */}
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowInviteSection(!showInviteSection)}
                className="flex items-center gap-2 text-gray-700 font-semibold hover:text-velora-primary transition-colors mb-3"
              >
                <UserPlusIcon className="w-5 h-5" />
                Invite Members (Optional)
                {selectedUsers.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedUsers.length} selected)
                  </span>
                )}
              </button>

              {showInviteSection && (
                <div className="space-y-3">
                  {loadingMatches ? (
                    <div className="text-center py-4">
                      <LoadingSpinner />
                      <p className="text-gray-500 mt-2 text-sm">Loading matches...</p>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No matches found. Match with users to invite them.</p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
                      {matches.map((match) => {
                        const otherUser = match.user || match.otherUser || {};
                        const userId = otherUser.id || otherUser._id;
                        const isSelected = selectedUsers.includes(userId?.toString());
                        const avatar = otherUser.photo || otherUser.photos?.[0]?.url || placeholderImg;
                        const name = otherUser.name || 'Unknown';

                        return (
                          <div
                            key={userId}
                            onClick={() => toggleUserSelection(userId?.toString())}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-velora-primary/20 border-2 border-velora-primary'
                                : 'bg-white border-2 border-transparent hover:border-gray-300'
                            }`}
                          >
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  if (e.target.src !== placeholderImg) {
                                    e.target.src = placeholderImg;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-semibold text-sm">
                                  {getInitials(name)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 truncate">{name}</h4>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-velora-primary border-velora-primary'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim() || !formData.passkey.trim() || !(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
              className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Creating...
                </>
              ) : !(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true)) ? (
                'Not Allowed'
              ) : !formData.passkey.trim() ? (
                'Passkey Required'
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




import { useNavigate } from 'react-router-dom';
import { XMarkIcon, UserPlusIcon, LockClosedIcon, GlobeAltIcon, KeyIcon, TagIcon } from '@heroicons/react/24/outline';
import { groupService } from '../../services/groupService';
import { matchService } from '../../services/matchService';
import { getPlaceholderImage, getInitials } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../contexts/GroupsContext';

export default function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addGroupOptimistically, loadGroups } = useGroups();
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    avatar: null,
    privacy: 'public', // 'public' or 'private'
    passkey: '',
  });
  const [availableTags, setAvailableTags] = useState([
    'Dating', 'Friendship', 'Networking', 'Hobbies', 'Sports', 'Travel',
    'Food', 'Music', 'Movies', 'Books', 'Fitness', 'Art', 'Technology',
    'Business', 'Education', 'Entertainment', 'Lifestyle', 'Health'
  ]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen && showInviteSection) {
      loadMatches();
    }
  }, [isOpen, showInviteSection]);

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await matchService.getMatchList();
      const matchesList = response.matches || response.data || [];
      // Filter out fake users
      setMatches(matchesList.filter(m => {
        const otherUser = m.user || m.otherUser || {};
        return !otherUser.isFake;
      }));
    } catch (error) {
      toast.error('Failed to load matches');
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  const addTag = (tag) => {
    if (!tag || !tag.trim()) return;

    const trimmedTag = tag.trim();
    if (formData.tags.includes(trimmedTag)) {
      toast.error('Tag already added');
      return;
    }

    if (formData.tags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag],
    }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Permission check: Only premium males and all females can create groups
    const canCreate = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);
    if (!canCreate) {
      toast.error('Only premium male users and all female users can create groups. Please upgrade to premium.');
      setTimeout(() => {
        handleClose();
        window.location.href = '/subscriptions';
      }, 2000);
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (formData.name.trim().length < 3) {
      toast.error('Group name must be at least 3 characters');
      return;
    }

    if (formData.name.trim().length > 150) {
      toast.error('Group name must be less than 150 characters');
      return;
    }

    if (formData.description && formData.description.length > 2000) {
      toast.error('Description must be less than 2000 characters');
      return;
    }

    // Passkey is REQUIRED
    if (!formData.passkey || !formData.passkey.trim()) {
      toast.error('Passkey is required to create a group');
      return;
    }

    if (formData.passkey.trim().length < 4 || formData.passkey.trim().length > 20) {
      toast.error('Passkey must be between 4 and 20 characters');
      return;
    }

    try {
      setLoading(true);

      // Prepare group data for backend
      const groupData = {
        groupName: formData.name.trim(),
        description: formData.description.trim() || undefined,
        privacy: formData.privacy,
        passkey: formData.passkey.trim(),
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        inviteUsers: selectedUsers.length > 0 ? selectedUsers : undefined,
      };

      const response = await groupService.createGroup(groupData);

      if (response.success) {
        toast.success('Group created successfully!');
        toast.success('Remember to share the passkey with people you want to invite!', { duration: 5000 });

        // Reload groups to get the new group with full details
        await loadGroups();

        // Navigate to the new group
        if (response.groupId) {
          navigate(`/group/${response.groupId}`);
        }

        // Pass the created group to the success handler
        onSuccess?.(response);
        handleClose();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create group';
      const errorCode = error.response?.data?.code;

      if (errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Premium membership required to create groups. Please upgrade.', { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', tags: [], avatar: null, privacy: 'public', passkey: '' });
    setSelectedUsers([]);
    setShowInviteSection(false);
    setTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  const placeholderImg = getPlaceholderImage(100, 100, 'No Photo');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Create Group</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Permission Check */}
            {(() => {
              const canCreate = user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true);
              if (!canCreate) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Premium Required:</strong> Only premium male users and all female users can create groups.
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          window.location.href = '/subscriptions';
                        }}
                        className="ml-1 underline font-semibold"
                      >
                        Upgrade now
                      </button>
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Group Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={150}
                minLength={3}
                disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter group name"
              />
            </div>

            {/* Description */}
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
                disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Describe your group (optional)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </div>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-velora-primary/20 text-velora-primary rounded-full text-sm"
                  >
                    {tag}
                    <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true)) || !tagInput.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {availableTags.filter(tag => !formData.tags.includes(tag)).slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-semibold text-gray-700 mb-2">
                Group Avatar (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {formData.avatar ? (
                    <img
                      src={URL.createObjectURL(formData.avatar)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-2xl">📷</span>
                  )}
                </div>
                <label className="flex-1">
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-center text-sm">
                    Choose Image
                  </div>
                </label>
              </div>
            </div>

            {/* Passkey - REQUIRED */}
            <div>
              <label htmlFor="passkey" className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-4 h-4" />
                  Passkey <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="password"
                id="passkey"
                name="passkey"
                value={formData.passkey}
                onChange={handleChange}
                required
                maxLength={20}
                minLength={4}
                disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter a passkey (4-20 characters, required)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Users will need this passkey to join your group. Share it with people you want to invite.
              </p>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={handleChange}
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    className="w-5 h-5 text-velora-primary focus:ring-velora-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Public (anyone with passkey can join)
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={handleChange}
                    disabled={!(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
                    className="w-5 h-5 text-velora-primary focus:ring-velora-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2">
                    <LockClosedIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Private (invite only)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Invite Members */}
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowInviteSection(!showInviteSection)}
                className="flex items-center gap-2 text-gray-700 font-semibold hover:text-velora-primary transition-colors mb-3"
              >
                <UserPlusIcon className="w-5 h-5" />
                Invite Members (Optional)
                {selectedUsers.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedUsers.length} selected)
                  </span>
                )}
              </button>

              {showInviteSection && (
                <div className="space-y-3">
                  {loadingMatches ? (
                    <div className="text-center py-4">
                      <LoadingSpinner />
                      <p className="text-gray-500 mt-2 text-sm">Loading matches...</p>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No matches found. Match with users to invite them.</p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
                      {matches.map((match) => {
                        const otherUser = match.user || match.otherUser || {};
                        const userId = otherUser.id || otherUser._id;
                        const isSelected = selectedUsers.includes(userId?.toString());
                        const avatar = otherUser.photo || otherUser.photos?.[0]?.url || placeholderImg;
                        const name = otherUser.name || 'Unknown';

                        return (
                          <div
                            key={userId}
                            onClick={() => toggleUserSelection(userId?.toString())}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-velora-primary/20 border-2 border-velora-primary'
                                : 'bg-white border-2 border-transparent hover:border-gray-300'
                            }`}
                          >
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  if (e.target.src !== placeholderImg) {
                                    e.target.src = placeholderImg;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-semibold text-sm">
                                  {getInitials(name)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 truncate">{name}</h4>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-velora-primary border-velora-primary'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim() || !formData.passkey.trim() || !(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true))}
              className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Creating...
                </>
              ) : !(user?.gender === 'female' || (user?.gender === 'male' && user?.isPremium === true)) ? (
                'Not Allowed'
              ) : !formData.passkey.trim() ? (
                'Passkey Required'
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

