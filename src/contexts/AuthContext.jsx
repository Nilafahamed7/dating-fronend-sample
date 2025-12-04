import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socketService';
import { presenceService } from '../services/presenceService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const userResourceSubscriptionRef = useRef(null);

  // Set up persistent subscription for user resource updates (groups, etc.)
  const setupUserResourceSubscription = (socket, userId) => {
    if (!socket || !userId) return;

    // Clean up existing subscription if any
    if (userResourceSubscriptionRef.current) {
      socket.off('user:resource-update', userResourceSubscriptionRef.current);
    }

    // Create handler for user resource updates
    const handleUserResourceUpdate = (data) => {
      // This will be handled by components that need it (ChatList, etc.)
      // We just ensure the subscription is active
      };

    // Subscribe to user resource updates
    socket.on('user:resource-update', handleUserResourceUpdate);
    userResourceSubscriptionRef.current = handleUserResourceUpdate;

    // Ensure user room is joined
    socket.emit('join-user-room', userId);
  };

  // Set up socket subscription when socket connects
  useEffect(() => {
    const socket = getSocket();
    if (socket && user?._id) {
      const userId = user._id || user.userId || user.id;
      socket.on('connect', () => {
        setupUserResourceSubscription(socket, userId);
      });

      // If already connected, set up immediately
      if (socket.connected) {
        setupUserResourceSubscription(socket, userId);
      }

      return () => {
        if (userResourceSubscriptionRef.current) {
          socket.off('user:resource-update', userResourceSubscriptionRef.current);
        }
      };
    }
  }, [user?._id]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);

        // Set user from stored data first (optimistic update)
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Initialize socket connection if user is logged in
          const userId = parsedUser._id || parsedUser.userId || parsedUser.id;
          if (userId) {
            const socket = initializeSocket(userId);
            // Set up persistent subscription for user resource updates
            if (socket) {
              // Wait for connection before setting up subscription
              if (socket.connected) {
                setupUserResourceSubscription(socket, userId);
              } else {
                socket.once('connect', () => {
                  setupUserResourceSubscription(socket, userId);
                });
              }
            }
          }
        } catch (parseError) {
          }

        // Then try to refresh profile from server (silent update)
        try {
          const profile = await authService.getProfile();
          if (profile.data) {
            setUser(profile.data);
            // Update stored user data
            localStorage.setItem('user', JSON.stringify(profile.data));
          }
        } catch (error) {
          // Only clear auth if it's a 401 (unauthorized) error
          // For other errors (network, server issues), keep using stored data
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          } else {
            // For other errors, log but keep user logged in with stored data
            }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password, options = {}) => {
    const {
      suppressSuccessToast = false,
      suppressErrorToast = false,
      successMessage,
    } = options || {};
    try {
      const response = await authService.login(identifier, password);
      const { token: newToken, user: userData } = response.data || {};

      if (!newToken || !userData) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      // Remove justSignedUp flag for existing users logging in
      localStorage.removeItem('justSignedUp');
      setToken(newToken);
      setUser(userData);

      // Initialize socket connection after login
      const userId = userData._id || userData.userId || userData.id;
      if (userId) {
        const socket = initializeSocket(userId);
        // Set up persistent subscription for user resource updates
        if (socket) {
          setupUserResourceSubscription(socket, userId);
        }
      }

      if (!suppressSuccessToast) {
        const roleLabel = successMessage ?? (userData.role === 'admin' ? 'Admin login successful!' : 'Login successful!');
        toast.success(roleLabel);
      }
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      if (!suppressErrorToast) {
        toast.error(message);
      }
      return { success: false, error: message };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData);
      const { token: newToken, user: newUser } = response.data || {};

      if (newToken && newUser) {
        // Auto-login user after signup
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        // Mark user as just signed up so ProtectedRoute knows to enforce profile completion
        localStorage.setItem('justSignedUp', 'true');
        setToken(newToken);
        setUser(newUser);

        // Initialize socket connection after signup
        const userId = newUser._id || newUser.userId || newUser.id;
        if (userId) {
          const socket = initializeSocket(userId);
          if (socket) {
            setupUserResourceSubscription(socket, userId);
          }
        }

        toast.success('Account created! Please complete your profile.');
        return { success: true, user: newUser, token: newToken };
      }

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyOTP = async (identifier, code, method) => {
    try {
      const response = await authService.verifyOTP(identifier, code, method);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);

      // Initialize socket connection after OTP verification
      const userId = userData._id || userData.userId || userData.id;
      if (userId) {
        const socket = initializeSocket(userId);
        // Set up persistent subscription for user resource updates
        if (socket) {
          setupUserResourceSubscription(socket, userId);
        }
      }

      toast.success('Verification successful!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Set user offline before logout
      try {
        await presenceService.updatePresence(false);
      } catch (presenceError) {
        // Continue with logout even if presence update fails
      }

      // Disconnect socket
      try {
        disconnectSocket();
      } catch (socketError) {
        }

      await authService.logout();
    } catch (error) {
      } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const socialLogin = async (provider, accessToken) => {
    try {
      const response = await authService.socialLogin(provider, accessToken);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      // Set justSignedUp flag only for new users from social login
      if (response.data.isNewUser) {
        localStorage.setItem('justSignedUp', 'true');
      } else {
        localStorage.removeItem('justSignedUp');
      }
      setToken(newToken);
      setUser(userData);

      // Initialize socket connection after social login
      const userId = userData._id || userData.userId || userData.id;
      if (userId) {
        const socket = initializeSocket(userId);
        // Set up persistent subscription for user resource updates
        if (socket) {
          setupUserResourceSubscription(socket, userId);
        }
      }

      toast.success(response.data.isNewUser ? 'Account created successfully!' : 'Login successful!');
      return { success: true, isNewUser: response.data.isNewUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Social login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateUser = (userData) => {
    // Update both state and localStorage to keep them in sync
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Helper to check if user should be treated as premium
  const isPremiumUser = (userData) => {
    if (!userData) return false;
    // Girls get everything free - treat as premium
    if (userData.gender && userData.gender.toLowerCase() === 'female') {
      return true;
    }
    return userData.isPremium;
  };

  // Derived user object with overridden isPremium
  const derivedUser = user ? {
    ...user,
    isPremium: isPremiumUser(user)
  } : null;

  const value = {
    user: derivedUser,
    token,
    loading,
    login,
    signup,
    verifyOTP,
    socialLogin,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
