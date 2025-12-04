import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '../components/common/PageContainer';
import { walletService } from '../services/walletService';
import { useAuth } from '../contexts/AuthContext';
import WithdrawRequestDetailDrawer from '../components/wallet/WithdrawRequestDetailDrawer';
import WithdrawModal from '../components/wallet/WithdrawModal';
import {
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentCheckIcon,
  NoSymbolIcon,
  EyeIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MIN_WITHDRAWAL_COINS = 5000;

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  processing: {
    label: 'Processing',
    icon: ClockIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  locked: {
    label: 'Locked',
    icon: InformationCircleIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    dotColor: 'bg-orange-500',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  completed: {
    label: 'Paid',
    icon: DocumentCheckIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
  },
  failed: {
    label: 'Failed',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: NoSymbolIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-500',
  },
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

export default function WithdrawRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coinBalance, setCoinBalance] = useState({ coins: 0, lockedCoins: 0, availableCoins: 0 });
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
  });
  const [transactionType, setTransactionType] = useState('all'); // all, withdraw, deposit, purchase

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [balanceResponse, requestsResponse, transactionsResponse] = await Promise.all([
        walletService.getBalance(),
        walletService.getWithdrawalRequests({ page: 1, limit: 100 }),
        walletService.getTransactions({ page: 1, limit: 50 }),
      ]);

      if (balanceResponse.success) {
        setCoinBalance({
          coins: balanceResponse.coins || 0,
          lockedCoins: balanceResponse.lockedCoins || 0,
          availableCoins: balanceResponse.availableCoins || balanceResponse.coins || 0,
        });
      }

      if (requestsResponse.success) {
        const newRequests = requestsResponse.requests || [];

        // Check for status changes and show notifications
        setRequests(prevRequests => {
          if (prevRequests.length > 0) {
            newRequests.forEach(newReq => {
              const oldReq = prevRequests.find(r => r.id === newReq.id);
              if (oldReq && oldReq.status !== newReq.status) {
                if (newReq.status === 'approved') {
                  toast.success('Your withdraw request was approved');
                } else if (newReq.status === 'rejected') {
                  toast.error(`Your withdraw request was rejected: ${newReq.rejectionReason || 'No reason provided'}`);
                } else if (newReq.status === 'completed') {
                  toast.success('Your withdrawal has been paid');
                }
              }
            });
          }
          return newRequests;
        });
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.transactions || []);
      }
    } catch (error) {
      setRequests(prevRequests => {
        if (prevRequests.length === 0) {
          toast.error('Failed to load data');
        }
        return prevRequests;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (filters.status) {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    if (filters.dateRange) {
      const now = new Date();
      const days = parseInt(filters.dateRange);
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(req => new Date(req.createdAt) >= cutoff);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [requests, filters]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (transactionType === 'withdraw') {
      filtered = filtered.filter(txn => txn.purpose === 'withdrawal' || txn.metadata?.type === 'withdrawal');
    } else if (transactionType === 'deposit') {
      filtered = filtered.filter(txn => txn.coins > 0 && txn.purpose !== 'withdrawal');
    } else if (transactionType === 'purchase') {
      filtered = filtered.filter(txn => txn.purpose === 'coins' || txn.type === 'payment');
    }

    return filtered.sort((a, b) => new Date(b.createdAt || b.processedAt) - new Date(a.createdAt || a.processedAt));
  }, [transactions, transactionType]);

  const handleViewDetails = async (request) => {
    try {
      const requestId = request.id || request._id;
      if (!requestId) {
        toast.error('Invalid request ID');
        return;
      }
      const response = await walletService.getWithdrawalRequest(requestId);
      if (response.success) {
        setSelectedRequest(response.request);
        setShowDetailDrawer(true);
      }
    } catch (error) {
      toast.error('Failed to load request details');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Request ID', 'Amount (Coins)', 'Amount (Currency)', 'Status', 'Payout Method', 'Created At', 'Updated At', 'Transaction Reference', 'Admin Note'];
    const rows = filteredRequests.map((req) => [
      (req.id || req._id || '').toString().slice(-8),
      req.amountCoins || req.coins || 0,
      formatCurrency(req.finalPayoutAmount || req.amount || 0),
      req.status,
      req.payoutMethod || 'bank',
      formatDateTime(req.createdAt),
      formatDateTime(req.reviewedAt || req.updatedAt),
      req.transactionId || '--',
      req.adminNotes || req.rejectionReason || '--',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdraw-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleWithdrawSuccess = () => {
    loadData();
    setShowWithdrawModal(false);
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const availableCoins = coinBalance.availableCoins;
  const canRequestWithdraw = availableCoins >= MIN_WITHDRAWAL_COINS;

  const location = useLocation();

  return (
    <>
      <PageContainer
        className="bg-gradient-to-br from-velora-gray via-white to-velora-gray/50"
        fullWidth={false}
        maxWidth="7xl"
        padding={true}
      >
      <div className="w-full max-w-7xl mx-auto space-y-6 py-4">
          {/* Header with Balance and CTA */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Withdraw Requests</h1>
                <p className="text-sm md:text-base text-gray-600">View and manage your withdrawal requests</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                <div className="text-left sm:text-right bg-gradient-to-br from-velora-primary/10 to-velora-primary/5 rounded-xl p-4 sm:p-5 border border-velora-primary/20">
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-1">Available Balance</p>
                  <p className="text-2xl md:text-3xl font-bold text-velora-primary">
                    {availableCoins.toLocaleString()} coins
                  </p>
                  {coinBalance.lockedCoins > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {coinBalance.lockedCoins.toLocaleString()} locked in pending requests
                    </p>
                  )}
                </div>
                <div className="relative flex-shrink-0">
                  <motion.button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!canRequestWithdraw}
                    whileHover={canRequestWithdraw ? { scale: 1.05 } : {}}
                    whileTap={canRequestWithdraw ? { scale: 0.95 } : {}}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                      canRequestWithdraw
                        ? 'bg-gradient-to-r from-velora-primary to-yellow-500 text-black hover:shadow-xl shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={!canRequestWithdraw ? 'Minimum 5,000 coins required to request withdrawal' : 'Request Withdrawal'}
                    aria-label={canRequestWithdraw ? 'Request withdrawal' : 'Minimum 5,000 coins required to request withdrawal'}
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Request Withdraw</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary transition-all bg-white"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary transition-all bg-white"
                >
                  <option value="">All Time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <div className="flex items-end flex-shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-all border-2 border-transparent hover:border-gray-300"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span className="whitespace-nowrap">Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 md:p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-velora-primary border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 md:p-16 text-center">
              <ArrowDownTrayIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No withdraw requests yet</h3>
              <p className="text-gray-600 mb-8 text-base">Request when you have 5,000+ coins</p>
              {canRequestWithdraw && (
                <motion.button
                  onClick={() => setShowWithdrawModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-velora-primary to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Request Withdrawal
                </motion.button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const requestId = request.id || request._id || `req-${Math.random()}`;

                return (
                  <motion.div
                    key={requestId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(request)}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${status.bgColor} ${status.color} ${status.borderColor} border-2`}>
                              <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                              {status.label}
                            </span>
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              ID: {requestId.toString().slice(-8)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 block text-xs mb-1">Amount</span>
                              <span className="font-bold text-gray-900 text-base">
                                {(request.amountCoins || request.coins || 0).toLocaleString()} coins
                              </span>
                            </div>
                            <div className="bg-velora-primary/5 rounded-lg p-3 border border-velora-primary/20">
                              <span className="text-gray-600 block text-xs mb-1">Payout</span>
                              <span className="font-bold text-velora-primary text-base">
                                {formatCurrency(request.finalPayoutAmount || request.amount || 0)}
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 block text-xs mb-1">Method</span>
                              <span className="font-semibold text-gray-700 capitalize text-base">
                                {request.payoutMethod || 'bank'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start lg:items-end gap-3 text-sm border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 border-gray-200">
                          <div className="space-y-1">
                            <div>
                              <span className="text-gray-500 text-xs">Created: </span>
                              <span className="text-gray-700 font-medium">{formatDateTime(request.createdAt)}</span>
                            </div>
                            {(request.reviewedAt || request.updatedAt) && (
                              <div>
                                <span className="text-gray-500 text-xs">Updated: </span>
                                <span className="text-gray-700 font-medium">{formatDateTime(request.reviewedAt || request.updatedAt)}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(request);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-velora-primary hover:bg-velora-primary/10 rounded-lg transition-colors font-medium"
                            aria-label={`View details for request ${requestId.toString().slice(-8)}`}
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                      {request.adminNotes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Admin Note: </span>
                            {request.adminNotes}
                          </p>
                        </div>
                      )}
                      {request.rejectionReason && (
                        <div className="mt-4 pt-4 border-t border-red-200 bg-red-50 rounded-lg p-3">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Rejection Reason: </span>
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Transaction History Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Transaction History</h2>
                <div className="flex flex-wrap gap-2">
                  {['all', 'withdraw', 'deposit', 'purchase'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTransactionType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        transactionType === type
                          ? 'bg-gradient-to-r from-velora-primary to-yellow-500 text-black shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-base font-medium">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((txn, index) => {
                    const isCoinPurchase = txn.purpose === 'coins' || txn.purpose === 'credits' || txn.type === 'payment' || txn.metadata?.type === 'coin_purchase';
                    const coinsReceived = txn.coins || txn.metadata?.coinsPurchased || txn.coinsReceived || txn.quantity || txn.metadata?.coins || 0;
                    const isWithdrawal = txn.purpose === 'withdrawal' || txn.metadata?.type === 'withdrawal';

                    return (
                      <div
                        key={txn.id || txn._id || `txn-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                      >
                        <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold text-gray-900 text-base">
                                {isWithdrawal ? 'Withdrawal' : isCoinPurchase ? 'Coin Purchase' : 'Deposit'}
                              </span>
                              {coinsReceived > 0 && (
                                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                  +{coinsReceived.toLocaleString()} coins
                                </span>
                              )}
                              {coinsReceived < 0 && (
                                <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                  {coinsReceived.toLocaleString()} coins
                                </span>
                              )}
                            </div>
                            {isCoinPurchase && txn.amount && (
                              <p className="text-sm text-gray-600">
                                Paid: <span className="font-medium">{formatCurrency(Math.abs(txn.amount))}</span> • Received: <span className="font-medium">{coinsReceived.toLocaleString()} coins</span>
                              </p>
                            )}
                            {isWithdrawal && txn.amount && (
                              <p className="text-sm text-gray-600">
                                Withdrawn: <span className="font-medium">{formatCurrency(Math.abs(txn.amount))}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatDateTime(txn.createdAt || txn.processedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-2">
                          {txn.amount && (
                            <p className={`font-bold text-lg ${isWithdrawal ? 'text-red-600' : isCoinPurchase ? 'text-gray-900' : 'text-green-600'}`}>
                              {isWithdrawal ? '-' : isCoinPurchase ? '' : '+'}{formatCurrency(Math.abs(txn.amount))}
                            </p>
                          )}
                          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                            txn.status === 'success' ? 'bg-green-100 text-green-700' :
                            txn.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {txn.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        coinBalance={coinBalance}
        onSuccess={handleWithdrawSuccess}
      />

      {/* Detail Drawer */}
      <WithdrawRequestDetailDrawer
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onRefresh={loadData}
      />
    </>
  );
}

