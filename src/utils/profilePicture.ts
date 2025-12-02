// Utility functions for consistent profile picture handling

export interface ProfilePictureProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getFallbackAvatarUrl = (name: string, size: number = 150): string => {
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=f97316&color=fff&size=${size}`;
};

export const getSizeClasses = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl'
  };
  return sizes[size];
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackText: string) => {
  const target = e.target as HTMLImageElement;
  const parent = target.parentElement;
  
  if (parent && !parent.querySelector('.fallback-avatar')) {
    const fallback = document.createElement('div');
    fallback.className = 'fallback-avatar w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold';
    fallback.textContent = fallbackText;
    parent.appendChild(fallback);
  }
  
  target.style.display = 'none';
};

// Standardized profile picture component props
export const getProfilePictureProps = (user: any, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const displayName = user?.displayName || user?.name || 'User';
  const profileImage = user?.profileImage || user?.photoURL || user?.avatar;
  
  return {
    src: profileImage,
    alt: displayName,
    fallbackText: getInitials(displayName),
    size,
    className: getSizeClasses(size)
  };
};
