import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

export default function AdminIcebreakers() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    type: 'text',
    tags: [],
    isActive: true,
    order: 0,
  });

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getIcebreakers();
      setPrompts(response?.prompts || []);
    } catch (error) {
      toast.error('Unable to load ice-breakers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleCreate = async () => {
    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }

    try {
      await adminService.createIcebreaker(formData);
      toast.success('Ice-breaker created successfully');
      setShowCreateModal(false);
      setFormData({ question: '', type: 'text', tags: [], isActive: true, order: 0 });
      loadPrompts();
    } catch (error) {
      toast.error('Failed to create ice-breaker');
    }
  };

  const handleUpdate = async (id) => {
    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }

    try {
      await adminService.updateIcebreaker(id, formData);
      toast.success('Ice-breaker updated successfully');
      setEditingId(null);
      setFormData({ question: '', type: 'text', tags: [], isActive: true, order: 0 });
      loadPrompts();
    } catch (error) {
      toast.error('Failed to update ice-breaker');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ice-breaker?')) return;
    try {
      await adminService.deleteIcebreaker(id);
      toast.success('Ice-breaker deleted successfully');
      loadPrompts();
    } catch (error) {
      toast.error('Failed to delete ice-breaker');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await adminService.updateIcebreaker(id, { isActive: !currentStatus });
      toast.success('Status updated');
      loadPrompts();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReorder = async (id, direction) => {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    const currentIndex = prompts.findIndex(p => p.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= prompts.length) return;

    const newOrder = prompts[newIndex].order;
    try {
      await adminService.updateIcebreaker(id, { order: newOrder });
      await adminService.updateIcebreaker(prompts[newIndex].id, { order: prompt.order });
      loadPrompts();
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const startEdit = (prompt) => {
    setEditingId(prompt.id);
    setFormData({
      question: prompt.question,
      type: prompt.type || 'text',
      tags: prompt.tags || [],
      isActive: prompt.isActive,
      order: prompt.order || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ question: '', type: 'text', tags: [], isActive: true, order: 0 });
  };

  const filteredPrompts = prompts.filter(p =>
    p.question.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout selectedNavKey="icebreakers">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Ice-Breakers Management"
      subtitle="Ice-Breakers"
      selectedNavKey="icebreakers"
      headerActions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPrompts()}
            type="button"
            className="px-5 py-2.5 rounded-2xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition whitespace-nowrap"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            type="button"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5" />
            Create Prompt
          </button>
        </div>
      }
    >
      <section className="p-6 lg:p-8 xl:p-10 space-y-6 lg:space-y-8">
        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6 lg:p-8 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ice-breakers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPrompts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      {search ? 'No prompts found matching your search' : 'No ice-breakers yet. Create one to get started!'}
                    </td>
                  </tr>
                ) : (
                  filteredPrompts.map((prompt) => (
                    <tr key={prompt.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReorder(prompt.id, 'up')}
                            disabled={prompts.findIndex(p => p.id === prompt.id) === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-700">{prompt.order}</span>
                          <button
                            onClick={() => handleReorder(prompt.id, 'down')}
                            disabled={prompts.findIndex(p => p.id === prompt.id) === prompts.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDownIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {editingId === prompt.id ? (
                          <input
                            type="text"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{prompt.question}</div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {editingId === prompt.id ? (
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="text">Text</option>
                            <option value="choice">Choice</option>
                            <option value="truth">Truth</option>
                            <option value="dare">Dare</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {prompt.type || 'text'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => handleToggleActive(prompt.id, prompt.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            prompt.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {prompt.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        {editingId === prompt.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(prompt.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(prompt)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(prompt.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10001,
                width: '100%',
                maxWidth: '32rem',
                padding: '1rem',
                pointerEvents: 'auto'
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full p-6"
              >
                <h3 className="text-xl font-bold text-black mb-4">Create Ice-Breaker Prompt</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question *</label>
                    <textarea
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter ice-breaker question..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="text">Text</option>
                      <option value="choice">Choice</option>
                      <option value="truth">Truth</option>
                      <option value="dare">Dare</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-all"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

