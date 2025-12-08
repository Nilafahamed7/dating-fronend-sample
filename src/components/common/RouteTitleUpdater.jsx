import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavBarContext } from './GlobalNavBar';

export default function RouteTitleUpdater() {
    const location = useLocation();
    const { setNavbarTitle, setShowBackButton } = useNavBarContext();

    useEffect(() => {
        const path = location.pathname;

        // Root Pages
        if (path === '/' || path === '/home') {
            setNavbarTitle('✨ Discover');
            setShowBackButton(false);
        } else if (path === '/matches') {
            setNavbarTitle('Matches');
            setShowBackButton(false);
        } else if (path === '/chat') {
            setNavbarTitle('Chats');
            setShowBackButton(false);
        } else if (path === '/groups') {
            setNavbarTitle('Groups');
            setShowBackButton(false);
        } else if (path === '/profile') {
            setNavbarTitle('Profile');
            setShowBackButton(false);
        } else if (path === '/utility') {
            setNavbarTitle('Utility');
            setShowBackButton(false);
        }
        // Nested Pages
        else if (path === '/profile/edit') {
            setNavbarTitle('Edit Profile');
            setShowBackButton(true);
        } else if (path === '/safety') {
            setNavbarTitle('Safety Features');
            setShowBackButton(true);
        } else if (path === '/notifications') {
            setNavbarTitle('Notifications');
            setShowBackButton(true);
        } else if (path === '/settings') {
            setNavbarTitle('Settings');
            setShowBackButton(true);
        } else if (path === '/wallet') {
            setNavbarTitle('Wallet');
            setShowBackButton(true); // User requested hide on root, but wallet might be considered root or sub. User said "Utility main page" is root. Wallet is often sub. Let's check user request.
            // User said: "HIDE back button on: ... Utility main page". Wallet is usually accessed from Utility.
            // But user also said "Utility sub-pages" show back button.
            // Let's assume Wallet is a sub-page of Utility for now, or a root page if accessed directly.
            // The user listed "Wallet" in "mainPages" in GlobalNavBar logic I just wrote (copied from existing).
            // Let's stick to the user's specific list for HIDE: Home, Matches, Chat List, Groups list, Profile main page, Utility main page.
            // Wallet isn't explicitly in the HIDE list, so SHOW.
        } else if (path.startsWith('/events')) {
            if (path === '/events') {
                setNavbarTitle('Events');
                setShowBackButton(true); // Events is likely a sub-feature
            } else if (path.includes('/create')) {
                setNavbarTitle('Create Event');
                setShowBackButton(true);
            } else {
                setNavbarTitle('Event Details');
                setShowBackButton(true);
            }
        } else if (path.startsWith('/forums')) {
            if (path === '/forums') {
                setNavbarTitle('Forums');
                setShowBackButton(true);
            } else if (path.includes('/create')) {
                setNavbarTitle('Create Forum');
                setShowBackButton(true);
            } else {
                setNavbarTitle('Forum Details');
                setShowBackButton(true);
            }
        }
        // Dynamic pages (Chat, Group Chat) will override this in their own components
        // But we can set a default here just in case
        else if (path.startsWith('/chat/')) {
            // Don't overwrite if it's already set by the component (optimization?)
            // Actually, this runs on route change, so it runs BEFORE the component mounts/updates.
            // So we set a placeholder here.
            setNavbarTitle('Chat');
            setShowBackButton(true);
        }

    }, [location.pathname, setNavbarTitle, setShowBackButton]);

    return null;
}
