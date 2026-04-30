import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Award, Target, Sparkles, Activity } from 'lucide-react';
import { usePlatformStats, usePlatformSettings } from '../../hooks/useLandingPage';

export default function PlatformStatsSection() {
  const { stats, loading: statsLoading } = usePlatformStats();
  const { settings } = usePlatformSettings();
  const [animatedStats, setAnimatedStats] = useState({
    totalProjects: 0,
    totalFunded: 0,
    totalRaised: 0,
    successRate: 0
  });

  // Determine which stats to show (manual or auto-calculated)
  const displayStats = React.useMemo(() => {
    if (!stats) return null;

    if (settings?.statisticsMode === 'manual' && stats.manualStats) {
      return {
        totalProjectsCreated: stats.manualStats.totalProjectsCreated ?? stats.totalProjectsCreated,
        totalProjectsFunded: stats.manualStats.totalProjectsFunded ?? stats.totalProjectsFunded,
        totalAmountRaised: stats.manualStats.totalAmountRaised ?? stats.totalAmountRaised,
        totalSupporters: stats.manualStats.totalSupporters ?? stats.totalSupporters,
        successRate: stats.manualStats.successRate ?? stats.successRate
      };
    }

    return {
      totalProjectsCreated: stats.totalProjectsCreated,
      totalProjectsFunded: stats.totalProjectsFunded,
      totalAmountRaised: stats.totalAmountRaised,
      totalSupporters: stats.totalSupporters,
      successRate: stats.successRate
    };
  }, [stats, settings]);

  // Animate numbers on mount
  useEffect(() => {
    if (!displayStats) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        totalProjects: Math.floor(displayStats.totalProjectsCreated * progress),
        totalFunded: Math.floor(displayStats.totalProjectsFunded * progress),
        totalRaised: Math.floor(displayStats.totalAmountRaised * progress),
        successRate: parseFloat((displayStats.successRate * progress).toFixed(1))
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          totalProjects: displayStats.totalProjectsCreated,
          totalFunded: displayStats.totalProjectsFunded,
          totalRaised: displayStats.totalAmountRaised,
          successRate: displayStats.successRate
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [displayStats]);

  if (settings && !settings.showStatistics) {
    return null;
  }

  if (statsLoading) {
    return (
      <section className="py-24 bg-brand-black border-y border-white/5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 h-48 rounded-[2rem] animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayStats) return null;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statsData = [
    {
      icon: Target,
      value: animatedStats.totalProjects.toLocaleString('en-IN'),
      label: 'Deployments',
      sublabel: 'PROJECTS LAUNCHED',
      accent: 'text-brand-acid',
      glow: 'bg-brand-acid/10'
    },
    {
      icon: Award,
      value: animatedStats.totalFunded.toLocaleString('en-IN'),
      label: 'Magnitudes',
      sublabel: 'SUCCESSFULLY FUNDED',
      accent: 'text-brand-orange',
      glow: 'bg-brand-orange/10'
    },
    {
      icon: DollarSign,
      value: formatCurrency(animatedStats.totalRaised),
      label: 'Capital Flow',
      sublabel: 'TOTAL RAISED',
      accent: 'text-brand-acid',
      glow: 'bg-brand-acid/10'
    },
    {
      icon: TrendingUp,
      value: `${animatedStats.successRate}%`,
      label: 'Velocity',
      sublabel: 'SUCCESS RATE',
      accent: 'text-brand-orange',
      glow: 'bg-brand-orange/10'
    }
  ];

  return (
    <section className="relative py-32 bg-brand-black overflow-hidden border-b border-white/5">
      {/* Background Cinematic Glows */}
      <div className="absolute top-[-20%] left-[10%] w-[40%] h-[40%] bg-brand-acid/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[10%] w-[40%] h-[40%] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 mb-8">
            <Activity className="w-4 h-4 text-brand-acid animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
              Live Platform <span className="text-brand-acid">Telemetry</span>
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-brand-white italic uppercase tracking-tighter mb-6 leading-none">
            ENGINEERING <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-acid to-white">THE FUTURE</span>
          </h2>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium tracking-tight">
            Quantifying the impact of the Idea Nation. Real-time metrics from a growing ecosystem of modern visionaries.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 hover:bg-white/10 transition-all duration-500 overflow-hidden"
              >
                {/* Glow Effect */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.glow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-brand-black border border-white/10 mb-8 group-hover:scale-110 group-hover:border-brand-acid/30 transition-all relative z-10`}>
                  <Icon className={`w-6 h-6 ${stat.accent}`} />
                </div>

                {/* Value */}
                <div className="text-5xl md:text-6xl font-black text-brand-white mb-2 italic uppercase tracking-tighter relative z-10">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="space-y-1 relative z-10">
                  <div className="text-sm font-black text-brand-white italic uppercase tracking-widest">{stat.label}</div>
                  <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{stat.sublabel}</div>
                </div>

                {/* Bottom Bar */}
                <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-transparent via-${stat.accent.split('-')[1]} to-transparent group-hover:w-full transition-all duration-700`}></div>
              </div>
            );
          })}
        </div>

        {/* Real-time Ticker */}
        <div className="mt-20 flex items-center justify-center gap-4 text-neutral-600">
          <div className="w-1.5 h-1.5 bg-brand-acid rounded-full"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">
            SYSTEM CLOCK: {new Date().toLocaleTimeString('en-IN', { hour12: false })} IST • NODE ACTIVE
          </p>
          <div className="w-1.5 h-1.5 bg-brand-acid rounded-full"></div>
        </div>
      </div>
    </section>
  );
}

