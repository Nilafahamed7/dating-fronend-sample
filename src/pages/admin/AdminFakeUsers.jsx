import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';
import { getPlaceholderImage } from '../../utils/helpers';

const statusClasses = {
    true: 'bg-emerald-50 text-emerald-700',
    false: 'bg-gray-100 text-gray-500',
};

const formatDateTime = (value) => {
    if (!value) return '--';
    return new Date(value).toLocaleString();
};

export default function AdminFakeUsers() {
    const navigate = useNavigate();
    const [query, setQuery] = useState({
        page: 1,
        limit: 10,
        status: 'all',
        search: '',
    });
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const loadUsers = useCallback(
        async (withSpinner = true) => {
            try {
                if (withSpinner) {
                    setLoading(true);
                } else {
                    setTableLoading(true);
                }
                const params = {
                    page: query.page,
                    limit: query.limit,
                };
                if (query.status !== 'all') {
                    params.status = query.status;
                }
                if (query.search.trim()) {
                    params.search = query.search.trim();
                }
                const response = await adminService.getFakeUsers(params);
                setUsers(response?.users || []);
                setPagination(response?.pagination || { total: 0, page: 1, limit: query.limit, pages: 0 });
            } catch (error) {
                toast.error('Unable to load fake users');
                } finally {
                setLoading(false);
                setTableLoading(false);
            }
        },
        [query]
    );

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fake user?')) return;
        try {
            await adminService.deleteFakeUser(id);
            toast.success('Fake user deleted');
            loadUsers(false);
        } catch (error) {
            toast.error('Failed to delete fake user');
        }
    };

    const handlePageChange = (direction) => {
        setQuery((prev) => {
            const nextPage = Math.min(
                Math.max(1, prev.page + direction),
                Math.max(1, pagination.pages || 1)
            );
            return { ...prev, page: nextPage };
        });
    };

    const headerActions = (
        <div className="flex gap-2">
            <button
                onClick={() => navigate('/admin/fake-users/create')}
                type="button"
                className="px-5 py-2.5 rounded-2xl bg-velora-primary text-white font-semibold hover:bg-velora-primary/90 transition flex items-center gap-2"
            >
                <PlusIcon className="w-5 h-5" />
                Create New
            </button>
            <button
                onClick={() => loadUsers(false)}
                type="button"
                className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
            >
                Refresh
            </button>
        </div>
    );

    const tableContent = useMemo(() => {
        if (loading) {
            return (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner />
                </div>
            );
        }

        if (!users.length) {
            return (
                <div className="py-20 text-center text-gray-500 text-sm">
                    No fake users found.
                </div>
            );
        }

        return (
            <div className="overflow-x-auto -mx-6 lg:-mx-8">
                <div className="inline-block min-w-full align-middle px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                {[
                                    'Avatar',
                                    'Name',
                                    'Email',
                                    'Status',
                                    'Created At',
                                    'Notes',
                                    'Actions',
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {users.map((user) => {
                                const statusBadge = statusClasses[user.isActive] || statusClasses.false;
                                const avatar = user.avatar || getPlaceholderImage(80, 80, 'No Photo');

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50/50 text-sm transition-colors">
                                        <td className="px-4 lg:px-6 py-5">
                                            <img
                                                src={avatar}
                                                alt={user.name}
                                                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-gray-200"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = getPlaceholderImage(80, 80, 'No Photo');
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 lg:px-6 py-5">
                                            <div className="font-semibold text-gray-900">{user.name}</div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-5 text-gray-600">{user.email}</td>
                                        <td className="px-4 lg:px-6 py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-5 text-gray-600">{formatDateTime(user.createdAt)}</td>
                                        <td className="px-4 lg:px-6 py-5 text-gray-600 max-w-xs truncate">
                                            {user.fakeMetadata?.notes || '--'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/profile/${user.id}`)}
                                                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                                                    title="View Profile"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/admin/fake-users/edit/${user.id}`)}
                                                    className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }, [users, loading, navigate]);

    return (
        <AdminLayout
            title="Fake Users"
            subtitle="Management"
            selectedNavKey="fakeUsers"
            headerActions={headerActions}
        >
            <section className="p-4 lg:p-8 xl:p-10 space-y-6 lg:space-y-8">
                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-500">Show</label>
                            <select
                                value={query.limit}
                                onChange={(e) =>
                                    setQuery((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))
                                }
                                className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                            >
                                {[10, 25, 50].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-500">entries</span>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="w-4 h-4 text-gray-400" />
                                <select
                                    value={query.status}
                                    onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                                    className="border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={query.search}
                                    onChange={(e) =>
                                        setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                                    }
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 relative">
                        {tableLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                                <LoadingSpinner />
                            </div>
                        )}
                        {tableContent}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} entries
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handlePageChange(-1)}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-semibold text-gray-700">
                                Page {pagination.page} of {pagination.pages || 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page >= (pagination.pages || 1)}
                                className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}
