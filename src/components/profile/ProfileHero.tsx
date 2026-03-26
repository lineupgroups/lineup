import React, { useState } from 'react';
import { MapPin, Calendar, Settings, UserPlus, UserMinus, Share2, Mail, BadgeCheck } from 'lucide-react';
import { EnhancedUser } from '../../types/user';
import SocialLinksBar from './SocialLinksBar';
import ReportButton from '../common/ReportButton';
import { sanitizeText, truncateText } from '../../utils/sanitize';

// Expandable Verified Badge Component
const ExpandableVerifiedBadge: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        inline-flex items-center gap-1 flex-shrink-0
        ${isExpanded
          ? 'px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-full'
          : ''
        }
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        cursor-pointer
      `}
      title="KYC Verified Creator"
    >
      {/* Green Tick Icon */}
      <div className={`
        relative flex items-center justify-center
        ${isExpanded ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'}
        transition-all duration-300
      `}>
        <BadgeCheck
          className={`
            w-full h-full text-green-500
            ${isExpanded ? 'fill-green-100' : 'fill-green-50'}
          `}
        />
      </div>

      {/* Expandable Text */}
      <span
        className={`
          text-xs font-semibold text-green-700 whitespace-nowrap
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-w-[100px] opacity-100 ml-0.5' : 'max-w-0 opacity-0'}
        `}
      >
        KYC Verified
      </span>
    </button>
  );
};

interface ProfileHeroProps {
  user: EnhancedUser;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditProfile?: () => void;
  onToggleFollow?: () => void;
  onShare?: () => void;
  followLoading?: boolean;
  className?: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}


const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  isOwnProfile,
  isFollowing = false,
  onEditProfile,
  onToggleFollow,
  onShare,
  followLoading = false,
  className = '',
  onFollowersClick,
  onFollowingClick
}) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getXPProgressPercentage = (currentLevel: number, experiencePoints: number) => {
    const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];

    let currentLevelXP: number;
    let nextLevelXP: number;

    if (currentLevel <= 10) {
      currentLevelXP = levels[currentLevel - 1] || 0;
      nextLevelXP = levels[currentLevel] || (currentLevel - 5) * 1000;
    } else {
      currentLevelXP = (currentLevel - 6) * 1000;
      nextLevelXP = (currentLevel - 5) * 1000;
    }

    const progressXP = experiencePoints - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;

    if (requiredXP <= 0) return 100;
    return Math.min((progressXP / requiredXP) * 100, 100);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Cover/Background */}
      <div
        className="relative w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        style={{ aspectRatio: '16 / 5' }}
      >
        {user.coverImage && (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Content */}
      <div className="px-3 sm:px-6 pb-4 sm:pb-6">
        {/* Avatar Section - overlaps cover */}
        <div className="flex justify-between -mt-12 sm:-mt-16 mb-3">
          <div className="relative">
            {/* Premium Verified Ring - gradient with glow effect */}
            {(user.isVerifiedCreator || user.isCreatorVerified) ? (
              <div className="relative">
                {/* White backdrop circle - makes ring stand out on colorful backgrounds */}
                <div className="absolute inset-0 bg-white rounded-full scale-110" />

                {/* Gradient border ring */}
                <div className="relative p-[4px] bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-full shadow-xl">
                  {/* Inner white ring for clean look */}
                  <div className="p-[3px] bg-white rounded-full">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-gray-100">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-avatar')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-avatar w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold';
                              fallback.textContent = getInitials(user.displayName);
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold">
                          {getInitials(user.displayName)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Non-verified users - standard white border */
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-avatar w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold';
                        fallback.textContent = getInitials(user.displayName);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold">
                    {getInitials(user.displayName)}
                  </div>
                )}
              </div>
            )}

            {/* Level Badge */}
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-md z-10">
              L{user.level}
            </div>
          </div>

          {/* Action Buttons - Desktop Only */}
          <div className="hidden sm:flex items-end gap-2 sm:gap-3">
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onToggleFollow}
                  disabled={followLoading}
                  className={`
                    inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm
                    ${isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                    ${followLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  `}
                >
                  {followLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
                    </>
                  ) : (
                    <>
                      {isFollowing ? (
                        <UserMinus className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>{isFollowing ? 'Following' : 'Follow'}</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={onShare}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Report Button - only show if not own profile */}
            {!isOwnProfile && (
              <ReportButton
                targetType="user"
                targetId={user.id}
                targetName={user.displayName}
              />
            )}
          </div>
        </div>

        {/* User Info - on white background */}
        <div className="space-y-1 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                {user.displayName}
              </h1>
              {/* ✨ Expandable Verified Badge - click to expand */}
              {(user.isVerifiedCreator || user.isCreatorVerified) && (
                <ExpandableVerifiedBadge />
              )}
            </div>
            {user.username && (
              <p className="text-sm sm:text-base text-blue-600 font-medium mt-0.5">@{user.username}</p>
            )}

            {/* Instagram-style Stats */}
            <div className="flex items-center gap-6 mt-4 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-base">{user.stats?.projectsCreated || 0}</span>
                <span className="text-gray-600 text-base">projects</span>
              </div>
              <button
                onClick={onFollowersClick}
                className="group flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                  {user.stats?.followersCount || 0}
                </span>
                <span className="text-gray-600 text-base group-hover:text-blue-600 transition-colors">
                  followers
                </span>
              </button>
              <button
                onClick={onFollowingClick}
                className="group flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                  {user.stats?.followingCount || 0}
                </span>
                <span className="text-gray-600 text-base group-hover:text-blue-600 transition-colors">
                  following
                </span>
              </button>
            </div>

            {user.jobTitle && (
              <p className="text-sm sm:text-base text-gray-600 mt-2">{user.jobTitle}</p>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
            {user.showEmail && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Mobile Only */}
        <div className="flex sm:hidden items-center gap-2 mb-4">
          {isOwnProfile ? (
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button
                onClick={onToggleFollow}
                disabled={followLoading}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm
                  ${isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                  ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {followLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
                  </>
                ) : (
                  <>
                    {isFollowing ? (
                      <UserMinus className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </>
                )}
              </button>
            </>
          )}

          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {/* Report Button - only show if not own profile */}
          {!isOwnProfile && (
            <ReportButton
              targetType="user"
              targetId={user.id}
              targetName={user.displayName}
            />
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mt-4 sm:mt-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {sanitizeText(truncateText(user.bio, 160))}
            </p>
          </div>
        )}

        {/* Description */}
        {user.description && (
          <div className="mt-3 sm:mt-4">
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {sanitizeText(truncateText(user.description, 500))}
            </p>
          </div>
        )}

        {/* Social Links */}
        {Object.values(user.socialLinks).some(link => link) && (
          <div className="mt-4 sm:mt-6">
            <SocialLinksBar socialLinks={user.socialLinks} />
          </div>
        )}

        {/* Experience Points Bar */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Experience Points</span>
            <span className="text-sm text-gray-600">{user.experiencePoints.toLocaleString()} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getXPProgressPercentage(user.level, user.experiencePoints)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Level {user.level}</span>
            <span>Level {user.level + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;


