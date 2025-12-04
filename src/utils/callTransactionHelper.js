/**
 * Shared helper to insert/update call transaction with deduplication
 * This ensures transactions appear once in chat, Calls tab, and wallet UI
 * 
 * @param {Object} transactionData - Canonical transaction data from server
 * @param {Object} options - Options for insertion
 * @param {Set} seenTransactionIds - Set of already seen transaction IDs (for deduplication)
 * @param {Function} updateChatEvents - Function to update chat events
 * @param {Function} updateCallsList - Function to update calls list
 * @param {Function} updateWalletTransactions - Function to update wallet transactions
 * @returns {Object|null} - The processed transaction or null if duplicate
 */
export const insertCallTransaction = (
  transactionData,
  {
    seenTransactionIds,
    updateChatEvents,
    updateCallsList,
    updateWalletTransactions,
  }
) => {
  // Validate required fields
  if (!transactionData || !transactionData.transactionId) {
    return null; // Invalid transaction data
  }

  const transactionId = transactionData.transactionId;
  const callId = transactionData.callId;

  // Check for duplicate by transactionId (primary dedupe key)
  if (seenTransactionIds.has(transactionId)) {
    return null; // Duplicate - ignore
  }

  // Mark as seen
  seenTransactionIds.add(transactionId);

  // Trust server's authoritative callType (voice or video, no mixed)
  // Server determines callType based on videoUsed flag: if video was used at any point, entire call is video
  const authoritativeCallType = transactionData.callType || 'voice';

  // Normalize transaction data
  const normalizedTransaction = {
    id: transactionId,
    transactionId: transactionId,
    callId: callId,
    threadId: transactionData.threadId || null,
    initiatorId: transactionData.initiatorId,
    receiverId: transactionData.receiverId,
    participants: transactionData.participants || [],
    payerUserId: transactionData.payerUserId || transactionData.distribution?.payerId || null,
    callType: authoritativeCallType, // Trust server's callType (voice or video)
    totalCoins: transactionData.totalCoins || transactionData.billedCoins || 0,
    billedCoins: transactionData.billedCoins || transactionData.totalCoins || 0,
    receiverShare: transactionData.distribution?.femaleShare || transactionData.receiverShare || transactionData.femaleShare || 0,
    adminShare: transactionData.distribution?.adminShare || transactionData.adminShare || 0,
    distribution: transactionData.distribution || {
      payerId: transactionData.payerUserId || null,
      femaleShare: transactionData.receiverShare || transactionData.femaleShare || 0,
      adminShare: transactionData.adminShare || 0,
    },
    status: transactionData.status || 'completed',
    timestamp: transactionData.timestamp || new Date().toISOString(),
    durationSeconds: transactionData.durationSeconds || 0,
    startedAt: transactionData.startedAt,
    endedAt: transactionData.endedAt,
    rates: transactionData.rates || { voice: 20, video: 40 },
  };

  // Update chat events if handler provided
  if (updateChatEvents) {
    updateChatEvents(normalizedTransaction);
  }

  // Update calls list if handler provided
  if (updateCallsList) {
    updateCallsList(normalizedTransaction);
  }

  // Update wallet transactions if handler provided
  if (updateWalletTransactions) {
    updateWalletTransactions(normalizedTransaction);
  }

  return normalizedTransaction;
};

/**
 * Format call type label for display
 * @param {string} callType - 'voice' or 'video' (no mixed)
 * @returns {string} - Formatted label
 */
export const formatCallTypeLabel = (callType) => {
  // Trust server's callType - no inference needed
  return callType === 'video' ? 'Video' : 'Voice';
};

/**
 * Format duration (simple format, no breakdown)
 * @param {number} durationSeconds - Total duration in seconds
 * @returns {string} - Formatted duration
 */
export const formatCallDuration = (durationSeconds) => {
  const totalMins = Math.floor(durationSeconds / 60);
  const totalSecs = durationSeconds % 60;
  return `${totalMins}:${totalSecs.toString().padStart(2, '0')}`;
};

