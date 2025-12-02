import React from 'react';
import { ExternalLink, Twitter, Linkedin, Github, Instagram, Facebook, Youtube, Globe } from 'lucide-react';
import { SocialLinks } from '../../types/user';

interface SocialLinksBarProps {
  socialLinks: SocialLinks;
  className?: string;
}

const SocialLinksBar: React.FC<SocialLinksBarProps> = ({ socialLinks, className = '' }) => {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'facebook':
        return <Facebook className="w-5 h-5" />;
      case 'youtube':
        return <Youtube className="w-5 h-5" />;
      case 'website':
        return <Globe className="w-5 h-5" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200';
      case 'linkedin':
        return 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200';
      case 'github':
        return 'hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200';
      case 'instagram':
        return 'hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200';
      case 'facebook':
        return 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200';
      case 'youtube':
        return 'hover:bg-red-50 hover:text-red-600 hover:border-red-200';
      case 'website':
        return 'hover:bg-green-50 hover:text-green-600 hover:border-green-200';
      default:
        return 'hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200';
    }
  };

  const formatUrl = (url: string, platform: string) => {
    if (!url) return '';
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add appropriate prefix based on platform
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/${url.replace('@', '')}`;
      case 'linkedin':
        return url.includes('linkedin.com') ? `https://${url}` : `https://linkedin.com/in/${url}`;
      case 'github':
        return `https://github.com/${url}`;
      case 'instagram':
        return `https://instagram.com/${url.replace('@', '')}`;
      case 'facebook':
        return `https://facebook.com/${url}`;
      case 'youtube':
        return url.includes('youtube.com') ? `https://${url}` : `https://youtube.com/c/${url}`;
      default:
        return url.startsWith('www.') ? `https://${url}` : `https://${url}`;
    }
  };

  const activeSocialLinks = Object.entries(socialLinks).filter(([_, url]) => url && url.trim());

  if (activeSocialLinks.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {activeSocialLinks.map(([platform, url]) => (
        <a
          key={platform}
          href={formatUrl(url!, platform)}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 
            text-gray-600 transition-all duration-200 ${getSocialColor(platform)}
          `}
          title={`Visit ${platform} profile`}
        >
          {getSocialIcon(platform)}
          <span className="text-sm font-medium capitalize">{platform}</span>
        </a>
      ))}
    </div>
  );
};

export default SocialLinksBar;

