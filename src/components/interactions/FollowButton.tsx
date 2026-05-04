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
        'inline-flex items-center gap-2 rounded-xl border transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isFollowed
          ? 'bg-brand-acid/10 border-brand-acid/30 text-brand-acid shadow-[0_0_10px_rgba(204,255,0,0.1)]'
          : 'bg-white/5 border-neutral-700 text-neutral-400 hover:bg-white/10 hover:border-neutral-600',
        buttonSizeClasses[size],
        className
      )}
    >
      <Icon
        className={cn(
          sizeClasses[size],
          'transition-all duration-200',
          isFollowed ? 'text-brand-acid' : '',
          isLoading && 'animate-pulse'
        )}
      />
      {showText && (
        <span className={cn(
          'font-bold',
          isFollowed ? 'text-brand-acid' : 'text-neutral-400'
        )}>
          {isFollowed ? 'Following' : 'Follow'}
        </span>
      )}
      {showCount && followCount > 0 && (
        <span className={cn(
          'text-xs px-2 py-1 rounded-full',
          isFollowed ? 'bg-brand-acid/20 text-brand-acid' : 'bg-neutral-800 text-neutral-500'
        )}>
          {followCount}
        </span>
      )}
    </button>
  );
};
