import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ProjectImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  onError?: () => void;
}

export const ProjectImage: React.FC<ProjectImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Generate fallback based on title
  const generateFallback = () => {
    if (!fallbackTitle) return null;
    
    // Generate a color based on title hash
    const hash = fallbackTitle.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-pink-400 to-pink-600',
      'from-teal-400 to-teal-600'
    ];
    
    const colorClass = colors[Math.abs(hash) % colors.length];
    
    return (
      <div className={`bg-gradient-to-br ${colorClass} flex items-center justify-center text-white ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-75" />
          <div className="text-sm font-medium line-clamp-2">
            {fallbackTitle}
          </div>
        </div>
      </div>
    );
  };

  if (hasError) {
    return generateFallback() || (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export default ProjectImage;
