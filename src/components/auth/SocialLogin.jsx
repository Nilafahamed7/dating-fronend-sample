import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SocialLogin() {
  const [loading, setLoading] = useState({ google: false, facebook: false });
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [googleClientId, setGoogleClientId] = useState(null);
  const [facebookAppId, setFacebookAppId] = useState(null);

  useEffect(() => {
    // Load Google Identity Services
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && googleClientId !== 'your-google-client-id-here') {
      setGoogleClientId(googleClientId);
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Load Facebook SDK
    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (facebookAppId && facebookAppId !== 'your-facebook-app-id-here') {
      setFacebookAppId(facebookAppId);
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      if (!googleClientId) {
        toast.error('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in .env file');
        return;
      }

      setLoading(prev => ({ ...prev, google: true }));

      // Wait for Google Identity Services to load
      await new Promise((resolve) => {
        if (window.google) {
          resolve();
        } else {
          const checkGoogle = setInterval(() => {
            if (window.google) {
              clearInterval(checkGoogle);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkGoogle);
            resolve();
          }, 5000);
        }
      });

      if (!window.google) {
        toast.error('Failed to load Google Sign-In. Please refresh the page.');
        setLoading(prev => ({ ...prev, google: false }));
        return;
      }

      let callbackFired = false;
      let timeoutId;

      // Set a shorter timeout to reset loading if user cancels (no callback after 5 seconds)
      timeoutId = setTimeout(() => {
        if (!callbackFired) {
          setLoading(prev => ({ ...prev, google: false }));
        }
      }, 5000);

      // Use Google Identity Services
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: async (response) => {
          callbackFired = true;
          clearTimeout(timeoutId);

          try {
            if (response.error) {
              // User cancelled or error occurred
              if (response.error === 'popup_closed_by_user' || response.error === 'access_denied' || response.error === 'popup_blocked') {
                // User cancelled - don't show error, just reset loading
                setLoading(prev => ({ ...prev, google: false }));
                return;
              }
              toast.error('Google login failed: ' + response.error);
              setLoading(prev => ({ ...prev, google: false }));
              return;
            }

            if (!response.access_token) {
              setLoading(prev => ({ ...prev, google: false }));
              return;
            }

            const result = await socialLogin('google', response.access_token);
            if (result.success) {
              // ProtectedRoute will handle redirect based on profile completion
              navigate('/home');
            } else {
              setLoading(prev => ({ ...prev, google: false }));
            }
          } catch (error) {
            const message = error.response?.data?.message || 'Failed to login with Google';
            toast.error(message);
            setLoading(prev => ({ ...prev, google: false }));
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      toast.error('Failed to initialize Google login');
      setLoading(prev => ({ ...prev, google: false }));
    }
  };

  const handleFacebookLogin = async () => {
    try {
      if (!facebookAppId) {
        toast.error('Facebook OAuth not configured. Please set VITE_FACEBOOK_APP_ID in .env file');
        return;
      }

      // Check if we're on HTTPS or localhost (localhost is allowed for development)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecure = window.location.protocol === 'https:' || isLocalhost;

      if (!isSecure && window.location.protocol === 'http:') {
        toast.error('Facebook login requires HTTPS. Please use https://localhost or deploy to a secure server.');
        setLoading(prev => ({ ...prev, facebook: false }));
        return;
      }

      setLoading(prev => ({ ...prev, facebook: true }));

      // Wait for Facebook SDK to load
      await new Promise((resolve) => {
        if (window.FB) {
          resolve();
        } else {
          const checkFB = setInterval(() => {
            if (window.FB) {
              clearInterval(checkFB);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkFB);
            resolve();
          }, 5000);
        }
      });

      if (!window.FB) {
        toast.error('Failed to load Facebook SDK. Please refresh the page.');
        setLoading(prev => ({ ...prev, facebook: false }));
        return;
      }

      let callbackFired = false;
      let timeoutId;

      // Set a shorter timeout to reset loading if user cancels (no callback after 5 seconds)
      timeoutId = setTimeout(() => {
        if (!callbackFired) {
          setLoading(prev => ({ ...prev, facebook: false }));
        }
      }, 5000);

      // Use Facebook Login - callback must be a regular function, not async
      window.FB.login((response) => {
        callbackFired = true;
        clearTimeout(timeoutId);

        // Handle the async operations inside the callback
        (async () => {
          try {
            if (response.authResponse) {
              const accessToken = response.authResponse.accessToken;
              if (!accessToken) {
                setLoading(prev => ({ ...prev, facebook: false }));
                return;
              }

              const result = await socialLogin('facebook', accessToken);
              if (result.success) {
                navigate('/home');
              } else {
                setLoading(prev => ({ ...prev, facebook: false }));
              }
            } else {
              // User cancelled or declined permissions
              // Check if it's a cancellation (status will be 'unknown' or not 'connected')
              if (response.status === 'unknown' || !response.authResponse) {
                // User cancelled - silently reset loading, don't show error
                setLoading(prev => ({ ...prev, facebook: false }));
                return;
              }
              // Other error - show message
              toast.error('Facebook login cancelled or failed');
              setLoading(prev => ({ ...prev, facebook: false }));
            }
          } catch (error) {
            const message = error.response?.data?.message || 'Failed to login with Facebook';
            toast.error(message);
            setLoading(prev => ({ ...prev, facebook: false }));
          }
        })();
      }, { scope: 'email,public_profile' });
    } catch (error) {
      toast.error('Failed to initialize Facebook login');
      setLoading(prev => ({ ...prev, facebook: false }));
    }
  };

  // Show message if OAuth is not configured
  if (!googleClientId && !facebookAppId) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          Social login not configured. Add OAuth credentials to .env file.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className={`grid gap-2 sm:gap-3 ${googleClientId && facebookAppId ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {googleClientId && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading.google}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading.google ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">Google</span>
              </>
            )}
          </button>
        )}

        {facebookAppId && (
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={loading.facebook}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading.facebook ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Facebook</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
