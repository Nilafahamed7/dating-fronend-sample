import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  StarIcon,
  PhoneIcon,
  VideoCameraIcon,
  EyeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
// NavBar removed - using GlobalNavBar from App.jsx
import { useRazorpayCheckout } from '../components/payment/RazorpayCheckout';

export default function Subscriptions() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState('');
  const [canceling, setCanceling] = useState(false);
  const { handlePayment: handleRazorpayPayment } = useRazorpayCheckout();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planList, subscriptionStatus] = await Promise.all([
        subscriptionService.getPublicPlans(),
        subscriptionService.getStatus().catch(() => null),
      ]);
      setPlans(planList || []);
      setStatus(subscriptionStatus || null);
    } catch (error) {
      toast.error('Unable to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setSubscribing(planId);
      const plan = plans.find((p) => p.planId === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Use Razorpay checkout
      await handleRazorpayPayment({
        amount: plan.price,
        currency: plan.currency || 'INR',
        purpose: 'subscription',
        metadata: {
          planId: plan.planId,
          planName: plan.name,
        },
        description: `Subscription to ${plan.name} plan`,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        onSuccess: async (transaction) => {
          try {
            // Payment verification already activates subscription in backend
            // But let's refresh the subscription status to ensure it's updated
            const subscriptionStatus = await subscriptionService.getStatus();
            if (subscriptionStatus?.active) {
              toast.success('Payment successful! Membership activated');
              updateUser({ ...user, isPremium: true });
            } else {
              toast.success('Payment successful! Activating membership...');
              // If subscription not activated yet, try to activate
              try {
                await subscriptionService.activate();
                updateUser({ ...user, isPremium: true });
                toast.success('Membership activated successfully');
              } catch (activateError) {
                // Subscription should already be activated by payment verification
                // But if not, user can manually activate
              }
            }
            await loadData();
          } catch (error) {
            // Payment was successful, so update user anyway
            updateUser({ ...user, isPremium: true });
            toast.success('Payment successful! Membership activated');
            await loadData();
          } finally {
            setSubscribing('');
          }
        },
        onError: (error) => {
          toast.error(error.message || 'Payment failed');
          setSubscribing('');
        },
        onCancel: () => {
          setSubscribing('');
        },
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to activate plan';
      toast.error(message);
      setSubscribing('');
    }
  };

  const handleCancel = async () => {
    try {
      setCanceling(true);
      await subscriptionService.cancel();
      toast.success('Membership cancelled');
      updateUser({ ...user, isPremium: false });
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to cancel subscription';
      toast.error(message);
    } finally {
      setCanceling(false);
    }
  };

  const activePlanName = useMemo(() => status?.plan || null, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 w-full overflow-x-hidden">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 w-full max-w-full">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 w-full min-w-0">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <p className="text-xs sm:text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
              Memberships
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2">Manage Subscription</h1>
            <p className="text-gray-500 mt-3 max-w-2xl">
              Review every plan, see your benefits, and switch or cancel at any time.
            </p>
          </div>

        {status?.active && (
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircleIcon className="w-6 h-6" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] font-semibold">Current Plan</p>
                <h2 className="text-2xl font-bold text-gray-900">{status.plan}</h2>
              </div>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Expires on {status.expiresOn ? new Date(status.expiresOn).toLocaleDateString() : 'N/A'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={canceling}
                onClick={handleCancel}
                className="px-4 py-2 rounded-full border border-emerald-200 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-60"
              >
                {canceling ? 'Cancelling...' : 'Cancel Membership'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                Plans
              </p>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Experience</h2>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No premium plans available yet. Please check back later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {plans.map((plan) => {
                const isCurrent = activePlanName && plan.name === activePlanName;
                return (
                  <div
                    key={plan.planId}
                    className={`rounded-3xl border p-5 flex flex-col gap-4 ${
                      isCurrent ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{plan.planId}</p>
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          {plan.name}
                          <StarIcon className="w-5 h-5 text-velora-primary" />
                        </h3>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-700">
                      <span className="text-3xl font-bold text-gray-900 flex items-center gap-1">
                        <CurrencyDollarIcon className="w-6 h-6 text-velora-primary" />
                        {plan.price}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" /> {plan.duration}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plan.features?.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || subscribing === plan.planId}
                      onClick={() => handleSubscribe(plan.planId)}
                      className="w-full bg-gray-900 text-white rounded-2xl py-3 font-semibold hover:bg-black transition disabled:opacity-60"
                    >
                      {isCurrent ? 'Current Plan' : subscribing === plan.planId ? 'Activating...' : 'Activate Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Premium Features Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Premium Features</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Feature 1: 100 Free Call Minutes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PhoneIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">100 Free Call Minutes</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 2: Voice & Video Calls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <VideoCameraIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">Voice & Video Calls</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 3: View Private Photos Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <EyeIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">View Private Photos Free</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 4: Unlimited Matches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserGroupIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">Unlimited Matches</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 5: Free Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">Free Messages</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 6: Free Superlikes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <StarIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">Free Superlikes</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 7: Incognito Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">Incognito Mode</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 8: See Who Viewed Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <EyeIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">See Who Viewed Profile</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>

            {/* Feature 9: No Reply Window Limits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">No Reply Window Limits</span>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

