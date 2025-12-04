import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminWithdrawalService } from '../../services/adminWithdrawalService';

const statusClasses = {
  pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200',
  locked: 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200',
  approved: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
  processing: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
  rejected: 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border border-rose-200',
  completed: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200',
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AdminWithdrawals() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [unlockNote, setUnlockNote] = useState('');

  const loadWithdrawals = useCallback(
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
        if (query.status) {
          params.status = query.status;
        }
        if (query.search.trim()) {
          params.search = query.search.trim();
        }
        if (query.startDate) {
          params.startDate = query.startDate;
        }
        if (query.endDate) {
          params.endDate = query.endDate;
        }

        const response = await adminWithdrawalService.getAllWithdrawals(params);
        if (response.success) {
          setRequests(response.requests || []);
          setPagination(response.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load withdrawal requests');
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [query]
  );

  const loadStats = useCallback(async () => {
    try {
      const response = await adminWithdrawalService.getWithdrawalStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const response = await adminWithdrawalService.approveWithdrawal(selectedRequest.id, {
        adminNotes: adminNote,
      });
      if (response.success) {
        toast.success('Withdrawal request approved successfully');
        setShowApproveModal(false);
        setAdminNote('');
        setSelectedRequest(null);
        loadWithdrawals(false);
        loadStats();
      } else {
        toast.error(response.message || 'Failed to approve withdrawal');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      const response = await adminWithdrawalService.rejectWithdrawal(selectedRequest.id, {
        adminNotes: rejectionReason,
      });
      if (response.success) {
        toast.success('Withdrawal request rejected');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
        loadWithdrawals(false);
        loadStats();
      } else {
        toast.error(response.message || 'Failed to reject withdrawal');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const response = await adminWithdrawalService.unlockWithdrawalCoins(selectedRequest.id, {
        adminNotes: unlockNote || 'Coins unlocked by admin due to stuck request',
      });
      if (response.success) {
        toast.success('Coins unlocked successfully');
        setShowUnlockModal(false);
        setUnlockNote('');
        setSelectedRequest(null);
        loadWithdrawals(false);
        loadStats();
      } else {
        toast.error(response.message || 'Failed to unlock coins');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unlock coins');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (request) => {
    try {
      const response = await adminWithdrawalService.getWithdrawalDetails(request.id);
      if (response.success) {
        setSelectedRequest(response.request);
        setShowDetailsModal(true);
      }
    } catch (error) {
      toast.error('Failed to load withdrawal details');
    }
  };

  const handleExportCSV = () => {
    // Simple CSV export
    const headers = ['ID', 'User', 'Coins', 'Amount', 'Status', 'Requested At', 'Reviewed At'];
    const rows = requests.map((req) => [
      req.id,
      req.user?.name || req.user?.email || 'N/A',
      req.amountCoins || req.coins || 0,
      formatCurrency(req.finalPayoutAmount || req.amount || 0),
      req.status,
      formatDateTime(req.createdAt),
      formatDateTime(req.reviewedAt),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdraw Requests</h1>
            <p className="text-sm text-gray-600 mt-1">Manage user withdrawal requests</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-600">Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                ₹{formatCurrency(stats.pendingAmount || 0).replace('₹', '')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Approved</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedRequests || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircleIcon className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedRequests || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                ₹{formatCurrency(stats.totalAmount || 0).replace('₹', '')}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={query.status}
                onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="locked">Locked</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={query.search}
                onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
                placeholder="Search by ID, user..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={query.startDate}
                onChange={(e) => setQuery({ ...query, startDate: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={query.endDate}
                onChange={(e) => setQuery({ ...query, endDate: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <ArrowDownTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No withdrawal requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Coins</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Locked</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Requested</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                        {request.id.slice(-8)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{request.user?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{request.user?.email}</p>
                          {request.userLockedCoins > 0 && (
                            <p className="text-xs text-amber-600 font-medium mt-1">
                              🔒 {request.userLockedCoins.toLocaleString()} locked
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                        {(request.amountCoins || request.coins || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                        {formatCurrency(request.finalPayoutAmount || request.amount || 0)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses[request.status] || statusClasses.pending}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {request.coinsLocked ? (
                          <div className="flex flex-col gap-1">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 w-fit">
                              🔒 Locked
                            </span>
                            <span className="text-xs font-medium text-amber-700">
                              {request.lockedCoinsAmount?.toLocaleString() || (request.amountCoins || request.coins || 0).toLocaleString()} coins
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unlocked</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDateTime(request.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          {(request.status === 'pending' || request.status === 'locked') && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApproveModal(true);
                                }}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors whitespace-nowrap"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors whitespace-nowrap"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.coinsLocked && (
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowUnlockModal(true);
                              }}
                              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors whitespace-nowrap"
                              title="Unlock Coins"
                            >
                              Unlock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuery({ ...query, page: query.page - 1 })}
                    disabled={query.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setQuery({ ...query, page: query.page + 1 })}
                    disabled={query.page >= pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Withdrawal Request Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Request ID</p>
                  <p className="font-mono text-sm font-medium">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[selectedRequest.status] || statusClasses.pending}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-medium">{selectedRequest.user?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coins</p>
                  <p className="font-medium">{(selectedRequest.amountCoins || selectedRequest.coins || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedRequest.finalPayoutAmount || selectedRequest.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payout Method</p>
                  <p className="font-medium capitalize">{selectedRequest.payoutMethod || 'bank'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested At</p>
                  <p className="font-medium">{formatDateTime(selectedRequest.createdAt)}</p>
                </div>
                {selectedRequest.reviewedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Reviewed At</p>
                    <p className="font-medium">{formatDateTime(selectedRequest.reviewedAt)}</p>
                  </div>
                )}
              </div>
              {selectedRequest.payoutDetails && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payout Details</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    {selectedRequest.payoutDetails.accountHolderName && (
                      <p><span className="font-medium">Account Holder:</span> {selectedRequest.payoutDetails.accountHolderName}</p>
                    )}
                    {selectedRequest.payoutDetails.accountNumber && (
                      <p><span className="font-medium">Account Number:</span> ****{selectedRequest.payoutDetails.accountNumber.slice(-4)}</p>
                    )}
                    {selectedRequest.payoutDetails.ifscCode && (
                      <p><span className="font-medium">IFSC:</span> {selectedRequest.payoutDetails.ifscCode}</p>
                    )}
                    {selectedRequest.payoutDetails.bankName && (
                      <p><span className="font-medium">Bank:</span> {selectedRequest.payoutDetails.bankName}</p>
                    )}
                    {selectedRequest.payoutDetails.upiId && (
                      <p><span className="font-medium">UPI ID:</span> {selectedRequest.payoutDetails.upiId}</p>
                    )}
                    {selectedRequest.payoutDetails.email && (
                      <p><span className="font-medium">Email:</span> {selectedRequest.payoutDetails.email}</p>
                    )}
                  </div>
                </div>
              )}
              {selectedRequest.adminNotes && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Admin Notes</p>
                  <p className="text-sm text-gray-600">{selectedRequest.adminNotes}</p>
                </div>
              )}
              {selectedRequest.rejectionReason && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-red-700 mb-2">Rejection Reason</p>
                  <p className="text-sm text-gray-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Approve Withdrawal</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Approve withdrawal of {formatCurrency(selectedRequest.finalPayoutAmount || selectedRequest.amount || 0)} for {selectedRequest.user?.name || 'user'}?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
                  placeholder="Add any notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setAdminNote('');
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Reject Withdrawal</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Reject withdrawal request for {selectedRequest.user?.name || 'user'}?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
                  placeholder="Provide a reason for rejection..."
                  required
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Unlock Coins</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Warning</p>
                <p className="text-sm text-amber-700">
                  This will unlock {selectedRequest.amountCoins || selectedRequest.coins || 0} coins for {selectedRequest.user?.name || 'user'}.
                  Use this only if the withdrawal request is stuck or failed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={unlockNote}
                  onChange={(e) => setUnlockNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
                  placeholder="Add any notes about why coins are being unlocked..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockNote('');
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading ? 'Unlocking...' : 'Unlock Coins'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

