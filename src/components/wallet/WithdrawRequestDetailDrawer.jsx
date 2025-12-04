import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon, CheckCircleIcon, XCircleIcon, DocumentCheckIcon, NoSymbolIcon, DocumentArrowDownIcon, InformationCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { walletService } from '../../services/walletService';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
  },
  processing: {
    label: 'Processing',
    icon: ClockIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  locked: {
    label: 'Locked',
    icon: InformationCircleIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  completed: {
    label: 'Paid',
    icon: DocumentCheckIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  failed: {
    label: 'Failed',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: NoSymbolIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
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

export default function WithdrawRequestDetailDrawer({ isOpen, onClose, request, onRefresh }) {
  const [requestDetails, setRequestDetails] = useState(request);
  const [loading, setLoading] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!request) return;
    const requestId = request.id || request._id;
    if (!requestId) return;
    try {
      setLoading(true);
      const response = await walletService.getWithdrawalRequest(requestId);
      if (response.success) {
        setRequestDetails(response.request);
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  }, [request, onRefresh]);

  useEffect(() => {
    if (isOpen && request) {
      setRequestDetails(request);
      // Optionally reload details
      const requestId = request.id || request._id;
      if (requestId) {
        loadDetails();
      }
    }
  }, [isOpen, request, loadDetails]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Simple print-based PDF export
    const printWindow = window.open('', '_blank');
    const content = generateReceiptHTML();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const generateReceiptHTML = () => {
    if (!requestDetails) return '';
    const status = statusConfig[requestDetails.status] || statusConfig.pending;
    const requestId = (requestDetails.id || requestDetails._id || '').toString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Withdrawal Receipt - ${requestId.slice(-8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .label { font-weight: bold; color: #666; }
            .value { margin-top: 5px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Withdrawal Request Receipt</h1>
            <p>Request ID: ${requestId.slice(-8)}</p>
          </div>
          <div class="section">
            <div class="label">Status</div>
            <div class="value"><span class="status">${status.label}</span></div>
          </div>
          <div class="section">
            <div class="label">Amount</div>
            <div class="value">${(requestDetails.amountCoins || requestDetails.coins || 0).toLocaleString()} coins</div>
            <div class="value">${formatCurrency(requestDetails.finalPayoutAmount || requestDetails.amount || 0)}</div>
          </div>
          <div class="section">
            <div class="label">Payout Method</div>
            <div class="value">${(requestDetails.payoutMethod || 'bank').toUpperCase()}</div>
          </div>
          <div class="section">
            <div class="label">Created At</div>
            <div class="value">${formatDateTime(requestDetails.createdAt)}</div>
          </div>
          ${requestDetails.reviewedAt ? `
          <div class="section">
            <div class="label">Reviewed At</div>
            <div class="value">${formatDateTime(requestDetails.reviewedAt)}</div>
          </div>
          ` : ''}
          ${requestDetails.transactionId ? `
          <div class="section">
            <div class="label">Transaction Reference</div>
            <div class="value">${requestDetails.transactionId}</div>
          </div>
          ` : ''}
          ${requestDetails.adminNotes ? `
          <div class="section">
            <div class="label">Admin Notes</div>
            <div class="value">${requestDetails.adminNotes}</div>
          </div>
          ` : ''}
          ${requestDetails.rejectionReason ? `
          <div class="section">
            <div class="label">Rejection Reason</div>
            <div class="value">${requestDetails.rejectionReason}</div>
          </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  if (!isOpen || !requestDetails) return null;

  const status = statusConfig[requestDetails.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/12 backdrop-blur-sm"
          style={{
            top: 'var(--navbar-height, 64px)',
            bottom: 'var(--bottom-nav-height, 64px)',
          }}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
          className="fixed right-0 bg-white shadow-2xl z-[61] flex flex-col w-full md:w-[420px] pointer-events-auto"
          style={{
            top: 'var(--navbar-height, 64px)',
            bottom: 'var(--bottom-nav-height, 64px)',
            height: 'calc(100vh - var(--navbar-height, 64px) - var(--bottom-nav-height, 64px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close drawer"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-center">
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${status.bgColor} ${status.color} ${status.borderColor} border`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{status.label}</span>
              </div>
            </div>

            {/* Request ID */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Withdraw Request ID</p>
              <p className="font-mono text-sm font-semibold text-gray-900 break-all">
                {requestDetails.id || requestDetails._id || 'N/A'}
              </p>
              <p className="font-mono text-xs text-gray-400 mt-1">
                Short ID: {(requestDetails.id || requestDetails._id || '').toString().slice(-8)}
              </p>
            </div>

            {/* Amount Details */}
            <div className="bg-velora-primary/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Coins Requested</span>
                <span className="font-semibold text-gray-900">
                  {(requestDetails.amountCoins || requestDetails.coins || 0).toLocaleString()} coins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount (INR)</span>
                <span className="font-bold text-xl text-velora-primary">
                  {formatCurrency(requestDetails.finalPayoutAmount || requestDetails.amount || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-medium text-gray-900">
                  1 coin = ₹{(requestDetails.conversionRate || 0.10).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payout Method */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Payout Method</p>
              <p className="font-medium text-gray-900 capitalize">{requestDetails.payoutMethod || 'bank'}</p>
              {requestDetails.payoutDetails && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  {requestDetails.payoutDetails.accountHolderName && (
                    <p><span className="font-medium">Account Holder:</span> {requestDetails.payoutDetails.accountHolderName}</p>
                  )}
                  {requestDetails.payoutDetails.accountNumber && (
                    <p><span className="font-medium">Account:</span> ****{String(requestDetails.payoutDetails.accountNumber).slice(-4)}</p>
                  )}
                  {requestDetails.payoutDetails.ifscCode && (
                    <p><span className="font-medium">IFSC:</span> {requestDetails.payoutDetails.ifscCode}</p>
                  )}
                  {requestDetails.payoutDetails.bankName && (
                    <p><span className="font-medium">Bank:</span> {requestDetails.payoutDetails.bankName}</p>
                  )}
                  {requestDetails.payoutDetails.upiId && (
                    <p><span className="font-medium">UPI ID:</span> {requestDetails.payoutDetails.upiId}</p>
                  )}
                  {requestDetails.payoutDetails.email && (
                    <p><span className="font-medium">Email:</span> {requestDetails.payoutDetails.email}</p>
                  )}
                </div>
              )}
            </div>

            {/* Locked Message */}
            {requestDetails.status === 'locked' && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-orange-900 mb-2">Withdraw Locked — Admin Action Required</p>
                    <p className="text-sm text-orange-800 mb-2">
                      Your withdraw is locked and requires admin review. You cannot modify or resubmit this request. We will notify you when it is resolved.
                    </p>
                    {requestDetails.lockedReason && (
                      <p className="text-xs text-orange-700 mt-2 italic">
                        Reason: {requestDetails.lockedReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline / Audit Trail */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Status History</p>
              <div className="space-y-4">
                {(requestDetails.audit || []).length > 0 ? (
                  requestDetails.audit.map((entry, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          entry.toStatus === 'completed' ? 'bg-purple-500' :
                          entry.toStatus === 'approved' || entry.toStatus === 'processing' ? 'bg-green-500' :
                          entry.toStatus === 'rejected' || entry.toStatus === 'failed' ? 'bg-red-500' :
                          entry.toStatus === 'locked' ? 'bg-orange-500' :
                          'bg-gray-400'
                        }`} />
                        {index < requestDetails.audit.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900 capitalize">
                          {entry.action.replace(/_/g, ' ')} {entry.actor === 'admin' ? 'by Admin' : entry.actor === 'system' ? 'by System' : ''}
                        </p>
                        {entry.fromStatus && entry.toStatus && (
                          <p className="text-xs text-gray-500 capitalize">
                            {entry.fromStatus} → {entry.toStatus}
                          </p>
                        )}
                        {entry.note && (
                          <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback to basic timeline if audit not available
                  <>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-velora-primary" />
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900">Request Created</p>
                        <p className="text-sm text-gray-500">{formatDateTime(requestDetails.createdAt)}</p>
                      </div>
                    </div>
                    {requestDetails.reviewedAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            requestDetails.status === 'approved' ? 'bg-green-500' :
                            requestDetails.status === 'rejected' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                          {requestDetails.completedAt && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">
                            {requestDetails.status === 'approved' ? 'Approved' : 'Rejected'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDateTime(requestDetails.reviewedAt)}</p>
                        </div>
                      </div>
                    )}
                    {requestDetails.completedAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Payment Completed</p>
                          <p className="text-sm text-gray-500">{formatDateTime(requestDetails.completedAt)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            {requestDetails.adminNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Admin Notes</p>
                <p className="text-sm text-blue-800">{requestDetails.adminNotes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {requestDetails.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</p>
                <p className="text-sm text-red-800">{requestDetails.rejectionReason}</p>
              </div>
            )}

            {/* Transaction Reference */}
            {requestDetails.transactionId && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Transaction Reference</p>
                <p className="font-mono text-sm font-semibold text-gray-900">{requestDetails.transactionId}</p>
              </div>
            )}

            {/* External Reference */}
            {requestDetails.externalReference && (
              <div>
                <p className="text-sm text-gray-500 mb-1">External Payment Reference</p>
                <p className="font-mono text-sm font-semibold text-gray-900">{requestDetails.externalReference}</p>
              </div>
            )}

            {/* Conversion Rate */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <p className="font-medium text-gray-900">1 coin = ₹{(requestDetails.conversionRate || 0.10).toFixed(2)}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 space-y-3 flex-shrink-0">
            {/* Action Buttons based on status */}
            {requestDetails.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // TODO: Implement cancel withdrawal
                    toast.info('Cancel withdrawal feature coming soon');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  <NoSymbolIcon className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Open support form with withdrawId pre-filled
                    toast.info('Contact support feature coming soon');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-velora-primary hover:opacity-90 text-black rounded-xl font-semibold transition-opacity"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Contact Support
                </button>
              </div>
            )}
            {requestDetails.status === 'locked' && (
              <button
                onClick={() => {
                  // Open support form with withdrawId pre-filled
                  const withdrawId = requestDetails.id || requestDetails._id;
                  // TODO: Implement support form modal/page
                  // For now, show a message with the withdraw ID
                  toast.success(`Support request for withdraw ID: ${String(withdrawId).slice(-8)}. Please contact support with this ID.`, {
                    duration: 5000,
                  });
                  // In production, this would open a support form modal
                  // Example: setShowSupportModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-velora-primary hover:opacity-90 text-black rounded-xl font-semibold transition-opacity"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Contact Support
              </button>
            )}
            {/* Print/Export buttons for completed/paid withdrawals */}
            {(requestDetails.status === 'completed' || requestDetails.status === 'paid') && (
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-velora-primary hover:opacity-90 text-black rounded-xl font-semibold transition-opacity"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

