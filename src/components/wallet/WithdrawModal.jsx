import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowDownTrayIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { walletService } from '../../services/walletService';
import toast from 'react-hot-toast';

const MIN_WITHDRAWAL_COINS = 5000;
const CONVERSION_RATE = 0.10; // 1 coin = ₹0.10 (10 paise)
const PLATFORM_FEE = 0; // Can be configured

export default function WithdrawModal({ isOpen, onClose, coinBalance, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState('coins'); // 'coins' or 'inr'
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [payoutDetails, setPayoutDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setStep(1);
      setInputValue('');
      setInputMode('coins');
      setPayoutMethod('bank');
      setPayoutDetails({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        upiId: '',
        email: '',
        notes: '',
      });
    }
  }, [isOpen]);

  const availableCoins = coinBalance?.availableCoins || 0;
  const maxCoins = Math.max(MIN_WITHDRAWAL_COINS, availableCoins);
  const maxInr = availableCoins * CONVERSION_RATE;

  // Calculate coins and INR based on input mode
  const calculateValues = () => {
    if (!inputValue || inputValue === '') {
      return { coins: 0, inr: 0, roundedCoins: 0, roundedInr: 0, roundingNote: null };
    }

    const numValue = parseFloat(inputValue) || 0;

    if (inputMode === 'coins') {
      const coins = Math.floor(numValue); // Ensure integer
      const inr = coins * CONVERSION_RATE;
      return { coins, inr, roundedCoins: coins, roundedInr: inr, roundingNote: null };
    } else {
      // INR mode: convert to coins (round down)
      const exactCoins = numValue / CONVERSION_RATE;
      const roundedCoins = Math.floor(exactCoins); // Round down to nearest integer
      const roundedInr = roundedCoins * CONVERSION_RATE;
      const roundingNote = exactCoins !== roundedCoins
        ? `(rounded down from ${exactCoins.toFixed(1)})`
        : null;
      return { coins: exactCoins, inr: numValue, roundedCoins, roundedInr, roundingNote };
    }
  };

  const { coins, inr, roundedCoins, roundedInr, roundingNote } = calculateValues();

  const handleInputChange = (value) => {
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleModeToggle = (mode) => {
    setInputMode(mode);
    // Convert current value when switching modes
    if (inputValue) {
      if (mode === 'inr' && inputMode === 'coins') {
        // Convert coins to INR
        const coins = Math.floor(parseFloat(inputValue) || 0);
        setInputValue((coins * CONVERSION_RATE).toFixed(2));
      } else if (mode === 'coins' && inputMode === 'inr') {
        // Convert INR to coins (round down)
        const inr = parseFloat(inputValue) || 0;
        const coins = Math.floor(inr / CONVERSION_RATE);
        setInputValue(coins.toString());
      }
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate based on rounded coins
      if (roundedCoins < 1) {
        toast.error('Minimum unit is 1 coin (₹0.10)');
        return;
      }
      if (roundedCoins < MIN_WITHDRAWAL_COINS) {
        const minInr = MIN_WITHDRAWAL_COINS * CONVERSION_RATE;
        if (inputMode === 'inr' && roundingNote) {
          toast.error(`Entered amount equals ${roundedCoins} coins after conversion which is below minimum withdrawal of ${MIN_WITHDRAWAL_COINS} coins (₹${minInr.toFixed(2)})`);
        } else {
          toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL_COINS} coins (₹${minInr.toFixed(2)})`);
        }
        return;
      }
      if (roundedCoins > availableCoins) {
        toast.error('Insufficient available coins');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate payout details
      if (payoutMethod === 'bank') {
        if (!payoutDetails.accountHolderName || !payoutDetails.accountNumber ||
            !payoutDetails.ifscCode || !payoutDetails.bankName) {
          toast.error('Please fill all bank details');
          return;
        }
      } else if (payoutMethod === 'upi') {
        if (!payoutDetails.upiId) {
          toast.error('Please enter UPI ID');
          return;
        }
      } else if (payoutMethod === 'paypal' || payoutMethod === 'other') {
        if (!payoutDetails.email) {
          toast.error('Please enter email address');
          return;
        }
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Use rounded values for submission
      const finalCoins = roundedCoins;
      const finalInr = roundedInr;
      const finalPayoutAmount = finalInr - PLATFORM_FEE;

      const response = await walletService.createWithdrawalRequest(
        finalCoins,
        payoutMethod,
        payoutDetails,
        CONVERSION_RATE,
        PLATFORM_FEE,
        finalInr,
        inputMode,
        inputMode === 'coins' ? parseFloat(inputValue) || 0 : parseFloat(inputValue) || 0
      );

      if (response.success) {
        toast.success('Withdrawal request submitted — pending admin verification');
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  // Use rounded values for display
  const displayCoins = roundedCoins;
  const displayInr = roundedInr;
  const finalPayoutAmount = Math.max(0, displayInr - PLATFORM_FEE);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <ArrowDownTrayIcon className="w-6 h-6 text-velora-primary" />
              <h2 className="text-xl font-bold text-gray-900">Withdraw Request</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Withdraw
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={inputMode === 'coins' ? `Min: ${MIN_WITHDRAWAL_COINS} coins` : `Min: ₹${(MIN_WITHDRAWAL_COINS * CONVERSION_RATE).toFixed(2)}`}
                      className="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                    />
                    {/* Unit Toggle */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => handleModeToggle('coins')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          inputMode === 'coins'
                            ? 'bg-velora-primary text-black'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Coins
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeToggle('inr')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          inputMode === 'inr'
                            ? 'bg-velora-primary text-black'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        INR
                      </button>
                    </div>
                  </div>

                  {/* Live Conversion Display */}
                  {inputValue && (
                    <div className="mt-2">
                      {inputMode === 'coins' ? (
                        <p className="text-xs text-gray-500">
                          ≈ ₹{inr.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          ≈ {roundedCoins} Coins {roundingNote && ` ${roundingNote}`}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>Available: {availableCoins.toLocaleString()} coins (₹{maxInr.toFixed(2)})</span>
                  </div>

                  {/* Conversion Rate Display */}
                  <div className="mt-2 text-xs text-gray-500">
                    Conversion: 1 coin = ₹{CONVERSION_RATE.toFixed(2)}
                  </div>
                </div>

                {displayCoins >= MIN_WITHDRAWAL_COINS && (
                  <div className="bg-velora-primary/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coins to Withdraw:</span>
                      <span className="font-semibold">{displayCoins.toLocaleString()} Coins</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span className="font-semibold">1 coin = ₹{CONVERSION_RATE.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount (INR):</span>
                      <span className="font-semibold">₹{displayInr.toFixed(2)}</span>
                    </div>
                    {roundingNote && (
                      <div className="text-xs text-amber-600 italic">
                        Note: {roundingNote}
                      </div>
                    )}
                    {PLATFORM_FEE > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Platform Fee:</span>
                        <span>- ₹{PLATFORM_FEE.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Final Payout:</span>
                        <span className="font-bold text-lg text-velora-primary">
                          ₹{finalPayoutAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Method
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {payoutMethod === 'bank' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={payoutDetails.accountHolderName}
                        onChange={(e) => setPayoutDetails({ ...payoutDetails, accountHolderName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={payoutDetails.accountNumber}
                        onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        value={payoutDetails.ifscCode}
                        onChange={(e) => setPayoutDetails({ ...payoutDetails, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={payoutDetails.bankName}
                        onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                        required
                      />
                    </div>
                  </div>
                )}

                {payoutMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      value={payoutDetails.upiId}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, upiId: e.target.value })}
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                      required
                    />
                  </div>
                )}

                {(payoutMethod === 'paypal' || payoutMethod === 'other') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={payoutDetails.email}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={payoutDetails.notes}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-velora-primary/5 rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-lg text-gray-900">Withdrawal Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coins to Withdraw:</span>
                      <span className="font-semibold">{displayCoins.toLocaleString()} Coins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount (INR):</span>
                      <span className="font-semibold">₹{displayInr.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span className="font-semibold">1 coin = ₹{CONVERSION_RATE.toFixed(2)}</span>
                    </div>
                    {PLATFORM_FEE > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Platform Fee:</span>
                        <span>- ₹{PLATFORM_FEE.toLocaleString()}</span>
                      </div>
                    )}
                    {roundingNote && (
                      <div className="text-xs text-amber-600 italic">
                        Note: {roundingNote}
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Final Payout Amount:</span>
                        <span className="font-bold text-xl text-velora-primary">
                          ₹{finalPayoutAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-2">Payout Method:</p>
                    <p className="text-sm text-gray-600 capitalize">{payoutMethod}</p>
                    {payoutMethod === 'bank' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{payoutDetails.accountHolderName}</p>
                        <p>{payoutDetails.bankName}</p>
                        <p>****{payoutDetails.accountNumber.slice(-4)}</p>
                      </div>
                    )}
                    {payoutMethod === 'upi' && (
                      <p className="mt-2 text-sm text-gray-600">{payoutDetails.upiId}</p>
                    )}
                    {(payoutMethod === 'paypal' || payoutMethod === 'other') && (
                      <p className="mt-2 text-sm text-gray-600">{payoutDetails.email}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Your withdrawal request will be reviewed by admin</li>
                        <li>Coins will be locked until approval</li>
                        <li>You will be notified once the request is processed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!inputValue || roundedCoins < MIN_WITHDRAWAL_COINS || roundedCoins < 1}
                className="px-6 py-3 bg-velora-primary text-black rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-velora-primary text-black rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

