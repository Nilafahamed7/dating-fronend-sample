import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

const PAGE_TYPES = [
  { value: 'privacy-policy', label: 'Privacy Policy' },
  { value: 'terms-conditions', label: 'Terms & Conditions' },
  { value: 'refund-policy', label: 'Refund Policy' },
  { value: 'contact-us', label: 'Contact Us' },
  { value: 'safety-policy', label: 'Safety Policy' },
];

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPageType, setEditingPageType] = useState(null);
  const [formData, setFormData] = useState({
    pageType: '',
    title: '',
    description: '',
    content: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  });

  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getPages();
      setPages(response?.pages || []);
    } catch (error) {
      toast.error('Unable to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleEdit = async (pageType) => {
    try {
      const response = await adminService.getPage(pageType);
      const page = response?.page;
      const pageTypeObj = PAGE_TYPES.find(p => p.value === pageType);

      if (page) {
        // Existing page - load its data
        setEditingPageType(pageType);
        setFormData({
          pageType: page.title,
          title: page.title,
          description: page.description || '',
          content: page.content || '',
          email: page.email || '',
          phone: page.phone || '',
          address: page.address || '',
          isActive: page.isActive,
        });
      } else {
        // New page - show form with default values
        setEditingPageType(pageType);
        setFormData({
          pageType: pageType,
          title: pageTypeObj?.label || pageType,
          description: '',
          content: '',
          email: '',
          phone: '',
          address: '',
          isActive: true,
        });
      }
    } catch (error) {
      // Fallback to creating new page if error occurs
      const pageTypeObj = PAGE_TYPES.find(p => p.value === pageType);
      setEditingPageType(pageType);
      setFormData({
        pageType: pageType,
        title: pageTypeObj?.label || pageType,
        description: '',
        content: '',
        email: '',
        phone: '',
        address: '',
        isActive: true,
      });
      // Only show error if it's not a 404
      if (error.response?.status !== 404) {
        toast.error('Unable to load page');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await adminService.createOrUpdatePage(formData);
      toast.success('Page saved successfully');
      setEditingPageType(null);
      setFormData({
        pageType: '',
        title: '',
        description: '',
        content: '',
        email: '',
        phone: '',
        address: '',
        isActive: true,
      });
      loadPages();
    } catch (error) {
      toast.error('Failed to save page');
    }
  };

  const handleCancel = () => {
    setEditingPageType(null);
    setFormData({
      pageType: '',
      title: '',
      description: '',
      content: '',
      email: '',
      phone: '',
      address: '',
      isActive: true,
    });
  };

  const getPageByType = (pageType) => {
    return pages.find(p => p.title === pageType);
  };

  if (loading) {
    return (
      <AdminLayout selectedNavKey="pages">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout selectedNavKey="pages">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Page Content Management</h1>
          <p className="text-gray-600 mt-1">Manage static page content for Privacy Policy, Terms, Refund Policy, Contact Us, and Safety Policy</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {PAGE_TYPES.map((pageType) => {
            const page = getPageByType(pageType.value);
            const isEditing = editingPageType === pageType.value;

            return (
              <motion.div
                key={pageType.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                {!isEditing ? (
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{pageType.label}</h3>
                          {page && (
                            <p className="text-sm text-gray-500">
                              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                          {page && (
                            <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                              page.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {page.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(pageType.value)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        {page ? 'Edit' : 'Create'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Editing: {pageType.label}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {pageType.value === 'contact-us' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content (Markdown supported)
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="Enter page content in Markdown format..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use Markdown syntax: # for headings, ## for subheadings, - for lists, etc.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${pageType.value}`}
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`active-${pageType.value}`} className="text-sm font-medium text-gray-700">
                        Active (visible to users)
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

