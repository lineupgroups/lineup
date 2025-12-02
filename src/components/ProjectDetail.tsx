import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, Star, MessageCircle, ThumbsUp, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { FirestoreProject, FirestoreUser } from '../types/firestore';
import { getUser } from '../lib/firestore';
import { getDaysLeft, getProjectProgress, convertTimestamp } from '../lib/firestore';
import { recordProjectView } from '../lib/analytics';
import LoadingSpinner from './common/LoadingSpinner';
import { LikeButton } from './interactions/LikeButton';
import { FollowButton } from './interactions/FollowButton';
import { ShareButton } from './interactions/ShareButton';
import { InteractionStats } from './interactions/InteractionStats';
import { useAuth } from '../contexts/AuthContext';
import { useProjectUpdates } from '../hooks/useProjectUpdates';
import ProjectUpdatesList from './creator/ProjectUpdatesList';
import CommentsSection from './comments/CommentsSection';
import SupportersDetailTab from './creator/SupportersDetailTab';
import FundingProgress from './project/FundingProgress';
import DonationLeaderboard from './project/DonationLeaderboard';
import toast from 'react-hot-toast';

interface ProjectDetailProps {
  project: FirestoreProject;
  onBack: () => void;
  onSupportClick: () => void;
  onCreatorClick?: (creatorId: string, username?: string) => void;
}

export default function ProjectDetail({ project, onBack, onSupportClick, onCreatorClick }: ProjectDetailProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [creator, setCreator] = useState<FirestoreUser | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(true);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  // Fetch project updates
  const {
    updates,
    loading: updatesLoading
  } = useProjectUpdates(project.id);

  // Track project view
  useEffect(() => {
    const trackView = async () => {
      try {
        if (user) {
          await recordProjectView(
            project.id,
            user.uid,
            (user as any).city,
            (user as any).state
          );
        } else {
          await recordProjectView(project.id);
        }
      } catch (error) {
        console.error('Error tracking project view:', error);
      }
    };
    trackView();
  }, [project.id, user]);

  // Fetch creator data
  useEffect(() => {
    const fetchCreator = async () => {
      try {
        setLoadingCreator(true);
        setCreatorError(null);
        const creatorData = await getUser(project.creatorId);
        setCreator(creatorData);
      } catch (error) {
        console.error('Error fetching creator:', error);
        setCreatorError('Failed to load creator information');
        setCreator(null);
      } finally {
        setLoadingCreator(false);
      }
    };

    if (project.creatorId) {
      fetchCreator();
    } else {
      setLoadingCreator(false);
      setCreatorError('No creator information available');
    }
  }, [project.creatorId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleUpdateLike = (updateId: string) => {
    if (!user) {
      toast.error('Please sign in to like updates');
      return;
    }
    // TODO: Implement update-specific like functionality
    toast.success('Update liked! (Feature coming soon)');
  };

  const handleUpdateComment = (updateId: string) => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    // TODO: Implement comment functionality
    toast.success('Comment feature coming soon!');
  };

  const handleCreatorNavigation = () => {
    if (!creator) return;

    if (onCreatorClick) {
      // Use the username if available, otherwise fall back to user ID
      onCreatorClick(creator.uid, creator.username || undefined);
    } else {
      // Fallback: show a message if no navigation handler is provided
      toast.info('Creator profile navigation not available');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'updates', label: `Updates (${updates.length})` },
    { id: 'supporters', label: `Supporters (${project.supporters})` },
    { id: 'comments', label: 'Comments' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            aria-label="Go back to projects list"
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg px-2 py-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Projects</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Header */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-64 md:h-80 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium">
                      {project.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg">
                        <LikeButton projectId={project.id} size="sm" />
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg">
                        <ShareButton
                          projectId={project.id}
                          projectTitle={project.title}
                          projectDescription={project.tagline}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{project.tagline}</p>

                {/* Creator Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
                  {loadingCreator ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-24 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ) : creatorError ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm">!</span>
                      </div>
                      <div>
                        <p className="font-medium text-red-600">Creator Unavailable</p>
                        <p className="text-sm text-red-500">{creatorError}</p>
                      </div>
                    </div>
                  ) : creator ? (
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                      onClick={handleCreatorNavigation}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCreatorNavigation();
                        }
                      }}
                      aria-label={`View ${creator.displayName}'s profile`}
                    >
                      <img
                        src={creator.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName)}&background=f97316&color=fff`}
                        alt={creator.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName)}&background=f97316&color=fff`;
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 hover:text-orange-600 transition-colors">{creator.displayName}</p>
                        <p className="text-sm text-gray-600">{creator.location || 'India'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-medium">
                        {project.creatorId.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Creator</p>
                        <p className="text-sm text-gray-600">India</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {convertTimestamp(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    {creator?.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{creator.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interaction Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6 p-4 bg-gray-50 rounded-lg">
                  <InteractionStats projectId={project.id} size="md" />
                  <FollowButton projectId={project.id} size="md" showText={true} />
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{project.supporters}</div>
                    <div className="text-sm text-gray-600">Supporters</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{getDaysLeft(project)}</div>
                    <div className="text-sm text-gray-600">Days Left</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{getProjectProgress(project).toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Funded</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Project information tabs">
                  {tabs.map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' && index > 0) {
                          setActiveTab(tabs[index - 1].id);
                        } else if (e.key === 'ArrowRight' && index < tabs.length - 1) {
                          setActiveTab(tabs[index + 1].id);
                        } else if (e.key === 'Home') {
                          setActiveTab(tabs[0].id);
                        } else if (e.key === 'End') {
                          setActiveTab(tabs[tabs.length - 1].id);
                        }
                      }}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      id={`tab-${tab.id}`}
                      tabIndex={activeTab === tab.id ? 0 : -1}
                      className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div
                    role="tabpanel"
                    id="tabpanel-overview"
                    aria-labelledby="tab-overview"
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Project</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {project.fullDescription || project.description}
                        </p>
                      </div>
                    </div>

                    {/* Why This Matters Section */}
                    {project.story?.why && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Matters</h3>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {project.story.why}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Fund Breakdown Section */}
                    {project.story?.fundBreakdown && project.story.fundBreakdown.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">How Funds Will Be Used</h3>
                        <div className="space-y-3">
                          {project.story.fundBreakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <span className="text-gray-900 font-medium">{item.item}</span>
                              <span className="text-gray-900 font-semibold">
                                ₹{new Intl.NumberFormat('en-IN').format(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video if available */}
                    {project.video && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Video</h3>
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <video
                            src={project.video}
                            controls
                            preload="metadata"
                            className="w-full h-full object-cover"
                            poster={project.image}
                            aria-label={`Video presentation for ${project.title}`}
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              const container = target.parentElement;
                              if (container) {
                                container.innerHTML = `
                                  <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                                    <div class="text-center">
                                      <div class="text-4xl mb-2">📹</div>
                                      <p>Video unavailable</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          >
                            <p>
                              Your browser does not support the video tag.
                              <a href={project.video} className="text-orange-600 hover:underline">
                                Download the video
                              </a>
                            </p>
                          </video>
                        </div>
                      </div>
                    )}

                    {/* Project Gallery */}
                    {project.gallery && project.gallery.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {project.gallery.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                              onClick={() => window.open(image, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline Section */}
                    {project.story?.timeline && project.story.timeline.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Timeline</h3>
                        <div className="space-y-4">
                          {project.story.timeline.map((item, index) => (
                            <div key={index} className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-20 h-12 bg-orange-100 text-orange-900 font-semibold rounded-lg flex items-center justify-center text-sm">
                                Month {item.month}
                              </div>
                              <div className="flex-1 pt-2">
                                <p className="text-gray-700">{item.milestone}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risks & Challenges Section */}
                    {project.story?.risks && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Risks & Challenges</h3>
                        <div className="prose max-w-none bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {project.story.risks}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rewards */}
                    {project.rewards && project.rewards.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Tiers</h3>
                        <div className="space-y-4">
                          {project.rewards.map((reward) => (
                            <div key={reward.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{reward.title}</h4>
                                <span className="text-lg font-bold text-orange-600">
                                  {formatCurrency(reward.amount)}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">{reward.description}</p>
                              <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Est. delivery: {reward.estimatedDelivery}</span>
                                <span>{reward.available - reward.claimed} remaining</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Updates Tab */}
                {activeTab === 'updates' && (
                  <div
                    role="tabpanel"
                    id="tabpanel-updates"
                    aria-labelledby="tab-updates"
                    className="space-y-6"
                  >
                    <ProjectUpdatesList
                      updates={updates}
                      loading={updatesLoading}
                      onEdit={() => { }}
                      onDelete={() => { }}
                      onPin={() => { }}
                      isCreator={false}
                    />
                  </div>
                )}

                {/* Supporters Tab */}
                {activeTab === 'supporters' && (
                  <div
                    role="tabpanel"
                    id="tabpanel-supporters"
                    aria-labelledby="tab-supporters"
                  >
                    <SupportersDetailTab projectId={project.id} />
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div
                    role="tabpanel"
                    id="tabpanel-comments"
                    aria-labelledby="tab-comments"
                  >
                    <CommentsSection
                      projectId={project.id}
                      creatorId={project.creatorId}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Funding Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <FundingProgress
                  raised={project.raised}
                  goal={project.goal || project.fundingGoal || 0}
                  daysLeft={getDaysLeft(project)}
                  supporters={project.supporters}
                  animated={true}
                />

                {/* Support Button */}
                <button
                  onClick={onSupportClick}
                  aria-label={`Support ${project.title} project`}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Support This Project
                </button>

                {/* Secondary Actions */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex-1">
                    <LikeButton
                      projectId={project.id}
                      size="md"
                      showCount={true}
                      className="w-full justify-center"
                    />
                  </div>
                  <div className="flex-1">
                    <ShareButton
                      projectId={project.id}
                      projectTitle={project.title}
                      projectDescription={project.tagline}
                      size="md"
                      className="w-full justify-center"
                    />
                  </div>
                </div>
              </div>

              {/* Creator Card */}
              {creator && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Creator</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={creator.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName)}&background=f97316&color=fff`}
                      alt={creator.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName)}&background=f97316&color=fff`;
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{creator.displayName}</p>
                      <p className="text-sm text-gray-600">{creator.location || 'India'}</p>
                    </div>
                  </div>

                  {creator.bio && (
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">{creator.bio}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{creator.stats?.projectsCreated || 0}</div>
                      <div className="text-xs text-gray-600">Projects Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{creator.stats?.projectsSupported || 0}</div>
                      <div className="text-xs text-gray-600">Projects Supported</div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreatorNavigation}
                    aria-label={`View ${creator.displayName}'s full profile`}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    View Profile
                  </button>
                </div>
              )}

              {/* Donation Leaderboard */}
              <DonationLeaderboard projectId={project.id} limit={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}