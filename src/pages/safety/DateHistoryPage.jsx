import { useState, useEffect } from 'react';
import PageContainer from '../../components/common/PageContainer';
import { safetyService } from '../../services/safetyService';
import { CalendarIcon, CheckCircleIcon, ExclamationTriangleIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DateHistoryPage() {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await safetyService.getDateHistory();
      if (response.success) {
        setHistory(response.dateHistory || []);
        setAlerts(response.emergencyAlerts || []);
      }
    } catch (error) {
      toast.error('Failed to load date history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'alert') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
          <ExclamationTriangleIcon className="w-3 h-3" />
          Alert
        </span>
      );
    } else if (status === 'safe') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <CheckCircleIcon className="w-3 h-3" />
          Safe
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
        Pending
      </span>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Date Safety History</h1>
            <p className="text-sm text-gray-500">View your date plans and safety check-ins</p>
          </div>
        </div>

        {/* Date History */}
        {history.length === 0 && alerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No date history</h3>
            <p className="text-sm text-gray-500">Your shared date plans and check-ins will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Plans */}
            {history.map((date) => (
              <div
                key={date.dateId}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Date Plan: {date.dateId}</h3>
                      {getStatusBadge(date.status)}
                    </div>
                    {date.companion && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Companion:</span> {date.companion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {date.location && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">{date.location}</p>
                      </div>
                    </div>
                  )}
                  {date.time && (
                    <div className="flex items-start gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(date.time)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {date.sharedAt && (
                  <p className="text-xs text-gray-500 mb-3">
                    Shared: {formatDate(date.sharedAt)}
                  </p>
                )}

                {date.lastCheckInTime && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Last Check-in</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(date.lastCheckInTime)}</p>
                  </div>
                )}

                {date.trustedContacts && date.trustedContacts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Shared with:</p>
                    <div className="flex flex-wrap gap-2">
                      {date.trustedContacts.map((contact, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {contact.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Emergency Alerts */}
            {alerts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Alerts</h2>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.alertId}
                      className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 mb-1">Emergency Alert</h3>
                          <p className="text-sm text-red-700">{alert.message || 'Emergency alert triggered'}</p>
                        </div>
                      </div>
                      {alert.latitude && alert.longitude && (
                        <p className="text-xs text-red-600 mb-2">
                          Location: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </p>
                      )}
                      <p className="text-xs text-red-600">
                        Triggered: {formatDate(alert.triggeredAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

