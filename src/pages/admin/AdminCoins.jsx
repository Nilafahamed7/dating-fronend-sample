import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ArrowPathIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

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

export default function AdminCoins() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 20,
    callType: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const loadData = useCallback(
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
        if (query.callType) {
          params.callType = query.callType;
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

        const summaryParams = {};
        if (query.startDate) {
          summaryParams.startDate = query.startDate;
        }
        if (query.endDate) {
          summaryParams.endDate = query.endDate;
        }

        const [transactionsResponse, summaryResponse] = await Promise.all([
          adminService.getAdminCoinTransactions(params),
          adminService.getAdminCoinsSummary(summaryParams),
        ]);

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.transactions || []);
          setPagination(transactionsResponse.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
        }

        if (summaryResponse.success) {
          setSummary(summaryResponse.summary);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load coin transactions');
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coin Transactions</h1>
            <p className="text-sm text-gray-600 mt-1">View and manage coin transactions</p>
          </div>
          <button
            onClick={() => loadData(false)}
            disabled={tableLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm hover:shadow disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${tableLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Admin Coins</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {(summary.totalAdminCoins || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Today's Coins</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {(summary.todayCoins || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Last 24 hours</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">This Week</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {(summary.weekCoins || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <PhoneIcon className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Paid Calls</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {(summary.totalPaidCalls || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <VideoCameraIcon className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Calls in Range</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {(summary.paidCallsInRange || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Filtered period</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Type</label>
              <select
                value={query.callType}
                onChange={(e) => setQuery({ ...query, callType: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary"
              >
                <option value="">All Types</option>
                <option value="voice">Voice</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={query.search}
                onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
                placeholder="Search by user name..."
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
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-gray-200">
            <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Call ID</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payer</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Receiver</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Call Type</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Duration</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Admin Coins</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Billed Coins</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((txn) => {
                    const callDetail = txn.callDetail;

                    return (
                      <tr key={txn.id || txn._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm text-gray-900 font-mono">
                          {txn.txnId?.slice(-8) || txn.id?.slice(-8) || txn._id?.slice(-8) || 'N/A'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 font-mono">
                          {callDetail?.callId ? callDetail.callId.slice(-8) : (txn.metadata?.callId ? txn.metadata.callId.slice(-8) : 'N/A')}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-900">
                              {callDetail?.payerName || callDetail?.callerName || 'Unknown'}
                            </span>
                            {(callDetail?.payerId || callDetail?.callerId) && (
                              <span className="text-xs text-gray-500 font-mono">
                                {(callDetail.payerId || callDetail.callerId)?.toString().slice(-6)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-900">
                              {callDetail?.receiverName || callDetail?.girlName || callDetail?.calleeName || 'Unknown'}
                            </span>
                            {(callDetail?.receiverId || callDetail?.girlId || callDetail?.calleeId) && (
                              <span className="text-xs text-gray-500 font-mono">
                                {String(callDetail.receiverId || callDetail.girlId || callDetail.calleeId).slice(-6)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {callDetail?.callType ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              callDetail.callType === 'voice'
                                ? 'bg-blue-100 text-blue-700'
                                : callDetail.callType === 'video'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {callDetail.callType}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDuration(callDetail?.durationSeconds)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-green-600">
                          {(txn.coins || callDetail?.adminShare || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-900 font-semibold">
                          {(callDetail?.billedCoins || callDetail?.totalCoins || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDateTime(txn.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuery({ ...query, page: query.page - 1 })}
                    disabled={query.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setQuery({ ...query, page: query.page + 1 })}
                    disabled={query.page >= pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
