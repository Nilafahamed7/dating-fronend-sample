import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import { groupDateService } from '../services/groupDateService';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function GroupDateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [groupDate, setGroupDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadGroupDate();
  }, [id]);

  const loadGroupDate = async () => {
    try {
      setLoading(true);
      const response = await groupDateService.getGroupDateDetails(id);
      setGroupDate(response.groupDate);
    } catch (error) {
      toast.error('Failed to load group date details');
      navigate('/group-dates');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      await groupDateService.joinGroupDate(id);
      toast.success('Request sent to host!');
      loadGroupDate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group date');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (userId, action) => {
    try {
      setActionLoading(true);
      await groupDateService.approveGroupDateRequest(id, userId, action);
      toast.success(action === 'approve' ? 'User approved!' : 'Request rejected');
      loadGroupDate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this group date?')) {
      return;
    }

    try {
      setActionLoading(true);
      const reason = prompt('Please provide a reason for cancellation (optional):');
      await groupDateService.cancelGroupDate(id, reason);
      toast.success('Group date cancelled');
      navigate('/group-dates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel group date');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!groupDate) {
    return null;
  }

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.userId;
  const isHost = groupDate.host?.id === currentUserId;
  const currentUserParticipant = groupDate.participants?.find(
    (p) => p.id === currentUserId
  );
  const userStatus = currentUserParticipant?.status;

  const approvedParticipants = groupDate.participants?.filter((p) =>
    ['host', 'approved'].includes(p.status)
  ) || [];
  const pendingParticipants = groupDate.participants?.filter((p) =>
    p.status === 'pending'
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Main Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{groupDate.title}</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                  {groupDate.type}
                </span>
                <span className={`px-3 py-1 rounded-full font-medium ${
                  groupDate.status === 'scheduled'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {groupDate.status}
                </span>
              </div>
            </div>
            {isHost && groupDate.status === 'scheduled' && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Cancel Date
              </button>
            )}
          </div>

          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
              <div>
                <div className="font-medium">
                  {new Date(groupDate.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(groupDate.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
              <span>{groupDate.location}</span>
            </div>

            <div className="flex items-start gap-3">
              <UsersIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
              <span>
                {approvedParticipants.length}/{groupDate.participantsLimit} participants
              </span>
            </div>

            {groupDate.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{groupDate.notes}</p>
              </div>
            )}
          </div>

          {/* Join Button for Non-Participants */}
          {!userStatus && groupDate.status === 'scheduled' && (
            <button
              onClick={handleJoin}
              disabled={actionLoading || approvedParticipants.length >= groupDate.participantsLimit}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all font-medium disabled:opacity-50"
            >
              {approvedParticipants.length >= groupDate.participantsLimit
                ? 'Group Date Full'
                : 'Request to Join'}
            </button>
          )}

          {/* Status for Participants */}
          {userStatus && (
            <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
              userStatus === 'host' || userStatus === 'approved'
                ? 'bg-green-100 text-green-800'
                : userStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {userStatus === 'host' && '👑 You are hosting this group date'}
              {userStatus === 'approved' && '✓ You are part of this group date'}
              {userStatus === 'pending' && '⏳ Your request is pending approval'}
              {userStatus === 'invited' && '✉️ You have been invited'}
            </div>
          )}
        </motion.div>

        {/* Participants List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Participants</h2>

          {approvedParticipants.length > 0 ? (
            <div className="space-y-3">
              {approvedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">{participant.name}</div>
                    <div className="text-sm text-gray-600">
                      {participant.status === 'host' ? 'Host' : 'Participant'}
                    </div>
                  </div>
                  {participant.status === 'host' && (
                    <span className="text-2xl">👑</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No participants yet</p>
          )}
        </motion.div>

        {/* Pending Requests (Host Only) */}
        {isHost && pendingParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Pending Requests ({pendingParticipants.length})
            </h2>

            <div className="space-y-3">
              {pendingParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">{participant.name}</div>
                    <div className="text-sm text-gray-600">
                      Requested {new Date(participant.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(participant.id, 'approve')}
                      disabled={actionLoading || approvedParticipants.length >= groupDate.participantsLimit}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                      title="Approve"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleApprove(participant.id, 'reject')}
                      disabled={actionLoading}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                      title="Reject"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

