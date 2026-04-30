import React, { useState } from 'react';
import { MapPin, Calendar, Settings, UserPlus, UserMinus, Share2, Mail, BadgeCheck, Activity, LogOut } from 'lucide-react';
import { EnhancedUser } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import SocialLinksBar from './SocialLinksBar';
import ReportButton from '../common/ReportButton';
import { sanitizeText, truncateText } from '../../utils/sanitize';
import toast from 'react-hot-toast';

// Expandable Verified Badge Component
const ExpandableVerifiedBadge: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        inline-flex items-center gap-1.5 flex-shrink-0
        ${isExpanded
          ? 'px-3 py-1 bg-brand-acid/10 border border-brand-acid/20 rounded-full'
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
            w-full h-full text-brand-acid
            ${isExpanded ? 'fill-brand-acid/20' : 'fill-brand-acid/10'}
          `}
        />
      </div>

      {/* Expandable Text */}
      <span
        className={`
          text-[10px] font-black uppercase tracking-widest text-brand-acid whitespace-nowrap
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-w-[100px] opacity-100 ml-1' : 'max-w-0 opacity-0'}
        `}
      >
        Verified
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
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to terminate session');
    }
  };

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
    <div className={`bg-neutral-900/30 rounded-[2.5rem] border border-neutral-800 overflow-hidden backdrop-blur-xl ${className}`}>
      {/* Cover/Background */}
      <div
        className="relative w-full overflow-hidden bg-[#0A0A0A]"
        style={{ aspectRatio: '16 / 5' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 to-transparent z-10" />
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-60 scale-105 hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-orange/20 to-brand-acid/20" />
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 sm:px-10 pb-8 sm:pb-12">
        {/* Avatar Section - overlaps cover */}
        <div className="relative z-20 flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 sm:-mt-24 mb-8 sm:mb-10 gap-6">
          <div className="relative group">
            {/* Premium Verified Ring - gradient with glow effect */}
            {(user.isVerifiedCreator || user.isCreatorVerified) ? (
              <div className="relative p-1 bg-brand-acid rounded-full shadow-[0_0_40px_rgba(204,255,0,0.2)] group-hover:shadow-[0_0_60px_rgba(204,255,0,0.3)] transition-all duration-500">
                <div className="p-1 bg-brand-black rounded-full">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden bg-neutral-900 border-2 border-neutral-800">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.displayName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-avatar')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-avatar w-full h-full bg-neutral-800 flex items-center justify-center text-brand-white text-xl md:text-2xl font-black italic';
                            fallback.textContent = getInitials(user.displayName);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-brand-white text-xl md:text-3xl font-black italic">
                        {getInitials(user.displayName)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Non-verified users */
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full border-4 border-brand-black shadow-2xl overflow-hidden bg-neutral-900 ring-1 ring-neutral-800">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-avatar w-full h-full bg-neutral-800 flex items-center justify-center text-brand-white text-xl md:text-2xl font-black italic';
                        fallback.textContent = getInitials(user.displayName);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-brand-white text-xl md:text-3xl font-black italic">
                    {getInitials(user.displayName)}
                  </div>
                )}
              </div>
            )}

            {/* Level Badge */}
            <div className="absolute bottom-2 right-2 bg-brand-orange text-brand-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-brand-black shadow-xl z-10 transform group-hover:scale-110 transition-transform">
              LVL {user.level}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isOwnProfile ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-neutral-900 text-brand-white border border-neutral-800 rounded-2xl hover:border-brand-acid/50 hover:bg-neutral-800 transition-all duration-300 text-[11px] font-black uppercase tracking-widest group"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-2xl hover:bg-brand-orange/20 hover:border-brand-orange/50 transition-all duration-300 text-[11px] font-black uppercase tracking-widest group"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleFollow}
                disabled={followLoading}
                className={`
                  inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl transition-all duration-300 text-[11px] font-black uppercase tracking-widest
                  ${isFollowing
                    ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    : 'bg-brand-acid text-brand-black hover:bg-[#b3e600] shadow-[0_0_20px_rgba(204,255,0,0.2)]'
                  }
                  ${followLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                `}
              >
                {followLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <UserMinus className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
              </button>
            )}

            <button
              onClick={onShare}
              className="p-3.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-2xl hover:text-brand-white hover:border-neutral-700 transition-all duration-300"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {!isOwnProfile && (
              <ReportButton
                targetType="user"
                targetId={user.id}
                targetName={user.displayName}
                className="!p-3.5 !bg-neutral-900 !text-neutral-500 !border !border-neutral-800 !rounded-2xl hover:!text-brand-orange hover:!border-brand-orange/30 !transition-all"
              />
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-white tracking-tighter italic uppercase">
                  {user.displayName}
                </h1>
                {(user.isVerifiedCreator || user.isCreatorVerified) && (
                  <ExpandableVerifiedBadge />
                )}
              </div>
              {user.username && (
                <p className="text-lg text-brand-acid font-black tracking-widest uppercase mt-2 opacity-80 italic">@{user.username}</p>
              )}
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-8 py-6 border-y border-neutral-800/50">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-brand-white leading-none">{user.stats?.projectsCreated || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-2">Projects</span>
              </div>
              <button onClick={onFollowersClick} className="flex flex-col group text-left">
                <span className="text-2xl font-black text-brand-white leading-none group-hover:text-brand-acid transition-colors">{user.stats?.followersCount || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-2 group-hover:text-neutral-400">Followers</span>
              </button>
              <button onClick={onFollowingClick} className="flex flex-col group text-left">
                <span className="text-2xl font-black text-brand-white leading-none group-hover:text-brand-acid transition-colors">{user.stats?.followingCount || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-2 group-hover:text-neutral-400">Following</span>
              </button>
            </div>

            {user.bio && (
              <p className="text-lg text-neutral-400 leading-relaxed font-medium">
                {sanitizeText(user.bio)}
              </p>
            )}

            {/* Social Links */}
            {Object.values(user.socialLinks).some(link => link) && (
              <div className="pt-2">
                <SocialLinksBar socialLinks={user.socialLinks} />
              </div>
            )}
          </div>

          <div className="space-y-8 bg-neutral-900/40 p-8 rounded-[2rem] border border-neutral-800/50">
            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-6">
              {user.location && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Location</p>
                  <div className="flex items-center gap-2 text-brand-white font-bold">
                    <MapPin className="w-4 h-4 text-brand-orange" />
                    <span>{user.location}</span>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Member Since</p>
                <div className="flex items-center gap-2 text-brand-white font-bold">
                  <Calendar className="w-4 h-4 text-brand-acid" />
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>

            {user.jobTitle && (
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Role</p>
                <p className="text-lg text-brand-white font-black italic uppercase tracking-tight">{user.jobTitle}</p>
              </div>
            )}

            {/* XP Bar */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-acid" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Experience Progression</span>
                </div>
                <span className="text-xs font-black text-brand-acid">{user.experiencePoints.toLocaleString()} XP</span>
              </div>
              <div className="relative w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-orange to-brand-acid h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                  style={{ width: `${getXPProgressPercentage(user.level, user.experiencePoints)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-neutral-500">
                <span>LVL {user.level}</span>
                <span>LVL {user.level + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;


