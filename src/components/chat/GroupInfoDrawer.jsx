import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceIndicator from './PresenceIndicator';
import { XMarkIcon, UserGroupIcon, UserPlusIcon, PencilIcon, CheckIcon, XMarkIcon as XIcon, TrashIcon, LinkIcon, ClipboardDocumentIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { groupChatService } from '../../services/groupChatService';
import { matchService } from '../../services/matchService';
import { getPlaceholderImage, getInitials } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function GroupInfoDrawer({ groupId, isOpen, onClose, onLeave }) {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviting, setInviting] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [loadingInviteLink, setLoadingInviteLink] = useState(false);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' or 'link'
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const navigate = useNavigate();
  const placeholderImg = getPlaceholderImage(100, 100, 'No Photo');

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 640);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupInfo();
    }
  }, [isOpen, groupId]);

  useEffect(() => {
    if (showInviteModal && activeTab === 'matches') {
      loadMatchedUsers();
    }
  }, [showInviteModal, activeTab]);

  const loadMatchedUsers = async () => {
    try {
      setLoadingMatches(true);
      const response = await matchService.getMatchList();
      if (response.success && response.data) {
        // Filter out users who are already members
        const memberIds = group?.members?.map(m => (m._id?.toString() || m.toString())) || [];
        const availableMatches = (response.data.matches || []).filter(match => {
          const userId = match.user?._id?.toString() || match.otherUser?._id?.toString() || match._id?.toString();
          return !memberIds.includes(userId);
        });
        setMatchedUsers(availableMatches);
      }
    } catch (error) {
      toast.error('Failed to load matched users');
    } finally {
      setLoadingMatches(false);
    }
  };

  const generateInviteLink = async () => {
    try {
      setLoadingInviteLink(true);
      const response = await groupChatService.generateInviteLink(groupId);
      if (response.success && response.data) {
        setInviteLink(response.data.inviteUrl);
        toast.success('Invite link generated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invite link');
    } finally {
      setLoadingInviteLink(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      const response = await groupChatService.getGroupInfo(groupId);
      if (response.success) {
        setGroup(response.data);
        setEditName(response.data.name || '');
        setEditDescription(response.data.description || '');
      }
    } catch (error) {
      toast.error('Failed to load group info');
    } finally {
      setLoading(false);
    }
  };

  const isAdminOrCreator = () => {
    if (!group || !user) return false;
    const isAdmin = group.admins?.some(a => a._id?.toString() === user._id?.toString() || a.toString() === user._id?.toString());
    const isCreator = group.createdBy?._id?.toString() === user._id?.toString() || group.createdBy?.toString() === user._id?.toString();
    return isAdmin || isCreator;
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (editName.trim().length < 3) {
      toast.error('Group name must be at least 3 characters');
      return;
    }

    if (editName.trim().length > 150) {
      toast.error('Group name must be less than 150 characters');
      return;
    }

    if (editDescription && editDescription.length > 2000) {
      toast.error('Description must be less than 2000 characters');
      return;
    }

    try {
      setSaving(true);
      const response = await groupChatService.updateGroup(groupId, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });

      if (response.success) {
        toast.success('Group updated successfully');
        setEditingName(false);
        setEditingDescription(false);
        loadGroupInfo(); // Reload to get updated data
        onLeave?.(); // Trigger parent refresh
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update group';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(group?.name || '');
    setEditDescription(group?.description || '');
    setEditingName(false);
    setEditingDescription(false);
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all messages and members.`)) {
      return;
    }

    try {
      setDeleting(true);
      await groupChatService.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      onClose();
      navigate('/chat');
      onLeave?.(); // Trigger parent refresh
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete group';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      setLeaving(true);
      await groupChatService.leaveGroup(groupId);
      toast.success('Left group successfully');
      onLeave?.();
      onClose();
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    } finally {
      setLeaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden flex flex-col"
          style={{
            maxHeight: isDesktop ? '90vh' : 'calc(100vh - var(--bottom-navbar-height, 60px) - 1rem)',
            marginBottom: isDesktop ? '0' : 'var(--bottom-navbar-height, 60px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Group Info</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: '1rem' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : group ? (
              <>
                {/* Group Avatar and Name */}
                <div className="text-center mb-6">
                  <img
                    src={group.avatar || placeholderImg}
                    alt={group.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                    onError={(e) => {
                      if (e.target.src !== placeholderImg) {
                        e.target.src = placeholderImg;
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {editingName ? (
                      <div className="flex items-center gap-2 w-full max-w-xs mx-auto">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary text-lg font-bold text-center"
                          maxLength={150}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="p-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold text-gray-900">{group.name}</h3>
                        {isAdminOrCreator() && (
                          <button
                            onClick={() => {
                              setEditingName(true);
                              setEditName(group.name || '');
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit name"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  {editingDescription ? (
                    <div className="flex items-start justify-center gap-2 w-full max-w-xs mx-auto mb-2">
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary text-sm resize-none"
                        rows={3}
                        maxLength={2000}
                        placeholder="Group description (optional)"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="p-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      {group.description ? (
                        <p className="text-gray-600 text-sm">{group.description}</p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">No description</p>
                      )}
                      {isAdminOrCreator() && (
                        <button
                          onClick={() => {
                            setEditingDescription(true);
                            setEditDescription(group.description || '');
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit description"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Group Creator */}
                {group.createdBy && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Created By
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={group.createdBy.photos?.[0]?.url || placeholderImg}
                        alt={group.createdBy.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          if (e.target.src !== placeholderImg) {
                            e.target.src = placeholderImg;
                          }
                        }}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{group.createdBy.name}</p>
                        <p className="text-xs text-gray-500">Group Creator</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Join Date */}
                {group.joinDate && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      You Joined
                    </h4>
                    <p className="text-gray-700">
                      {new Date(group.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Members */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Members ({group.members?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {group.members?.map((member) => {
                      const isAdmin = group.admins?.some(a => a._id?.toString() === member._id?.toString());
                      const isCreator = group.createdBy?._id?.toString() === member._id?.toString();

                      return (
                        <div
                          key={member._id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="relative">
                            <img
                              src={member.photos?.[0]?.url || placeholderImg}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                if (e.target.src !== placeholderImg) {
                                  e.target.src = placeholderImg;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{member.name}</p>
                              {isCreator && (
                                <span className="px-2 py-0.5 bg-velora-primary/20 text-velora-primary text-xs font-semibold rounded-full">
                                  Creator
                                </span>
                              )}
                              {isAdmin && !isCreator && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <PresenceIndicator
                              userId={member._id}
                              showDot={false}
                              textClassName="text-gray-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load group info</p>
              </div>
            )}
          </div>

          {/* Footer - Actions */}
          {group && (
            <div className="p-4 border-t border-gray-200 space-y-2" style={{ paddingBottom: 'calc(1rem + var(--bottom-navbar-height, 60px))' }}>
              {/* Invite Button - Only show if user is a member */}
              {group.members?.some(m => m._id?.toString() === user?._id?.toString()) && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full px-4 py-3 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  Invite Members
                </button>
              )}

              {/* Delete Group button - only for creator */}
              {(group.createdBy?._id?.toString() === user?._id?.toString() ||
                group.createdBy?.toString() === user?._id?.toString()) && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-5 h-5" />
                      Delete Group
                    </>
                  )}
                </button>
              )}
              {/* Leave Group Button - for all members except creator */}
              {!(group.createdBy?._id?.toString() === user?._id?.toString() ||
                group.createdBy?.toString() === user?._id?.toString()) && (
                <button
                  onClick={handleLeaveGroup}
                  disabled={leaving}
                  className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {leaving ? (
                    <>
                      <LoadingSpinner />
                      Leaving...
                    </>
                  ) : (
                    <>
                      <UserGroupIcon className="w-5 h-5" />
                      Leave Group
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Invite Members</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter user IDs (comma-separated) or email addresses to invite to this group.
              </p>
              <input
                type="text"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="User IDs or emails (comma-separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-velora-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!inviteSearch.trim()) {
                      toast.error('Please enter user IDs or emails');
                      return;
                    }
                    try {
                      setInviting(true);
                      // For now, we'll use a simple approach - user IDs
                      // In a real app, you'd want to search for users by email/name first
                      const userIds = inviteSearch.split(',').map(id => id.trim()).filter(Boolean);
                      await groupChatService.inviteToGroup(groupId, userIds);
                      toast.success('Invitations sent successfully');
                      setShowInviteModal(false);
                      setInviteSearch('');
                      loadGroupInfo(); // Reload to show updated member count
                    } catch (error) {
                      toast.error(error.response?.data?.message || 'Failed to send invitations');
                    } finally {
                      setInviting(false);
                    }
                  }}
                  disabled={inviting || !inviteSearch.trim()}
                  className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? 'Sending...' : 'Send Invites'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

