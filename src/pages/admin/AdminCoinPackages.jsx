import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  SparklesIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminWalletService } from '../../services/adminWalletService';

const initialFormState = {
  id: null,
  name: '',
  coins: '',
  price: '',
  currency: 'INR',
  bonus: '',
  discount: '',
  popular: false,
  order: '',
  description: '',
  isActive: true,
};

export default function AdminCoinPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await adminWalletService.getAllPackages();
      setPackages(response.packages || []);
    } catch (error) {
      toast.error('Unable to load coin packages');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEdit = (pkg) => {
    setFormState({
      id: pkg._id,
      name: pkg.name,
      coins: pkg.coins,
      price: pkg.price,
      currency: pkg.currency || 'INR',
      bonus: pkg.bonus || '',
      discount: pkg.discount || '',
      popular: pkg.popular || false,
      order: pkg.order || '',
      description: pkg.description || '',
      isActive: pkg.isActive !== false,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (!formState.name || !formState.coins || !formState.price) {
      toast.error('Name, coins, and price are required');
      return;
    }

    if (parseInt(formState.coins) <= 0) {
      toast.error('Coins must be greater than 0');
      return;
    }

    if (parseFloat(formState.price) < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formState.name,
        coins: parseInt(formState.coins),
        price: parseFloat(formState.price),
        currency: formState.currency,
        bonus: formState.bonus ? parseInt(formState.bonus) : 0,
        discount: formState.discount ? parseFloat(formState.discount) : 0,
        popular: formState.popular,
        order: formState.order ? parseInt(formState.order) : 0,
        description: formState.description,
        isActive: formState.isActive,
      };

      if (formState.id) {
        // Update
        await adminWalletService.updatePackage(formState.id, payload);
        toast.success('Coin package updated successfully');
      } else {
        // Create
        await adminWalletService.createPackage(payload);
        toast.success('Coin package created successfully');
      }

      resetForm();
      loadPackages();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to save coin package';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await adminWalletService.deletePackage(id);
      toast.success('Coin package deleted successfully');
      loadPackages();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to delete coin package';
      toast.error(message);
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      await adminWalletService.updatePackage(pkg._id, {
        isActive: !pkg.isActive,
      });
      toast.success(`Package ${!pkg.isActive ? 'activated' : 'deactivated'}`);
      loadPackages();
    } catch (error) {
      toast.error('Unable to update package status');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />
              Coin Packages Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage coin packages that users can purchase
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors"
          >
            {showForm ? (
              <>
                <XMarkIcon className="w-5 h-5" />
                Cancel
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                Create Package
              </>
            )}
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-yellow-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {formState.id ? 'Edit Package' : 'Create New Package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Package Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Starter Pack"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Coins */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coins <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.coins}
                    onChange={(e) => handleChange('coins', e.target.value)}
                    placeholder="100"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formState.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="200"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Bonus Coins */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bonus Coins (Optional)
                  </label>
                  <input
                    type="number"
                    value={formState.bonus}
                    onChange={(e) => handleChange('bonus', e.target.value)}
                    placeholder="10"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount % (Optional)
                  </label>
                  <input
                    type="number"
                    value={formState.discount}
                    onChange={(e) => handleChange('discount', e.target.value)}
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formState.order}
                    onChange={(e) => handleChange('order', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of this package..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.popular}
                    onChange={(e) => handleChange('popular', e.target.checked)}
                    className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (Visible to users)</span>
                </label>
              </div>

              {/* Calculation Preview */}
              {formState.coins && formState.price && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Package Preview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Base Coins</p>
                      <p className="font-bold text-gray-900">{formState.coins}</p>
                    </div>
                    {formState.bonus && (
                      <div>
                        <p className="text-gray-600">Bonus</p>
                        <p className="font-bold text-green-600">+{formState.bonus}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Total Coins</p>
                      <p className="font-bold text-gray-900">
                        {parseInt(formState.coins) + (parseInt(formState.bonus) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price per Coin</p>
                      <p className="font-bold text-gray-900">
                        ₹{(parseFloat(formState.price) / (parseInt(formState.coins) + (parseInt(formState.bonus) || 0))).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      {formState.id ? 'Update Package' : 'Create Package'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Packages List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Coin Packages Yet</h3>
            <p className="text-gray-600 mb-4">Create your first coin package to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Create Package
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                  pkg.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
                } ${pkg.popular ? 'ring-2 ring-yellow-500' : ''}`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm mb-2">
                    <SparklesIcon className="w-4 h-4" />
                    POPULAR
                  </div>
                )}

                {/* Package Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                )}

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Coins</span>
                    <span className="font-bold text-gray-900">{pkg.coins}</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bonus</span>
                      <span className="font-bold text-green-600">+{pkg.bonus}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold text-gray-900">Total Coins</span>
                    <span className="font-bold text-yellow-600">{pkg.coins + (pkg.bonus || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price</span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">₹{pkg.price}</span>
                      {pkg.discount > 0 && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                          {pkg.discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Per Coin</span>
                    <span className="text-sm text-gray-600">
                      ₹{(pkg.price / (pkg.coins + (pkg.bonus || 0))).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      pkg.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {pkg.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id, pkg.name)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  <div>Package ID: {pkg.packageId}</div>
                  <div>Order: {pkg.order || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

