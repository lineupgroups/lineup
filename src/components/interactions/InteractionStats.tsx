import React from 'react';
import { Heart, Bell, Eye } from 'lucide-react';
import { useInteractionCounts } from '../../hooks/useInteractions';
import { cn } from '../../lib/utils';

interface InteractionStatsProps {
  projectId: string;
  viewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const InteractionStats: React.FC<InteractionStatsProps> = ({
  projectId,
  viewCount,
  size = 'md',
  orientation = 'horizontal',
  className
}) => {
  const { counts, isLoading } = useInteractionCounts(projectId);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const stats = [
    {
      icon: Heart,
      count: counts.likes,
      label: 'likes',
      color: 'text-red-500'
    },
    {
      icon: Bell,
      count: counts.follows,
      label: 'followers',
      color: 'text-blue-500'
    }
  ];

  // Add view count if provided
  if (viewCount !== undefined) {
    stats.unshift({
      icon: Eye,
      count: viewCount,
      label: 'views',
      color: 'text-gray-500'
    });
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex gap-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
        className
      )}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={cn('bg-gray-200 rounded animate-pulse', sizeClasses[size])} />
            <div className={cn('bg-gray-200 rounded animate-pulse h-4 w-8', textSizeClasses[size])} />
          </div>
        ))}
      </div>
    );
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={cn(
      'flex gap-4',
      orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
      className
    )}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-1"
            title={`${stat.count} ${stat.label}`}
          >
            <Icon className={cn(sizeClasses[size], stat.color)} />
            <span className={cn(
              'font-medium text-gray-600',
              textSizeClasses[size]
            )}>
              {formatCount(stat.count)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
