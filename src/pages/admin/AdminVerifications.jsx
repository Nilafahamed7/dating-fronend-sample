import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminVerifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadVerifications();
  }, [filter, pagination.page]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminService.getVerificationRequests({
        status: filter === 'all' ? undefined : filter,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setVerifications(response.data.verifications || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        throw new Error(response.message || 'Failed to load verifications');
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = verification.userId?.name?.toLowerCase() || '';
    const userEmail = verification.userId?.email?.toLowerCase() || '';
    return userName.includes(query) || userEmail.includes(query);
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: ClockIcon,
        className: 'bg-yellow-100 text-yellow-800',
        label: 'Pending',
      },
      approved: {
        icon: CheckCircleIcon,
        className: 'bg-green-100 text-green-800',
        label: 'Approved',
      },
      rejected: {
        icon: XCircleIcon,
        className: 'bg-red-100 text-red-800',
        label: 'Rejected',
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-yellow-600" />
            Photo Verifications
          </h1>
          <p className="text-gray-600 mt-1">Review and manage photo verification requests</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-velora-primary text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filter === 'pending'
                ? 'No pending verification requests'
                : 'No verification requests found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVerifications.map((verification) => {
              const user = verification.userId;
              const primaryPhoto = user?.photos?.[0]?.url || null;
              const age = user?.dateOfBirth
                ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

              return (
                <motion.div
                  key={verification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/admin/verifications/${verification._id}`)}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                >
                  {/* User Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {primaryPhoto ? (
                        <img
                          src={primaryPhoto}
                          alt={user?.name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-velora-primary to-velora-secondary">
                          <span className="text-xl font-bold text-black">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{user?.name || 'Unknown'}</h3>
                      {age && <p className="text-sm text-gray-600">{age} years old</p>}
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                    {getStatusBadge(verification.status)}
                  </div>

                  {/* Verification Photo Preview */}
                  <div className="bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                    <img
                      src={verification.photoUrl}
                      alt="Verification selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Request Info */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      Submitted: {new Date(verification.createdAt).toLocaleDateString()}
                    </p>
                    {verification.reviewedAt && (
                      <p>
                        Reviewed: {new Date(verification.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/verifications/${verification._id}`);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-velora-primary text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {verification.status === 'pending' ? 'Review Request' : 'View Details'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

