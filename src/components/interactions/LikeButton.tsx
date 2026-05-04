import React from 'react';
import { Heart } from 'lucide-react';
import { useProjectLikes } from '../../hooks/useInteractions';
import { cn } from '../../lib/utils';

interface LikeButtonProps {
  projectId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  projectId,
  size = 'md',
  showCount = true,
  className
}) => {
  const { isLiked, likeCount, toggleLike, isLoading } = useProjectLikes(projectId);

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

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLiked
          ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange shadow-[0_0_10px_rgba(255,91,0,0.1)]'
          : 'bg-white/5 border-neutral-700 text-neutral-400 hover:bg-white/10 hover:border-neutral-600',
        buttonSizeClasses[size],
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          'transition-all duration-200',
          isLiked ? 'fill-current text-brand-orange' : '',
          isLoading && 'animate-pulse'
        )}
      />
      {showCount && (
        <span className={cn(
          'font-bold',
          isLiked ? 'text-brand-orange' : 'text-neutral-400'
        )}>
          {likeCount}
        </span>
      )}
    </button>
  );
};
