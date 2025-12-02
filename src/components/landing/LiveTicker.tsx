import React, { useEffect, useState } from 'react';
import { TrendingUp, Heart, Rocket, Zap } from 'lucide-react';
import { useRecentActivities, usePlatformSettings } from '../../hooks/useLandingPage';

export default function LiveTicker() {
  const { activities, loading } = useRecentActivities(20, 30000); // Refresh every 30 seconds
  const { settings } = usePlatformSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Don't show if disabled in settings
  if (settings && !settings.showLiveTicker) {
    return null;
  }

  if (loading || !activities || activities.length === 0) {
    return null;
  }

  const currentActivity = activities[currentIndex];

  useEffect(() => {
    if (isPaused) return;

    const speed = settings?.liveTickerSpeed || 5;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, speed * 1000);

    return () => clearInterval(interval);
  }, [activities.length, isPaused, settings]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'support':
        return <Heart className="w-4 h-4" fill="currentColor" />;
      case 'milestone':
        return <TrendingUp className="w-4 h-4" />;
      case 'project_launched':
        return <Rocket className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'support':
        return 'from-pink-500 to-red-500';
      case 'milestone':
        return 'from-green-500 to-emerald-500';
      case 'project_launched':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div
          className="pointer-events-auto bg-white/95 backdrop-blur-lg rounded-full shadow-2xl border border-gray-200 px-6 py-3 hover:scale-105 transition-all duration-300 cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Live
              </span>
            </div>

            {/* Activity Content */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${getColor(currentActivity.type)} text-white flex items-center justify-center shadow-lg`}>
                {getIcon(currentActivity.type)}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {currentActivity.message}
                </p>
              </div>

              {/* Time */}
              <div className="flex-shrink-0 text-xs text-gray-500">
                {formatTime(currentActivity.timestamp)}
              </div>
            </div>

            {/* Progress Dots */}
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
              {activities.slice(0, 5).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex % 5
                      ? 'w-6 bg-gradient-to-r from-orange-500 to-red-500'
                      : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

