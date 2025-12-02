import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  fallback,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access this page. Please sign in to continue.
          </p>
          <AuthModal isOpen={true} onClose={() => { }} initialMode="login" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * CreatorProtectedRoute - Requires KYC verification
 * Protects creator-only routes like dashboard, project creation, etc.
 */
interface CreatorProtectedRouteProps {
  children: React.ReactNode;
}

export function CreatorProtectedRoute({ children }: CreatorProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Must be logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access creator features.
          </p>
          <AuthModal isOpen={true} onClose={() => { }} initialMode="login" />
        </div>
      </div>
    );
  }

  // Must be KYC verified
  if (!user.isCreatorVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">KYC Verification Required</h2>
          <p className="text-gray-600 mb-6">
            You need to complete KYC verification before accessing creator features.
          </p>

          {/* KYC Status */}
          {user.kycStatus === 'not_started' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Complete your KYC verification to unlock creator dashboard and start creating projects.
              </p>
            </div>
          )}

          {user.kycStatus === 'submitted' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Your KYC is under review. We'll notify you once it's approved (typically within 24-48 hours).
              </p>
            </div>
          )}

          {user.kycStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2">
                Your KYC was rejected. {user.kycRejectionReason && `Reason: ${user.kycRejectionReason}`}
              </p>
              <p className="text-xs text-red-700">
                Please resubmit with correct information.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {(user.kycStatus === 'not_started' || user.kycStatus === 'rejected') && (
              <a
                href="/kyc/submit"
                className="inline-block px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-pink-700 transition-colors"
              >
                {user.kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC Verification'}
              </a>
            )}

            {user.kycStatus === 'submitted' && (
              <a
                href="/kyc/status"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View KYC Status
              </a>
            )}

            <a
              href="/"
              className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User is verified, allow access
  return <>{children}</>;
}
