import { usePaymentGate } from '../../hooks/usePaymentGate';
import { useRazorpayCheckout } from './RazorpayCheckout';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * PaymentGate component - Wraps content that requires payment
 */
export default function PaymentGate({
  children,
  coinCost = 0,
  premiumOnly = false,
  action = 'default',
  onSuccess,
  onError,
  showPaymentPrompt = true,
}) {
  const { coinBalance, isPremium, hasSufficientCoins, checkAndPay, refreshBalance } = usePaymentGate();
  const { user } = useAuth();
  const { handlePayment: handleRazorpayPayment } = useRazorpayCheckout();

  const handlePaymentRequired = async () => {
    if (premiumOnly && !isPremium) {
      toast.error('This feature requires a premium subscription');
      return;
    }

    if (coinCost > 0 && !hasSufficientCoins(coinCost)) {
      // Show payment prompt to buy coins
      if (showPaymentPrompt) {
        const buyCoins = window.confirm(
          `You need ${coinCost} coins for this action. You have ${coinBalance} coins. Would you like to buy more coins?`
        );
        if (buyCoins) {
          // Navigate to wallet or show coin purchase modal
          window.location.href = '/wallet';
        }
      }
      return;
    }

    // If user has sufficient coins, proceed
    const success = await checkAndPay(action, coinCost, premiumOnly);
    if (success && onSuccess) {
      onSuccess();
    } else if (!success && onError) {
      onError();
    }
  };

  // If premium only and user is premium, show content
  if (premiumOnly && isPremium) {
    return <>{children}</>;
  }

  // If coin cost and user has sufficient coins, show content with payment handler
  if (coinCost > 0 && hasSufficientCoins(coinCost)) {
    return (
      <div onClick={handlePaymentRequired} className="cursor-pointer">
        {children}
      </div>
    );
  }

  // If no payment required, show content
  if (coinCost === 0 && !premiumOnly) {
    return <>{children}</>;
  }

  // Payment required - show locked state
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
        <button
          onClick={handlePaymentRequired}
          className="px-4 py-2 bg-velora-primary text-white rounded-lg font-semibold hover:bg-velora-primary/90 transition"
        >
          {premiumOnly ? 'Upgrade to Premium' : `Pay ${coinCost} Coins`}
        </button>
      </div>
    </div>
  );
}

