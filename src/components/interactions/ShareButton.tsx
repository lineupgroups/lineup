import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link, Twitter, Facebook, MessageCircle, Mail, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { sanitizeUrl } from '../../utils/sanitize';

interface ShareButtonProps {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  projectId = '',
  projectTitle = 'Project',
  projectDescription = '',
  size = 'md',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Generate project URL with sanitization
  const sanitizedProjectId = projectId ? encodeURIComponent(projectId.replace(/[^a-zA-Z0-9-_]/g, '')) : '';
  const projectUrl = sanitizeUrl(`${window.location.origin}/project/${sanitizedProjectId}`);
  const encodedUrl = encodeURIComponent(projectUrl);
  const encodedTitle = encodeURIComponent((projectTitle || '').slice(0, 100)); // Limit title length
  const encodedDescription = encodeURIComponent((projectDescription || '').slice(0, 200)); // Limit description

  // Share options
  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Link,
      action: async () => {
        try {
          if (!projectUrl) {
            toast.error('No link available to copy');
            return;
          }
          
          await navigator.clipboard.writeText(projectUrl);
          setCopied(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error('Error copying to clipboard:', error);
          
          try {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = projectUrl || '';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (success) {
              toast.success('Link copied to clipboard!');
            } else {
              toast.error('Failed to copy link');
            }
          } catch (fallbackError) {
            console.error('Clipboard fallback failed:', fallbackError);
            toast.error('Unable to copy link');
          }
        }
        setIsOpen(false);
      },
      color: copied ? 'text-green-600' : 'text-gray-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () => {
        try {
          if (!projectUrl || !projectTitle) {
            toast.error('Missing project information for sharing');
            return;
          }
          const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=Check out this amazing project: ${encodedTitle}`;
          window.open(twitterUrl, '_blank', 'width=600,height=400');
        } catch (error) {
          console.error('Error sharing to Twitter:', error);
          toast.error('Failed to share to Twitter');
        } finally {
          setIsOpen(false);
        }
      },
      color: 'text-blue-500'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () => {
        try {
          if (!projectUrl) {
            toast.error('Missing project URL for sharing');
            return;
          }
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          window.open(facebookUrl, '_blank', 'width=600,height=400');
        } catch (error) {
          console.error('Error sharing to Facebook:', error);
          toast.error('Failed to share to Facebook');
        } finally {
          setIsOpen(false);
        }
      },
      color: 'text-blue-600'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      action: () => {
        try {
          if (!projectUrl || !projectTitle) {
            toast.error('Missing project information for sharing');
            return;
          }
          const whatsappUrl = `https://wa.me/?text=${encodedTitle} - ${encodedUrl}`;
          window.open(whatsappUrl, '_blank');
        } catch (error) {
          console.error('Error sharing to WhatsApp:', error);
          toast.error('Failed to share to WhatsApp');
        } finally {
          setIsOpen(false);
        }
      },
      color: 'text-green-500'
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => {
        try {
          if (!projectUrl || !projectTitle) {
            toast.error('Missing project information for sharing');
            return;
          }
          const emailSubject = `Check out: ${projectTitle || 'this project'}`;
          const emailBody = `I thought you might be interested in this project:\n\n${projectTitle || 'Project'}\n${projectDescription || ''}\n\n${projectUrl}`;
          const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
          window.location.href = emailUrl;
        } catch (error) {
          console.error('Error sharing via email:', error);
          toast.error('Failed to share via email');
        } finally {
          setIsOpen(false);
        }
      },
      color: 'text-gray-600'
    }
  ];

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Share project options"
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
          'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
          'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500',
          buttonSizeClasses[size],
          className
        )}
      >
        <Share2 className={sizeClasses[size]} />
        <span className="font-medium">Share</span>
      </button>

      {isOpen && (
        <div 
          role="menu"
          aria-label="Share options"
          className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1"
        >
          {shareOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                onClick={option.action}
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextButton = e.currentTarget.nextElementSibling as HTMLButtonElement;
                    nextButton?.focus();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevButton = e.currentTarget.previousElementSibling as HTMLButtonElement;
                    prevButton?.focus();
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-150 focus:outline-none focus:bg-gray-50"
              >
                <Icon className={cn('w-4 h-4', option.color)} />
                <span className="text-sm font-medium text-gray-700">
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
