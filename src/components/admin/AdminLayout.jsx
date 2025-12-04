import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_NAV_ITEMS } from './navConfig';

export default function AdminLayout({
  title,
  subtitle,
  selectedNavKey = 'dashboard',
  onNavSelect,
  headerActions,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (item) => {
    if (item.mode === 'route' && item.path) {
      navigate(item.path);
      setSidebarOpen(false);
      return;
    }

    if (item.mode === 'internal') {
      if (onNavSelect) {
        onNavSelect(item.key);
        setSidebarOpen(false);
      } else if (item.path) {
        navigate(item.path);
        setSidebarOpen(false);
      } else {
        toast('Module coming soon');
      }
      return;
    }

    toast('Module coming soon');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full w-full bg-[#0c0b1a] text-white">
      <div className="px-7 py-8 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff6ec4] to-[#ffe357] flex items-center justify-center text-xl font-bold text-gray-900">
            VA
          </div>
          <div>
            <p className="text-sm uppercase tracking-widest text-white/70">Velora Admin</p>
            <p className="text-2xl font-bold">Control Panel</p>
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain scroll-smooth min-h-0 px-4 py-6 space-y-2"
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = selectedNavKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all ${isActive
                ? 'bg-white/20 text-white shadow-lg shadow-black/10'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 py-6 border-t border-white/10 space-y-3 flex-shrink-0">
        <button
          onClick={() => navigate('/admin/settings')}
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Admin Settings"
        >
          <span className="flex items-center gap-2 font-medium">
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </span>
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-red-500/90 text-white font-semibold hover:bg-red-500 active:bg-red-600 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#0c0b1a]"
          aria-label="Logout from admin panel"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex bg-[#f5f6fb] min-h-screen w-full relative">
      {createPortal(
        <>
          {/* Mobile Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-[10000] w-72 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } flex-shrink-0 shadow-2xl`}
          >
            <SidebarContent isMobile={true} />
          </aside>
        </>,
        document.body
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 w-72 flex-col fixed inset-y-0 left-0 z-30 h-full">
        <SidebarContent isMobile={false} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 w-full relative lg:pl-72">
        <header className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-7 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 w-full max-w-full">
            <div className="flex items-center gap-4 min-w-0 flex-1 max-w-full">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-2xl border border-gray-200 text-gray-700 hover:border-gray-900 lg:hidden transition-colors flex-shrink-0 cursor-pointer active:scale-95"
                aria-label="Open sidebar"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <div className="min-w-0 flex-1 max-w-full">
                {subtitle && (
                  <p className="text-xs lg:text-sm font-semibold text-velora-primary uppercase tracking-[0.3em] mb-1 truncate">
                    {subtitle}
                  </p>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap lg:flex-shrink-0 lg:ml-4">
              <div className="hidden md:flex items-center gap-3 bg-gray-100 rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 flex-shrink-0 max-w-[200px] lg:max-w-none">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                  {user?.name} ({user?.role})
                </span>
              </div>
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-w-0 w-full bg-[#f5f6fb]">
          {children}
        </div>
      </main>
    </div>
  );
}

