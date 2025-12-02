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
        'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLiked
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
        buttonSizeClasses[size],
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          'transition-all duration-200',
          isLiked ? 'fill-current text-red-500' : '',
          isLoading && 'animate-pulse'
        )}
      />
      {showCount && (
        <span className={cn(
          'font-medium',
          isLiked ? 'text-red-600' : 'text-gray-700'
        )}>
          {likeCount}
        </span>
      )}
    </button>
  );
};
