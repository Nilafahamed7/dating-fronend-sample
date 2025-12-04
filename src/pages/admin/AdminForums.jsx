import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

export default function AdminForums() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });
  const [forums, setForums] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const loadForums = useCallback(async (withSpinner = true) => {
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
      if (query.search.trim()) {
        params.search = query.search.trim();
      }
      const response = await adminService.getAllForums(params);
      setForums(response?.forums || []);
      setPagination(response?.pagination || { total: 0, page: 1, limit: query.limit, pages: 0 });
    } catch (error) {
      toast.error('Unable to load forums');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [query]);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getForumStats();
      setStats(response?.stats);
    } catch (error) {
      }
  }, []);

  useEffect(() => {
    loadForums();
    loadStats();
  }, [loadForums, loadStats]);

  const handleDelete = async (forumId) => {
    if (!window.confirm('Are you sure you want to delete this forum?')) return;
    try {
      await adminService.deleteForum(forumId);
      toast.success('Forum deleted successfully');
      loadForums(false);
      loadStats();
    } catch (error) {
      toast.error('Failed to delete forum');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout selectedNavKey="forums">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Forums Management"
      subtitle="Forums"
      selectedNavKey="forums"
      headerActions={
        <button
          onClick={() => loadForums(false)}
          type="button"
          className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
        >
          Refresh
        </button>
      }
    >
      <section className="p-6 lg:p-8 xl:p-10 space-y-6 lg:space-y-8">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Total Forums</div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">{stats.totalForums || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">User Created</div>
              <div className="text-3xl lg:text-4xl font-bold text-indigo-600">{stats.userCreatedForums || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Admin Created</div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">{stats.adminCreatedForums || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Total Posts</div>
              <div className="text-3xl lg:text-4xl font-bold text-purple-600">{stats.totalPosts || 0}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6 lg:p-8 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search forums..."
                value={query.search}
                onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
              />
            </div>
          </div>

          {tableLoading ? (
            <div className="p-12 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 lg:-mx-8">
              <div className="inline-block min-w-full align-middle px-6 lg:px-8">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Forum</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Creator</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Posts</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {forums.map((forum) => (
                      <tr key={forum._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">{forum.title}</div>
                          {forum.description && (
                            <div className="text-sm text-gray-500 line-clamp-1 mt-1">{forum.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-sm">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">{forum.createdBy?.name || 'Unknown'}</div>
                              {forum.createdBy?.email && (
                                <div className="text-xs text-gray-500 mt-0.5">{forum.createdBy.email}</div>
                              )}
                            </div>
                            {forum.createdBy?.role === 'admin' && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            {forum.actualPostCount || forum.postCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(forum.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/forums/${forum._id}`, '_blank')}
                              className="p-2.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                              title="View Forum"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(forum._id)}
                              className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Forum"
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
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="p-6 lg:p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setQuery({ ...query, page: query.page - 1 })}
                  disabled={query.page === 1}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                <span className="px-5 py-2.5 text-sm font-semibold text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setQuery({ ...query, page: query.page + 1 })}
                  disabled={query.page >= pagination.pages}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

