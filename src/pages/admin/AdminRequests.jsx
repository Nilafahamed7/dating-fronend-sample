import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    VideoCameraIcon,
    PhotoIcon,
    IdentificationIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import { BASE_URL } from '../../utils/constants';
import { getSocket } from '../../services/socketService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminRequests() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        loadRequests();
    }, [filter, pagination.page]);

    // Real-time updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNewRequest = (newRequest) => {
            toast.success(`New ${newRequest.type} verification request from ${newRequest.userName}`);

            // Only update list if we are on the first page and filter allows it
            if (pagination.page === 1 && (filter === 'all' || filter === 'pending')) {
                setRequests(prev => [newRequest, ...prev]);
            }
        };

        socket.on('admin:verification:new', handleNewRequest);

        return () => {
            socket.off('admin:verification:new', handleNewRequest);
        };
    }, [filter, pagination.page]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await adminService.getRequests({
                status: filter === 'all' ? undefined : filter,
                page: pagination.page,
                limit: pagination.limit,
            });

            if (response.success) {
                setRequests(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination,
                }));
            } else {
                throw new Error(response.message || 'Failed to load requests');
            }
        } catch (error) {
            console.error('Error loading requests:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(request => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const userName = (request.userId?.name || request.userName || '').toLowerCase();
        const userEmail = (request.userId?.email || '').toLowerCase();
        return userName.includes(query) || userEmail.includes(query);
    });

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    if (loading && requests.length === 0) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: {
                icon: ClockIcon,
                className: 'bg-yellow-100 text-yellow-800',
                label: 'Pending',
            },
            approved: {
                icon: CheckCircleIcon,
                className: 'bg-green-100 text-green-800',
                label: 'Approved',
            },
            rejected: {
                icon: XCircleIcon,
                className: 'bg-red-100 text-red-800',
                label: 'Rejected',
            },
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                <Icon className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return <VideoCameraIcon className="w-5 h-5 text-purple-600" />;
            case 'identity':
                return <IdentificationIcon className="w-5 h-5 text-blue-600" />;
            default:
                return <PhotoIcon className="w-5 h-5 text-green-600" />;
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <ShieldCheckIcon className="w-8 h-8 text-velora-primary" />
                        Verification Requests
                    </h1>
                    <p className="text-gray-600 mt-1">Manage user verification requests in real-time</p>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Status Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'pending', 'approved', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilter(status);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                        ? 'bg-velora-primary text-black'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Requests List */}
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <LoadingSpinner />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                            {filter === 'pending'
                                ? 'No pending requests'
                                : 'No requests found'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {filteredRequests.map((request) => {
                                const user = request.userId || {};
                                const primaryPhoto = user.photos?.[0]?.url || request.userAvatar || null;
                                const userName = user.name || request.userName || 'Unknown';

                                return (
                                    <motion.div
                                        key={request._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                        onClick={() => navigate(`/admin/requests/${request._id}`)}
                                        className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border border-gray-100"
                                    >
                                        {/* User Info */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm">
                                                {primaryPhoto ? (
                                                    <img
                                                        src={primaryPhoto}
                                                        alt={userName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-velora-primary to-velora-secondary">
                                                        <span className="text-lg font-bold text-black">
                                                            {userName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{userName}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getTypeIcon(request.type)}
                                                    <span className="text-xs font-medium text-gray-600 capitalize">
                                                        {request.type} Verification
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>

                                        {/* Media Preview (if photo) */}
                                        {request.type === 'photo' && request.mediaUrl && (
                                            <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 relative group" style={{ aspectRatio: '4/3' }}>
                                                <img
                                                    src={getMediaUrl(request.mediaUrl)}
                                                    alt="Verification"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded-full">View</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Video/Other Preview Placeholder */}
                                        {request.type !== 'photo' && (
                                            <div className="bg-gray-50 rounded-lg mb-4 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                                                <div className="text-center p-4">
                                                    {getTypeIcon(request.type)}
                                                    <p className="text-sm text-gray-500 mt-2">Click to review {request.type}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer Info */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                                            <span>
                                                {new Date(request.createdAt).toLocaleDateString()} {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="font-medium text-velora-primary">
                                                View Details &rarr;
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                            disabled={pagination.page === pagination.pages}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
