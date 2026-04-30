import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useProjectsByCreator } from '../hooks/useProjects';
import { useEnhancedUserProfile, useUserFollow } from '../hooks/useEnhancedUserProfile';
import { useProfileSharing } from '../hooks/useProfileSharing';
import { Heart, Award, Star, Plus, Activity, Bookmark } from 'lucide-react';
import ProjectCard from './projects/ProjectCard';
import LoadingSpinner from './common/LoadingSpinner';
import ProfileHero from './profile/ProfileHero';
import UserStatsCard from './profile/UserStatsCard';
import AchievementsSection from './profile/AchievementsSection';
import BackedProjectsTab from './profile/BackedProjectsTab';
import ProfileEditModal from './profile/ProfileEditModal';
import ProfileShareModal from './profile/ProfileShareModal';
import BookmarkedProjectsTab from './profile/BookmarkedProjectsTab';
import ErrorBoundary from './common/ErrorBoundary';
import ProfileErrorFallback from './profile/ProfileErrorFallback';
import FollowersModal from './profile/FollowersModal';
import FollowingModal from './profile/FollowingModal';
import ActivityFeed from './activity/ActivityFeed';

interface EnhancedUserProfileProps {
  user?: any; // Current authenticated user (for compatibility with old UserProfile)
  userId?: string; // If provided, shows another user's profile
  username?: string; // If provided, shows profile by username
  onBack?: () => void; // Navigation back handler
  onStartProject?: () => void;
}

const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({ userId: propUserId, username: propUsername, onBack, onStartProject }) => {
  const params = useParams<{ userId?: string; username?: string }>();
  const [user] = useAuthState(auth);

  // Directly use userId from props or params - no async resolution needed for ID-based routing
  const targetUserId = propUserId || params.userId || (propUsername || params.username ? null : user?.uid);
  const username = propUsername || params.username;
  const isOwnProfile = targetUserId === user?.uid;

  const [activeTab, setActiveTab] = useState<'created' | 'backed' | 'saved' | 'achievements' | 'activity'>('created');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);

  const { profile, isLoading: profileLoading, refreshProfile } = useEnhancedUserProfile(targetUserId || undefined);
  const { projects: userProjects, loading: projectsLoading } = useProjectsByCreator(targetUserId || '');
  const { isFollowing, toggleFollow, isLoading: followLoading } = useUserFollow(targetUserId || '', refreshProfile);
  const { isShareModalOpen, openShareModal, closeShareModal } = useProfileSharing(profile || undefined);

  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view profiles.</p>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600">
            {username ? `User @${username} could not be found.` : 'The requested user profile could not be found.'}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleProfileSaved = () => {
    refreshProfile();
  };

  const handleShare = () => {
    openShareModal();
  };

  const tabs = [
    {
      id: 'created',
      label: 'Created Projects',
      icon: <Award className="w-5 h-5" />,
      count: profile.stats.projectsCreated
    },
    {
      id: 'backed',
      label: 'Backed Projects',
      icon: <Heart className="w-5 h-5" />,
      count: profile.stats.projectsBacked,
      hidden: !profile.showBackedProjects && !isOwnProfile
    },
    {
      id: 'saved',
      label: 'Saved Projects',
      icon: <Bookmark className="w-5 h-5" />,
      count: 0, // Will show actual count from component
      hidden: !isOwnProfile // Only show saved projects for own profile
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: <Star className="w-5 h-5" />,
      count: profile.achievements.length
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity className="w-5 h-5" />,
      count: 0 // Will be populated by activity feed
    }
  ].filter(tab => !tab.hidden);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'created':
        if (projectsLoading) {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-48 bg-neutral-800/50"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-neutral-800/50 rounded w-3/4"></div>
                      <div className="h-3 bg-neutral-800/50 rounded w-1/2"></div>
                      <div className="h-3 bg-neutral-800/50 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (userProjects.length === 0) {
          return (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-neutral-900 rounded-3xl flex items-center justify-center border border-neutral-800 group hover:border-brand-acid/30 transition-all duration-300">
                <Award className="w-10 h-10 text-neutral-600 group-hover:text-brand-acid transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-brand-white mb-2">No Projects Created</h3>
              <p className="text-neutral-500 max-w-sm mx-auto mb-8 font-medium">
                {isOwnProfile
                  ? 'The world is waiting for your next big idea. Start creating now!'
                  : `${profile.displayName} hasn't launched any projects on Lineup yet.`
                }
              </p>
              {isOwnProfile && onStartProject && (
                <button
                  onClick={onStartProject}
                  className="inline-flex items-center gap-3 bg-brand-acid text-brand-black px-8 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-[#b3e600] transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                >
                  <Plus className="w-6 h-6" />
                  Launch Project
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {userProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        );

      case 'backed':
        return <BackedProjectsTab userId={targetUserId} />;

      case 'saved':
        return <BookmarkedProjectsTab userId={targetUserId} isOwnProfile={isOwnProfile} />;

      case 'achievements':
        return (
          <AchievementsSection
            achievements={profile.achievements}
            level={profile.level}
            experiencePoints={profile.experiencePoints}
          />
        );

      case 'activity':
        return (
          <ActivityFeed
            userId={profile.id}
            mode="user"
            className="bg-neutral-900/30 rounded-2xl p-6 border border-neutral-800"
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ProfileErrorFallback}>
      <div className="min-h-screen bg-brand-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Profile Hero Section */}
          <ProfileHero
            user={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onEditProfile={handleEditProfile}
            onToggleFollow={toggleFollow}
            onShare={handleShare}
            followLoading={followLoading}
            className="mb-6 sm:mb-10"
            onFollowersClick={() => setIsFollowersModalOpen(true)}
            onFollowingClick={() => setIsFollowingModalOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
            {/* Left Sidebar */}
            <div className="lg:col-span-4 space-y-6 sm:space-y-10">
              {/* Statistics Section */}
              {(profile.showStats || isOwnProfile) && (
                <UserStatsCard
                  stats={profile.stats}
                  onFollowersClick={() => setIsFollowersModalOpen(true)}
                  onFollowingClick={() => setIsFollowingModalOpen(true)}
                />
              )}

              {/* Quick Achievements Preview */}
              {profile.achievements.length > 0 && (
                <div className="bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-brand-orange" />
                      Achievements
                    </h3>
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-acid hover:opacity-80 transition-opacity"
                    >
                      All
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {profile.achievements.slice(0, 6).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex-shrink-0 text-center p-4 bg-neutral-900 border border-neutral-800 rounded-2xl min-w-[90px] group hover:border-brand-orange/30 transition-all duration-300"
                      >
                        <div className="text-3xl mb-2 grayscale-[0.5] group-hover:grayscale-0 transition-all transform group-hover:scale-110">{achievement.icon}</div>
                        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider line-clamp-1">{achievement.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8">
              {/* Navigation Tabs */}
              <div className="bg-neutral-900/30 rounded-3xl border border-neutral-800 mb-6 sm:mb-10 overflow-hidden">
                <div className="border-b border-neutral-800 p-2 sm:p-3">
                  <nav className="flex space-x-1 sm:space-x-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                          flex items-center gap-2 px-4 sm:px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
                          ${activeTab === tab.id
                            ? 'bg-brand-acid text-brand-black shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                            : 'text-neutral-500 hover:text-brand-white hover:bg-neutral-800/50'
                          }
                        `}
                      >
                        <span className="flex items-center justify-center">
                          {React.cloneElement(tab.icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
                        </span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        {tab.count > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ml-1 ${
                            activeTab === tab.id ? 'bg-brand-black/10 text-brand-black' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-8">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        {isOwnProfile && (
          <ProfileEditModal
            user={profile}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleProfileSaved}
          />
        )}

        {/* Profile Share Modal */}
        {profile && (
          <ProfileShareModal
            user={profile}
            isOpen={isShareModalOpen}
            onClose={closeShareModal}
          />
        )}

        {/* Followers Modal */}
        {profile && (
          <FollowersModal
            isOpen={isFollowersModalOpen}
            onClose={() => setIsFollowersModalOpen(false)}
            userId={profile.id}
            followerCount={profile.stats?.followersCount || 0}
          />
        )}

        {/* Following Modal */}
        {profile && (
          <FollowingModal
            isOpen={isFollowingModalOpen}
            onClose={() => setIsFollowingModalOpen(false)}
            userId={profile.id}
            followingCount={profile.stats?.followingCount || 0}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedUserProfile;

