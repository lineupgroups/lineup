import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class PageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PageErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-8">
              We encountered an unexpected error while loading this page. This has been logged and we'll work to fix it.
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="text-left mb-8 p-4 bg-gray-50 rounded-lg border">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-3">
                  Technical Details
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-xs text-gray-600">Error:</strong>
                    <code className="block text-xs text-red-600 bg-red-50 p-2 rounded mt-1 break-all">
                      {this.state.error.message}
                    </code>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-xs text-gray-600">Stack Trace:</strong>
                      <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <Link
                to="/"
                className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-orange-500 hover:text-orange-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </Link>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
