import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
    this.maxRetries = 3;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (in production, send to error tracking service)
    // Store error info for display
    this.setState({ errorInfo });

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      // Reset error state and retry
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    } else {
      // Max retries reached, reload the app
      window.location.reload();
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { retryCount, error } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" style={{
          paddingTop: 'var(--top-navbar-height, 64px)',
          paddingBottom: 'var(--bottom-navbar-height, 60px)',
        }}>
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center space-y-4 border border-gray-100">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-2xl font-bold text-gray-900">Something went wrong</div>
            <p className="text-sm text-gray-500">
              We encountered an unexpected error. {canRetry ? 'You can try again or reload the page.' : 'Please reload the page.'}
            </p>
            {error?.message && process.env.NODE_ENV !== 'production' && (
              <details className="text-left">
                <summary className="text-xs text-gray-400 cursor-pointer mb-2">Error details (dev only)</summary>
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-4 py-2 mt-2 break-words">
                  {error.message}
                </p>
              </details>
            )}
            <div className="flex gap-3 pt-2">
              {canRetry && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="flex-1 rounded-xl bg-velora-primary text-white font-semibold py-3 hover:opacity-90 transition"
                >
                  Try Again ({this.maxRetries - retryCount} left)
                </button>
              )}
              <button
                type="button"
                onClick={this.handleReload}
                className={`${canRetry ? 'flex-1' : 'w-full'} rounded-xl bg-gray-900 text-white font-semibold py-3 hover:bg-black transition`}
              >
                Reload App
              </button>
            </div>
            {process.env.NODE_ENV === 'production' && (
              <p className="text-xs text-gray-400 mt-4">
                If this problem persists, please contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

