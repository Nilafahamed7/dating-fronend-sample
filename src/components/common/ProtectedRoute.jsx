import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requireProfileCompletion = true }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if profile completion is required and user hasn't completed it
  // Only enforce for NEW users (who just signed up), not existing users logging in
  if (requireProfileCompletion && user && location.pathname !== '/complete-profile') {
    // Only redirect NEW users (who just signed up) to complete profile
    // Check if user just signed up by looking for the flag in localStorage
    const justSignedUp = localStorage.getItem('justSignedUp') === 'true';
    if (justSignedUp && !user.profileCompleted) {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  // If user is on complete-profile but already completed, redirect to home
  if (location.pathname === '/complete-profile' && user && user.profileCompleted) {
    return <Navigate to="/" replace />;
  }

  return children;
}

