import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowTrendingUpIcon,
    ChartBarIcon,
    LockClosedIcon,
    ChevronLeftIcon,
    ChatBubbleLeftIcon,
    HeartIcon,
    EyeIcon,
    UserGroupIcon,
    StarIcon,
    GiftIcon,
    PhoneIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { matchService } from '../services/matchService';
import { subscriptionService } from '../services/subscriptionService';
import { useNavigate } from 'react-router-dom';

// Enhanced SVG Line Chart Component
const GrowthChart = ({ data, color = '#10b981' }) => {
    const height = 200;
    const width = 400;
    const padding = 30;

    // Handle empty data
    if (!data || data.length === 0) {
        return (
            <div className="w-full overflow-hidden">
                <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No data available
                </div>
            </div>
        );
    }

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const minVal = Math.min(...data.map(d => d.value), 0);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
        const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
        return { x, y, value: d.value, label: d.label };
    });

    const pathData = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = points.length > 0
        ? `M ${points[0].x},${height - padding} ${pathData} L ${points[points.length - 1].x},${height - padding} Z`
        : '';

    return (
        <div className="w-full overflow-hidden" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700">Growth Trend</h4>
                <div className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full">
                    <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                    +24%
                </div>
            </div>
            <div className="relative" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', height: 'auto' }} className="overflow-visible" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                        const y = padding + t * (height - padding * 2);
                        const value = maxVal - (t * range);
                        return (
                            <g key={idx}>
                                <line
                                    x1={padding}
                                    y1={y}
                                    x2={width - padding}
                                    y2={y}
                                    stroke="#f3f4f6"
                                    strokeWidth="1"
                                />
                                <text
                                    x={padding - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="text-[10px] fill-gray-400"
                                >
                                    {Math.round(value)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area under curve */}
                    {areaPath && (
                        <motion.path
                            d={areaPath}
                            fill={color}
                            fillOpacity="0.15"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 1 }}
                        />
                    )}

                    {/* Chart Line */}
                    <motion.polyline
                        points={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Data points */}
                    {points.map((point, idx) => (
                        <motion.circle
                            key={idx}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 + idx * 0.1, duration: 0.3 }}
                        />
                    ))}
                </svg>
            </div>
            <div className="flex justify-between mt-3 text-xs text-gray-500 font-medium">
                {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0 || i === points.length - 1).map((point, i) => (
                    <span key={i} className="text-center">{point.label}</span>
                ))}
            </div>
        </div>
    );
};

const KPICard = ({ icon: Icon, label, value, trend, color }) => (
    <motion.div
        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all flex flex-col items-center justify-center text-center min-w-0 group relative overflow-hidden"
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.98 }}
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)' }}
    >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative z-10 w-full">
            <div className={`p-4 rounded-2xl mb-4 ${color} shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-110`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-gray-900 mb-2 block">{value}</span>
            <span className="text-xs text-gray-600 font-bold mb-3 uppercase tracking-wide">{label}</span>
            <span className="text-[10px] font-bold text-green-600 flex items-center justify-center gap-1 bg-green-50 px-3 py-1.5 rounded-full shadow-sm">
                <ArrowTrendingUpIcon className="w-3 h-3" /> {trend}
            </span>
        </div>
    </motion.div>
);

export default function ProgressPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [timeframe, setTimeframe] = useState('30'); // 7, 30, 90
    const [stats, setStats] = useState({
        likesReceived: 0,
        superlikesReceived: 0,
        messagesReceived: 0,
        giftsReceived: 0,
        profileViews: 0,
        searchAppearances: 0,
    });
    const [loading, setLoading] = useState(true);
    const [freeMinutesRemaining, setFreeMinutesRemaining] = useState(0);
    const [freeMinutesTotal, setFreeMinutesTotal] = useState(100); // Default, will be updated based on user type
    const [selectedMetrics, setSelectedMetrics] = useState(['profileViews', 'matches', 'superlikes']);
    const [recentEvents, setRecentEvents] = useState([]);

    // Business Logic: Female users get premium features for this view
    const isPremiumOverride = user?.isPremium || user?.gender === 'female';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const [statsResponse, premiumResponse] = await Promise.all([
                    matchService.getUserStats(),
                    user?.isPremium ? subscriptionService.getPremiumStatus().catch(() => null) : Promise.resolve(null),
                ]);

                if (statsResponse.success) {
                    // Handle both response.data and response.stats structures
                    const statsData = statsResponse.data || statsResponse.stats || {};
                    setStats({
                        likesReceived: statsData.likesReceived || 0,
                        superlikesReceived: statsData.superlikesReceived || 0,
                        messagesReceived: statsData.messagesReceived || 0,
                        giftsReceived: statsData.giftsReceived || 0,
                        profileViews: statsData.profileViews || 0,
                        searchAppearances: statsData.searchAppearances || 0,
                    });
                }

                if (premiumResponse?.success && premiumResponse.active) {
                    const freeMinutes = premiumResponse.freeMinutesRemaining ?? premiumResponse.data?.freeMinutesRemaining ?? user?.freeIncomingMinutesRemaining ?? 0;
                    // For premium males: 50 minutes, for others: 100 minutes (or from API)
                    const isPremiumMale = user?.isPremium && user?.gender?.toLowerCase() === 'male';
                    const defaultTotalMinutes = isPremiumMale ? 50 : 100;
                    const totalMinutes = premiumResponse.freeMinutesTotal ?? premiumResponse.data?.freeMinutesTotal ?? defaultTotalMinutes;
                    setFreeMinutesTotal(totalMinutes);
                    setFreeMinutesRemaining(Math.max(0, Math.min(totalMinutes, freeMinutes)));
                } else if (user?.isPremium) {
                    // For premium males: calculate from premiumCallMinutesUsed (50 mins total)
                    if (user?.gender?.toLowerCase() === 'male') {
                        const premiumCallMinutesUsed = user?.premiumCallMinutesUsed || 0;
                        const freeMinutesRemaining = Math.max(0, 50 - premiumCallMinutesUsed);
                        setFreeMinutesTotal(50);
                        setFreeMinutesRemaining(freeMinutesRemaining);
                    } else if (user?.freeIncomingMinutesRemaining !== undefined) {
                        setFreeMinutesTotal(100);
                        setFreeMinutesRemaining(Math.max(0, Math.min(100, user.freeIncomingMinutesRemaining)));
                    } else {
                        setFreeMinutesTotal(100);
                        setFreeMinutesRemaining(0);
                    }
                } else {
                    setFreeMinutesTotal(100);
                    setFreeMinutesRemaining(0);
                }

                // Mock recent events (in real app, fetch from API)
                setRecentEvents([
                    { type: 'superlike', message: 'Received Super Like from userX', date: '10 Nov' },
                    { type: 'gift', message: 'Gift received', date: '9 Nov' },
                    { type: 'call', message: '5 min call from userY', date: '8 Nov' },
                ]);
            } catch (error) {
                } finally {
                setLoading(false);
            }
        };

        if (isPremiumOverride) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [isPremiumOverride, user]);

    // Generate chart data based on timeframe and stats
    const chartData = useMemo(() => {
        const days = timeframe === '7' ? 7 : timeframe === '90' ? 90 : 30;
        const baseValue = stats.profileViews || 0;
        const data = [];
        const points = Math.max(2, Math.min(7, days)); // At least 2 points, max 7 data points for readability

        for (let i = 0; i < points; i++) {
            const date = new Date();
            const divisor = points > 1 ? points - 1 : 1;
            date.setDate(date.getDate() - (days - Math.floor((i / divisor) * days)));
            const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            // Simulate growth pattern
            const progress = divisor > 0 ? i / divisor : 0;
            const value = Math.floor(baseValue * (0.1 + progress * 0.9));
            data.push({ label: dayLabel, value: Math.max(0, value) });
        }

        // Ensure last point matches actual value
        if (data.length > 0 && baseValue > 0) {
            data[data.length - 1].value = baseValue;
        }

        return data;
    }, [timeframe, stats.profileViews]);

    return (
        <div className="w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden overflow-y-auto" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', minHeight: 0 }}>
            <div className="w-full max-w-full min-w-0 h-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minHeight: 0 }}>
                <div className="p-4 sm:p-6 lg:p-8 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', paddingLeft: 'clamp(1rem, 2vw, 2rem)', paddingRight: 'clamp(1rem, 2vw, 2rem)' }}>
                    {/* Header Section */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-velora-primary/20 to-velora-secondary/20 rounded-xl">
                                    <ChartBarIcon className="w-6 h-6 text-velora-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Profile Growth
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Track your performance and engagement metrics</p>
                                </div>
                                {isPremiumOverride && (
                                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30">
                                        PRO
                                    </span>
                                )}
                            </div>
                            {/* Date Range Selector - Moved to top right on desktop */}
                            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-md w-fit">
                                {['7 Days', '30 Days', '90 Days'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeframe(t.split(' ')[0])}
                                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${timeframe === t.split(' ')[0]
                                            ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isPremiumOverride ? (
                        // UNLOCKED VIEW - Dashboard Layout
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Top Section: KPIs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                <KPICard
                                    icon={EyeIcon}
                                    label="Profile Views"
                                    value={loading ? '...' : (stats.profileViews || 0).toLocaleString()}
                                    trend="+32%"
                                    color="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600"
                                />
                                <KPICard
                                    icon={HeartIcon}
                                    label="Likes Received"
                                    value={loading ? '...' : (stats.likesReceived || 0).toLocaleString()}
                                    trend="+12%"
                                    color="bg-gradient-to-br from-red-50 to-pink-100 text-red-600"
                                />
                                <KPICard
                                    icon={StarIconSolid}
                                    label="Superlikes Received"
                                    value={loading ? '...' : (stats.superlikesReceived || 0).toLocaleString()}
                                    trend="+5%"
                                    color="bg-gradient-to-br from-blue-50 to-cyan-100 text-blue-600"
                                />
                                <KPICard
                                    icon={ChatBubbleLeftIcon}
                                    label="Messages Received"
                                    value={loading ? '...' : (stats.messagesReceived || 0).toLocaleString()}
                                    trend="+8%"
                                    color="bg-gradient-to-br from-green-50 to-emerald-100 text-green-600"
                                />
                                <KPICard
                                    icon={GiftIcon}
                                    label="Gifts Received"
                                    value={loading ? '...' : (stats.giftsReceived || 0).toLocaleString()}
                                    trend="+2%"
                                    color="bg-gradient-to-br from-pink-50 to-rose-100 text-pink-600"
                                />
                                {user?.isPremium && (
                                    <KPICard
                                        icon={PhoneIcon}
                                        label="Call Mins Used"
                                        value={loading ? '...' : `${Math.max(0, freeMinutesTotal - (freeMinutesRemaining || 0))} / ${freeMinutesTotal}`}
                                        trend={`${Math.max(0, freeMinutesRemaining || 0)} left`}
                                        color="bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600"
                                    />
                                )}
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                                {/* Left Column: Chart (2 cols on desktop) */}
                                <div className="lg:col-span-2 space-y-4" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                                    {/* Timeframe Toggle - Mobile/Tablet */}
                                    <div className="flex justify-center w-full lg:hidden">
                                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
                                            {['7 Days', '30 Days', '90 Days'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTimeframe(t.split(' ')[0])}
                                                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${timeframe === t.split(' ')[0]
                                                        ? 'bg-gray-900 text-white shadow-md'
                                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Chart Card */}
                                    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-2xl flex flex-col backdrop-blur-sm relative overflow-hidden" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 50%, #ffffff 100%)' }}>
                                        {/* Decorative gradient overlay */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-velora-primary/5 to-velora-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                        <div className="relative z-10">
                                        <div className="mb-4" style={{ width: '100%', minWidth: 0 }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Select Metrics</h4>
                                                <div className="h-1 w-12 bg-gradient-to-r from-velora-primary to-velora-secondary rounded-full"></div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { key: 'profileViews', label: 'Profile Views' },
                                                    { key: 'matches', label: 'Matches' },
                                                    { key: 'superlikes', label: 'Super Likes' },
                                                    { key: 'gifts', label: 'Gifts' },
                                                    { key: 'calls', label: 'Calls Received' },
                                                ].map((metric) => (
                                                    <label
                                                        key={metric.key}
                                                        className="flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMetrics.includes(metric.key)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedMetrics([...selectedMetrics, metric.key]);
                                                                } else {
                                                                    setSelectedMetrics(selectedMetrics.filter(m => m !== metric.key));
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-velora-primary border-gray-300 rounded focus:ring-velora-primary"
                                                            aria-label={`Toggle ${metric.label} metric`}
                                                        />
                                                        <span className="text-xs text-gray-600">{metric.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-[300px]" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
                                            <GrowthChart data={chartData} />
                                        </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Recent Activity & Progress (1 col on desktop) */}
                                <div className="lg:col-span-1 space-y-4" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                                    {/* Recent Events Feed */}
                                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl backdrop-blur-sm relative overflow-hidden" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)' }}>
                                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -ml-16 -mt-16 opacity-50"></div>
                                        <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <ClockIcon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900">Recent Activity</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {recentEvents.length > 0 ? (
                                                recentEvents.map((event, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 text-xs">
                                                        <span className="text-gray-400 font-medium min-w-[55px] flex-shrink-0">{event.date}</span>
                                                        <span className="flex-1 text-gray-600 leading-relaxed">{event.message}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
                                            )}
                                        </div>
                                        </div>
                                    </div>

                                    {/* Progress Ring / Level Card */}
                                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)' }}>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                                                    <StarIconSolid className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <p className="text-xs text-gray-300 uppercase tracking-wider font-semibold">Current Level</p>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Rising Star</h3>
                                            <p className="text-xs text-gray-400 mb-6">Top 15% of profiles in your area</p>
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="relative w-24 h-24 flex items-center justify-center">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="44"
                                                            stroke="currentColor"
                                                            strokeWidth="6"
                                                            fill="transparent"
                                                            className="text-gray-700"
                                                        />
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="44"
                                                            stroke="#fbbf24"
                                                            strokeWidth="6"
                                                            fill="transparent"
                                                            strokeDasharray={2 * Math.PI * 44}
                                                            strokeDashoffset={2 * Math.PI * 44 * (1 - 0.75)}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <span className="absolute text-xl font-bold">75%</span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-gray-700">
                                                <p className="text-xs text-gray-400 text-center">Keep engaging to level up!</p>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                                        <div className="absolute -top-8 -left-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // PAYWALL VIEW
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 py-12"
                        >
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center relative">
                                <ChartBarIcon className="w-12 h-12 text-gray-400" />
                                <div className="absolute -top-2 -right-2 bg-amber-500 p-2 rounded-full shadow-md">
                                    <LockClosedIcon className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-gray-900">Unlock Profile Insights</h3>
                                <p className="text-base text-gray-500 max-w-md mx-auto">
                                    See who's viewing your profile, track your popularity, and get tips to improve your matches.
                                </p>
                            </div>

                            <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                                {[
                                    'See who viewed your profile',
                                    'Track profile popularity trends',
                                    'Get match improvement tips',
                                    'Compare with top profiles'
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-4 text-gray-700">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/subscriptions')}
                                className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95 text-lg"
                            >
                                Upgrade to Premium
                            </button>

                            <p className="text-sm text-gray-400">
                                Starting at just $9.99/month
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

