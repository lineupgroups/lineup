import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Award, Target, Sparkles } from 'lucide-react';
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

    const duration = 2000; // 2 seconds
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

  // Don't show if disabled in settings
  if (settings && !settings.showStatistics) {
    return null;
  }

  if (statsLoading) {
    return (
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-12 bg-white/20 rounded mb-2 mx-auto w-32"></div>
                <div className="h-4 bg-white/20 rounded mx-auto w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayStats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      // 1 Crore or more
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 Lakh or more
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  };

  const statsData = [
    {
      icon: Target,
      value: animatedStats.totalProjects.toLocaleString('en-IN'),
      label: 'Projects Launched',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Award,
      value: animatedStats.totalFunded.toLocaleString('en-IN'),
      label: 'Successfully Funded',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: DollarSign,
      value: formatCurrency(animatedStats.totalRaised),
      label: 'Total Raised',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-500/10'
    },
    {
      icon: TrendingUp,
      value: `${animatedStats.successRate}%`,
      label: 'Success Rate',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            PLATFORM IMPACT
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Making Dreams Happen, Together
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join thousands of creators and supporters building India's future
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Value */}
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-white/80 font-medium">
                  {stat.label}
                </div>

                {/* Decorative gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-white/70 text-sm">
            Statistics updated in real-time • Last updated: {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>
    </section>
  );
}

