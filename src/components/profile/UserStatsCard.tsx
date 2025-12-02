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
      label: 'Projects Created',
      value: formatNumber(stats?.projectsCreated),
      icon: <Target className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Projects Liked',
      value: formatNumber(stats?.projectsLiked),
      icon: <Heart className="w-5 h-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      label: 'Total Raised',
      value: formatCurrency(stats?.totalRaised),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'Total Backed',
      value: formatCurrency(stats?.totalBacked),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Followers',
      value: formatNumber(stats?.followersCount),
      icon: <Users className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      label: 'Success Rate',
      value: `${(stats?.successRate || 0).toFixed(1)}%`,
      icon: <Star className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  ], [stats, formatCurrency, formatNumber]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            onClick={item.label === 'Followers' ? onFollowersClick : undefined}
            className={`
              p-4 rounded-lg border ${item.borderColor} ${item.bgColor} 
              transition-all duration-200 hover:shadow-md
              ${item.label === 'Followers' && onFollowersClick ? 'cursor-pointer hover:scale-105' : ''}
            `}
          >
            <div className={`${item.color} mb-2`}>
              {item.icon}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-600 leading-tight">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div
            onClick={onFollowingClick}
            className={`flex items-center justify-between ${onFollowingClick ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''
              }`}
          >
            <span>Following:</span>
            <span className="font-medium text-gray-900">{formatNumber(stats?.followingCount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Avg. Project Duration:</span>
            <span className="font-medium text-gray-900">{stats?.averageProjectDuration || 0} days</span>
          </div>
        </div>
      </div>
    </div>
  );
});

UserStatsCard.displayName = 'UserStatsCard';

export default UserStatsCard;

