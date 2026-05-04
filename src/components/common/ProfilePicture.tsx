import React from 'react';
import { User } from 'lucide-react';
import { getInitials, handleImageError, ProfilePictureProps } from '../../utils/profilePicture';

interface ProfilePictureComponentProps extends ProfilePictureProps {
  showBorder?: boolean;
  borderColor?: string;
}

export default function ProfilePicture({
  src,
  alt,
  className = '',
  fallbackText,
  size = 'md',
  showBorder = false,
  borderColor = 'border-white'
}: ProfilePictureComponentProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 min-w-[1.5rem] min-h-[1.5rem] text-xs',
    sm: 'w-8 h-8 min-w-[2rem] min-h-[2rem] text-sm',
    md: 'w-12 h-12 min-w-[3rem] min-h-[3rem] text-base',
    lg: 'w-16 h-16 min-w-[4rem] min-h-[4rem] text-lg',
    xl: 'w-24 h-24 min-w-[6rem] min-h-[6rem] text-xl'
  };

  const borderClasses = showBorder ? `border-2 ${borderColor}` : '';
  const baseClasses = `rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 aspect-square ${sizeClasses[size]} ${borderClasses} ${className}`;

  if (src) {
    return (
      <div className={baseClasses}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => handleImageError(e, fallbackText || getInitials(alt))}
        />
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-gradient-to-br from-brand-orange to-[#ff7529] text-white font-bold`}>
      {fallbackText || getInitials(alt)}
    </div>
  );
}

// Convenience component for user profile pictures
interface UserProfilePictureProps {
  user: any;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
}

export function UserProfilePicture({
  user,
  size = 'md',
  className = '',
  showBorder = false,
  borderColor = 'border-white'
}: UserProfilePictureProps) {
  const displayName = user?.displayName || user?.name || 'User';
  const profileImage = user?.profileImage || ''; // Only use our profileImage, not photoURL

  // Check for verification
  const isVerified = user?.isVerifiedCreator === true;

  // If verified, override border settings to show brand-acid ring
  const finalShowBorder = isVerified || showBorder;
  const finalBorderColor = isVerified ? 'border-brand-acid ring-2 ring-brand-acid ring-offset-2 ring-offset-brand-black' : borderColor;

  return (
    <ProfilePicture
      src={profileImage}
      alt={displayName}
      fallbackText={getInitials(displayName)}
      size={size}
      className={className}
      showBorder={finalShowBorder}
      borderColor={finalBorderColor}
    />
  );
}
