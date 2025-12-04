import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { callService } from '../services/callService';
import { getSocket } from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import PageContainer from '../components/common/PageContainer';

export default function Calls() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'missed', 'incoming', 'outgoing', 'paid', 'unpaid'
  const navigate = useNavigate();
  const seenTransactionIdsRef = useRef(new Set()); // Track seen transaction IDs for deduplication

  useEffect(() => {
    // Reset seen transaction IDs when page changes
    if (page === 1) {
      seenTransactionIdsRef.current.clear();
    }
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  
  // Reload when user changes (in case user logs in/out)
  useEffect(() => {
    if (user?._id) {
      seenTransactionIdsRef.current.clear();
      setPage(1);
      setTransactions([]);
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await callService.getCallTransactions(page, 20);
      
      // Debug: Log response to help diagnose issues
      if (process.env.NODE_ENV === 'development') {
        console.log('[Calls] API Response:', {
          success: response.success,
          transactionCount: response.transactions?.length || 0,
          transactions: response.transactions,
          pagination: response.pagination,
        });
      }
      
      if (response.success) {
          let filteredTransactions = response.transactions || [];
          
          // Debug: Log filtered transactions
          if (process.env.NODE_ENV === 'development') {
            console.log('[Calls] Filtered transactions before processing:', filteredTransactions.length);
          }

          // Deduplicate by transactionId/callId (only within current response)
          const uniqueTransactions = [];
          const seenInResponse = new Set();
          for (const tx of filteredTransactions) {
            const transactionKey = tx.id || tx.callId;
            // Only check for duplicates within the current response
            // Don't check seenTransactionIdsRef here - that's for preventing duplicates when merging
            if (!seenInResponse.has(transactionKey)) {
              seenInResponse.add(transactionKey);

              // Trust server's authoritative callType (voice or video, no mixed)
              const authoritativeCallType = tx.callType || 'voice';
              
              // Normalize status: map all success statuses to 'completed'
              const normalizedStatus = (tx.status === 'paid' || 
                                       tx.status === 'completed' || 
                                       tx.status === 'ended' || 
                                       tx.status === 'success')
                ? 'completed'
                : (tx.status || 'completed');
              
              // Ensure otherParty exists - create from participants if needed
              let otherParty = tx.otherParty;
              if (!otherParty && tx.participants && Array.isArray(tx.participants)) {
                const currentUserId = user?._id?.toString();
                const other = tx.participants.find(p => 
                  (p.id?.toString() || p._id?.toString()) !== currentUserId
                );
                if (other) {
                  otherParty = {
                    id: other.id || other._id,
                    name: other.name || 'Unknown',
                    avatar: other.avatar || other.photos?.[0]?.url || null,
                  };
                }
              }
              
              // Fallback if still no otherParty
              if (!otherParty) {
                otherParty = {
                  id: null,
                  name: 'Unknown',
                  avatar: null,
                };
              }
              
              uniqueTransactions.push({
                ...tx,
                callType: authoritativeCallType, // Trust server's callType
                status: normalizedStatus, // Normalized status
                otherParty: otherParty, // Ensure otherParty always exists
              });
            }
          }

          // Apply filters
          let finalTransactions = uniqueTransactions;
          if (filter === 'missed') {
            finalTransactions = finalTransactions.filter(tx => tx.status === 'missed');
          } else if (filter === 'incoming') {
            finalTransactions = finalTransactions.filter(tx => !tx.isCaller);
          } else if (filter === 'outgoing') {
            finalTransactions = finalTransactions.filter(tx => tx.isCaller);
          } else if (filter === 'paid') {
            finalTransactions = finalTransactions.filter(tx =>
              (tx.status === 'completed' || tx.status === 'ended' || tx.status === 'success' || tx.status === 'paid') && tx.billedCoins > 0
            );
          } else if (filter === 'cancelled') {
            finalTransactions = finalTransactions.filter(tx =>
              tx.status === 'cancelled' || tx.status === 'rejected'
            );
          } else if (filter === 'unpaid') {
            finalTransactions = finalTransactions.filter(tx =>
              tx.status === 'missed' || tx.status === 'cancelled' || (tx.billedCoins === 0 && tx.status !== 'completed')
            );
          }

          if (page === 1) {
            // For page 1, replace all transactions
            setTransactions(finalTransactions);
            // Update seen IDs for socket event deduplication
            finalTransactions.forEach(tx => {
              const key = tx.id || tx.callId;
              if (key) {
                seenTransactionIdsRef.current.add(key);
              }
            });
          } else {
            // For subsequent pages, merge with deduplication
            setTransactions(prev => {
              const existingKeys = new Set(prev.map(tx => tx.id || tx.callId));
              const newTransactions = finalTransactions.filter(tx => {
                const key = tx.id || tx.callId;
                if (existingKeys.has(key)) {
                  return false; // Skip if already in current list
                }
                // Add to seen IDs for socket event deduplication
                if (key) {
                  seenTransactionIdsRef.current.add(key);
                }
                return true;
              });
              return [...prev, ...newTransactions];
            });
          }
          // Adjust hasMore based on filtered results
          setHasMore(finalTransactions.length === 20 && response.pagination.page < response.pagination.pages);
          
          // Debug: Log final result
          if (process.env.NODE_ENV === 'development') {
            console.log('[Calls] Final transactions to display:', {
              count: finalTransactions.length,
              filter,
              page,
            });
          }
      } else {
        toast.error('Failed to load call history');
      }
    } catch (error) {
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  // Reload when filter changes
  useEffect(() => {
    setPage(1);
    setTransactions([]);
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Listen for real-time call:transaction events
  useEffect(() => {
    const socket = getSocket();

    const handleCallTransaction = (transactionData) => {
      // Check for duplicate by transactionId (primary dedupe key) or callId (secondary)
      const transactionKey = transactionData.transactionId || transactionData.callId;
      if (seenTransactionIdsRef.current.has(transactionKey)) {
        return; // Ignore duplicate
      }

      // Mark as seen
      seenTransactionIdsRef.current.add(transactionKey);

      // Add or update transaction in the list immediately
      setTransactions(prev => {
        // Check if transaction already exists (double-check)
        const existingIndex = prev.findIndex(tx =>
          (transactionData.transactionId && tx.id === transactionData.transactionId) ||
          (tx.callId === transactionData.callId && transactionData.transactionId)
        );

        if (existingIndex >= 0) {
          // Get existing transaction for reference
          const existingTx = prev[existingIndex];
          
          // Map status correctly - all success statuses should be 'completed'
          const mappedStatus = (transactionData.status === 'paid' || 
                                transactionData.status === 'completed' || 
                                transactionData.status === 'ended' || 
                                transactionData.status === 'success')
            ? 'completed'
            : (transactionData.status || existingTx.status);

          // Ensure otherParty exists - create from participants if needed
          let otherParty = transactionData.otherParty || existingTx.otherParty;
          if (!otherParty && transactionData.participants && Array.isArray(transactionData.participants)) {
            const currentUserId = user?._id?.toString();
            const other = transactionData.participants.find(p => 
              (p.id?.toString() || p._id?.toString()) !== currentUserId
            );
            if (other) {
              otherParty = {
                id: other.id || other._id,
                name: other.name || 'Unknown',
                avatar: other.avatar || other.photos?.[0]?.url || null,
              };
            }
          }
          
          // Fallback if still no otherParty
          if (!otherParty) {
            otherParty = {
              id: null,
              name: 'Unknown',
              avatar: null,
            };
          }

          // Update existing transaction with authoritative data
          const updated = [...prev];
          updated[existingIndex] = {
            ...existingTx,
            ...transactionData,
            id: transactionData.transactionId || existingTx.id,
            callType: transactionData.callType || existingTx.callType, // Use authoritative callType
            status: mappedStatus,
            otherParty: otherParty, // Ensure otherParty always exists
          };
          return updated;
        }

        // Trust server's authoritative callType (voice or video, no mixed)
        const authoritativeCallType = transactionData.callType || 'voice';

        // Map status correctly - all success statuses should be 'completed'
        const mappedStatus = (transactionData.status === 'paid' || 
                              transactionData.status === 'completed' || 
                              transactionData.status === 'ended' || 
                              transactionData.status === 'success')
          ? 'completed'
          : (transactionData.status || 'completed');

        // Ensure otherParty exists - create from participants if needed
        let otherParty = transactionData.otherParty;
        if (!otherParty && transactionData.participants && Array.isArray(transactionData.participants)) {
          const currentUserId = user?._id?.toString();
          const other = transactionData.participants.find(p => 
            (p.id?.toString() || p._id?.toString()) !== currentUserId
          );
          if (other) {
            otherParty = {
              id: other.id || other._id,
              name: other.name || 'Unknown',
              avatar: other.avatar || other.photos?.[0]?.url || null,
            };
          }
        }
        
        // Fallback if still no otherParty
        if (!otherParty) {
          otherParty = {
            id: null,
            name: 'Unknown',
            avatar: null,
          };
        }

        // Add new transaction at the beginning
        return [{
          ...transactionData,
          id: transactionData.transactionId || transactionData.callId,
          callType: authoritativeCallType, // Use server's authoritative callType
          isCaller: transactionData.initiatorId === user?._id?.toString(),
          status: mappedStatus,
          otherParty: otherParty, // Ensure otherParty always exists
        }, ...prev];
      });

      // Reload transactions after a delay to get full details from server
      setTimeout(() => {
        loadTransactions();
      }, 3000);
    };

    const handleBillingFailed = (data) => {
      // Reload to show failed transaction
      loadTransactions();
    };

    const handleCallEnded = (data) => {
      // Reload transactions when a call ends to ensure we have the latest status
      // Add a small delay to allow the transaction to be saved
      setTimeout(() => {
        loadTransactions();
      }, 2000);
    };

    socket.on('call:transaction', handleCallTransaction);
    socket.on('call:billing_failed', handleBillingFailed);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('call:transaction', handleCallTransaction);
      socket.off('call:billing_failed', handleBillingFailed);
      socket.off('call-ended', handleCallEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconciliation: Fetch missed transactions on mount and when window regains focus
  useEffect(() => {
    const reconcileTransactions = async () => {
      try {
        // Get the most recent transaction timestamp
        const mostRecentTx = transactions
          .filter(tx => tx.createdAt || tx.attemptedAt || tx.startedAt)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.attemptedAt || a.startedAt);
            const dateB = new Date(b.createdAt || b.attemptedAt || b.startedAt);
            return dateB - dateA;
          })[0];

        const since = mostRecentTx
          ? new Date(new Date(mostRecentTx.createdAt || mostRecentTx.attemptedAt || mostRecentTx.startedAt).getTime() + 1000).toISOString()
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

        const response = await callService.getCallTransactions(1, 100, null, since);
        if (response.success && response.transactions) {
          // Add new transactions that aren't already in the list
          setTransactions(prev => {
            const existingIds = new Set(prev.map(tx => tx.id || tx.transactionId));
            const newTxs = response.transactions.filter(tx => !existingIds.has(tx.id));
            return [...prev, ...newTxs];
          });
        }
      } catch (error) {
        }
    };

    // Reconcile on mount
    if (transactions.length === 0) {
      reconcileTransactions();
    }

    // Reconcile when window regains focus
    const handleFocus = () => {
      reconcileTransactions();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleTransactionTap = (tx) => {
    // Navigate to chat with the other party
    if (tx.otherParty?.id) {
      navigate(`/chat/${tx.otherParty.id}`);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Call History</h1>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'missed', label: 'Missed' },
            { value: 'incoming', label: 'Incoming' },
            { value: 'outgoing', label: 'Outgoing' },
            { value: 'paid', label: 'Paid' },
            { value: 'unpaid', label: 'Unpaid' },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === filterOption.value
                  ? 'bg-velora-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <PhoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No call history yet</p>
            <p className="text-sm text-gray-400 mt-2">Your call transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTransactionTap(tx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="relative">
                      {tx.otherParty?.avatar ? (
                        <img
                          src={tx.otherParty.avatar}
                          alt={tx.otherParty?.name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-lg font-semibold">
                            {(tx.otherParty?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                        {tx.callType === 'video' ? (
                          <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <PhoneIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {tx.otherParty?.name || 'Unknown'}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        {/* Show call direction */}
                        <span className="text-xs text-gray-500 font-medium">
                          {tx.isCaller ? 'Outgoing' : 'Incoming'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {tx.callType === 'video' ? 'Video' : 'Voice'}
                        </span>
                        {tx.status === 'missed' ? (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium">
                            Missed
                          </span>
                        ) : tx.status === 'cancelled' ? (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-medium">
                            Cancelled
                          </span>
                        ) : tx.status === 'failed' ? (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium">
                            Failed
                          </span>
                        ) : (tx.status === 'ended' || tx.status === 'completed' || tx.status === 'success') ? (
                          <>
                            {tx.durationSeconds > 0 && (
                              <span className="text-sm text-gray-600">
                                {formatDuration(tx.durationSeconds)}
                              </span>
                            )}
                            {/* Show coins only if user is the payer (for caller) or receiver (for callee) */}
                            {tx.billedCoins > 0 && tx.isCaller && (
                              <span className="text-sm font-medium text-red-600">
                                {tx.billedCoins} coins deducted
                              </span>
                            )}
                            {tx.receiverShare > 0 && !tx.isCaller && (
                              <span className="text-sm font-medium text-green-600">
                                {tx.receiverShare} coins received
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded font-medium capitalize">
                            {tx.status || 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="w-full py-3 text-center text-velora-primary font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Call Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Other Party</label>
                  <div className="flex items-center space-x-3 mt-1">
                    {selectedTransaction.otherParty?.avatar ? (
                      <img
                        src={selectedTransaction.otherParty.avatar}
                        alt={selectedTransaction.otherParty?.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-semibold">
                          {(selectedTransaction.otherParty?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{selectedTransaction.otherParty?.name || 'Unknown'}</p>
                      {selectedTransaction.otherParty?.id && (
                        <button
                          onClick={() => handleViewProfile(selectedTransaction.otherParty.id)}
                          className="text-sm text-velora-primary hover:underline"
                        >
                          View Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Call Type</label>
                  <p className="font-medium">{selectedTransaction.callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
                </div>

                {(selectedTransaction.status === 'ended' || selectedTransaction.status === 'completed' || selectedTransaction.status === 'success') && selectedTransaction.durationSeconds > 0 && (
                  <div>
                    <label className="text-sm text-gray-500">Duration</label>
                    <p className="font-medium">{formatDuration(selectedTransaction.durationSeconds)}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500">Date & Time</label>
                  <p className="font-medium">
                    {new Date(selectedTransaction.attemptedAt || selectedTransaction.startedAt || selectedTransaction.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedTransaction.status === 'missed' && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Missed Call</h3>
                    <p className="text-sm text-yellow-800">
                      {selectedTransaction.reason === 'callee_offline'
                        ? 'User was offline when call was attempted'
                        : selectedTransaction.notes || 'Call was missed'}
                    </p>
                  </div>
                )}

                {selectedTransaction.isCaller ? (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Coins Deducted</h3>
                    <p className="text-2xl font-bold text-red-600">{selectedTransaction.billedCoins || 0} coins</p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Coins Received</h3>
                    <p className="text-2xl font-bold text-green-600">{selectedTransaction.receiverShare || 0} coins</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium capitalize">{selectedTransaction.status}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="mt-6 w-full py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

