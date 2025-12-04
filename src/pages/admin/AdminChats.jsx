import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

export default function AdminChats() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 20,
    search: '',
    messageType: '',
  });
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [chatDetails, setChatDetails] = useState(null);

  const loadChats = useCallback(async (withSpinner = true) => {
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
      if (query.messageType) {
        params.messageType = query.messageType;
      }
      const response = await adminService.getAllChats(params);
      setMessages(response?.messages || []);
      setPagination(response?.pagination || { total: 0, page: 1, limit: query.limit, pages: 0 });
    } catch (error) {
      toast.error('Unable to load chats');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [query]);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getChatStats();
      setStats(response?.stats);
    } catch (error) {
      }
  }, []);

  const loadChatDetails = async (matchId) => {
    try {
      const response = await adminService.getChatDetails(matchId);
      setChatDetails(response);
      setSelectedMatchId(matchId);
    } catch (error) {
      toast.error('Failed to load chat details');
    }
  };

  useEffect(() => {
    loadChats();
    loadStats();
  }, [loadChats, loadStats]);

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await adminService.deleteChatMessage(messageId);
      toast.success('Message deleted successfully');
      loadChats(false);
      loadStats();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString();
  };

  const getMessageTypeBadge = (type) => {
    const badges = {
      text: 'bg-blue-100 text-blue-800',
      image: 'bg-purple-100 text-purple-800',
      gift: 'bg-pink-100 text-pink-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout selectedNavKey="chats">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (selectedMatchId && chatDetails) {
    return (
      <AdminLayout
        title="Chat Details"
        subtitle="Chats"
        selectedNavKey="chats"
        headerActions={
          <button
            onClick={() => {
              setSelectedMatchId(null);
              setChatDetails(null);
            }}
            type="button"
            className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
          >
            Back to List
          </button>
        }
      >
        <section className="p-6 lg:p-8 xl:p-10 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Match Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">Status:</span> {chatDetails.match?.status}</div>
              <div><span className="font-semibold">Participants:</span> {chatDetails.match?.participants?.map(p => p.name).join(', ')}</div>
              <div><span className="font-semibold">Matched At:</span> {formatDate(chatDetails.match?.matchedAt)}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">Messages ({chatDetails.totalMessages})</h3>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {chatDetails.messages?.map((msg) => (
                <div key={msg.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">{msg.sender?.name}</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getMessageTypeBadge(msg.messageType)}`}>
                        {msg.messageType}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                  </div>
                  {msg.text && <div className="text-sm text-gray-700">{msg.text}</div>}
                  {msg.giftType && <div className="text-sm text-pink-600">🎁 Gift: {msg.giftType}</div>}
                  {msg.isDeleted && <div className="text-xs text-red-500 italic">[Deleted]</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Chats Monitoring"
      subtitle="Chats"
      selectedNavKey="chats"
      headerActions={
        <button
          onClick={() => loadChats(false)}
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
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Total Messages</div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">{stats.totalMessages || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Text Messages</div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">{stats.textMessages || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Gift Messages</div>
              <div className="text-3xl lg:text-4xl font-bold text-pink-600">{stats.giftMessages || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Image Messages</div>
              <div className="text-3xl lg:text-4xl font-bold text-purple-600">{stats.imageMessages || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Today's Messages</div>
              <div className="text-3xl lg:text-4xl font-bold text-green-600">{stats.todayMessages || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Active Conversations</div>
              <div className="text-3xl lg:text-4xl font-bold text-indigo-600">{stats.uniqueMatches || 0}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6 lg:p-8 border-b border-gray-100 space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={query.search}
                onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
              />
            </div>
            <select
              value={query.messageType}
              onChange={(e) => setQuery({ ...query, messageType: e.target.value, page: 1 })}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
            >
              <option value="">All Types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="gift">Gift</option>
            </select>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Content</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {messages.map((message) => (
                      <tr key={message.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">{message.sender?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{message.sender?.email}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getMessageTypeBadge(message.messageType)}`}>
                            {message.messageType}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-900 max-w-xs">
                          {message.giftType ? (
                            <span className="text-pink-600">🎁 {message.giftType}</span>
                          ) : message.text ? (
                            <div className="truncate">{message.text}</div>
                          ) : message.imageUrl ? (
                            <span className="text-purple-600">📷 Image</span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                          {message.isDeleted && <span className="text-xs text-red-500 ml-2">[Deleted]</span>}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {message.participants?.map(p => p.name).join(', ') || '--'}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(message.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadChatDetails(message.matchId)}
                              className="p-2.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                              title="View Chat"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Message"
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

