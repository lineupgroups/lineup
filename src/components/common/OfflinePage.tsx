import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Home, Cloud, CloudOff } from 'lucide-react';

interface OfflinePageProps {
    onRetry?: () => void;
    onGoHome?: () => void;
}

/**
 * Offline Page - Beautiful offline indicator in the Lineup theme
 * Automatically detects online status and provides retry functionality
 */
export default function OfflinePage({ onRetry, onGoHome }: OfflinePageProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [retryCount, setRetryCount] = useState(0);

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-refresh when back online
            if (onRetry) {
                setTimeout(() => onRetry(), 500);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [onRetry]);

    const handleRetry = useCallback(async () => {
        setIsChecking(true);
        setRetryCount(prev => prev + 1);

        // Check actual connectivity
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch('/api/health', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);
            setIsOnline(true);
            if (onRetry) onRetry();
        } catch {
            // Try alternative check
            if (navigator.onLine) {
                setIsOnline(true);
                if (onRetry) onRetry();
            } else {
                setIsOnline(false);
            }
        } finally {
            setIsChecking(false);
        }
    }, [onRetry]);

    const handleGoHome = useCallback(() => {
        if (onGoHome) {
            onGoHome();
        } else {
            window.location.href = '/';
        }
    }, [onGoHome]);

    // If back online, show a brief success state
    if (isOnline) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200 animate-in zoom-in duration-300">
                            <Cloud className="w-12 h-12 text-white animate-bounce" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                            Back Online!
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Connection Restored
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You're back online. Refreshing...
                    </p>
                    <div className="flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
                {/* Animated Icon */}
                <div className="relative mb-8">
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-orange-200 animate-ping opacity-20" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-28 h-28 rounded-full border-2 border-orange-300 animate-pulse opacity-30" />
                    </div>

                    {/* Main icon */}
                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-orange-200">
                        <CloudOff className="w-12 h-12 text-white" />
                    </div>

                    {/* Status indicator */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <WifiOff className="w-3 h-3" />
                        Offline
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    You're Offline
                </h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    It looks like you've lost your internet connection.
                    Check your network and try again.
                </p>

                {/* Retry count indicator */}
                {retryCount > 0 && (
                    <p className="text-sm text-gray-500 mb-4">
                        Retry attempts: {retryCount}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleRetry}
                        disabled={isChecking}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
                    >
                        <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
                        {isChecking ? 'Checking...' : 'Try Again'}
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </button>
                </div>

                {/* Tips */}
                <div className="mt-10 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                        Troubleshooting Tips
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Check if your WiFi or mobile data is turned on
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Try moving closer to your router
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Restart your browser or device
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Wait a moment and try again
                        </li>
                    </ul>
                </div>

                {/* Branding */}
                <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                    <span className="text-2xl">🚀</span>
                    <span className="text-sm font-medium">Lineup</span>
                </div>
            </div>
        </div>
    );
}
