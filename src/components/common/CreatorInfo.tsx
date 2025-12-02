import React from 'react';
import { useCreatorInfo } from '../../hooks/useCreatorInfo';
import { UserProfilePicture } from './ProfilePicture';

import { BadgeCheck } from 'lucide-react';

interface CreatorInfoProps {
  creatorId: string;
  size?: 'sm' | 'md' | 'lg';
  showBio?: boolean;
  className?: string;
}

export const CreatorInfo: React.FC<CreatorInfoProps> = ({
  creatorId,
  size = 'md',
  showBio = false,
  className = ''
}) => {
  const { creator, isLoading, error } = useCreatorInfo(creatorId);

  const sizeClasses = {
    sm: {
      avatar: 'w-8 h-8 text-xs',
      text: 'text-sm',
      subtext: 'text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      avatar: 'w-10 h-10 text-sm',
      text: 'text-base',
      subtext: 'text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      avatar: 'w-12 h-12 text-base',
      text: 'text-lg',
      subtext: 'text-base',
      icon: 'w-5 h-5'
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`bg-gray-300 rounded-full animate-pulse ${sizeClasses[size].avatar}`}></div>
        <div>
          <div className={`h-4 bg-gray-300 rounded w-20 mb-1 animate-pulse`}></div>
          <div className={`h-3 bg-gray-300 rounded w-16 animate-pulse`}></div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`bg-gray-400 rounded-full flex items-center justify-center text-white font-medium ${sizeClasses[size].avatar}`}>
          ?
        </div>
        <div>
          <p className={`font-medium text-gray-900 ${sizeClasses[size].text}`}>Unknown Creator</p>
          <p className={`text-gray-500 ${sizeClasses[size].subtext}`}>Creator unavailable</p>
        </div>
      </div>
    );
  }



  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <UserProfilePicture
        user={creator}
        size={size}
        className={sizeClasses[size].avatar}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className={`font-medium text-gray-900 truncate ${sizeClasses[size].text}`}>
            {creator.displayName}
          </p>
          {creator.isVerifiedCreator && (
            <BadgeCheck className={`${sizeClasses[size].icon} text-green-500 fill-green-50`} />
          )}
        </div>
        <p className={`text-gray-500 truncate ${sizeClasses[size].subtext}`}>
          {creator.username ? `@${creator.username}` : 'Creator'}
        </p>
        {showBio && creator.bio && (
          <p className={`text-gray-600 mt-1 line-clamp-2 ${sizeClasses[size].subtext}`}>
            {creator.bio}
          </p>
        )}
      </div>
    </div>
  );
};
