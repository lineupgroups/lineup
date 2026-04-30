import React, { memo, useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Heart, Star, Target } from 'lucide-react';
import { UserStats } from '../../types/user';

interface UserStatsCardProps {
  stats?: UserStats;
  className?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const UserStatsCard: React.FC<UserStatsCardProps> = memo(({ stats, className = '', onFollowersClick, onFollowingClick }) => {
  const formatCurrency = useMemo(() => (amount: number | undefined) => {
    const safeAmount = amount || 0;
    if (safeAmount >= 100000) {
      return `₹${(safeAmount / 100000).toFixed(1)}L`;
    } else if (safeAmount >= 1000) {
      return `₹${(safeAmount / 1000).toFixed(1)}K`;
    }
    return `₹${safeAmount}`;
  }, []);

  const formatNumber = useMemo(() => (num: number | undefined) => {
    const safeNum = num || 0;
    if (safeNum >= 1000000) {
      return `${(safeNum / 1000000).toFixed(1)}M`;
    } else if (safeNum >= 1000) {
      return `${(safeNum / 1000).toFixed(1)}K`;
    }
    return safeNum.toString();
  }, []);

  const statItems = useMemo(() => [
    {
      label: 'Projects Launched',
      value: formatNumber(stats?.projectsCreated),
      icon: <Target className="w-4 h-4" />,
      color: 'text-brand-acid',
      bgColor: 'bg-brand-acid/10',
      borderColor: 'border-brand-acid/20'
    },
    {
      label: 'Backers Helped',
      value: formatNumber(stats?.followersCount),
      icon: <Users className="w-4 h-4" />,
      color: 'text-brand-orange',
      bgColor: 'bg-brand-orange/10',
      borderColor: 'border-brand-orange/20'
    },
    {
      label: 'Total Impact',
      value: formatCurrency(stats?.totalRaised),
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-brand-acid',
      bgColor: 'bg-brand-acid/10',
      borderColor: 'border-brand-acid/20'
    },
    {
      label: 'Success Rate',
      value: `${(stats?.successRate || 0).toFixed(0)}%`,
      icon: <Star className="w-4 h-4" />,
      color: 'text-brand-orange',
      bgColor: 'bg-brand-orange/10',
      borderColor: 'border-brand-orange/20'
    }
  ], [stats, formatCurrency, formatNumber]);

  return (
    <div className={`bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6 sm:p-8 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-acid" />
          Analytics Overview
        </h3>
        <div className="px-3 py-1 bg-neutral-800 rounded-full text-[9px] font-black uppercase tracking-widest text-neutral-500">
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`
              p-5 rounded-2xl border ${item.borderColor} ${item.bgColor} 
              transition-all duration-300 group hover:scale-[1.02]
            `}
          >
            <div className={`${item.color} mb-3 transform group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-black text-brand-white italic tracking-tight">{item.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 leading-tight">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="mt-8 pt-8 border-t border-neutral-800">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={onFollowingClick}
            className="flex items-center justify-between group p-3 hover:bg-neutral-800/50 rounded-xl transition-all"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 group-hover:text-neutral-400">Following</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-brand-white">{formatNumber(stats?.followingCount)}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-acid animate-pulse" />
            </div>
          </button>
          
          <div className="flex items-center justify-between p-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Avg. Project Run</span>
            <span className="text-sm font-black text-brand-white italic">{stats?.averageProjectDuration || 0} DAYS</span>
          </div>
        </div>
      </div>
    </div>
  );
});

UserStatsCard.displayName = 'UserStatsCard';

export default UserStatsCard;

