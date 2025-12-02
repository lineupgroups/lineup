import React from 'react';
import { AlertTriangle, Home, RefreshCw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';

interface ProfileErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const ProfileErrorFallback: React.FC<ProfileErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
    const navigate = useNavigate();
    const [user] = useAuthState(auth);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Unable to Load Profile
                </h2>

                <p className="text-gray-600 mb-6">
                    We couldn't load this profile right now. It might be deleted, private, or temporarily unavailable.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg text-left">
                        <p className="text-xs font-mono text-gray-500 break-all">
                            Error: {error.message}
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={resetErrorBoundary}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </button>

                        {user && (
                            <button
                                onClick={() => navigate(`/profile/${user.uid}`)}
                                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                <User className="w-4 h-4" />
                                My Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileErrorFallback;
