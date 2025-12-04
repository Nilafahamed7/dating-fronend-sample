/**
 * Utility to dynamically update navbar height CSS variables
 * Tracks both top and bottom navbar heights
 */
export const updateNavbarHeight = () => {
  // Update top navbar height
  const topNavbar = document.querySelector('nav.fixed.top-0, nav[class*="fixed"][class*="top-0"]');
  if (topNavbar) {
    const topHeight = topNavbar.offsetHeight;
    document.documentElement.style.setProperty('--navbar-height', `${topHeight}px`);
  }

  // Update bottom navbar height
  const bottomNavbar = document.querySelector('nav.fixed.bottom-0, nav[class*="fixed"][class*="bottom-0"]');
  if (bottomNavbar) {
    const bottomHeight = bottomNavbar.offsetHeight;
    document.documentElement.style.setProperty('--bottom-nav-height', `${bottomHeight}px`);
  }

  return {
    top: topNavbar ? topNavbar.offsetHeight : null,
    bottom: bottomNavbar ? bottomNavbar.offsetHeight : null,
  };
};

/**
 * Initialize navbar height on load and resize
 */
export const initNavbarHeight = () => {
  // Update on load
  updateNavbarHeight();

  // Update on resize (debounced)
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateNavbarHeight();
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  // Also update when DOM changes (for dynamic navbars)
  const observer = new MutationObserver(() => {
    updateNavbarHeight();
  });

  // Observe body for navbar changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    observer.disconnect();
  };
};

