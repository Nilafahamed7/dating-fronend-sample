import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { getPlaceholderImage } from '../../utils/helpers';

const statusClasses = {
  active: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-rose-50 text-rose-600',
  deleted: 'bg-gray-100 text-gray-500',
};

const subscriptionClasses = {
  active: 'bg-purple-50 text-purple-600',
  expired: 'bg-amber-50 text-amber-600',
  cancelled: 'bg-gray-100 text-gray-500',
  not_subscribed: 'bg-gray-100 text-gray-500',
};

const verificationClasses = {
  approved: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  rejected: 'bg-rose-50 text-rose-600',
  none: 'bg-gray-100 text-gray-500',
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString();
};

export default function AdminUserList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    verified: 'all',
    search: '',
  });
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const loadUsers = useCallback(
    async (withSpinner = true) => {
      try {
        if (withSpinner) {
          setLoading(true);
        } else {
          setTableLoading(true);
        }
        const params = {
          page: query.page,
          limit: query.limit,
        };
        if (query.status !== 'all') {
          params.status = query.status;
        }
        if (query.verified !== 'all') {
          params.verified = query.verified === 'verified';
        }
        if (query.search.trim()) {
          params.search = query.search.trim();
        }
        const response = await adminService.getUsers(params);
        setUsers(response?.users || []);
        setPagination(response?.pagination || { total: 0, page: 1, limit: query.limit, pages: 0 });
      } catch (error) {
        toast.error('Unable to load users');
        } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusChange = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateUserStatus(user.id, { status: nextStatus });
      toast.success('Status updated');
      loadUsers(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
    }
  };

  const handleVerificationChange = async (user, action) => {
    try {
      await adminService.updateUserStatus(user.id, {
        photoVerificationStatus: action === 'approve' ? 'approved' : 'rejected',
      });
      toast.success(`Verification ${action === 'approve' ? 'approved' : 'rejected'}`);
      loadUsers(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update verification';
      toast.error(message);
    }
  };

  const handlePageChange = (direction) => {
    setQuery((prev) => {
      const nextPage = Math.min(
        Math.max(1, prev.page + direction),
        Math.max(1, pagination.pages || 1)
      );
      return { ...prev, page: nextPage };
    });
  };

  const headerActions = (
    <button
      onClick={() => loadUsers(false)}
      type="button"
      className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
    >
      Refresh
    </button>
  );

  const tableContent = useMemo(() => {
    if (loading) {
      return (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (!users.length) {
      return (
        <div className="py-20 text-center text-gray-500 text-sm">
          No users found with the current filters.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto -mx-6 lg:-mx-8">
        <div className="inline-block min-w-full align-middle px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {[
                  'Sr No.',
                  'Name',
                  'Email',
                  'Mobile',
                  'Join Date',
                  'Last Login',
                  'Login Details',
                  'Profile Location',
                  'Status',
                  'Is Subscribed?',
                  'Plan Name',
                  'Start Date',
                  'Expired Date',
                  'Identity',
                  'Is Verified?',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((user) => {
              const statusBadge = statusClasses[user.status] || statusClasses.active;
              const planBadge =
                subscriptionClasses[user.planStatus] || subscriptionClasses.not_subscribed;
              const verificationBadge =
                verificationClasses[user.verificationStatus] || verificationClasses.none;
              const avatar = user.avatar || getPlaceholderImage(80, 80, 'No Photo');

              return (
                <tr key={user.id} className="hover:bg-gray-50/50 text-sm transition-colors">
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{user.srNo || '-'}</td>
                  <td className="px-4 lg:px-6 py-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatar}
                        alt={user.name}
                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getPlaceholderImage(80, 80, 'No Photo');
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            {user.name}
                            {user.isCurrentlyActive && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{user.email || '--'}</td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{user.phone || '--'}</td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{formatDateTime(user.joinDate)}</td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">
                    {user.lastLoginAt ? (
                      <div className="flex flex-col">
                        <span className="text-xs">{formatDateTime(user.lastLoginAt)}</span>
                        {user.isCurrentlyActive && (
                          <span className="text-xs text-green-600 font-semibold mt-1">● Online</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">
                    {user.loginDetails ? (
                      <div className="flex flex-col gap-1 text-xs">
                        {user.loginDetails.ipAddress && (
                          <div>
                            <span className="font-semibold">IP:</span> {user.loginDetails.ipAddress}
                          </div>
                        )}
                        {user.loginDetails.device && (
                          <div>
                            <span className="font-semibold">Device:</span> {user.loginDetails.device}
                          </div>
                        )}
                        {user.loginDetails.loginAt && (
                          <div className="text-gray-500">
                            {formatDateTime(user.loginDetails.loginAt)}
                          </div>
                        )}
                        {user.loginDetails.loginLocation && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Login Location:</div>
                            {user.loginDetails.loginLocation.city && (
                              <div className="text-gray-600">{user.loginDetails.loginLocation.city}</div>
                            )}
                            {user.loginDetails.loginLocation.region && (
                              <div className="text-gray-600">{user.loginDetails.loginLocation.region}</div>
                            )}
                            {user.loginDetails.loginLocation.country && (
                              <div className="text-gray-600">{user.loginDetails.loginLocation.country}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">
                    {user.location ? (
                      <div className="flex flex-col gap-1 text-xs">
                        {user.location.formattedAddress && (
                          <div className="font-semibold text-gray-900">
                            {user.location.formattedAddress}
                          </div>
                        )}
                        {user.location.address && (
                          <div className="font-semibold text-gray-900">
                            {user.location.address}
                          </div>
                        )}
                        {user.location.city && (
                          <div>
                            <span className="font-semibold">City:</span> {user.location.city}
                          </div>
                        )}
                        {user.location.state && (
                          <div>
                            <span className="font-semibold">State:</span> {user.location.state}
                          </div>
                        )}
                        {user.location.country && (
                          <div>
                            <span className="font-semibold">Country:</span> {user.location.country}
                          </div>
                        )}
                        {/* Handle Profile location coordinates (nested structure) */}
                        {user.location.coordinates?.coordinates && Array.isArray(user.location.coordinates.coordinates) && user.location.coordinates.coordinates.length === 2 && (
                          <div className="text-gray-500 text-xs mt-1">
                            📍 {user.location.coordinates.coordinates[1].toFixed(4)}, {user.location.coordinates.coordinates[0].toFixed(4)}
                          </div>
                        )}
                        {/* Handle User location coordinates (flat array) */}
                        {user.location.coordinates && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2 && !user.location.coordinates.coordinates && (
                          <div className="text-gray-500 text-xs mt-1">
                            📍 {user.location.coordinates[1].toFixed(4)}, {user.location.coordinates[0].toFixed(4)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-5">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${planBadge}`}
                    >
                      {user.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{user.planName || '--'}</td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{formatDateTime(user.planStart)}</td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600">{formatDateTime(user.planExpiry)}</td>
                  <td className="px-4 lg:px-6 py-5 text-gray-600 capitalize">{user.identityStatus?.replace('_', ' ') || 'Not Upload'}</td>
                  <td className="px-4 lg:px-6 py-5">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${verificationBadge}`}
                    >
                      {user.verificationStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(user)}
                        className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-black transition"
                      >
                        {user.status === 'active' ? 'Make Deactivate' : 'Activate'}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleVerificationChange(user, 'approve')}
                          className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerificationChange(user, 'reject')}
                          className="px-2 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="px-2 py-1 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1 hover:border-gray-400"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Info
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    );
  }, [users, loading, navigate]);

  return (
    <AdminLayout
      title="User List Management"
      subtitle="Users"
      selectedNavKey="userList"
      headerActions={headerActions}
    >
      <section className="p-6 lg:p-8 xl:p-10 space-y-6 lg:space-y-8">
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Show</label>
              <select
                value={query.limit}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))
                }
                className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">entries</span>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-400" />
                <select
                  value={query.status}
                  onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={query.verified}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, verified: e.target.value, page: 1 }))
                  }
                  className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Not Verified</option>
                </select>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={query.search}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                  }
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                <LoadingSpinner />
              </div>
            )}
            {tableContent}
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} entries
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(-1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-700">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page >= (pagination.pages || 1)}
                className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

