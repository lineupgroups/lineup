import { useState, useCallback } from 'react';
import { EnhancedUser } from '../types/user';
import toast from 'react-hot-toast';

export const useProfileSharing = (user?: EnhancedUser) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const profileUrl = user 
    ? (user.username 
       ? `${window.location.origin}/@${user.username}` 
       : `${window.location.origin}/#profile=${user.id}`)
    : '';
  const profileText = user ? `Check out ${user.displayName}'s profile on Lineup` : '';

  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const copyProfileLink = useCallback(async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy profile link:', error);
      toast.error('Failed to copy link');
    }
  }, [profileUrl]);

  const shareViaWebAPI = useCallback(async () => {
    if (!user || !navigator.share) {
      copyProfileLink();
      return;
    }

    try {
      await navigator.share({
        title: `${user.displayName} - Lineup`,
        text: profileText,
        url: profileUrl
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing profile:', error);
        copyProfileLink(); // Fallback to copy
      }
    }
  }, [user, profileText, profileUrl, copyProfileLink]);

  const shareToSocial = useCallback((platform: 'twitter' | 'linkedin' | 'whatsapp') => {
    if (!user) return;

    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(profileText)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${profileText} ${profileUrl}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }, [user, profileText, profileUrl]);

  return {
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    copyProfileLink,
    shareViaWebAPI,
    shareToSocial,
    profileUrl,
    profileText
  };
};
