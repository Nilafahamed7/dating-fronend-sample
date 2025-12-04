import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
// NavBar removed - using GlobalNavBar from App.jsx
import ProfileLeftSidebar from '../components/sidebar/ProfileLeftSidebar';
import { ShieldCheckIcon, EyeSlashIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function PrivacySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    invisibleMode: false,
    showOnlineStatus: true,
    readReceipts: true,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);

  useEffect(() => {
    loadSettings();
    loadBlockedUsers();
  }, []);

  const loadSettings = async () => {
    // Load privacy settings from API
    // For now, using defaults
  };

  const loadBlockedUsers = async () => {
    // Load blocked users from API
    // For now, empty array
  };

  const handleToggleSetting = async (setting) => {
    if (setting === 'invisibleMode' && !user?.isPremium) {
      toast.error('Invisible mode requires a premium subscription');
      return;
    }

    setSettings({ ...settings, [setting]: !settings[setting] });
    // Save to API
    toast.success('Setting updated');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex">
      <ProfileLeftSidebar isOpen={showLeftSidebar} onClose={() => setShowLeftSidebar(false)} />

      <div className="flex-1 relative z-10 flex flex-col min-w-0">
        {/* NavBar removed - using GlobalNavBar from App.jsx */}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Privacy Settings</h1>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheckIcon className="w-6 h-6 text-velora-primary" />
                  <h2 className="text-xl font-bold text-gray-800">Privacy Controls</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-800">Invisible Mode</p>
                        <p className="text-sm text-gray-500">Browse profiles without being seen</p>
                        {!user?.isPremium && (
                          <p className="text-xs text-velora-primary mt-1">Premium feature</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('invisibleMode')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.invisibleMode ? 'bg-velora-primary' : 'bg-gray-300'
                      } ${!user?.isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!user?.isPremium}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.invisibleMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BellIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-800">Show Online Status</p>
                        <p className="text-sm text-gray-500">Let others see when you're online</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('showOnlineStatus')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.showOnlineStatus ? 'bg-velora-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BellIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-800">Read Receipts</p>
                        <p className="text-sm text-gray-500">Show when messages are read</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('readReceipts')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.readReceipts ? 'bg-velora-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.readReceipts ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Blocked Users</h2>
                {blockedUsers.length === 0 ? (
                  <p className="text-gray-500">No blocked users</p>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <button className="text-sm text-velora-primary hover:underline">Unblock</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

