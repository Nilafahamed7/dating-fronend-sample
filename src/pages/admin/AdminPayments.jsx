import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

const statusClasses = {
  success: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200',
  failed: 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border border-rose-200',
  pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200',
};

const methodClasses = {
  razorpay: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
  stripe: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200',
  manual: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200',
};

const purposeClasses = {
  subscription: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200',
  credits: 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border border-pink-200',
  coins: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200',
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

export default function AdminPayments() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 20,
    status: '',
    method: '',
    purpose: '',
    search: '',
    transactionType: 'all', // 'all', 'payments', 'wallet'
  });
  const [payments, setPayments] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [walletStats, setWalletStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const loadPayments = useCallback(
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
        if (query.method) {
          params.method = query.method;
        }
        if (query.purpose) {
          params.purpose = query.purpose;
        }
        if (query.search.trim()) {
          params.search = query.search.trim();
        }

        // Load payments and wallet transactions based on transactionType
        const promises = [];

        if (query.transactionType === 'all' || query.transactionType === 'payments') {
          promises.push(adminService.getPayments(params));
        } else {
          promises.push(Promise.resolve({ payments: [], pagination: { total: 0, page: 1, limit: query.limit, pages: 0 } }));
        }

        if (query.transactionType === 'all' || query.transactionType === 'wallet') {
          promises.push(adminService.getWalletTransactions(params));
        } else {
          promises.push(Promise.resolve({ transactions: [], pagination: { total: 0, page: 1, limit: query.limit, pages: 0 } }));
        }

        const [paymentsResponse, walletResponse] = await Promise.all(promises);

        setPayments(paymentsResponse?.payments || []);
        setWalletTransactions(walletResponse?.transactions || []);

        // Combine pagination totals
        const totalPayments = paymentsResponse?.pagination?.total || 0;
        const totalWallet = walletResponse?.pagination?.total || 0;
        const combinedTotal = totalPayments + totalWallet;

        setPagination({
          total: combinedTotal,
          page: parseInt(query.page),
          limit: parseInt(query.limit),
          pages: Math.ceil(combinedTotal / parseInt(query.limit)),
        });
      } catch (error) {
        toast.error('Unable to load transactions');
        } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [query]
  );

  const loadStats = useCallback(async () => {
    try {
      const [paymentStatsResponse, walletStatsResponse] = await Promise.all([
        adminService.getPaymentStats(),
        adminService.getWalletStats(),
      ]);
      setStats(paymentStatsResponse?.stats);
      setWalletStats(walletStatsResponse?.stats);
    } catch (error) {
      }
  }, []);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [loadPayments, loadStats]);

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
      onClick={() => loadPayments(false)}
      type="button"
      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs sm:text-sm font-semibold hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap flex-shrink-0"
    >
      <ArrowPathIcon className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">Refresh</span>
      <span className="sm:hidden">↻</span>
    </button>
  );

  // Combine payments and wallet transactions
  const allTransactions = useMemo(() => {
    const combined = [];
    const seenIds = new Set();

    // Add payments (these are all transactions from payment endpoint)
    payments.forEach(payment => {
      if (!seenIds.has(payment.id)) {
        combined.push({
          ...payment,
          type: 'payment',
          coins: payment.coins || 0,
          subscriptionPlan: payment.subscriptionPlan || null,
          coinPackage: payment.coinPackage || null,
        });
        seenIds.add(payment.id);
      }
    });

    // Add wallet transactions (these are coin/credit transactions)
    walletTransactions.forEach(txn => {
      if (!seenIds.has(txn.id)) {
        combined.push({
          ...txn,
          type: 'wallet',
          razorpayOrderId: txn.razorpayOrderId || '--',
          razorpayPaymentId: txn.razorpayPaymentId || '--',
          subscriptionPlan: txn.subscriptionPlan || null,
          coinPackage: txn.coinPackage || null,
        });
        seenIds.add(txn.id);
      }
    });

    // Sort by date (newest first)
    return combined.sort((a, b) => {
      const dateA = new Date(a.processedAt || a.createdAt);
      const dateB = new Date(b.processedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [payments, walletTransactions]);

  const tableContent = useMemo(() => {
    if (loading) {
      return (
        <div className="py-12 sm:py-16 lg:py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (!allTransactions.length) {
      return (
        <div className="py-12 sm:py-16 lg:py-20 text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <CurrencyDollarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-sm sm:text-base mb-1">No transactions found</p>
          <p className="text-gray-500 text-xs sm:text-sm">Try adjusting your filters to see more results</p>
        </div>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                {[
                  'Type',
                  'Txn ID',
                  'User',
                  'Amount',
                  'Coins',
                  'Plan/Package',
                  'Method',
                  'Purpose',
                  'Status',
                  'Payment Details',
                  'Date',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-3 lg:px-4 xl:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b-2 border-gray-200"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {allTransactions.map((transaction, index) => {
                const statusBadge = statusClasses[transaction.status] || statusClasses.pending;
                const methodBadge = methodClasses[transaction.method] || methodClasses.manual;
                const purposeBadge = purposeClasses[transaction.purpose] || purposeClasses.credits;

                return (
                  <tr
                    key={`${transaction.type}-${transaction.id || transaction.txnId}`}
                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 text-sm transition-all duration-200 border-l-4 border-transparent hover:border-blue-400"
                  >
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm ${
                          transaction.type === 'payment'
                            ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'
                            : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                        }`}>
                          {transaction.type === 'payment' ? 'Payment' : 'Wallet'}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <span className="font-mono text-xs text-gray-900 break-all">{transaction.txnId}</span>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <div className="min-w-[120px]">
                          <p className="font-semibold text-gray-900 text-sm truncate">{transaction.userName}</p>
                          <p className="text-xs text-gray-500 truncate">{transaction.userEmail}</p>
                          {transaction.userPhone && transaction.userPhone !== '--' && (
                            <p className="text-xs text-gray-400 truncate">{transaction.userPhone}</p>
                          )}
                      </div>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                          {formatCurrency(transaction.amount || 0, transaction.currency || 'INR')}
                      </span>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        {transaction.coins > 0 ? (
                          <div>
                            <span className="font-semibold text-yellow-600 text-sm">
                              {transaction.coins.toLocaleString()} 🪙
                            </span>
                            {transaction.coinPackage?.bonus > 0 && (
                              <span className="text-xs text-green-600 ml-1 block sm:inline">
                                (+{transaction.coinPackage.bonus} bonus)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">--</span>
                        )}
                      </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5 min-w-[150px]">
                        {transaction.subscriptionPlan ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-indigo-700 text-xs sm:text-sm truncate">
                              {transaction.subscriptionPlan.planName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.subscriptionPlan.status === 'active' ? (
                                <span className="text-green-600">Active</span>
                              ) : transaction.subscriptionPlan.status === 'expired' ? (
                                <span className="text-red-600">Expired</span>
                              ) : (
                                <span className="text-gray-600">Cancelled</span>
                              )}
                            </div>
                            {transaction.subscriptionPlan.expiresAt && (
                              <div className="text-xs text-gray-400 truncate">
                                Exp: {formatDateTime(transaction.subscriptionPlan.expiresAt).split(',')[0]}
                              </div>
                            )}
                          </div>
                        ) : transaction.coinPackage ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-yellow-700 text-xs sm:text-sm truncate">
                              {transaction.coinPackage.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.coinPackage.coins} coins
                              {transaction.coinPackage.bonus > 0 && (
                                <span className="text-green-600 ml-1">
                                  +{transaction.coinPackage.bonus} bonus
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">--</span>
                        )}
                      </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap shadow-sm ${methodBadge}`}>
                          {transaction.method}
                      </span>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap shadow-sm ${purposeBadge}`}>
                          {transaction.purpose}
                      </span>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5">
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm ${statusBadge}`}>
                          {transaction.status === 'success' && <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
                          {transaction.status === 'failed' && <XCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
                          {transaction.status === 'pending' && <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
                          {transaction.status}
                      </span>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5 min-w-[120px]">
                        <div className="space-y-1">
                          {transaction.razorpayOrderId && transaction.razorpayOrderId !== '--' && (
                            <div>
                              <span className="text-xs text-gray-500">Order:</span>
                              <span className="font-mono text-xs text-gray-600 ml-1 break-all">{transaction.razorpayOrderId}</span>
                            </div>
                          )}
                          {transaction.razorpayPaymentId && transaction.razorpayPaymentId !== '--' && (
                            <div>
                              <span className="text-xs text-gray-500">Payment:</span>
                              <span className="font-mono text-xs text-gray-600 ml-1 break-all">{transaction.razorpayPaymentId}</span>
                            </div>
                          )}
                          {(!transaction.razorpayOrderId || transaction.razorpayOrderId === '--') &&
                           (!transaction.razorpayPaymentId || transaction.razorpayPaymentId === '--') && (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </div>
                    </td>
                      <td className="px-3 lg:px-4 xl:px-6 py-4 lg:py-5 text-gray-600 text-xs whitespace-nowrap">
                        {formatDateTime(transaction.processedAt || transaction.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 px-4 sm:px-6">
          {allTransactions.map((transaction) => {
            const statusBadge = statusClasses[transaction.status] || statusClasses.pending;
            const methodBadge = methodClasses[transaction.method] || methodClasses.manual;
            const purposeBadge = purposeClasses[transaction.purpose] || purposeClasses.credits;

            return (
              <div key={`${transaction.type}-${transaction.id || transaction.txnId}`} className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-200 hover:border-blue-300 p-4 space-y-3 transition-all duration-200">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${
                        transaction.type === 'payment'
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'
                          : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                      }`}>
                        {transaction.type === 'payment' ? 'Payment' : 'Wallet'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${statusBadge}`}>
                        {transaction.status === 'success' && <CheckCircleIcon className="w-3 h-3 inline mr-1" />}
                        {transaction.status === 'failed' && <XCircleIcon className="w-3 h-3 inline mr-1" />}
                        {transaction.status === 'pending' && <ClockIcon className="w-3 h-3 inline mr-1" />}
                        {transaction.status}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-600 break-all">{transaction.txnId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {formatCurrency(transaction.amount || 0, transaction.currency || 'INR')}
                    </p>
                    {transaction.coins > 0 && (
                      <p className="text-sm font-semibold text-yellow-600 mt-1">
                        {transaction.coins.toLocaleString()} 🪙
                      </p>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900 text-sm">{transaction.userName}</p>
                  <p className="text-xs text-gray-500">{transaction.userEmail}</p>
                  {transaction.userPhone && transaction.userPhone !== '--' && (
                    <p className="text-xs text-gray-400">{transaction.userPhone}</p>
                  )}
                </div>

                {/* Plan/Package */}
                {transaction.subscriptionPlan && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 space-y-1 border border-indigo-100 shadow-sm">
                    <p className="font-semibold text-indigo-700 text-sm">{transaction.subscriptionPlan.planName}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        transaction.subscriptionPlan.status === 'active' ? 'bg-green-100 text-green-700' :
                        transaction.subscriptionPlan.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.subscriptionPlan.status}
                      </span>
                      {transaction.subscriptionPlan.expiresAt && (
                        <span className="text-xs text-gray-600">
                          • Expires: {formatDateTime(transaction.subscriptionPlan.expiresAt).split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {transaction.coinPackage && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-3 space-y-1 border border-yellow-100 shadow-sm">
                    <p className="font-semibold text-yellow-700 text-sm">{transaction.coinPackage.name}</p>
                    <p className="text-xs text-gray-700">
                      {transaction.coinPackage.coins} coins
                      {transaction.coinPackage.bonus > 0 && (
                        <span className="text-green-600 font-semibold ml-1">+{transaction.coinPackage.bonus} bonus</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Method</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${methodBadge}`}>
                      {transaction.method}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Purpose</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${purposeBadge}`}>
                      {transaction.purpose}
                    </span>
                  </div>
                </div>

                {/* Payment Details */}
                {(transaction.razorpayOrderId && transaction.razorpayOrderId !== '--') ||
                 (transaction.razorpayPaymentId && transaction.razorpayPaymentId !== '--') ? (
                  <div className="space-y-1 pt-2 border-t border-gray-200 bg-gray-50 rounded-lg p-2">
                    {transaction.razorpayOrderId && transaction.razorpayOrderId !== '--' && (
                      <div>
                        <p className="text-xs text-gray-500">Order ID</p>
                        <p className="font-mono text-xs text-gray-700 break-all">{transaction.razorpayOrderId}</p>
                      </div>
                    )}
                    {transaction.razorpayPaymentId && transaction.razorpayPaymentId !== '--' && (
                      <div>
                        <p className="text-xs text-gray-500">Payment ID</p>
                        <p className="font-mono text-xs text-gray-700 break-all">{transaction.razorpayPaymentId}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Date */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-medium">
                    {formatDateTime(transaction.processedAt || transaction.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }, [allTransactions, loading]);

  return (
    <AdminLayout
      title="Payout & Transaction List"
      subtitle="Monitor All User Transactions"
      selectedNavKey="paymentList"
      headerActions={headerActions}
    >
      <section className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-4 sm:space-y-6 lg:space-y-8 min-w-0 w-full max-w-full">
        {(stats || walletStats) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="text-xs sm:text-sm lg:text-base font-semibold text-blue-700 uppercase tracking-wide flex-1 min-w-0">Total Transactions</div>
                  <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900">
                  {(stats?.totalTransactions || 0) + (walletStats?.totalTransactions || 0)}
                </div>
                <div className="mt-2 text-xs text-blue-600">All time transactions</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="text-xs sm:text-sm lg:text-base font-semibold text-emerald-700 uppercase tracking-wide flex-1 min-w-0">Successful</div>
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-700">
                  {(stats?.successfulTransactions || 0) + (walletStats?.successfulTransactions || 0)}
                </div>
                <div className="mt-2 text-xs text-emerald-600">Completed payments</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="text-xs sm:text-sm lg:text-base font-semibold text-green-700 uppercase tracking-wide flex-1 min-w-0">Total Revenue</div>
                  <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">
                  {formatCurrency((stats?.totalRevenue || 0) + (walletStats?.totalRevenue || 0))}
                </div>
                <div className="mt-2 text-xs text-green-600">Total earnings</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="text-xs sm:text-sm lg:text-base font-semibold text-yellow-700 uppercase tracking-wide flex-1 min-w-0">Coins Distributed</div>
                  <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-700">
                  {(walletStats?.totalCoinsDistributed || 0).toLocaleString()} 🪙
                </div>
                <div className="mt-2 text-xs text-yellow-600">Total coins given</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 lg:p-8 border-b border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">Show</label>
                <select
                  value={query.limit}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))
                  }
                  className="border border-gray-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">entries</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-white rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 shadow-sm">
                  <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <select
                    value={query.transactionType}
                    onChange={(e) => setQuery((prev) => ({ ...prev, transactionType: e.target.value, page: 1 }))}
                    className="w-full border-0 bg-transparent text-xs sm:text-sm focus:outline-none focus:ring-0 text-gray-700 font-medium"
                  >
                    <option value="all">All Transactions</option>
                    <option value="payments">Payments Only</option>
                    <option value="wallet">Wallet Only</option>
                  </select>
                </div>
                <select
                  value={query.status}
                    onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full border border-gray-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60 bg-white shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <option value="">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select
                    value={query.method}
                    onChange={(e) => setQuery((prev) => ({ ...prev, method: e.target.value, page: 1 }))}
                  className="w-full border border-gray-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60 bg-white shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <option value="">All Methods</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual">Manual</option>
                  </select>
                  <select
                    value={query.purpose}
                    onChange={(e) => setQuery((prev) => ({ ...prev, purpose: e.target.value, page: 1 }))}
                  className="w-full border border-gray-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60 bg-white shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <option value="">All Purposes</option>
                    <option value="subscription">Subscription</option>
                    <option value="credits">Credits</option>
                  <option value="coins">Coins</option>
                  </select>
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={query.search}
                    onChange={(e) =>
                      setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                    }
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60 bg-white shadow-sm hover:border-gray-300 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[200px]">
            {tableLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                <LoadingSpinner />
              </div>
            )}
            {tableContent}
          </div>

          {pagination.pages > 1 && (
            <div className="p-4 sm:p-6 lg:p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-semibold">{pagination.total}</span> entries
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handlePageChange(-1)}
                  disabled={pagination.page <= 1}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-gray-300 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                >
                  Previous
                </button>
                <span className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-800 bg-gray-100 rounded-xl">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-gray-300 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

