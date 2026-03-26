import { useState, useEffect, memo } from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';

interface RealTimeIndicatorProps {
    lastRefreshed: Date | null;
    isRefreshing?: boolean;
    isConnected?: boolean;
    onRefresh?: () => void;
    className?: string;
}

/**
 * Real-Time Data Indicator
 * Shows connection status and last refresh time with auto-refresh countdown
 */
function RealTimeIndicator({
    lastRefreshed,
    isRefreshing = false,
    isConnected = true,
    onRefresh,
    className = ''
}: RealTimeIndicatorProps) {
    const [timeAgo, setTimeAgo] = useState<string>('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Update time ago every 10 seconds
    useEffect(() => {
        const updateTimeAgo = () => {
            if (!lastRefreshed) {
                setTimeAgo('Never');
                return;
            }

            const seconds = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);

            if (seconds < 10) {
                setTimeAgo('Just now');
            } else if (seconds < 60) {
                setTimeAgo(`${seconds}s ago`);
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                setTimeAgo(`${minutes}m ago`);
            } else {
                const hours = Math.floor(seconds / 3600);
                setTimeAgo(`${hours}h ago`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 10000);
        return () => clearInterval(interval);
    }, [lastRefreshed]);

    // Listen for online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const effectiveConnected = isConnected && isOnline;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
                {isRefreshing ? (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                ) : effectiveConnected ? (
                    <div className="relative flex items-center">
                        <div className="absolute w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
                        <div className="relative w-2 h-2 rounded-full bg-green-500" />
                    </div>
                ) : (
                    <WifiOff className="w-3.5 h-3.5 text-red-500" />
                )}

                <span className={`text-xs font-medium ${isRefreshing
                    ? 'text-blue-600'
                    : effectiveConnected
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                    {isRefreshing ? 'Syncing...' : effectiveConnected ? 'Live' : 'Offline'}
                </span>
            </div>

            {/* Separator */}
            <span className="text-gray-300">•</span>

            {/* Last Updated */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {timeAgo}</span>
            </div>

            {/* Refresh Button */}
            {onRefresh && !isRefreshing && effectiveConnected && (
                <button
                    onClick={onRefresh}
                    className="ml-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Refresh data"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

export default memo(RealTimeIndicator);

/**
 * Compact version for inline use
 */
export const RealTimeIndicatorCompact = memo(function RealTimeIndicatorCompact({
    lastRefreshed,
    isRefreshing = false,
    className = ''
}: Omit<RealTimeIndicatorProps, 'onRefresh' | 'isConnected'>) {
    const [timeAgo, setTimeAgo] = useState<string>('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const updateTimeAgo = () => {
            if (!lastRefreshed) {
                setTimeAgo('--');
                return;
            }

            const seconds = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);

            if (seconds < 30) {
                setTimeAgo('now');
            } else if (seconds < 60) {
                setTimeAgo(`${seconds}s`);
            } else if (seconds < 3600) {
                setTimeAgo(`${Math.floor(seconds / 60)}m`);
            } else {
                setTimeAgo(`${Math.floor(seconds / 3600)}h`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 10000);
        return () => clearInterval(interval);
    }, [lastRefreshed]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isRefreshing) {
        return (
            <span className={`inline-flex items-center gap-1 text-xs text-blue-600 ${className}`}>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing
            </span>
        );
    }

    if (!isOnline) {
        return (
            <span className={`inline-flex items-center gap-1 text-xs text-red-500 ${className}`}>
                <WifiOff className="w-3 h-3" />
                Offline
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1 text-xs text-gray-500 ${className}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {timeAgo}
        </span>
    );
});
