import React, { useEffect, useState } from 'react';
import { TrendingUp, Heart, Rocket, Zap, Activity } from 'lucide-react';
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
        return <Heart className="w-4 h-4" />;
      case 'milestone':
        return <TrendingUp className="w-4 h-4" />;
      case 'project_launched':
        return <Rocket className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getAccent = (type: string) => {
    switch (type) {
      case 'support':
        return 'text-brand-orange border-brand-orange/30 bg-brand-orange/10';
      case 'milestone':
        return 'text-brand-acid border-brand-acid/30 bg-brand-acid/10';
      case 'project_launched':
        return 'text-brand-acid border-brand-acid/30 bg-brand-acid/10';
      default:
        return 'text-brand-white border-white/30 bg-white/10';
    }
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'JUST NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
      <div
        className="pointer-events-auto group relative bg-brand-black/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-2 pl-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 hover:border-brand-acid/30 hover:scale-[1.02]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div className="flex items-center justify-between gap-6">
          {/* Live Pulse */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-brand-acid rounded-full shadow-[0_0_10px_rgba(204,255,0,0.8)]"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-brand-acid rounded-full animate-ping"></div>
            </div>
            <span className="text-[10px] font-black text-brand-white uppercase tracking-[0.4em] italic">
              LIVE <span className="text-brand-acid">FEED</span>
            </span>
          </div>

          {/* Activity Stream */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500 ${getAccent(currentActivity.type)}`}>
              {getIcon(currentActivity.type)}
            </div>

            {/* Message Narrative */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-brand-white uppercase tracking-wider italic truncate">
                {currentActivity.message.toUpperCase()}
              </p>
            </div>

            {/* Telemetry Time */}
            <div className="flex-shrink-0 text-[9px] font-black text-neutral-600 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              {formatTime(currentActivity.timestamp)}
            </div>
          </div>

          {/* Registry Progress */}
          <div className="hidden sm:flex items-center gap-1.5 px-4 flex-shrink-0 border-l border-white/10">
            {activities.slice(0, 8).map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === currentIndex % activities.length
                    ? 'w-8 bg-brand-acid shadow-[0_0_10px_rgba(204,255,0,0.5)]'
                    : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* System Control Icon */}
          <div className="p-3 bg-brand-acid text-brand-black rounded-[1.5rem] flex-shrink-0 shadow-lg">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
