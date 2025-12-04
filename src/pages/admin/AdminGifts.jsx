import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon, GiftIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

export default function AdminGifts() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 20,
    search: '',
    giftType: '',
  });
  const [gifts, setGifts] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState(null);
  const [giftDetails, setGiftDetails] = useState(null);

  const loadGifts = useCallback(async (withSpinner = true) => {
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
      if (query.giftType) {
        params.giftType = query.giftType;
      }
      const response = await adminService.getAllGifts(params);
      setGifts(response?.gifts || []);
      setPagination(response?.pagination || { total: 0, page: 1, limit: query.limit, pages: 0 });
    } catch (error) {
      toast.error('Unable to load gifts');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [query]);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getGiftStats();
      setStats(response?.stats);
    } catch (error) {
      }
  }, []);

  const loadGiftDetails = async (giftId) => {
    try {
      const response = await adminService.getGiftDetails(giftId);
      setGiftDetails(response);
      setSelectedGiftId(giftId);
    } catch (error) {
      toast.error('Failed to load gift details');
    }
  };

  useEffect(() => {
    loadGifts();
    loadStats();
  }, [loadGifts, loadStats]);

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout selectedNavKey="gifts">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (selectedGiftId && giftDetails) {
    return (
      <AdminLayout
        title="Gift Details"
        subtitle="Gifts"
        selectedNavKey="gifts"
        headerActions={
          <button
            onClick={() => {
              setSelectedGiftId(null);
              setGiftDetails(null);
            }}
            type="button"
            className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
          >
            Back to List
          </button>
        }
      >
        <section className="p-6 lg:p-8 xl:p-10 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Gift Type</h3>
              <div className="text-lg font-bold text-pink-600">🎁 {giftDetails.gift?.giftType}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Sender</h3>
                <div className="text-sm">{giftDetails.gift?.sender?.name}</div>
                <div className="text-xs text-gray-500">{giftDetails.gift?.sender?.email}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Recipient</h3>
                <div className="text-sm">{giftDetails.gift?.recipient?.name}</div>
                <div className="text-xs text-gray-500">{giftDetails.gift?.recipient?.email}</div>
              </div>
            </div>
            {giftDetails.gift?.message && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Message</h3>
                <div className="text-sm text-gray-700">{giftDetails.gift.message.text}</div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Sent At</h3>
              <div className="text-sm">{formatDate(giftDetails.gift?.createdAt)}</div>
            </div>
          </div>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Gifts Monitoring"
      subtitle="Gifts"
      selectedNavKey="gifts"
      headerActions={
        <button
          onClick={() => loadGifts(false)}
          type="button"
          className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
        >
          Refresh
        </button>
      }
    >
      <section className="p-6 lg:p-8 xl:p-10 space-y-6 lg:space-y-8">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Total Gifts</div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">{stats.totalGifts || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Today's Gifts</div>
              <div className="text-3xl lg:text-4xl font-bold text-green-600">{stats.todayGifts || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">This Week</div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">{stats.thisWeekGifts || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">This Month</div>
              <div className="text-3xl lg:text-4xl font-bold text-purple-600">{stats.thisMonthGifts || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Unique Senders</div>
              <div className="text-3xl lg:text-4xl font-bold text-pink-600">{stats.uniqueSenders || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Unique Recipients</div>
              <div className="text-3xl lg:text-4xl font-bold text-indigo-600">{stats.uniqueRecipients || 0}</div>
            </div>
          </div>
        )}

        {stats?.giftTypeDistribution && stats.giftTypeDistribution.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Gift Type Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.giftTypeDistribution.map((item) => (
                <div key={item.giftType} className="text-center p-4 bg-gray-50 rounded-2xl">
                  <div className="text-2xl font-bold text-pink-600">{item.count}</div>
                  <div className="text-sm text-gray-600 mt-1">{item.giftType}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6 lg:p-8 border-b border-gray-100 space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search gifts..."
                value={query.search}
                onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by gift type..."
              value={query.giftType}
              onChange={(e) => setQuery({ ...query, giftType: e.target.value, page: 1 })}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
            />
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gift Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Match Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {gifts.map((gift) => (
                      <tr key={gift.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <GiftIcon className="w-5 h-5 text-pink-600" />
                            <span className="font-semibold text-gray-900">{gift.giftType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">{gift.sender?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{gift.sender?.email}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">{gift.recipient?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{gift.recipient?.email}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            gift.matchStatus === 'matched'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {gift.matchStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(gift.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => loadGiftDetails(gift.id)}
                            className="p-2.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
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

