import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, Twitter, Linkedin, MessageCircle, QrCode, Check } from 'lucide-react';
import { EnhancedUser } from '../../types/user';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EnhancedUser;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export default function ProfileShareModal({ isOpen, onClose, user }: ProfileShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const profileUrl = user.username 
    ? `${window.location.origin}/@${user.username}`
    : `${window.location.origin}/#profile=${user.id}`;
  const profileText = `Check out ${user.displayName}'s profile on Lineup`;

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
    
    // Cleanup function to revoke blob URLs
    return () => {
      if (qrCodeUrl && qrCodeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [isOpen, profileUrl, qrCodeUrl]);

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      const qrUrl = await QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.displayName} - Lineup`,
          text: profileText,
          url: profileUrl
        });
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast.error('Failed to share');
        }
      }
    } else {
      copyToClipboard(profileUrl);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(profileText)}&url=${encodeURIComponent(profileUrl)}`;
        window.open(twitterUrl, '_blank');
      }
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
        window.open(linkedinUrl, '_blank');
      }
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${profileText} ${profileUrl}`)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  ];

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${user.username}-lineup-profile-qr.png`;
      link.href = qrCodeUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Share Profile</h2>
            <p className="text-sm text-gray-600">Share {user.displayName}'s profile</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                <p className="text-sm text-gray-600">@{user.username}</p>
              </div>
            </div>
            {user.bio && (
              <p className="text-sm text-gray-700">{user.bio}</p>
            )}
          </div>

          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Link
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono">
                {profileUrl}
              </div>
              <button
                onClick={() => copyToClipboard(profileUrl)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Native Share Button */}
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <button
              onClick={shareViaWebAPI}
              className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          ) : null}

          {/* Social Media Sharing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Share on Social Media
            </label>
            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-lg text-white transition-colors ${option.color}`}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              QR Code
            </label>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              {isGeneratingQR ? (
                <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : qrCodeUrl ? (
                <div className="space-y-3">
                  <img
                    src={qrCodeUrl}
                    alt="Profile QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Download QR Code</span>
                  </button>
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  Failed to generate QR code
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2">
                Scan to visit profile
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Profile Views</span>
              <span className="font-medium text-gray-900">
                {user.stats?.followersCount || 0} followers
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
