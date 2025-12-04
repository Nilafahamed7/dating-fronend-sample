import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { XMarkIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';

export default function PremiumPlansModal({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [subscribing, setSubscribing] = useState('');
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planList, subscriptionStatus] = await Promise.all([
        subscriptionService.getPublicPlans(),
        subscriptionService.getStatus().catch(() => null),
      ]);
      setPlans(planList);
      setStatus(subscriptionStatus);
    } catch (error) {
      toast.error('Unable to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setSubscribing(planId);
      await subscriptionService.subscribe(planId, 'manual');
      toast.success('Subscription activated');
      updateUser({ ...user, isPremium: true });
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to activate plan';
      toast.error(message);
    } finally {
      setSubscribing('');
  const handleCancel = async () => {
    try {
      setCanceling(true);
      await subscriptionService.cancel();
      toast.success('Subscription cancelled');
      updateUser({ ...user, isPremium: false });
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to cancel subscription';
      toast.error(message);
    } finally {
      setCanceling(false);
    }
  };

    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
                  Premium
                </p>
                <h2 className="text-3xl font-bold text-gray-900">Unlock Premium Experiences</h2>
                <p className="text-sm text-gray-500">
                  Choose the plan that matches your journey. Cancel anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="px-8 py-6">
              {status?.active && (
                <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 flex flex-col gap-3 text-sm text-emerald-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  <div>
                    Premium plan <strong>{status.plan}</strong> active until{' '}
                    {status.expiresOn ? new Date(status.expiresOn).toLocaleDateString() : 'N/A'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={canceling}
                    className="self-start px-4 py-2 rounded-full bg-white text-emerald-700 font-semibold text-xs hover:bg-emerald-100 transition disabled:opacity-60"
                  >
                    {canceling ? 'Cancelling...' : 'Cancel plan'}
                  </button>
                </div>
              )}

              {loading ? (
                <div className="py-16 text-center text-gray-500">Loading plans...</div>
              ) : plans.length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-sm">
                  No premium plans available yet. Please check back later.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.planId}
                      className={`rounded-3xl border border-gray-100 p-6 flex flex-col gap-4 ${
                        plan.type === 'Featured'
                          ? 'bg-gradient-to-br from-velora-primary/5 to-white'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                            {plan.planId}
                          </p>
                          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {plan.name}
                            <StarIcon className="w-5 h-5 text-velora-primary" />
                          </h3>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-gray-700">
                        <span className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                          <CurrencyDollarIcon className="w-6 h-6 text-velora-primary" />
                          {plan.price}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4" />
                          {plan.duration}
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
                        disabled={subscribing === plan.planId || status?.active}
                        onClick={() => handleSubscribe(plan.planId)}
                        className="w-full bg-gray-900 text-white rounded-2xl py-3 font-semibold hover:bg-black transition disabled:opacity-60"
                      >
                        {status?.active && status.plan === plan.name
                          ? 'Current Plan'
                          : subscribing === plan.planId
                          ? 'Activating...'
                          : 'Activate Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

