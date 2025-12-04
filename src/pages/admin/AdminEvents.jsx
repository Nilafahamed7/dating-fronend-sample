import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon, TrashIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

const statusClasses = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-600',
};

export default function AdminEvents() {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: '',
  });
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const loadEvents = useCallback(async (withSpinner = true) => {
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
      if (query.status) {
        params.status = query.status;
      }
      if (query.search.trim()) {
        params.search = query.search.trim();
      }
      const response = await adminService.getAllEvents(params);
      setEvents(response?.events || []);
      setPagination(response?.pagination || { total: 0, page: 1, limit: query.limit, pages: 0 });
    } catch (error) {
      toast.error('Unable to load events');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [query]);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getEventStats();
      setStats(response?.stats);
    } catch (error) {
      }
  }, []);

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [loadEvents, loadStats]);

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await adminService.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      loadEvents(false);
      loadStats();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleStatusChange = async (eventId, status) => {
    try {
      await adminService.updateEventStatus(eventId, status);
      toast.success('Event status updated');
      loadEvents(false);
    } catch (error) {
      toast.error('Failed to update event status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout selectedNavKey="events">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Events Management"
      subtitle="Events"
      selectedNavKey="events"
      headerActions={
        <button
          onClick={() => loadEvents(false)}
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
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Total Events</div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">{stats.totalEvents || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">User Created</div>
              <div className="text-3xl lg:text-4xl font-bold text-indigo-600">{stats.userCreatedEvents || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Admin Created</div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">{stats.adminCreatedEvents || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Scheduled</div>
              <div className="text-3xl lg:text-4xl font-bold text-green-600">{stats.scheduledEvents || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Completed</div>
              <div className="text-3xl lg:text-4xl font-bold text-emerald-600">{stats.completedEvents || 0}</div>
            </div>
            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm lg:text-base font-medium text-gray-500 mb-2">Total Attendees</div>
              <div className="text-3xl lg:text-4xl font-bold text-purple-600">{stats.totalAttendees || 0}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6 lg:p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={query.search}
                  onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
                />
              </div>
              <select
                value={query.status}
                onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
                className="px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-velora-primary/60 transition"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Creator</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendees</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {events.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{event.eventCode}</div>
                        </td>
                        <td className="px-6 py-5 text-sm">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">{event.creator?.name || 'Unknown'}</div>
                              {event.creator?.email && (
                                <div className="text-xs text-gray-500 mt-0.5">{event.creator.email}</div>
                              )}
                            </div>
                            {event.creator?.role === 'admin' && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {formatDate(event.date)}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="w-4 h-4" />
                            {event.attendeeCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <select
                            value={event.status}
                            onChange={(e) => handleStatusChange(event._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 ${statusClasses[event.status] || 'bg-gray-100 text-gray-700'}`}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/events/${event.eventCode}`, '_blank')}
                              className="p-2.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                              title="View Event"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(event._id)}
                              className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Event"
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

