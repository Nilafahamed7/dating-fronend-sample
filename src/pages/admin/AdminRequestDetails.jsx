import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    UserIcon,
    CalendarIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { BASE_URL } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminRequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [previousRequests, setPreviousRequests] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadRequestDetails();
    }, [id]);

    const loadRequestDetails = async () => {
        try {
            setLoading(true);
            const response = await adminService.getRequestDetails(id);
            if (response.success) {
                setRequest(response.data.request);
                setPreviousRequests(response.data.previousRequests || []);
            } else {
                throw new Error(response.message || 'Failed to load request');
            }
        } catch (error) {
            console.error('Error loading request details:', error);
            toast.error('Failed to load request details');
            navigate('/admin/requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status, reason = '') => {
        try {
            setProcessing(true);
            const response = await adminService.updateRequestStatus(id, status, reason);

            if (response.success) {
                toast.success(`Request ${status} successfully`);
                // Update local state
                setRequest(prev => ({ ...prev, status, rejectionReason: reason }));
                setShowRejectModal(false);
            } else {
                throw new Error(response.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setProcessing(false);
        }
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    if (!request) return null;

    const user = request.userId || {};

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/admin/requests')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Review Request</h1>
                        <p className="text-gray-600 text-sm">
                            ID: {request._id} • Submitted {new Date(request.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className={`ml-auto px-4 py-1.5 rounded-full text-sm font-semibold capitalize
            ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                        {request.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Media & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Media Viewer */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold text-gray-900">Submitted Evidence</h2>
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">
                                    {request.type}
                                </span>
                            </div>
                            <div className="bg-black flex items-center justify-center min-h-[400px]">
                                {request.type === 'video' ? (
                                    <video
                                        src={getMediaUrl(request.mediaUrl)}
                                        controls
                                        className="max-h-[600px] w-full object-contain"
                                    />
                                ) : (
                                    <img
                                        src={getMediaUrl(request.mediaUrl)}
                                        alt="Verification Evidence"
                                        className="max-h-[600px] w-full object-contain"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {request.status === 'pending' && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 flex gap-4">
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={processing}
                                    className="flex-1 py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircleIcon className="w-6 h-6" />
                                    Reject Request
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('approved')}
                                    disabled={processing}
                                    className="flex-1 py-3 px-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    {processing ? <LoadingSpinner size="sm" color="white" /> : <CheckCircleIcon className="w-6 h-6" />}
                                    Approve Verification
                                </button>
                            </div>
                        )}

                        {request.status === 'rejected' && request.rejectionReason && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <h3 className="font-bold text-red-800 mb-1">Rejection Reason:</h3>
                                <p className="text-red-700">{request.rejectionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - User Info */}
                    <div className="space-y-6">
                        {/* User Profile Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                                User Information
                            </h2>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3 border-4 border-white shadow-md">
                                    <img
                                        src={user.photos?.[0]?.url || 'https://via.placeholder.com/150'}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                                <p className="text-gray-500 text-sm">
                                    {user.gender ? `${user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}` : 'N/A'}
                                    {user.dob && ` • ${Math.floor((new Date() - new Date(user.dob)) / (365.25 * 24 * 60 * 60 * 1000))} years`}
                                </p>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700 truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <ShieldCheckIcon className={`w-5 h-5 ${user.isVerified ? 'text-green-500' : 'text-gray-400'}`} />
                                    <span className={user.isVerified ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                        {user.isVerified ? 'Currently Verified' : 'Not Verified'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Previous Requests */}
                        {previousRequests.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="font-bold text-gray-900 mb-4">History</h2>
                                <div className="space-y-3">
                                    {previousRequests.map(prev => (
                                        <div key={prev._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">{prev.type}</p>
                                                <p className="text-xs text-gray-500">{new Date(prev.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize
                        ${prev.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    prev.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {prev.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Request</h3>
                            <p className="text-gray-600 mb-4">Please provide a reason for rejection. This will be sent to the user.</p>

                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Photo is blurry, face not visible, ID expired..."
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] mb-4"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected', rejectionReason)}
                                    disabled={!rejectionReason.trim() || processing}
                                    className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Processing...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
