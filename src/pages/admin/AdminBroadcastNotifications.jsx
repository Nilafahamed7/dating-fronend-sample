import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BellAlertIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function AdminBroadcastNotifications() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [statusPolling, setStatusPolling] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    deepLink: '/',
    targetAudience: 'all',
    options: {
      channelId: 'broadcast',
      sound: 'default',
      color: '#FF6B6B',
      vibrate: [200, 100, 200],
    },
  });

  useEffect(() => {
    loadBroadcasts();
  }, []);

  // Poll for status updates for active broadcasts
  useEffect(() => {
    const interval = setInterval(() => {
      broadcasts.forEach(broadcast => {
        if (broadcast.status === 'sending' || broadcast.status === 'queued') {
          loadBroadcastStatus(broadcast._id);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [broadcasts]);

  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBroadcasts();
      if (response.success) {
        setBroadcasts(response.data?.broadcasts || response.broadcasts || []);
      }
    } catch (error) {
      toast.error('Failed to load broadcast history');
    } finally {
      setLoading(false);
    }
  };

  const loadBroadcastStatus = async (broadcastId) => {
    try {
      const response = await adminService.getNotificationStatus(broadcastId);
      if (response.success) {
        setBroadcasts(prev => prev.map(b =>
          b._id === broadcastId
            ? { ...b, status: response.status, deliveryStats: { ...b.deliveryStats, ...response } }
            : b
        ));
      }
    } catch (error) {
      }
  };

  const handleRetry = async (broadcastId) => {
    try {
      const response = await adminService.retryNotification(broadcastId);
      if (response.success) {
        toast.success(`Retry initiated: ${response.retriedCount} notifications retried`);
        loadBroadcasts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retry notification');
    }
  };

  const handleViewDetails = async (broadcastId) => {
    try {
      const response = await adminService.getBroadcastDetails(broadcastId);
      if (response.success) {
        setSelectedBroadcast(response.data?.broadcast || response.broadcast);
      }
    } catch (error) {
      toast.error('Failed to load broadcast details');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      // Create FormData if image file is selected, otherwise use regular object
      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append('title', formData.title);
        payload.append('message', formData.message);
        payload.append('image', imageFile);
        payload.append('deepLink', formData.deepLink);
        payload.append('targetAudience', formData.targetAudience);
        payload.append('options', JSON.stringify(formData.options));
      } else {
        payload = formData;
      }

      const response = await adminService.sendBroadcast(payload);
      if (response.success) {
        toast.success('Broadcast notification sent successfully');
        setFormData({
          title: '',
          message: '',
          imageUrl: '',
          deepLink: '/',
          targetAudience: 'all',
          options: {
            channelId: 'broadcast',
            sound: 'default',
            color: '#FF6B6B',
            vibrate: [200, 100, 200],
          },
        });
        setImageFile(null);
        setImagePreview(null);
        setShowForm(false);
        loadBroadcasts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircleIcon className="w-3 h-3" />
            Completed
          </span>
        );
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            <ClockIcon className="w-3 h-3" />
            Sending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <XCircleIcon className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="w-8 h-8 text-velora-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
              <p className="text-sm text-gray-500">Send broadcast notifications to all users</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            {showForm ? 'Cancel' : 'Send Broadcast'}
          </button>
        </div>

        {/* Send Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-lg"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Broadcast Notification</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                  placeholder="Enter notification title"
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                  placeholder="Enter notification message"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500</p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image (Optional)
                </label>
                <div className="space-y-3">
                  {/* File Upload Option */}
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-velora-primary hover:bg-velora-primary/5 transition-colors">
                      <PhotoIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {imageFile ? 'Change Image' : 'Select Image from Gallery'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Supported: JPG, PNG, GIF (Max 5MB)
                    </p>
                  </div>

                  {/* Image Preview */}
                  {(imagePreview || formData.imageUrl) && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* OR Divider */}
                  {!imageFile && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or</span>
                      </div>
                    </div>
                  )}

                  {/* URL Input Option (only show if no file selected) */}
                  {!imageFile && (
                    <div>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                        placeholder="Or enter image URL (https://example.com/image.jpg)"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Deep Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deep Link (Optional)
                </label>
                <input
                  type="text"
                  value={formData.deepLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, deepLink: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                  placeholder="/chat, /profile, etc."
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-velora-primary focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="premium">Premium Users Only</option>
                  <option value="non-premium">Non-Premium Users Only</option>
                  <option value="male">Male Users Only</option>
                  <option value="female">Female Users Only</option>
                </select>
              </div>

              {/* Notification Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Color
                </label>
                <input
                  type="color"
                  value={formData.options.color}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    options: { ...prev.options, color: e.target.value }
                  }))}
                  className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Broadcast History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Broadcast History</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12">
              <BellAlertIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No broadcasts sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {broadcasts.map((broadcast) => (
                <div key={broadcast._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{broadcast.title}</h3>
                        {getStatusBadge(broadcast.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{broadcast.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Sent by: {broadcast.sentBy?.name || 'Admin'}</span>
                        <span>•</span>
                        <span>Target: {broadcast.targetAudience}</span>
                        <span>•</span>
                        <span>{formatDate(broadcast.sentAt || broadcast.createdAt)}</span>
                      </div>
                    </div>
                    {broadcast.imageUrl && (
                      <img
                        src={broadcast.imageUrl}
                        alt="Broadcast"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                  </div>

                  {/* Delivery Stats */}
                  {broadcast.deliveryStats && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Users</p>
                          <p className="font-semibold text-gray-900">{broadcast.deliveryStats.totalUsers || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Tokens</p>
                          <p className="font-semibold text-gray-900">{broadcast.deliveryStats.totalTokens || 0}</p>
                        </div>
                        <div>
                          <p className="text-green-600">Success</p>
                          <p className="font-semibold text-green-700">{broadcast.deliveryStats.successCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-red-600">Failed</p>
                          <p className="font-semibold text-red-700">{broadcast.deliveryStats.failureCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-orange-600">Invalid Tokens</p>
                          <p className="font-semibold text-orange-700">{broadcast.deliveryStats.invalidTokens || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {broadcast.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">Error: {broadcast.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Broadcast Details Modal */}
        {selectedBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedBroadcast(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Broadcast Details</h3>
                <button
                  onClick={() => setSelectedBroadcast(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedBroadcast.title}</h4>
                  <p className="text-gray-700">{selectedBroadcast.message}</p>
                </div>

                {selectedBroadcast.deliveries && selectedBroadcast.deliveries.length > 0 && (
                  <div>
                    <h5 className="text-md font-semibold text-gray-900 mb-3">Delivery Details</h5>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedBroadcast.deliveries.map((delivery, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{delivery.userId?.name || 'Unknown User'}</p>
                              <p className="text-gray-500 text-xs">Device: {delivery.deviceId}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                delivery.status === 'opened' ? 'bg-purple-100 text-purple-700' :
                                delivery.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                delivery.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                delivery.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {delivery.status}
                              </span>
                              {delivery.error && (
                                <p className="text-red-600 text-xs mt-1">{delivery.error}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}

