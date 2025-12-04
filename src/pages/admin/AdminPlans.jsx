import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  SparklesIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { subscriptionService } from '../../services/subscriptionService';

const initialFormState = {
  id: null,
  planId: '',
  name: '',
  description: '',
  price: '',
  currency: 'INR',
  durationDays: 30,
  priority: 0,
  featuresText: '',
  isActive: true,
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getAdminPlans();
      setPlans(data);
    } catch (error) {
      toast.error('Unable to load plans');
    } finally {
      setLoading(false);
    }
  };

  const featuresArray = useMemo(() => {
    if (!formState.featuresText) return [];
    return formState.featuresText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [formState.featuresText]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = (plan) => {
    setFormState({
      id: plan.id,
      planId: plan.planId,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency || 'INR',
      durationDays: plan.durationDays,
      priority: plan.priority ?? 0,
      featuresText: plan.features?.join('\n') || '',
      isActive: !!plan.isActive,
    });
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        planId: formState.planId || undefined,
        name: formState.name,
        description: formState.description,
        price: Number(formState.price),
        currency: formState.currency,
        durationDays: Number(formState.durationDays),
        priority: Number(formState.priority),
        features: featuresArray,
        isActive: formState.isActive,
      };

      if (formState.id) {
        await subscriptionService.updateAdminPlan(formState.id, payload);
        toast.success('Plan updated');
      } else {
        await subscriptionService.createAdminPlan(payload);
        toast.success('Plan created');
      }

      resetForm();
      await loadPlans();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to save plan';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan permanently?')) {
      return;
    }
    try {
      await subscriptionService.deleteAdminPlan(id);
      toast.success('Plan deleted');
      await loadPlans();
      if (formState.id === id) {
        resetForm();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to delete plan';
      toast.error(message);
    }
  };

  return (
    <AdminLayout
      title="Subscription Plans"
      subtitle="Plan Builder"
      selectedNavKey="plan"
      headerActions={
        <button
          type="button"
          onClick={loadPlans}
          className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
        >
          Refresh
        </button>
      }
    >
      <section className="p-6 lg:p-10 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
                  {formState.id ? 'Edit Plan' : 'New Plan'}
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {formState.id ? `Update ${formState.name}` : 'Create Premium Plan'}
                </h2>
              </div>
              {formState.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name*</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                    placeholder="e.g. Platinum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Plan ID</label>
                  <input
                    type="text"
                    value={formState.planId}
                    onChange={(e) => handleChange('planId', e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                    placeholder="Optional unique code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (in {formState.currency})*</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    required
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <input
                    type="text"
                    value={formState.currency}
                    onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (days)*</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.durationDays}
                    onChange={(e) => handleChange('durationDays', e.target.value)}
                    required
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <button
                      type="button"
                      onClick={() => handleChange('isActive', !formState.isActive)}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                        formState.isActive ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200' : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                      }`}
                    >
                      {formState.isActive ? '✓ Enabled' : '✗ Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 resize-none transition"
                  placeholder="Short marketing copy for this plan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Features (one per line)</label>
                <textarea
                  value={formState.featuresText}
                  onChange={(e) => handleChange('featuresText', e.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 resize-none transition"
                  placeholder={'Unlimited Likes\nPriority Matches\nSee Who Liked You'}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold rounded-2xl py-4 hover:bg-black transition disabled:opacity-60 text-base"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5" />
                    {formState.id ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs lg:text-sm font-semibold text-velora-primary uppercase tracking-[0.3em] mb-1">
                  Catalog
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Active Plans</h2>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : plans.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-sm">
                <SparklesIcon className="w-10 h-10 mb-3 text-gray-300" />
                <p>No plans yet. Create your first premium plan.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[38rem] overflow-y-auto pr-2">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-gray-100 rounded-2xl p-4 space-y-3 hover:border-gray-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">{plan.description || 'No description provided'}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          plan.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        {plan.currency} {plan.price}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {plan.durationDays} days
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Priority {plan.priority}
                      </span>
                    </div>

                    {plan.features?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(plan)}
                        className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition flex items-center gap-1"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id)}
                        className="px-3 py-1.5 rounded-full border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

