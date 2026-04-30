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
        return <Twitter className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getSocialColor = (platform: string) => {
    // Return a consistent hover style that fits the brand
    return 'hover:bg-neutral-800 hover:text-brand-acid hover:border-brand-acid/50';
  };

  const formatUrl = (url: string, platform: string) => {
    if (!url) return '';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
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
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {activeSocialLinks.map(([platform, url]) => (
        <a
          key={platform}
          href={formatUrl(url!, platform)}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-neutral-800 
            bg-neutral-900/50 text-neutral-400 transition-all duration-300 
            ${getSocialColor(platform)} group
          `}
          title={`Visit ${platform} profile`}
        >
          <div className="transform group-hover:scale-110 transition-transform">
            {getSocialIcon(platform)}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{platform}</span>
        </a>
      ))}
    </div>
  );
};

export default SocialLinksBar;

