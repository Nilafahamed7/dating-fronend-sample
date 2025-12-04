import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coinService } from '../services/coinService';
import toast from 'react-hot-toast';

/**
 * Hook to check if user has sufficient coins/premium status for actions
 */
export const usePaymentGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await coinService.getBalance();
      setCoinBalance(response.coins || 0);
    } catch (error) {
      setCoinBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // Action costs
  const ACTION_COSTS = {
    viewProfile: 2,
    like: 0, // Normal likes are free
    superlike: 20,
    sendMessage: 5,
    sendGift: 50,
  };

  /**
   * Check if user can perform a premium action
   */
  const canPerformPremiumAction = (action) => {
    if (!user) return false;
    if (user.isPremium) return true;

    // Define coin costs for premium actions
    const premiumActions = {
      superLike: 10,
      invisibleMode: 0, // Premium only, no coin alternative
      profileBoost: 50,
      seeWhoLiked: 0, // Premium only
    };

    const coinCost = premiumActions[action];
    if (coinCost === undefined) return false;
    if (coinCost === 0) return false; // Premium only

    return coinBalance >= coinCost;
  };

  /**
   * Check if user has sufficient coins for an action
   */
  const hasSufficientCoins = (requiredCoins) => {
    return coinBalance >= requiredCoins;
  };

  /**
   * Deduct coins for an action
   */
  const deductCoins = async (action, coinsUsed) => {
    try {
      const response = await coinService.useCoins(action, coinsUsed);
      if (response.success) {
        const newBalance = response.remainingCoins || 0;
        setCoinBalance(newBalance);
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to process payment');
      return false;
    }
  };

  /**
   * Check and handle payment for an action
   * Premium users bypass all payment checks
   */
  const checkAndPay = async (action, coinCost, premiumOnly = false) => {
    // Premium users get unlimited free access
    if (user?.isPremium) {
      return true;
    }

    // If premium only and user is not premium, deny
    if (premiumOnly && !user?.isPremium) {
      toast.error('This feature requires a premium subscription');
      return false;
    }

    // Check coin balance
    if (!hasSufficientCoins(coinCost)) {
      toast.error(`Insufficient coins. You need ${coinCost} coins for this action.`, {
        duration: 4000,
        action: {
          label: 'Buy Coins',
          onClick: () => navigate('/wallet'),
        },
      });
      return false;
    }

    // Deduct coins
    const success = await deductCoins(action, coinCost);
    // Note: Balance is already updated in deductCoins via setCoinBalance
    // Toast notification is handled by the component calling this function if needed

    return success;
  };

  /**
   * Helper methods for specific actions
   */
  const checkViewProfile = async () => {
    return await checkAndPay('viewProfile', ACTION_COSTS.viewProfile);
  };

  const checkLike = async () => {
    // Normal likes are free - always return true
    return true;
  };

  const checkSuperlike = async () => {
    // Super like: Premium users get it free, non-premium users need coins
    if (user?.isPremium) {
      return true; // Premium users get it free
    }

    // Non-premium users need coins (20 coins according to backend)
    return await checkAndPay('superlike', ACTION_COSTS.superlike);
  };

  const checkSendMessage = async () => {
    // Premium users and all female users can send messages for free
    const isFemale = user?.gender === 'female';
    if (user?.isPremium || isFemale) {
      return true;
    }
    // Non-premium male users need coins
    return await checkAndPay('sendMessage', ACTION_COSTS.sendMessage);
  };

  const checkSendGift = async () => {
    // Sending gifts is premium-only
    if (!user?.isPremium) {
      toast.error('Sending gifts requires a premium subscription. Please subscribe first.', {
        duration: 4000,
        action: {
          label: 'Subscribe',
          onClick: () => navigate('/subscriptions'),
        },
      });
      return false;
    }
    return true;
  };

  const openPaymentGate = () => {
    navigate('/subscriptions');
  };

  return {
    coinBalance,
    loading,
    isPremium: user?.isPremium || false,
    canPerformPremiumAction,
    hasSufficientCoins,
    deductCoins,
    checkAndPay,
    refreshBalance: loadBalance,
    // Action-specific helpers
    checkViewProfile,
    checkLike,
    checkSuperlike,
    checkSendMessage,
    checkSendGift,
    openPaymentGate,
    // Action costs
    ACTION_COSTS,
  };
};

