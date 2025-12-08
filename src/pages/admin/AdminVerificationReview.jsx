import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  UserIcon,
  CameraIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminVerificationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadVerification();
  }, [id]);

  const loadVerification = async () => {
    try {
      setLoading(true);
      const response = await adminService.getVerificationRequest(id);
      if (response.success) {
        setVerification(response.data.verification);
        setProfilePhotos(response.data.profilePhotos || []);
      } else {
        throw new Error(response.message || 'Failed to load verification');
      }
    } catch (error) {
      console.error('Error loading verification:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load verification');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!verification) return;

    try {
      setSubmitting(true);
      const response = await adminService.approveVerification(id, { adminNotes });
      
      if (response.success) {
        toast.success('Verification approved successfully');
        navigate('/admin/verifications');
      } else {
        throw new Error(response.message || 'Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to approve verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!verification) return;

    try {
      setSubmitting(true);
      const response = await adminService.rejectVerification(id, {
        adminNotes,
        reason: rejectionReason || 'We couldn\'t verify your selfie. Please try again with a clear photo.',
      });
      
      if (response.success) {
        toast.success('Verification rejected successfully');
        navigate('/admin/verifications');
      } else {
        throw new Error(response.message || 'Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to reject verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!verification) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Verification request not found</p>
        </div>
      </AdminLayout>
    );
  }

  const user = verification.userId;
  const age = user?.dateOfBirth
    ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/verifications')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Verifications
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Verification Review</h1>
          <p className="text-gray-600 mt-1">Review and approve or reject photo verification request</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info & Profile Photos */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">User Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                    {age && <p className="text-sm text-gray-600">{age} years old</p>}
                  </div>
                </div>
                {user?.gender && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 capitalize">{user.gender}</span>
                  </div>
                )}
                {user?.location?.city && (
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {user.location.city}
                      {user.location.country && `, ${user.location.country}`}
                    </span>
                  </div>
                )}
                {verification.createdAt && (
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Submitted: {new Date(verification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Profile Photos */}
            {profilePhotos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Photos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {profilePhotos.slice(0, 6).map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={photo.url}
                        alt={`Profile photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Verification Photo & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Selfie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CameraIcon className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Verification Selfie</h2>
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                  verification.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : verification.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                </span>
              </div>
              <div className="bg-gray-100 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <img
                  src={verification.photoUrl}
                  alt="Verification selfie"
                  className="w-full h-full object-contain"
                />
              </div>
              {verification.adminNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                  <p className="text-sm text-gray-600">{verification.adminNotes}</p>
                </div>
              )}
            </motion.div>

            {/* Admin Notes */}
            {verification.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Notes (Optional)</h2>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400"
                />
              </motion.div>
            )}

            {/* Rejection Reason (if rejecting) */}
            {verification.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-4">Rejection Reason (if rejecting)</h2>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="We couldn't verify your selfie. Please try again with a clear photo."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400"
                />
              </motion.div>
            )}

            {/* Action Buttons */}
            {verification.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4"
              >
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircleIcon className="w-5 h-5" />
                  Reject & Ask to Retake
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Approve & Verify Profile
                </button>
              </motion.div>
            )}

            {/* Status Display (if already reviewed) */}
            {verification.status !== 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className={`p-4 rounded-xl ${
                  verification.status === 'approved'
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {verification.status === 'approved' ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-600" />
                    )}
                    <h3 className="text-lg font-bold text-gray-900">
                      {verification.status === 'approved' ? 'Approved' : 'Rejected'}
                    </h3>
                  </div>
                  {verification.reviewedBy && (
                    <p className="text-sm text-gray-600">
                      Reviewed by: {verification.reviewedBy.name || 'Admin'}
                    </p>
                  )}
                  {verification.reviewedAt && (
                    <p className="text-sm text-gray-600">
                      On: {new Date(verification.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

