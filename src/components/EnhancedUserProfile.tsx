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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (userProjects.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Created</h3>
              <p className="text-gray-600 mb-6">
                {isOwnProfile
                  ? 'Start creating amazing projects to see them here!'
                  : `${profile.displayName} hasn't created any projects yet.`
                }
              </p>
              {isOwnProfile && onStartProject && (
                <button
                  onClick={onStartProject}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Start New Project
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ProfileErrorFallback}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Profile Hero Section */}
          <ProfileHero
            user={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onEditProfile={handleEditProfile}
            onToggleFollow={toggleFollow}
            onShare={handleShare}
            followLoading={followLoading}
            className="mb-4 sm:mb-8"
            onFollowersClick={() => setIsFollowersModalOpen(true)}
            onFollowingClick={() => setIsFollowingModalOpen(true)}
          />

          {/* Statistics Section */}
          {(profile.showStats || isOwnProfile) && (
            <UserStatsCard
              stats={profile.stats}
              className="mb-4 sm:mb-8"
              onFollowersClick={() => setIsFollowersModalOpen(true)}
              onFollowingClick={() => setIsFollowingModalOpen(true)}
            />
          )}

          {/* Quick Achievements Preview */}
          {profile.achievements.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Recent Achievements
                </h3>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {profile.achievements.slice(0, 6).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex-shrink-0 text-center p-3 bg-gray-50 rounded-lg min-w-[80px]"
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs text-gray-600 font-medium">{achievement.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                    flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap
                    ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                  `}
                  >
                    <span className="w-4 h-4 sm:w-5 sm:h-5">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                    <span className="bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-3 sm:p-6">
              {renderTabContent()}
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

