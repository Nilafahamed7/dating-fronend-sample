import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  SparklesIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  HeartIcon,
  GiftIcon,
  QuestionMarkCircleIcon,
  CubeIcon,
  UserGroupIcon,
  BellAlertIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';

const MASTER_TYPES = {
  interest: {
    label: 'Interest',
    icon: SparklesIcon,
    helper: 'Control the interests available for users while editing their profiles.',
    gradient: 'from-pink-50 to-white',
  },
  language: {
    label: 'Language',
    icon: GlobeAltIcon,
    helper: 'List the supported languages that appear inside the app.',
    gradient: 'from-sky-50 to-white',
  },
  religion: {
    label: 'Religion',
    icon: BuildingLibraryIcon,
    helper: 'Maintain religion tags that members can filter by.',
    gradient: 'from-violet-50 to-white',
  },
  relation_goal: {
    label: 'Relation Goal',
    icon: HeartIcon,
    helper: 'Define the relationship goals shown on profile cards.',
    gradient: 'from-rose-50 to-white',
  },
  gift: {
    label: 'Gift',
    icon: GiftIcon,
    helper: 'Configure virtual gifts and experiences.',
    gradient: 'from-amber-50 to-white',
  },
  faq: {
    label: 'FAQ',
    icon: QuestionMarkCircleIcon,
    helper: 'Manage frequently asked questions for the help centre.',
    gradient: 'from-lime-50 to-white',
  },
  package: {
    label: 'Package',
    icon: CubeIcon,
    helper: 'Create curated onboarding / concierge packages.',
    gradient: 'from-indigo-50 to-white',
  },
};

const REPORT_CARD_CONFIG = [
  { key: 'interest', label: 'Interest', icon: SparklesIcon, source: 'master' },
  { key: 'language', label: 'Language', icon: GlobeAltIcon, source: 'master' },
  { key: 'religion', label: 'Religion', icon: BuildingLibraryIcon, source: 'master' },
  { key: 'relation_goal', label: 'Relation Goal', icon: HeartIcon, source: 'master' },
  { key: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon, source: 'master' },
  { key: 'package', label: 'Total Package', icon: CubeIcon, source: 'master' },
  { key: 'gift', label: 'Total Gift', icon: GiftIcon, source: 'master' },
  { key: 'totalUsers', label: 'Total Users', icon: UserGroupIcon, source: 'overview', path: 'totalUsers' },
  { key: 'activeToday', label: 'Active Today', icon: SparklesIcon, source: 'overview', path: 'activeToday' },
  { key: 'totalReports', label: 'Total Reports', icon: ClipboardDocumentListIcon, source: 'reports', path: 'totalReports' },
  { key: 'totalEarning', label: 'Total Earning', icon: CurrencyDollarIcon, source: 'revenue', path: 'totalRevenue', currency: true },
];

export default function AdminDashboard() {
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    overview: {},
    engagement: {},
    revenue: {},
    reports: {},
    system: {},
  });
  const [masterSummary, setMasterSummary] = useState({});
  const [selectedNav, setSelectedNav] = useState('dashboard');
  const [masterItems, setMasterItems] = useState([]);
  const [masterItemsLoading, setMasterItemsLoading] = useState(false);
  const [masterItemsError, setMasterItemsError] = useState(null);
  const [masterSubmitting, setMasterSubmitting] = useState(false);
  const [masterForm, setMasterForm] = useState({ title: '', description: '', icon: '', price: '', packagePrice: '', features: '' });
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [deleteCount, setDeleteCount] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fakeUserCount, setFakeUserCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedNav !== 'dashboard' && selectedNav !== 'fakeGenerator' && MASTER_TYPES[selectedNav]) {
      loadMasterItems(selectedNav);
      loadMasterSummary();
    }
    // Load fake user count when on fake generator page
    if (selectedNav === 'fakeGenerator') {
      loadFakeUserCount();
    }
  }, [selectedNav]);

  const loadFakeUserCount = async () => {
    try {
      const response = await adminService.getFakeUserCount();
      if (response.success) {
        setFakeUserCount(response.count || 0);
      }
    } catch (error) {
      }
  };

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      const [overviewRes, engagementRes, revenueRes, reportsRes, systemRes, summaryRes] = await Promise.all([
        adminService.getDashboardOverview(),
        adminService.getEngagementMetrics(),
        adminService.getRevenueSummary(),
        adminService.getReportsSummary(),
        adminService.getSystemHealth(),
        adminService.getMasterDataSummary(),
      ]);

      setDashboard({
        overview: overviewRes?.overview || overviewRes?.data?.overview || {},
        engagement: engagementRes?.metrics || engagementRes?.data?.metrics || {},
        revenue: revenueRes?.revenue || revenueRes?.data?.revenue || {},
        reports: reportsRes?.summary || reportsRes?.data?.summary || {},
        system: systemRes?.system || systemRes?.data?.system || {},
      });
      setMasterSummary(summaryRes?.summary || {});
    } catch (error) {
      toast.error('Failed to load dashboard');
      } finally {
      setDashboardLoading(false);
    }
  };

  const loadMasterSummary = async () => {
    try {
      const response = await adminService.getMasterDataSummary();
      setMasterSummary(response?.summary || {});
    } catch (error) {
      }
  };

  const loadMasterItems = async (type) => {
    try {
      setMasterItemsLoading(true);
      setMasterItemsError(null);
      const response = await adminService.getMasterDataItems(type);
      const items = response?.items || response?.data?.items || [];
      // Ensure we have a valid array and remove duplicates by _id
      const uniqueItems = Array.isArray(items)
        ? Array.from(new Map(items.map(item => [item._id?.toString() || item.id?.toString(), item])).values())
        : [];
      setMasterItems(uniqueItems);
    } catch (error) {
      setMasterItemsError(error);
      toast.error('Unable to load records');
      setMasterItems([]);
    } finally {
      setMasterItemsLoading(false);
    }
  };

  const handleMasterSubmit = async (event) => {
    event.preventDefault();
    if (!MASTER_TYPES[selectedNav]) {
      return;
    }
    if (!masterForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Validate price for gifts
    if (selectedNav === 'gift') {
      if (!masterForm.price || parseInt(masterForm.price) <= 0) {
        toast.error('Price is required for gifts and must be greater than 0');
        return;
      }
    }

    // Validate price for packages (optional but if provided must be valid)
    if (selectedNav === 'package' && masterForm.packagePrice) {
      const price = parseInt(masterForm.packagePrice);
      if (isNaN(price) || price < 0) {
        toast.error('Package price must be a valid number');
        return;
      }
    }

    try {
      setMasterSubmitting(true);
      const metadata = {};
      // For gifts, include price in metadata
      if (selectedNav === 'gift' && masterForm.price) {
        const price = parseInt(masterForm.price);
        if (!isNaN(price) && price > 0) {
          metadata.price = price;
        }
      }
      // For packages, include price and features in metadata
      if (selectedNav === 'package') {
        if (masterForm.packagePrice) {
          const price = parseInt(masterForm.packagePrice);
          if (!isNaN(price) && price >= 0) {
            metadata.price = price;
          }
        }
        if (masterForm.features) {
          // Split features by comma or newline
          const featuresList = masterForm.features
            .split(/[,\n]/)
            .map(f => f.trim())
            .filter(f => f.length > 0);
          if (featuresList.length > 0) {
            metadata.features = featuresList;
          }
        }
      }

      const response = await adminService.createMasterDataItem({
        type: selectedNav,
        title: masterForm.title.trim(),
        description: masterForm.description.trim() || undefined,
        icon: masterForm.icon.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      if (response?.success || response?.item) {
        toast.success(`${MASTER_TYPES[selectedNav].label} added`);
        setMasterForm({ title: '', description: '', icon: '', price: '', packagePrice: '', features: '' });

        // Reload items and summary
        try {
          await Promise.all([
            loadMasterItems(selectedNav),
            loadMasterSummary()
          ]);
        } catch (reloadError) {
          // Don't show error to user, data will refresh on next page load
        }
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to add item';
      toast.error(message);
    } finally {
      setMasterSubmitting(false);
    }
  };

  const handleMasterDelete = async (id) => {
    if (!id) return;
    const confirmDelete = window.confirm('Delete this record permanently?');
    if (!confirmDelete) return;

    try {
      const response = await adminService.deleteMasterDataItem(id);
      if (response?.success || response) {
        toast.success('Deleted successfully');
        // Reload items and summary
        try {
          await Promise.all([
            loadMasterItems(selectedNav),
            loadMasterSummary()
          ]);
        } catch (reloadError) {
          // Still show success, data will refresh on next page load
        }
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete';
      toast.error(message);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await adminService.updateMasterDataItem(item._id, { isActive: !item.isActive });
      await loadMasterItems(selectedNav);
      await loadMasterSummary();
    } catch (error) {
      toast.error('Unable to update status');
    }
  };

  const handleGenerateFakeUsers = async () => {
    if (generateCount < 1 || generateCount > 100) {
      toast.error('Count must be between 1 and 100');
      return;
    }

    try {
      setGenerating(true);
      const response = await adminService.generateFakeUsers(generateCount);
      if (response.success) {
        toast.success(`Successfully generated ${response.count} fake user(s)`);
        setGenerateCount(10);
        // Reload dashboard to update user counts
        await loadDashboard();
        await loadFakeUserCount();
      } else {
        throw new Error(response.message || 'Failed to generate users');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to generate fake users');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteFakeUsers = async () => {
    if (deleteCount < 1 || deleteCount > fakeUserCount) {
      toast.error(`Count must be between 1 and ${fakeUserCount}`);
      return;
    }

    try {
      setDeleting(true);
      const response = await adminService.deleteFakeUsers(deleteCount);
      if (response.success) {
        toast.success(`Successfully deleted ${response.deletedCount} fake user(s)`);
        setDeleteCount(10);
        setShowDeleteModal(false);
        // Reload dashboard to update user counts
        await loadDashboard();
        await loadFakeUserCount();
      } else {
        throw new Error(response.message || 'Failed to delete users');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete fake users');
    } finally {
      setDeleting(false);
    }
  };

  const cardData = useMemo(() => {
    const { overview, engagement, revenue, reports, system } = dashboard;
    return [
      { label: 'Total Users', value: overview.totalUsers, badge: 'Users', icon: UserGroupIcon, accent: 'text-fuchsia-600', bg: 'from-fuchsia-50 to-white' },
      { label: 'Active Today', value: overview.activeToday, badge: 'Active', icon: SparklesIcon, accent: 'text-amber-500', bg: 'from-amber-50 to-white' },
      { label: 'Premium Users', value: overview.premiumUsers, badge: 'Premium', icon: GiftIcon, accent: 'text-emerald-600', bg: 'from-emerald-50 to-white' },
      { label: 'Pending Reports', value: overview.reportsPending ?? reports.pending, badge: 'Reports', icon: BellAlertIcon, accent: 'text-red-500', bg: 'from-rose-50 to-white' },
      { label: 'Matches', value: engagement.totalMatches, badge: 'Social', icon: HeartIcon, accent: 'text-pink-500', bg: 'from-pink-50 to-white' },
      { label: 'Messages', value: engagement.messagesSent, badge: 'Chats', icon: ChatBubbleLeftRightIcon, accent: 'text-indigo-500', bg: 'from-indigo-50 to-white' },
      { label: 'Revenue', value: revenue.totalRevenue, badge: 'INR', icon: CurrencyDollarIcon, accent: 'text-green-600', bg: 'from-green-50 to-white', isCurrency: true, currencySymbol: '₹' },
      { label: 'Subscriptions', value: revenue.subscriptions, badge: 'Plans', icon: CubeIcon, accent: 'text-cyan-600', bg: 'from-cyan-50 to-white' },
      { label: 'Resolved Reports', value: reports.resolved, badge: 'Safety', icon: ShieldCheckIcon, accent: 'text-purple-600', bg: 'from-purple-50 to-white' },
      { label: 'Total Reports', value: reports.totalReports, badge: 'Moderation', icon: ClipboardDocumentListIcon, accent: 'text-blue-500', bg: 'from-sky-50 to-white' },
      { label: 'System Uptime', value: system.uptime, badge: 'System', icon: Cog6ToothIcon, accent: 'text-slate-600', bg: 'from-slate-50 to-white', isString: true },
      { label: 'Average Latency', value: system.avgLatency, badge: 'Performance', icon: ChartBarIcon, accent: 'text-orange-500', bg: 'from-orange-50 to-white', isString: true },
    ];
  }, [dashboard]);

  const reportCards = useMemo(() => {
    return REPORT_CARD_CONFIG.map((card) => {
      let value = 0;
      if (card.source === 'master') {
        value = masterSummary[card.key]?.total || 0;
      } else if (card.source === 'overview') {
        value = dashboard.overview[card.path] || 0;
      } else if (card.source === 'revenue') {
        value = dashboard.revenue[card.path] || 0;
      } else if (card.source === 'reports') {
        value = dashboard.reports[card.path] || 0;
      }
      return { ...card, value };
    });
  }, [masterSummary, dashboard]);

  const formatValue = (card) => {
    if (card.isString) {
      return card.value || '--';
    }
    if (card.isCurrency || card.currency) {
      const value = typeof card.value === 'number' ? card.value : parseFloat(card.value || 0);
      const symbol = card.currencySymbol || '₹';
      return `${symbol}${value.toLocaleString()}`;
    }
    if (typeof card.value === 'number') {
      return card.value.toLocaleString();
    }
    return card.value ?? '--';
  };

  const renderDashboardView = () => (
    <section className="p-4 lg:p-8 xl:p-10 space-y-8 lg:space-y-10">
      <div className="bg-white rounded-3xl shadow-sm p-6 lg:p-8">
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-xs lg:text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
            Report Data
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">System Snapshot</h2>
          <p className="text-sm lg:text-base text-gray-500">Live counts for every catalogue and metric you maintain.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 lg:p-6 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest truncate">{card.label}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{formatValue(card)}</p>
                </div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gray-900/5 flex items-center justify-center flex-shrink-0 ml-4">
                  <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-gray-700" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-70`} />
              <div className="relative p-6 lg:p-8 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-purple-600 bg-white/80 px-3 py-1.5 rounded-full">
                    {card.badge}
                  </span>
                  <Icon className={`w-8 h-8 lg:w-10 lg:h-10 ${card.accent}`} />
                </div>
                <div>
                  <p className="text-sm lg:text-base font-medium text-gray-500">{card.label}</p>
                  <p className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">{formatValue(card)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Manage Users', description: 'View and moderate community', action: () => toast('User workspace coming soon') },
              { label: 'Verify Profiles', description: 'Approve pending verifications', action: () => toast('Verification queue coming soon') },
              { label: 'Send Notification', description: 'Broadcast updates to all users', action: () => navigate('/admin/dashboard', { replace: false }) },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-6">Reports Snapshot</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {(dashboard.reports.totalReports || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pending</span>
              <span className="text-xl font-bold text-amber-600">
                {(dashboard.reports.pending || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Resolved</span>
              <span className="text-xl font-bold text-emerald-600">
                {(dashboard.reports.resolved || 0).toLocaleString()}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Top Reasons
              </p>
              <div className="flex flex-wrap gap-2">
                {(dashboard.reports.topReasons || ['Harassment', 'Spam', 'Fake Profile']).map((reason) => (
                  <span
                    key={reason}
                    className="px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Uptime</span>
              <span className="text-xl font-bold text-gray-900">{dashboard.system.uptime || '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Avg Latency</span>
              <span className="text-xl font-bold text-indigo-600">{dashboard.system.avgLatency || '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Error Rate</span>
              <span className="text-xl font-bold text-rose-500">{dashboard.system.errorRate || '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderFakeUserGenerator = () => (
    <section className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
            Fake User Generator
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Generate Test Users</h1>
          <p className="text-sm text-gray-500 mt-2">
            Create fake users with random data for testing purposes. Each user will have a random name, email, phone, location, bio, and interests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Section */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Users to Generate
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                placeholder="Enter number of users (1-100)"
              />
              <p className="mt-2 text-xs text-gray-500">
                You can generate between 1 and 100 users at a time. Each user will be created with:
              </p>
              <ul className="mt-2 text-xs text-gray-500 list-disc list-inside space-y-1">
                <li>Random name, email, and phone number</li>
                <li>Random age (18-45 years)</li>
                <li>Random location (Indian cities)</li>
                <li>Random bio and interests</li>
                <li>Random verification status</li>
                <li>Some users will be marked as premium (30%)</li>
              </ul>
            </div>

            <button
              onClick={handleGenerateFakeUsers}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white rounded-2xl py-4 font-semibold hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Users...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate {generateCount} Fake User{generateCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Section */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Delete Fake Users
                </label>
                <span className="text-sm font-medium text-gray-600">
                  Total: {fakeUserCount} fake users
                </span>
              </div>
              <input
                type="number"
                min="1"
                max={fakeUserCount}
                value={deleteCount}
                onChange={(e) => setDeleteCount(Math.max(1, Math.min(fakeUserCount, parseInt(e.target.value) || 1)))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                placeholder={`Enter number to delete (1-${fakeUserCount})`}
                disabled={fakeUserCount === 0}
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter how many fake users you want to delete. This action cannot be undone.
              </p>
              {fakeUserCount === 0 && (
                <p className="mt-2 text-xs text-red-500 font-medium">
                  No fake users found to delete.
                </p>
              )}
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting || fakeUserCount === 0 || deleteCount < 1 || deleteCount > fakeUserCount}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white rounded-2xl py-4 font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting Users...
                </>
              ) : (
                <>
                  <TrashIcon className="w-5 h-5" />
                  Delete {deleteCount} Fake User{deleteCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-bold text-red-600">{deleteCount}</span> fake user(s)?
              This action cannot be undone and will permanently delete all related data (profiles, matches, messages, etc.).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFakeUsers}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const renderMasterManager = () => {
    const meta = MASTER_TYPES[selectedNav];
    if (!meta) {
      return (
        <section className="p-6 lg:p-10">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-gray-500">Invalid selection. Please select a valid option from the sidebar.</p>
          </div>
        </section>
      );
    }

    return (
      <section className="p-6 lg:p-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-velora-primary uppercase tracking-[0.3em]">
              {meta.label}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Manage {meta.label}</h1>
            <p className="text-sm text-gray-500 mt-2">{meta.helper}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadMasterItems(selectedNav)}
              className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-800 hover:border-gray-900 transition flex items-center gap-2"
            >
              <BoltIcon className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleMasterSubmit} className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Title</label>
              <input
                type="text"
                value={masterForm.title}
                onChange={(e) => setMasterForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={`Add ${meta.label} name`}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={masterForm.description}
                onChange={(e) => setMasterForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional helper text"
                rows={3}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Icon (optional)</label>
              <input
                type="text"
                value={masterForm.icon}
                onChange={(e) => setMasterForm((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="e.g. heart-outline"
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
              />
            </div>
            {selectedNav === 'gift' && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Price (coins) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={masterForm.price}
                  onChange={(e) => setMasterForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g. 50"
                  min="1"
                  required
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                />
                <p className="mt-1 text-xs text-gray-500">Amount of coins users need to pay to send this gift</p>
              </div>
            )}
            {selectedNav === 'package' && (
              <>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Price (optional)</label>
                  <input
                    type="number"
                    value={masterForm.packagePrice}
                    onChange={(e) => setMasterForm((prev) => ({ ...prev, packagePrice: e.target.value }))}
                    placeholder="e.g. 999"
                    min="0"
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                  />
                  <p className="mt-1 text-xs text-gray-500">Package price in your currency</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Features (optional)</label>
                  <textarea
                    value={masterForm.features}
                    onChange={(e) => setMasterForm((prev) => ({ ...prev, features: e.target.value }))}
                    placeholder="Enter features separated by commas or new lines&#10;e.g. Premium access, Unlimited likes, Priority support"
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-velora-primary/60 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">List package features (separate by comma or new line)</p>
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={masterSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-2xl py-3 font-semibold hover:bg-black transition disabled:opacity-60"
            >
              {masterSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  Add {meta.label}
                </>
              )}
            </button>
          </form>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Available {meta.label}</p>
                <h3 className="text-xl font-bold text-gray-900">{masterItems.length} item(s)</h3>
              </div>
            </div>
            {masterItemsError ? (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-red-600 font-semibold">Failed to load {meta.label.toLowerCase()} — retry</p>
                <button
                  type="button"
                  onClick={() => loadMasterItems(selectedNav)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black transition"
                >
                  Retry
                </button>
              </div>
            ) : masterItemsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-3 text-gray-500">Loading {meta.label.toLowerCase()}...</span>
              </div>
            ) : masterItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-gray-500 text-sm">No {meta.label.toLowerCase()} found</p>
                <p className="text-xs text-gray-400">Start adding above to create your first {meta.label.toLowerCase()}.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                {masterItems.map((item) => (
                  <div
                    key={item._id}
                    className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${item.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {item.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    {item.metadata?.price !== undefined && (
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Price: </span>
                        <span className="text-gray-600">₹{item.metadata.price}</span>
                      </div>
                    )}
                    {item.metadata?.features && Array.isArray(item.metadata.features) && item.metadata.features.length > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Features: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.metadata.features.map((feature, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Updated {new Date(item.updatedAt || item.createdAt).toLocaleString()}</span>
                      {item.icon && <span>{item.icon}</span>}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold"
                      >
                        {item.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMasterDelete(item._id)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-red-400 hover:text-red-500 transition flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const title =
    selectedNav === 'dashboard'
      ? 'Admin Dashboard'
      : selectedNav === 'fakeGenerator'
        ? 'Fake User Generator'
        : `${MASTER_TYPES[selectedNav]?.label || 'Catalogue'} Library`;

  const headerActions = (
    <button
      onClick={() => {
        if (selectedNav === 'dashboard') {
          loadDashboard();
        } else if (selectedNav === 'fakeGenerator') {
          // No refresh needed for fake generator
        } else {
          loadMasterItems(selectedNav);
        }
      }}
      type="button"
      className="px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
    >
      Refresh
    </button>
  );

  const content = (() => {
    try {
      if (selectedNav === 'dashboard') {
        return dashboardLoading ? (
          <div className="p-10 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          renderDashboardView()
        );
      } else if (selectedNav === 'fakeGenerator') {
        return renderFakeUserGenerator();
      } else {
        return renderMasterManager();
      }
    } catch (error) {
      return (
        <section className="p-6 lg:p-10">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-red-600 font-semibold">Error rendering content. Please refresh the page.</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        </section>
      );
    }
  })();

  return (
    <AdminLayout
      title={title}
      subtitle={selectedNav === 'dashboard' ? 'Overview' : selectedNav === 'fakeGenerator' ? 'Test Data' : MASTER_TYPES[selectedNav]?.label}
      selectedNavKey={selectedNav}
      onNavSelect={(key) => {
        if (key === 'dashboard' || key === 'fakeGenerator' || MASTER_TYPES[key]) {
          setSelectedNav(key);
        }
      }}
      headerActions={headerActions}
    >
      {content}
    </AdminLayout>
  );
}

