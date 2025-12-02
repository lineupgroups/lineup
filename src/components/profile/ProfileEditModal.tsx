import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Briefcase, Link, Globe, Twitter, Linkedin, Github, Instagram, Facebook, Youtube, AlertCircle } from 'lucide-react';
import { EnhancedUser, SocialLinks } from '../../types/user';
import { useProfileEdit } from '../../hooks/useEnhancedUserProfile';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { validateSocialLink, getPlatformLabel } from '../../utils/socialLinkValidation';
import ProfileImageUpload from './ProfileImageUpload';
import CoverImageUpload from './CoverImageUpload';
import UsernameChangeModal from './UsernameChangeModal';

interface ProfileEditModalProps {
  user: EnhancedUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const { updateProfile, updateSocials, isUpdating } = useProfileEdit();
  const { refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    description: user.description || '',
    location: user.location || '',
    jobTitle: user.jobTitle || '',
    isPublic: user.isPublic ?? true,
    showEmail: user.showEmail ?? false,
    showStats: user.showStats ?? true,
    showBackedProjects: user.showBackedProjects ?? true,
    donateAnonymousByDefault: user.donateAnonymousByDefault ?? false,
    profileImage: user.profileImage || '',
    coverImage: user.coverImage || ''
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: user.socialLinks?.twitter || '',
    linkedin: user.socialLinks?.linkedin || '',
    github: user.socialLinks?.github || '',
    instagram: user.socialLinks?.instagram || '',
    facebook: user.socialLinks?.facebook || '',
    youtube: user.socialLinks?.youtube || '',
    website: user.socialLinks?.website || ''
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'privacy'>('basic');
  const [socialLinkErrors, setSocialLinkErrors] = useState<Partial<Record<keyof SocialLinks, string>>>({});
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        description: user.description || '',
        location: user.location || '',
        jobTitle: user.jobTitle || '',
        isPublic: user.isPublic ?? true,
        showEmail: user.showEmail ?? false,
        showStats: user.showStats ?? true,
        showBackedProjects: user.showBackedProjects ?? true,
        donateAnonymousByDefault: user.donateAnonymousByDefault ?? false,
        profileImage: user.profileImage || '',
        coverImage: user.coverImage || ''
      });

      setSocialLinks({
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || '',
        github: user.socialLinks?.github || '',
        instagram: user.socialLinks?.instagram || '',
        facebook: user.socialLinks?.facebook || '',
        youtube: user.socialLinks?.youtube || '',
        website: user.socialLinks?.website || ''
      });
    }
  }, [user]);


  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    // Update the value immediately
    setSocialLinks(prev => ({ ...prev, [platform]: value }));

    // Validate on blur or after a delay (real-time validation can be annoying)
    // For now, we'll validate on blur, so clear the error when typing
    if (socialLinkErrors[platform]) {
      setSocialLinkErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[platform];
        return newErrors;
      });
    }
  };

  const handleSocialLinkBlur = (platform: keyof SocialLinks) => {
    const value = socialLinks[platform];
    if (!value || value.trim() === '') {
      // Clear error if field is empty
      setSocialLinkErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[platform];
        return newErrors;
      });
      return;
    }

    const result = validateSocialLink(platform, value);
    if (!result.isValid) {
      setSocialLinkErrors(prev => ({ ...prev, [platform]: result.error || 'Invalid URL format' }));
    } else {
      // Update with sanitized value
      if (result.sanitized && result.sanitized !== value) {
        setSocialLinks(prev => ({ ...prev, [platform]: result.sanitized! }));
      }
      // Clear error
      setSocialLinkErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[platform];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all social links before submitting
    const errors: Partial<Record<keyof SocialLinks, string>> = {};
    let hasErrors = false;

    Object.entries(socialLinks).forEach(([platform, value]) => {
      if (value && value.trim() !== '') {
        const result = validateSocialLink(platform as keyof SocialLinks, value);
        if (!result.isValid) {
          errors[platform as keyof SocialLinks] = result.error || 'Invalid URL format';
          hasErrors = true;
        } else if (result.sanitized) {
          // Update with sanitized value
          socialLinks[platform as keyof SocialLinks] = result.sanitized;
        }
      }
    });

    if (hasErrors) {
      setSocialLinkErrors(errors);
      toast.error('Please fix the validation errors before saving.');
      setActiveTab('social'); // Switch to social tab to show errors
      return;
    }

    try {
      // Update profile data
      await updateProfile(formData);

      // Update social links
      await updateSocials(socialLinks);

      onSave();
      onClose();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <Link className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'basic', label: 'Basic Info', icon: <User className="w-4 h-4" /> },
            { key: 'social', label: 'Social Links', icon: <Link className="w-4 h-4" /> },
            { key: 'privacy', label: 'Privacy', icon: <Globe className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                flex items-center gap-2 px-6 py-3 font-medium transition-colors duration-200 whitespace-nowrap
                ${activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Cover Image */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Photo
                  </label>
                  <CoverImageUpload
                    currentCover={formData.coverImage}
                    onCoverChange={(url: string) => handleInputChange('coverImage', url)}
                  />
                </div>

                {/* Profile Image */}
                <div className="flex justify-center mb-6">
                  <ProfileImageUpload
                    currentImage={formData.profileImage}
                    onImageChange={(url: string) => handleInputChange('profileImage', url)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Username Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                      @{user.username}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUsernameModalOpen(true)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                      Change
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    You can change your username once every 7 days
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      placeholder="e.g., Product Designer, Entrepreneur"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Mumbai, India"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself in a few words..."
                    rows={3}
                    maxLength={160}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className={`text-xs mt-1 ${formData.bio.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                    {Math.max(0, formData.bio.length)}/160 characters
                    {formData.bio.length > 160 && (
                      <span className="ml-2 text-red-600">({formData.bio.length - 160} over limit)</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide a detailed description of your background, interests, and goals..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className={`text-xs mt-1 ${formData.description.length > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                    {Math.max(0, formData.description.length)}/500 characters
                    {formData.description.length > 500 && (
                      <span className="ml-2 text-red-600">({formData.description.length - 500} over limit)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-6">
                  Add your social media profiles to help others connect with you.
                </p>

                {Object.entries(socialLinks).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      <div className="flex items-center gap-2">
                        {getSocialIcon(platform)}
                        {getPlatformLabel(platform)}
                      </div>
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleSocialLinkChange(platform as keyof SocialLinks, e.target.value)}
                      onBlur={() => handleSocialLinkBlur(platform as keyof SocialLinks)}
                      placeholder={
                        platform === 'twitter' ? '@username or https://twitter.com/username' :
                          platform === 'linkedin' ? 'https://linkedin.com/in/your-profile' :
                            platform === 'github' ? 'username or https://github.com/username' :
                              platform === 'instagram' ? '@username or https://instagram.com/username' :
                                platform === 'facebook' ? 'https://facebook.com/your-profile' :
                                  platform === 'youtube' ? 'https://youtube.com/c/your-channel' :
                                    'https://yourwebsite.com'
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${socialLinkErrors[platform as keyof SocialLinks]
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                        }`}
                    />
                    {socialLinkErrors[platform as keyof SocialLinks] && (
                      <div className="mt-1 flex items-start gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{socialLinkErrors[platform as keyof SocialLinks]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600 mb-6">
                  Control what information is visible to other users.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Public Profile</h4>
                      <p className="text-sm text-gray-600">Make your profile visible to everyone</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Email</h4>
                      <p className="text-sm text-gray-600">Display your email address on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showEmail}
                        onChange={(e) => handleInputChange('showEmail', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Statistics</h4>
                      <p className="text-sm text-gray-600">Display your project and backing statistics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showStats}
                        onChange={(e) => handleInputChange('showStats', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Backed Projects</h4>
                      <p className="text-sm text-gray-600">Display projects you've supported</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showBackedProjects}
                        onChange={(e) => handleInputChange('showBackedProjects', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        Donate Anonymously by Default
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Privacy</span>
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Hide your identity when supporting projects</p>
                      <p className="text-xs text-gray-500 mt-1">You'll appear as "anonymous_user####" to creators and others</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.donateAnonymousByDefault}
                        onChange={(e) => handleInputChange('donateAnonymousByDefault', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Username Change Modal */}
      <UsernameChangeModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        currentUsername={user.username}
        userId={user.id}
        lastChangedAt={user.usernameChangedAt?.toDate() || null}
        onSuccess={async () => {
          // Refresh user data to show updated username everywhere
          await refreshUserData();
          toast.success('Username updated! Refreshing page...');

          // Force page reload to update all components
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }}
      />
    </div>
  );
};

export default ProfileEditModal;

