import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  UserIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { securityService } from '../services/securityService';
// NavBar removed - using GlobalNavBar from App.jsx

export default function AccountSecurity() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [blocked, myReports] = await Promise.all([
        securityService.getBlockedUsers(),
        securityService.getMyReports(),
      ]);
      setBlockedUsers(blocked || []);
      setReports(myReports || []);
    } catch (error) {
      toast.error('Unable to load account security data');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      setUnblocking(userId);
      await securityService.unblockUser(userId);
      toast.success('User unblocked');
      await loadData();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to unblock user';
      toast.error(message);
    } finally {
      setUnblocking('');
    }
  };

  const renderEmptyState = (title, description) => (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-500">
      <ShieldCheckIcon className="w-10 h-10 text-gray-300" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <p className="text-xs sm:text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
              Security Center
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2">Account & Safety</h1>
            <p className="text-gray-500 mt-3 max-w-2xl">
              Review everyone you've blocked, track the reports you've submitted, and keep your profile safe.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Privacy
                </p>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Blocked Profiles
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {blockedUsers.length}
                  </span>
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : blockedUsers.length === 0 ? (
              renderEmptyState('No blocked users', 'People you block will appear here.')
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {blockedUsers.map((entry) => (
                  <div
                    key={entry.userId}
                    className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        {entry.name || 'Unknown user'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        Blocked on {entry.blockedAt ? new Date(entry.blockedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={unblocking === entry.userId}
                      onClick={() => handleUnblock(entry.userId)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full hover:border-gray-900 hover:text-gray-900 transition disabled:opacity-50"
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4" />
                      {unblocking === entry.userId ? 'Unblocking...' : 'Unblock'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Safety
                </p>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Reports
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {reports.length}
                  </span>
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : reports.length === 0 ? (
              renderEmptyState('No reports submitted', 'Reports you file against other users will show here.')
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {reports.map((report) => (
                  <div
                    key={report.reportId}
                    className="border border-gray-100 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                        <p className="text-base font-semibold text-gray-900">
                          Reason: {report.reason}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-600'
                            : report.status === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {report.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      Submitted on {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

