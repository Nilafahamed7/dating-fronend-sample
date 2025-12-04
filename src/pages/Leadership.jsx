import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { earningsService } from '../services/earningsService';
import { getInitials, formatCoins } from '../utils/helpers';
import CoinIcon from '../components/common/CoinIcon';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageContainer from '../components/common/PageContainer';
import { TrophyIcon, CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Leadership() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topEarners, setTopEarners] = useState([]);
  const [dailyEarnings, setDailyEarnings] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly'); // weekly, monthly, yearly
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Check if user is female - only females can access this page
  useEffect(() => {
    if (user && user.gender !== 'female') {
      toast.error('This page is only available for female users');
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.gender === 'female' && user?._id) {
      loadEarningsData();
    }
  }, [user?._id, period, selectedWeek]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [leaderboardResponse, dailyResponse] = await Promise.all([
        earningsService.getTopEarners(20, period).catch(err => {
          return { success: false, data: { leaderboard: [] } };
        }),
        earningsService.getDailyEarnings(selectedWeek).catch(err => {
          return { success: false, data: null };
        }),
      ]);

      if (leaderboardResponse.success) {
        const leaderboard = leaderboardResponse.data?.leaderboard || [];
        setTopEarners(leaderboard);

        // Calculate user's total earnings from leaderboard
        const userEarnings = leaderboard.find(
          e => e.userId?.toString() === user?._id?.toString()
        );
        if (userEarnings) {
          setTotalEarnings(userEarnings.totalCoins || 0);
        } else if (period === 'weekly' && dailyResponse.success && dailyResponse.data) {
          // If user is not in top 20 and period is weekly, use weekly total
          setTotalEarnings(dailyResponse.data.weeklyTotal || 0);
        } else {
          setTotalEarnings(0);
        }
      }

      if (dailyResponse.success) {
        setDailyEarnings(dailyResponse.data);
        // If user is not in top 20 and period is weekly, use weekly total
        if (period === 'weekly' && !topEarners.find(e => e.userId?.toString() === user?._id?.toString())) {
          setTotalEarnings(dailyResponse.data.weeklyTotal || 0);
        }
      }
    } catch (error) {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadEarningsData();
    toast.success('Earnings data refreshed');
  };

  const getCurrentUserRank = () => {
    if (!user?._id) return null;
    const rank = topEarners.findIndex(
      e => e.userId?.toString() === user?._id?.toString()
    );
    return rank >= 0 ? rank + 1 : null;
  };

  const userRank = getCurrentUserRank();

  if (user?.gender !== 'female') {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">This page is only available for female users.</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-velora-primary to-velora-secondary rounded-xl">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leadership Board</h1>
                <p className="text-sm text-gray-600">Top earners and your earnings breakdown</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* My Total Earnings Card */}
        <div className="bg-gradient-to-br from-velora-primary to-velora-secondary rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">My Total Earnings</p>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold">{formatCoins(totalEarnings)}</p>
                <span className="text-xl font-semibold">coins</span>
              </div>
              {userRank && (
                <p className="text-white/80 text-sm mt-2">
                  Rank #{userRank} in Top {topEarners.length} Earners
                </p>
              )}
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <CoinIcon className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Earnings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-velora-primary" />
                <h2 className="text-lg font-bold text-gray-900">Daily Earnings</h2>
              </div>
              {dailyEarnings?.weekStart && (
                <span className="text-xs text-gray-500">
                  Week of {new Date(dailyEarnings.weekStart).toLocaleDateString()}
                </span>
              )}
            </div>

            {dailyEarnings ? (
              <>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {daysOfWeek.map((day) => {
                    const dayData = dailyEarnings.dailyEarnings?.[day] || { coins: 0, count: 0 };
                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }) === day;
                    return (
                      <div
                        key={day}
                        className={`text-center p-3 rounded-lg ${
                          isToday ? 'bg-velora-primary/10 border-2 border-velora-primary' : 'bg-gray-50'
                        }`}
                      >
                        <p className={`text-xs font-medium mb-1 ${isToday ? 'text-velora-primary' : 'text-gray-500'}`}>
                          {day}
                        </p>
                        <div className="flex items-center justify-center gap-1">
                          <p className={`text-sm font-bold ${isToday ? 'text-velora-primary' : 'text-gray-900'}`}>
                            {formatCoins(dayData.coins || 0)}
                          </p>
                          <span className={`text-xs ${isToday ? 'text-velora-primary' : 'text-gray-600'}`}>coins</span>
                        </div>
                        {dayData.count > 0 && (
                          <p className="text-xs text-gray-400 mt-1">{dayData.count} txns</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Weekly Total</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-velora-primary">
                      {formatCoins(dailyEarnings.weeklyTotal || 0)}
                    </span>
                    <span className="text-sm text-gray-600">coins</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No earnings data available for this week</p>
                <p className="text-xs mt-2">Showing 0 coins for all days</p>
              </div>
            )}
          </div>

          {/* Top Earners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-velora-primary" />
                <h2 className="text-lg font-bold text-gray-900">Top Earners</h2>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-velora-primary"
              >
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>

            {topEarners.length > 0 ? (
              <div className="space-y-3">
                {topEarners.map((earner, index) => {
                  const isCurrentUser = earner.userId?.toString() === user?._id?.toString();
                  return (
                    <div
                      key={earner.userId?.toString() || index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isCurrentUser
                          ? 'bg-velora-primary/10 border-2 border-velora-primary'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {/* Rank */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : index === 1
                            ? 'bg-gray-300 text-gray-700'
                            : index === 2
                            ? 'bg-amber-600 text-white'
                            : isCurrentUser
                            ? 'bg-velora-primary text-black'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>

                      {/* Avatar */}
                      {earner.avatar ? (
                        <img
                          src={earner.avatar}
                          alt={earner.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br from-velora-primary to-velora-secondary flex items-center justify-center text-white text-sm font-semibold ${
                          earner.avatar ? 'hidden' : ''
                        }`}
                      >
                        {getInitials(earner.name || 'U')}
                      </div>

                      {/* Name and Earnings */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isCurrentUser ? 'text-velora-primary' : 'text-gray-900'
                          }`}
                        >
                          {earner.name || 'Unknown'}
                          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {earner.transactionCount || 0} transactions
                        </p>
                      </div>

                      {/* Earnings Amount */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <p
                            className={`text-sm font-bold ${
                              isCurrentUser ? 'text-velora-primary' : 'text-gray-900'
                            }`}
                          >
                            {formatCoins(earner.totalCoins || 0)}
                          </p>
                          <span className={`text-xs ${isCurrentUser ? 'text-velora-primary' : 'text-gray-600'}`}>
                            coins
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No earnings data available</p>
                <p className="text-xs mt-2">Showing 0 coins</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Earnings are calculated from gifts received, photo views, and calls.
            All amounts are displayed in coins. Rankings are updated in real-time.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

