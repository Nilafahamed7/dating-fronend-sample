import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

export default function AdminGiftManagement() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    order: 0,
    price: 50,
    isActive: true,
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);

  const loadGifts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getMasterDataItems('gift');
      setGifts(response.items || []);
    } catch (error) {
      toast.error('Failed to load gifts');
      } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: '',
      order: 0,
      price: 50,
      isActive: true,
    });
    setIconFile(null);
    setIconPreview(null);
    setEditingGift(null);
    setShowForm(false);
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setFormData({
      title: gift.title || '',
      description: gift.description || '',
      icon: gift.icon || '',
      order: gift.order || 0,
      price: gift.metadata?.price || 50,
      isActive: gift.isActive !== undefined ? gift.isActive : true,
    });
    setIconPreview(gift.icon && gift.icon.startsWith('http') ? gift.icon : null);
    setIconFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Gift title is required');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('type', 'gift');
      formPayload.append('title', formData.title.trim());
      if (formData.description) {
        formPayload.append('description', formData.description.trim());
      }
      formPayload.append('order', (formData.order || 0).toString());
      formPayload.append('isActive', formData.isActive.toString());

      // Add icon - either file or existing icon string
      if (iconFile) {
        formPayload.append('icon', iconFile);
      } else if (formData.icon && !formData.icon.startsWith('http')) {
        // If it's an emoji or text icon, send it as icon field
        formPayload.append('icon', formData.icon);
      } else if (formData.icon && formData.icon.startsWith('http')) {
        // Keep existing URL
        formPayload.append('icon', formData.icon);
      }

      // Add metadata (price)
      const metadata = {
        price: parseInt(formData.price) || 50,
      };
      formPayload.append('metadata', JSON.stringify(metadata));

      if (editingGift) {
        await adminService.updateMasterDataItem(editingGift._id, formPayload);
        toast.success('Gift updated successfully');
      } else {
        await adminService.createMasterDataItem(formPayload);
        toast.success('Gift created successfully');
      }

      resetForm();
      loadGifts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save gift';
      toast.error(errorMsg);
      }
  };

  const handleDelete = async (giftId) => {
    if (!window.confirm('Are you sure you want to delete this gift?')) {
      return;
    }

    try {
      await adminService.deleteMasterDataItem(giftId);
      toast.success('Gift deleted successfully');
      loadGifts();
    } catch (error) {
      toast.error('Failed to delete gift');
      }
  };

  const isIconUrl = (icon) => {
    return icon && (icon.startsWith('http://') || icon.startsWith('https://'));
  };

  if (loading) {
    return (
      <AdminLayout selectedNavKey="gift">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Gift Management"
      subtitle="Manage gift types and icons"
      selectedNavKey="gift"
      headerActions={
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Gift
        </button>
      }
    >
      <section className="p-6 lg:p-8 xl:p-10 space-y-6">
        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingGift ? 'Edit Gift' : 'Add New Gift'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gift Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g., Rose, Chocolate, Diamond"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                      rows="3"
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Custom Icon (Image)
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                            <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {iconFile ? iconFile.name : 'Click to upload icon image'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB, PNG/JPG</p>
                          </div>
                        </label>
                      </div>

                      {(iconPreview || (formData.icon && isIconUrl(formData.icon))) && (
                        <div className="relative inline-block">
                          <img
                            src={iconPreview || formData.icon}
                            alt="Icon preview"
                            className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIconFile(null);
                              setIconPreview(null);
                              setFormData({ ...formData, icon: '' });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <p>Or use emoji/text icon:</p>
                        <input
                          type="text"
                          value={formData.icon && !isIconUrl(formData.icon) ? formData.icon : ''}
                          onChange={(e) => {
                            if (!iconFile && !iconPreview) {
                              setFormData({ ...formData, icon: e.target.value });
                            }
                          }}
                          className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                          placeholder="e.g., 🎁 🎀 💝 🌹"
                          disabled={!!iconFile || !!iconPreview}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price (Coins) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                      Active (visible to users)
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition"
                    >
                      {editingGift ? 'Update Gift' : 'Create Gift'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-200 font-semibold rounded-xl hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Gifts List */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">All Gifts ({gifts.length})</h3>
          </div>

          {gifts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No gifts found. Click "Add Gift" to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Icon</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gifts.map((gift) => (
                    <tr key={gift._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {isIconUrl(gift.icon) ? (
                          <img
                            src={gift.icon}
                            alt={gift.title}
                            className="w-12 h-12 object-contain rounded-lg"
                          />
                        ) : (
                          <span className="text-3xl">{gift.icon || '🎁'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{gift.title}</div>
                        {gift.description && (
                          <div className="text-xs text-gray-500 mt-1">{gift.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-yellow-600">
                          {gift.metadata?.price || 50} coins
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{gift.order || 0}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            gift.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {gift.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(gift)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(gift._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

