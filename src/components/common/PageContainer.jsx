import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * PageContainer - Reusable component that ensures consistent layout, scrolling, and responsive design
 *
 * Features:
 * - Automatic padding for top and bottom navbars
 * - Smooth scrolling with proper overflow handling
 * - Responsive design (mobile + desktop)
 * - Safe area insets for mobile devices
 * - Prevents content from being hidden behind navbars
 */
export default function PageContainer({
  children,
  className = '',
  style = {},
  fullWidth = false,
  maxWidth = '7xl', // Tailwind max-width class
  padding = true,
  hideBottomNav = false, // For pages that don't need bottom nav padding
}) {
  const location = useLocation();

  // Check if we're on an auth page (login/signup) or admin page
  const isAuthRoute = useMemo(() => {
    return location.pathname === '/login' ||
           location.pathname === '/signup' ||
           location.pathname.startsWith('/admin/login');
  }, [location.pathname]);

  const isAdminRoute = useMemo(() => {
    return location.pathname.startsWith('/admin');
  }, [location.pathname]);

  // Calculate padding based on route
  const shouldShowBottomNav = !isAuthRoute && !isAdminRoute && !hideBottomNav;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const mainStyle = {
    flex: '1 1 auto',
    minHeight: 0,
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
    touchAction: 'pan-y',
    overscrollBehavior: 'contain',
    // Navbar padding is handled globally by MainContentWrapper
    // Only add safe area insets for notches
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    paddingLeft: padding ? 'env(safe-area-inset-left, 0px)' : 0,
    paddingRight: padding ? 'env(safe-area-inset-right, 0px)' : 0,
  };

  const contentStyle = {
    width: '100%',
    maxWidth: fullWidth ? '100%' : undefined,
    margin: '0 auto',
    padding: padding ? '1rem' : 0,
  };

  // Apply max-width class if provided
  const maxWidthClass = fullWidth ? '' : `max-w-${maxWidth}`;

  return (
    <div className={`PageContainer ${className}`} style={containerStyle}>
      <main
        className={`scrollable-content ${maxWidthClass} mx-auto w-full flex-1`}
        style={mainStyle}
      >
        <div style={contentStyle} className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

