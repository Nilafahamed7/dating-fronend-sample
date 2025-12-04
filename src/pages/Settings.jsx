import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// NavBar removed - using GlobalNavBar from App.jsx
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    ageRange: { min: 18, max: 50 },
    distance: 50,
    gender: 'all',
  });
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/login');
    }
  };

  const handlePreferenceChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPreferences({
        ...preferences,
        [parent]: { ...preferences[parent], [child]: value },
      });
    } else {
      setPreferences({ ...preferences, [field]: value });
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      // TODO: Implement preference update API call
      toast.success('Preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-velora-gray pb-24">
      {/* NavBar removed - using GlobalNavBar from App.jsx */}
      <div className="p-4 pt-20 space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-velora-darkGray mb-4">Preferences</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-velora-darkGray mb-2">
                Age Range: {preferences.ageRange.min} - {preferences.ageRange.max}
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Min</label>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={preferences.ageRange.min}
                    onChange={(e) => handlePreferenceChange('ageRange.min', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Max</label>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={preferences.ageRange.max}
                    onChange={(e) => handlePreferenceChange('ageRange.max', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-velora-darkGray mb-2">
                Maximum Distance: {preferences.distance} km
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={preferences.distance}
                onChange={(e) => handlePreferenceChange('distance', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-velora-darkGray mb-2">
                Show Me
              </label>
              <select
                value={preferences.gender}
                onChange={(e) => handlePreferenceChange('gender', e.target.value)}
                className="input-field"
              >
                <option value="all">Everyone</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="other">Others</option>
              </select>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Save Preferences'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-velora-darkGray mb-4">Account</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => navigate('/privacy-settings')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Privacy Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-velora-darkGray mb-4">Legal & Support</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/privacy-policy')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('/terms-conditions')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Terms and Conditions
            </button>
            <button
              type="button"
              onClick={() => navigate('/safety-policy')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Safety Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('/contact-us')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Contact Us
            </button>
            <button
              type="button"
              onClick={() => navigate('/support')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

