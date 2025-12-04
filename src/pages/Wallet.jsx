import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// NavBar removed - using GlobalNavBar from App.jsx
import PageContainer from '../components/common/PageContainer';
import { walletService } from '../services/walletService';
import {
  CurrencyDollarIcon,
  PlusIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  GiftIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useRazorpayCheckout } from '../components/payment/RazorpayCheckout';
import { useAuth } from '../contexts/AuthContext';
import WithdrawRequestDetailDrawer from '../components/wallet/WithdrawRequestDetailDrawer';

export default function Wallet() {
  const { user } = useAuth();
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [customCoins, setCustomCoins] = useState('');
  const [customCalculation, setCustomCalculation] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all'); // 'all' | 'purchase' | 'withdraw' | 'gift' | 'call'
  const [selectedWithdrawRequest, setSelectedWithdrawRequest] = useState(null);
  const [showWithdrawDetailDrawer, setShowWithdrawDetailDrawer] = useState(false);
  const { handlePayment: handleRazorpayPayment } = useRazorpayCheckout();

  useEffect(() => {
    loadCoinBalance();
    loadPackages();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionFilter]);

  const loadCoinBalance = async () => {
    try {
      setLoading(true);
      const response = await walletService.getBalance();
      setCoinBalance(response.coins || 0);
    } catch (error) {
      toast.error('Failed to load coin balance');
      setCoinBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await walletService.getPackages();
      setPackages(response.packages || []);
    } catch (error) {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      // Load all transactions without any filtering - backend returns all transaction types
      // Increase limit to show more transactions (500 to ensure we get everything)
      const response = await walletService.getTransactions({ page: 1, limit: 500 });
      setTransactions(response.transactions || []);
    } catch (error) {
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Reload transactions when filter changes
  useEffect(() => {
    loadTransactions();
  }, [transactionFilter]);

  const handleCustomCoinsChange = async (value) => {
    setCustomCoins(value);
    const coins = parseInt(value, 10);

    if (coins > 0) {
      try {
        const response = await walletService.calculatePurchase(coins);
        setCustomCalculation(response.calculation);
      } catch (error) {
        setCustomCalculation(null);
      }
    } else {
      setCustomCalculation(null);
    }
  };

  const handleBuyCoins = async (packageData, isCustom = false) => {
    try {
      const coins = isCustom ? (customCalculation.totalCoins || customCalculation.coins) : packageData.totalCoins;
      const amount = isCustom ? customCalculation.total : packageData.price; // Use total (includes GST) for custom
      const packageId = isCustom ? null : (packageData.id || packageData.packageId);

      setPurchasing(packageId || 'custom');

      // Use Razorpay checkout
      await handleRazorpayPayment({
        amount: amount,
        currency: 'INR',
        purpose: 'coins',
        metadata: {
          coinsPurchased: coins,
          packageId: packageId,
        },
        description: `Purchase ${coins} coins`,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        onSuccess: async (transaction) => {
          toast.success(`${coins} coins added successfully!`);
          setShowBuyCoins(false);
          setCustomCoins('');
          setCustomCalculation(null);
          await loadCoinBalance();
          await loadTransactions();
          setPurchasing(null);
        },
        onError: (error) => {
          toast.error(error.message || 'Payment failed');
          setPurchasing(null);
        },
        onCancel: () => {
          setPurchasing(null);
        },
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to purchase coins';
      toast.error(message);
      setPurchasing(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const shortenTxnId = (txnId) => {
    if (!txnId) return 'N/A';
    const str = String(txnId);
    if (str.length <= 10) return str;
    return `${str.slice(0, 6)}…${str.slice(-4)}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50" style={{ height: '100%', width: '100%' }}>
      {/* NavBar removed - using GlobalNavBar from App.jsx */}

      <PageContainer
        className="bg-gray-50"
        fullWidth={false}
        maxWidth="7xl"
        padding={true}
      >
        <div className="w-full space-y-6">
          {/* Coin Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-velora-primary to-velora-secondary rounded-3xl p-8 mb-6 shadow-xl w-full"
          >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CurrencyDollarIcon className="w-8 h-8 text-black" />
              <h2 className="text-2xl font-bold text-black">My Coins</h2>
            </div>

            {loading ? (
              <div className="w-32 h-12 bg-black/20 rounded-lg animate-pulse mx-auto mb-6" />
            ) : (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mb-6"
              >
                <p className="text-6xl font-bold text-black mb-2">
                  {coinBalance.toLocaleString()}
                </p>
                <p className="text-lg text-black/80">Available Balance</p>
              </motion.div>
            )}

            <motion.button
              onClick={() => setShowBuyCoins(!showBuyCoins)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-black text-velora-primary px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-2">
                <PlusIcon className="w-6 h-6" />
                Buy Coins
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Buy Coins Options */}
        <AnimatePresence>
          {showBuyCoins && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-6 mb-6 shadow-lg"
            >
              <h3 className="text-xl font-bold text-black mb-4">Purchase Coins</h3>

              {/* Coin Packages */}
              {loadingPackages ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-gray-100 rounded-xl animate-pulse h-24" />
                  ))}
                </div>
              ) : packages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {packages.map((pkg) => (
                      <motion.button
                        key={pkg.id || pkg.packageId}
                        onClick={() => handleBuyCoins(pkg, false)}
                        disabled={purchasing === (pkg.id || pkg.packageId)}
                        whileHover={{ scale: purchasing === (pkg.id || pkg.packageId) ? 1 : 1.02 }}
                        whileTap={{ scale: purchasing === (pkg.id || pkg.packageId) ? 1 : 0.98 }}
                        className={`p-4 border-2 rounded-xl transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed relative ${
                          (pkg.isPopular || pkg.popular)
                            ? 'bg-gradient-to-br from-velora-primary/20 to-velora-secondary/20 border-velora-primary'
                            : 'bg-gray-50 hover:bg-velora-primary/10 border-gray-200 hover:border-velora-primary'
                        }`}
                      >
                        {(pkg.isPopular || pkg.popular) && (
                          <div className="absolute -top-3 right-4 bg-velora-primary text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3" />
                            POPULAR
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-lg text-black">{pkg.totalCoins} Coins</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {pkg.discount > 0 && pkg.originalPrice ? (
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-400 line-through">
                                    ₹{pkg.originalPrice.toLocaleString()}
                                  </p>
                                  <p className="text-sm font-bold text-black">
                                    ₹{pkg.price.toLocaleString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm font-bold text-black">
                                  ₹{pkg.price.toLocaleString()}
                                </p>
                              )}
                              {pkg.bonus > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                  +{pkg.bonus} Bonus
                                </span>
                              )}
                              {pkg.discount > 0 && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                                  {pkg.discount}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                          {purchasing === (pkg.id || pkg.packageId) ? (
                            <div className="w-6 h-6 border-2 border-velora-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <PlusIcon className="w-6 h-6 text-velora-primary" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
              ) : null}

              {/* Custom Amount */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-black mb-3">Custom Amount</h4>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customCoins}
                      onChange={(e) => handleCustomCoinsChange(e.target.value)}
                      placeholder="Enter coins amount"
                      min="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-velora-primary"
                    />
                    {customCalculation && (
                      <p className="text-xs text-gray-500 mt-1">
                        Total: ₹{customCalculation.total.toFixed(2)} (includes GST)
                      </p>
                    )}
                  </div>
                  <motion.button
                    onClick={() => handleBuyCoins(null, true)}
                    disabled={!customCalculation || purchasing === 'custom'}
                    whileHover={{ scale: customCalculation && purchasing !== 'custom' ? 1.05 : 1 }}
                    whileTap={{ scale: customCalculation && purchasing !== 'custom' ? 0.95 : 1 }}
                    className="px-6 py-3 bg-velora-primary text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing === 'custom' ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Buy'
                    )}
                  </motion.button>
                </div>
                {customCalculation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-velora-primary/10 rounded-xl"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Coins:</span>
                      <span className="font-bold text-black">{customCalculation.coins.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Base Price (1 coin = ₹0.10):</span>
                      <span className="font-bold text-black">₹{customCalculation.price.toFixed(2)}</span>
                    </div>
                    {customCalculation.gst > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">GST (18%):</span>
                        <span className="font-bold text-gray-600">₹{customCalculation.gst.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="font-bold text-black">Total Price:</span>
                      <span className="font-bold text-lg text-black">
                        ₹{customCalculation.total.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-bold text-black">Transaction History</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTransactionFilter('all')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    transactionFilter === 'all'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTransactionFilter('purchase')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    transactionFilter === 'purchase'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Purchases
                </button>
                <button
                  onClick={() => setTransactionFilter('gift')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    transactionFilter === 'gift'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Gifts
                </button>
                <button
                  onClick={() => setTransactionFilter('withdraw')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    transactionFilter === 'withdraw'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Withdraws
                </button>
                <button
                  onClick={() => setTransactionFilter('call')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    transactionFilter === 'call'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Calls
                </button>
              </div>
              <button
                onClick={() => setShowTransactions(!showTransactions)}
                className="text-sm text-velora-primary font-medium hover:underline"
              >
                {showTransactions ? 'Hide' : 'Show All'}
              </button>
            </div>
          </div>

          {loadingTransactions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-gray-100 rounded-xl animate-pulse h-20" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-2">
                {transactionFilter === 'withdraw'
                  ? 'Your withdrawal history will appear here'
                  :                   transactionFilter === 'gift'
                  ? 'Your gift transactions will appear here'
                  : transactionFilter === 'purchase'
                  ? 'Your coin purchase history will appear here'
                  : transactionFilter === 'call'
                  ? 'Your call transactions will appear here'
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showTransactions ? transactions : transactions.slice(0, 5))
                .filter((txn) => {
                  // For male users: filter out received transactions (only show deductions)
                  const isMale = user?.gender === 'male';
                  if (isMale && txn.purpose === 'call') {
                    // For call transactions, check if it's a credit/receive transaction
                    const isCallCredit = txn.metadata?.type === 'call_receive' ||
                                        txn.metadata?.type === 'call_credit' ||
                                        txn.metadata?.type === 'call_admin_share';

                    // Check if coins value is positive (indicating a credit/receive)
                    // For call transactions, negative coins = debit (deduction), positive = credit (received)
                    const txnCoins = txn.coins !== undefined && txn.coins !== null ? txn.coins : 0;

                    // Filter out any call transaction where:
                    // 1. It's marked as a credit/receive type, OR
                    // 2. Coins value is positive (indicating money received)
                    if (isCallCredit || txnCoins > 0) {
                      return false; // Hide received transactions for male users
                    }
                  }

                  // Filter based on transactionFilter
                  if (transactionFilter === 'purchase') {
                    return txn.purpose === 'coins' || txn.purpose === 'credits';
                  } else if (transactionFilter === 'gift') {
                    return txn.purpose === 'gift';
                  } else if (transactionFilter === 'withdraw') {
                    return txn.purpose === 'withdrawal';
                  } else if (transactionFilter === 'call') {
                    return txn.purpose === 'call';
                  }
                  // 'all' shows everything - no filtering needed
                  return true;
                })
                .map((txn) => {
                  const txnId = txn.txnId || txn.id || txn._id || 'N/A';
                  // Get coins value from multiple possible sources
                  let coinsValue = 0;
                  // For call transactions, coins can be negative (charge) or positive (receive)
                  if (txn.purpose === 'call') {
                    coinsValue = txn.coins !== undefined && txn.coins !== null ? txn.coins : (txn.metadata?.billedCoins || 0);
                  } else if (txn.purpose === 'gift' && txn.metadata?.type === 'gift_sent') {
                    // For gift sent: coins is negative, use absolute value or metadata.giftCost
                    coinsValue = txn.metadata?.giftCost || (txn.coins !== undefined && txn.coins !== null ? Math.abs(txn.coins) : 0);
                  } else if (txn.coins !== undefined && txn.coins !== null && txn.coins > 0) {
                    coinsValue = txn.coins;
                  } else if (txn.metadata?.coinsPurchased) {
                    coinsValue = txn.metadata.coinsPurchased;
                  } else if (txn.metadata?.coins) {
                    coinsValue = txn.metadata.coins;
                  } else if (txn.amount && txn.amount > 0) {
                    // Calculate from amount if coins not set: amount / 0.10 (1 coin = 10 paise)
                    coinsValue = Math.round(txn.amount / 0.10);
                  }

                  const bonusValue = txn.bonus || txn.metadata?.bonus || 0;
                  const isCoinPurchase = txn.purpose === 'coins' || txn.purpose === 'credits';
                  const isGift = txn.purpose === 'gift';
                  const isWithdrawal = txn.purpose === 'withdrawal';
                  const isGiftSent = isGift && txn.metadata?.type === 'gift_sent';
                  const isGiftReceived = isGift && txn.metadata?.type === 'gift_received';
                  const isCall = txn.purpose === 'call';
                  const isCallCharge = isCall && (txn.metadata?.type === 'call_charge' || txn.metadata?.type === 'call_debit');
                  const isCallReceive = isCall && (txn.metadata?.type === 'call_receive' || txn.metadata?.type === 'call_credit' || txn.metadata?.type === 'call_admin_share');

                  // For male users: only show call charges (debits), never show receives
                  // Also check if coins are positive (indicating a credit) for call transactions
                  if (isCall && user?.gender === 'male') {
                    // Skip if it's a receive/credit transaction OR if coins are positive
                    if (isCallReceive || coinsValue > 0) {
                      return null; // Skip rendering this transaction for male users
                    }
                  }

                  // Purchase Transaction
                  if (isCoinPurchase && (transactionFilter === 'purchase' || transactionFilter === 'all')) {
                    // Calculate total coins - ensure we always have a number to display
                    let totalCoinsPurchased = coinsValue + bonusValue;
                    if (totalCoinsPurchased <= 0 && txn.amount && txn.amount > 0) {
                      // Calculate from amount if coins not set: amount / 0.10 (1 coin = 10 paise)
                      totalCoinsPurchased = Math.round(txn.amount / 0.10);
                    }

                    return (
                      <motion.div
                        key={txn.txnId || txn.id || txn._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(txn.status)}
                              <div>
                                <p className="font-bold text-green-600 text-lg">
                                  {totalCoinsPurchased > 0
                                    ? `${totalCoinsPurchased.toLocaleString()} Coins Purchased`
                                    : 'Coins Purchased'}
                                </p>
                                {(coinsValue > 0 || bonusValue > 0) && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {coinsValue > 0 && `${coinsValue.toLocaleString()} coins`}
                                    {bonusValue > 0 && (coinsValue > 0 ? ` + ${bonusValue.toLocaleString()} bonus` : `${bonusValue.toLocaleString()} bonus`)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {txn.amount && txn.amount > 0 && (
                                <p className="font-bold text-gray-900 text-lg">₹{txn.amount.toLocaleString()}</p>
                              )}
                              <p className={`text-xs font-medium capitalize mt-1 ${
                                txn.status === 'success' ? 'text-green-600' :
                                txn.status === 'failed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status === 'success' ? 'Success' : txn.status === 'failed' ? 'Failed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                            <div>
                              <p className="text-gray-500">Transaction ID:</p>
                              <p className="font-mono text-gray-900 break-all">{txnId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date & Time:</p>
                              <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Gift Sent Transaction
                  if (isGiftSent && (transactionFilter === 'gift' || transactionFilter === 'all')) {
                    return (
                      <motion.div
                        key={txn.txnId || txn.id || txn._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(txn.status)}
                              <div>
                                <p className="font-bold text-red-600 text-lg">
                                  -{Math.abs(coinsValue).toLocaleString()} Coins
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                  <GiftIcon className="w-4 h-4" />
                                  Gift sent to {txn.recipientName || 'User'}
                                  {txn.giftType && <span className="ml-1">({txn.giftType})</span>}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-600">For: Gift</p>
                              <p className={`text-xs font-medium capitalize mt-1 ${
                                txn.status === 'success' ? 'text-green-600' :
                                txn.status === 'failed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status === 'success' ? 'Success' : txn.status === 'failed' ? 'Failed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                            <div>
                              <p className="text-gray-500">Transaction ID:</p>
                              <p className="font-mono text-gray-900 break-all">{txnId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date & Time:</p>
                              <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Gift Received Transaction
                  if (isGiftReceived && (transactionFilter === 'gift' || transactionFilter === 'all')) {
                    return (
                      <motion.div
                        key={txn.txnId || txn.id || txn._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(txn.status)}
                              <div>
                                <p className="font-bold text-green-600 text-lg">
                                  +{coinsValue.toLocaleString()} Coins
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                  <GiftIcon className="w-4 h-4 text-purple-500" />
                                  Gift from {txn.senderName || 'Unknown User'}
                                  {txn.giftType && <span className="ml-1">({txn.giftType})</span>}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-600">Gift Received</p>
                              <p className={`text-xs font-medium capitalize mt-1 ${
                                txn.status === 'success' ? 'text-green-600' :
                                txn.status === 'failed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status === 'success' ? 'Success' : txn.status === 'failed' ? 'Failed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                            <div>
                              <p className="text-gray-500">Transaction ID:</p>
                              <p className="font-mono text-gray-900 break-all">{txnId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date & Time:</p>
                              <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Call Charge Transaction (Debit)
                  if (isCallCharge && (transactionFilter === 'call' || transactionFilter === 'all')) {
                    // Trust server's callType (voice or video, no mixed)
                    const callType = txn.metadata?.callType || 'voice';
                    const durationSeconds = txn.metadata?.durationSeconds || 0;
                    const durationMins = Math.floor(durationSeconds / 60);
                    const durationSecs = durationSeconds % 60;
                    const durationText = durationMins > 0
                      ? `${durationMins}m ${durationSecs}s`
                      : `${durationSecs}s`;
                    const billedCoins = Math.abs(txn.coins) || txn.metadata?.billedCoins || 0;

                    return (
                      <motion.div
                        key={txn.txnId || txn.id || txn._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl hover:from-red-100 hover:to-orange-100 transition-all border-2 border-red-200 hover:border-red-300 shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-full">
                                {callType === 'video' ? (
                                  <VideoCameraIcon className="w-5 h-5 text-red-600" />
                                ) : (
                                  <PhoneIcon className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-red-600 text-lg">
                                  -{billedCoins.toLocaleString()} Coins
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                                  <span className="font-medium">
                                    {callType === 'video' ? 'Video Call' : 'Voice Call'}
                                  </span>
                                  {durationSeconds > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{durationText}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-600">Call Charge</p>
                              <p className={`text-xs font-medium capitalize mt-1 ${
                                txn.status === 'success' ? 'text-green-600' :
                                txn.status === 'failed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status === 'success' ? 'Completed' : txn.status === 'failed' ? 'Failed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-200 text-xs">
                            <div>
                              <p className="text-gray-500">Transaction ID:</p>
                              <p className="font-mono text-gray-900 break-all">{txnId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date & Time:</p>
                              <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Call Receive Transaction (Credit) - Only show for female users
                  // Male users should not see received transactions
                  if (isCallReceive && (transactionFilter === 'call' || transactionFilter === 'all') && user?.gender !== 'male') {
                    // Trust server's callType (voice or video, no mixed)
                    const callType = txn.metadata?.callType || 'voice';
                    const durationSeconds = txn.metadata?.durationSeconds || 0;
                    const durationMins = Math.floor(durationSeconds / 60);
                    const durationSecs = durationSeconds % 60;
                    const durationText = durationMins > 0
                      ? `${durationMins}m ${durationSecs}s`
                      : `${durationSecs}s`;
                    const receivedCoins = txn.coins || txn.metadata?.billedCoins || 0;
                    const billedCoins = txn.metadata?.billedCoins || receivedCoins;
                    const sharePercent = billedCoins > 0 ? Math.round((receivedCoins / billedCoins) * 100) : 60;

                    return (
                      <motion.div
                        key={txn.txnId || txn.id || txn._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all border-2 border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-full">
                                {callType === 'video' ? (
                                  <VideoCameraIcon className="w-5 h-5 text-green-600" />
                                ) : (
                                  <PhoneIcon className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-green-600 text-lg">
                                  +{receivedCoins.toLocaleString()} Coins
                                </p>
                                <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                                  <span className="font-medium">
                                    {callType === 'video' ? 'Video Call' : 'Voice Call'} Received
                                  </span>
                                  {durationSeconds > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{durationText}</span>
                                    </>
                                  )}
                                  {sharePercent > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-600 font-semibold">{sharePercent}% share</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-600">Call Payment</p>
                              <p className={`text-xs font-medium capitalize mt-1 ${
                                txn.status === 'success' ? 'text-green-600' :
                                txn.status === 'failed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status === 'success' ? 'Received' : txn.status === 'failed' ? 'Failed' : 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-200 text-xs">
                            <div>
                              <p className="text-gray-500">Transaction ID:</p>
                              <p className="font-mono text-gray-900 break-all">{txnId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date & Time:</p>
                              <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Withdrawal Transaction
                  if (isWithdrawal && (transactionFilter === 'withdraw' || transactionFilter === 'all')) {
                    const withdrawRequestId = txn.metadata?.withdrawalRequestId || txn.id;
                    return (
                      <motion.div
                        key={txn.txnId || txn.id || txn._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
                        onClick={async () => {
                          try {
                            const response = await walletService.getWithdrawalRequest(withdrawRequestId);
                            if (response.success) {
                              setSelectedWithdrawRequest(response.request);
                              setShowWithdrawDetailDrawer(true);
                            } else {
                              toast.error('Failed to load withdraw details');
                            }
                          } catch (error) {
                            toast.error('Failed to load withdraw details');
                          }
                        }}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(txn.status)}
                              <div>
                                <p className="font-bold text-red-600 text-lg">
                                  -{Math.abs(coinsValue).toLocaleString()} Coins
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">Withdrawal</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {txn.amount && txn.amount > 0 && (
                                <p className="font-bold text-red-600 text-lg">-₹{txn.amount.toLocaleString()}</p>
                              )}
                              <p className={`text-xs font-medium capitalize mt-1 ${
                                txn.status === 'success' || txn.status === 'completed' ? 'text-green-600' :
                                txn.status === 'failed' ? 'text-red-600' :
                                txn.status === 'locked' ? 'text-orange-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status === 'success' ? 'Success' :
                                 txn.status === 'completed' ? 'Completed' :
                                 txn.status === 'failed' ? 'Failed' :
                                 txn.status === 'locked' ? 'Locked' :
                                 txn.status === 'pending' ? 'Pending' :
                                 txn.status === 'processing' ? 'Processing' :
                                 'Pending'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                            <div>
                              <p className="text-gray-500">Transaction ID:</p>
                              <p className="font-mono text-gray-900 break-all">{txnId}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Date & Time:</p>
                              <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Default/Unknown transaction type - show it anyway
                  // This catches all other transaction types (refunds, bonuses, admin adjustments, etc.)
                  const displayPurpose = txn.purpose || txn.type || 'Transaction';
                  const isCredit = coinsValue > 0 || (txn.amount && txn.amount > 0);
                  const isDebit = coinsValue < 0 || (txn.amount && txn.amount < 0);

                  return (
                    <motion.div
                      key={txn.txnId || txn.id || txn._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl hover:bg-opacity-80 transition-colors border-2 ${
                        isCredit
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                          : isDebit
                          ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:border-red-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(txn.status)}
                            <div>
                              <p className={`font-bold text-lg ${
                                isCredit ? 'text-green-600' : isDebit ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {coinsValue !== 0 ? (
                                  isCredit ? `+${Math.abs(coinsValue).toLocaleString()} Coins` : `${coinsValue.toLocaleString()} Coins`
                                ) : (
                                  displayPurpose
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                                {displayPurpose}
                                {txn.metadata?.type && (
                                  <span className="ml-1 text-gray-400">({txn.metadata.type})</span>
                                )}
                              </p>
                              {txn.metadata?.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{txn.metadata.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {txn.amount && txn.amount !== 0 && (
                              <p className={`font-bold text-lg ${
                                txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                              </p>
                            )}
                            <p className={`text-xs font-medium capitalize mt-1 ${
                              txn.status === 'success' || txn.status === 'completed' ? 'text-green-600' :
                              txn.status === 'failed' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {txn.status === 'success' || txn.status === 'completed' ? 'Success' :
                               txn.status === 'failed' ? 'Failed' :
                               txn.status === 'pending' ? 'Pending' :
                               txn.status || 'Pending'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs">
                          <div>
                            <p className="text-gray-500">Transaction ID:</p>
                            <p className="font-mono text-gray-900 break-all">{txnId}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date & Time:</p>
                            <p className="text-gray-900">{formatDateTime(txn.createdAt || txn.processedAt || new Date())}</p>
                          </div>
                        </div>
                        {txn.metadata && Object.keys(txn.metadata).length > 0 && (
                          <div className="pt-2 border-t border-gray-200 text-xs">
                            <p className="text-gray-500 mb-1">Details:</p>
                            <div className="space-y-1">
                              {txn.metadata.callId && (
                                <p className="text-gray-600">Call ID: <span className="font-mono">{txn.metadata.callId}</span></p>
                              )}
                              {txn.metadata.transactionId && (
                                <p className="text-gray-600">Related Transaction: <span className="font-mono">{txn.metadata.transactionId}</span></p>
                              )}
                              {txn.metadata.reason && (
                                <p className="text-gray-600">Reason: {txn.metadata.reason}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>
        </div>
      </PageContainer>

      {/* Withdraw Request Detail Drawer */}
      <WithdrawRequestDetailDrawer
        isOpen={showWithdrawDetailDrawer}
        onClose={() => {
          setShowWithdrawDetailDrawer(false);
          setSelectedWithdrawRequest(null);
        }}
        request={selectedWithdrawRequest}
        onRefresh={() => {
          loadTransactions();
        }}
      />
    </div>
  );
}

