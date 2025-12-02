import React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useProjectFollows } from '../../hooks/useInteractions';
import { cn } from '../../lib/utils';

interface FollowButtonProps {
  projectId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showText?: boolean;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  projectId,
  size = 'md',
  showCount = true,
  showText = true,
  className
}) => {
  const { isFollowed, followCount, toggleFollow, isLoading } = useProjectFollows(projectId);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const Icon = isFollowed ? BellRing : Bell;

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isFollowed
          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
        buttonSizeClasses[size],
        className
      )}
    >
      <Icon
        className={cn(
          sizeClasses[size],
          'transition-all duration-200',
          isFollowed ? 'text-blue-500' : '',
          isLoading && 'animate-pulse'
        )}
      />
      {showText && (
        <span className={cn(
          'font-medium',
          isFollowed ? 'text-blue-600' : 'text-gray-700'
        )}>
          {isFollowed ? 'Following' : 'Follow'}
        </span>
      )}
      {showCount && followCount > 0 && (
        <span className={cn(
          'text-xs px-2 py-1 rounded-full',
          isFollowed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        )}>
          {followCount}
        </span>
      )}
    </button>
  );
};
