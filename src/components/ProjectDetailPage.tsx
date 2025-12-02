import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BackProjectModal from './payments/BackProjectModal';
import { ArrowLeft, Users, Clock, Star, MessageCircle, ThumbsUp, ExternalLink, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { FirestoreProject, FirestoreUser } from '../types/firestore';
import { getUser } from '../lib/firestore';
import { getDaysLeft, getProjectProgress, convertTimestamp } from '../lib/firestore';
import { useProject } from '../hooks/useProjects';
import LoadingSpinner from './common/LoadingSpinner';
import { LikeButton } from './interactions/LikeButton';
import { FollowButton } from './interactions/FollowButton';
import { ShareButton } from './interactions/ShareButton';
import { InteractionStats } from './interactions/InteractionStats';
import ReportButton from './common/ReportButton';
import { useAuth } from '../contexts/AuthContext';
import { UserProfilePicture } from './common/ProfilePicture';
import { useProjectViewTracking } from '../hooks/useBehaviorTracking';
import toast from 'react-hot-toast';
import NotFound from './NotFound';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { hasUserBackedProject, getUserProjectDonationTotal } from '../lib/donationService';
import SupportersList from './creator/SupportersList';
import FundingProgress from './project/FundingProgress';
import DonationLeaderboard from './project/DonationLeaderboard';
import PulseBadge from './animations/PulseBadge';
import { getProjectStatus, getStatusLabel, getStatusColor } from '../utils/projectStatus';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { project, loading: projectLoading, error: projectError } = useProject(projectId || '');

  const [activeTab, setActiveTab] = useState('overview');
  const [creator, setCreator] = useState<FirestoreUser | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(true);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [isBackModalOpen, setIsBackModalOpen] = useState(false);
  const [realtimeProject, setRealtimeProject] = useState<FirestoreProject | null>(null);
  const [userHasBacked, setUserHasBacked] = useState(false);
  const [userTotalDonation, setUserTotalDonation] = useState(0);

  // Track project view for personalization
  const viewTracking = useProjectViewTracking(
    project?.id || '',
    project ? {
      title: project.title,
      description: project.description,
      category: project.category,
      location: project.location
    } : null
  );

  // Real-time listener for project updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FirestoreProject;
          setRealtimeProject({ id: snapshot.id, ...data });
        }
      },
      (error) => {
        console.error('Error listening to project updates:', error);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Check if user has backed this project
  useEffect(() => {
    const checkUserBacking = async () => {
      if (!user?.uid || !projectId) {
        setUserHasBacked(false);
        setUserTotalDonation(0);
        return;
      }

      try {
        const hasBacked = await hasUserBackedProject(user.uid, projectId);
        setUserHasBacked(hasBacked);

        if (hasBacked) {
          const total = await getUserProjectDonationTotal(user.uid, projectId);
          setUserTotalDonation(total);
        }
      } catch (error) {
        console.error('Error checking user backing:', error);
      }
    };

    checkUserBacking();
  }, [user?.uid, projectId, realtimeProject?.raised]); // Re-check when raised amount changes

  // Fetch creator data
  useEffect(() => {
    const fetchCreator = async () => {
      // Check both createdBy and creatorId fields (for compatibility)
      const creatorId = project?.createdBy || project?.creatorId;

      if (!creatorId) {
        console.warn('No creator ID found in project data');
        setCreatorError('Creator information not available');
        setLoadingCreator(false);
        return;
      }

      try {
        setLoadingCreator(true);
        setCreatorError(null);
        const creatorData = await getUser(creatorId);

        if (!creatorData) {
          console.warn(`Creator with ID ${creatorId} not found`);
          setCreatorError('Creator not found');
          setLoadingCreator(false);
          return;
        }

        setCreator(creatorData);
      } catch (error) {
        console.error('Error fetching creator:', error);
        setCreatorError('Failed to load creator information');
      } finally {
        setLoadingCreator(false);
      }
    };

    fetchCreator();
  }, [project?.createdBy, project?.creatorId]);

  // Navigate to creator profile
  const handleCreatorNavigation = () => {
    if (!creator) {
      toast.error('Creator information not available');
      return;
    }

    // Navigate to user profile by ID (always reliable)
    navigate(`/profile/${creator.uid}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Loading state
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state or project not found
  if (projectError || !project) {
    return <NotFound />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tab: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabChange(tab);
    }
  };

  const handleTabNavigation = (e: React.KeyboardEvent) => {
    const tabs = ['overview', 'updates', 'comments', 'supporters'];
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowRight') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      setActiveTab(tabs[prevIndex]);
    } else if (e.key === 'Home') {
      setActiveTab(tabs[0]);
    } else if (e.key === 'End') {
      setActiveTab(tabs[tabs.length - 1]);
    }
  };

  const handleUpdateLike = () => {
    if (!user) {
      toast('Please sign in to like updates', {
        icon: '🔐',
      });
      return;
    }
    toast('Update likes coming soon!', {
      icon: '👍',
    });
  };

  const handleUpdateComment = () => {
    if (!user) {
      toast('Please sign in to comment', {
        icon: '🔐',
      });
      return;
    }
    toast('Comments coming soon!', {
      icon: '💬',
    });
  };


  // Use real-time project data if available, otherwise fall back to initial project data
  const displayProject = realtimeProject || project;
  const progress = getProjectProgress(displayProject);
  const daysLeft = getDaysLeft(displayProject.endDate);

  // Get comprehensive project status
  const projectStatus = getProjectStatus(
    displayProject.endDate,
    displayProject.raised,
    displayProject.goal || displayProject.fundingGoal || 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{project.title} - Lineup</title>
        <meta name="description" content={project.tagline} />
        <meta property="og:title" content={project.title} />
        <meta property="og:description" content={project.tagline} />
        <meta property="og:image" content={project.image} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Project Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {project.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
              <p className="text-xl text-gray-600 mb-6">{project.tagline}</p>

              {/* Project Image/Video */}
              <div className="mb-6">
                {project.video ? (
                  <video
                    controls
                    preload="metadata"
                    poster={project.image}
                    className="w-full h-64 sm:h-80 object-cover rounded-lg"
                    aria-label={`Video preview for ${project.title}`}
                    onError={(e) => {
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLDivElement;
                      if (fallback) {
                        fallback.style.display = 'block';
                      }
                    }}
                  >
                    <source src={project.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-64 sm:h-80 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
                    }}
                  />
                )}
                <div style={{ display: 'none' }} className="w-full h-64 sm:h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Video could not be loaded</p>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-6">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  {loadingCreator ? (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ) : creatorError ? (
                    <div className="text-red-500 text-sm">{creatorError}</div>
                  ) : creator ? (
                    <div
                      className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={handleCreatorNavigation}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCreatorNavigation();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${creator.displayName}'s profile`}
                    >
                      <UserProfilePicture
                        user={creator}
                        size="md"
                        className="w-12 h-12"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{creator.displayName}</h3>
                        <p className="text-sm text-gray-600">@{creator.username}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <InteractionStats projectId={project.id} />
                  <div className="flex space-x-2">
                    <LikeButton projectId={project.id} />
                    <FollowButton projectId={project.id} />
                    <ShareButton
                      projectId={project.id}
                      projectTitle={project.title}
                      projectDescription={project.tagline}
                    />
                    <ReportButton
                      targetType="project"
                      targetId={project.id}
                      targetName={project.title}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div
                className="flex space-x-1 p-1 bg-gray-100 rounded-lg m-4 overflow-x-auto scrollbar-hide"
                role="tablist"
                onKeyDown={handleTabNavigation}
              >
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'updates', label: 'Updates' },
                  { id: 'comments', label: 'Comments' },
                  { id: 'supporters', label: 'Supporters' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    id={`${tab.id}-tab`}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${activeTab === tab.id
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    onClick={() => handleTabChange(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
                    <div className="prose max-w-none space-y-8">
                      {/* About Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Project</h3>
                        <div className="whitespace-pre-wrap text-gray-700">
                          {project.description}
                        </div>
                      </div>

                      {/* Why This Matters Section */}
                      {project.story?.why && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Why This Matters</h3>
                          <div className="whitespace-pre-wrap text-gray-700">
                            {project.story.why}
                          </div>
                        </div>
                      )}

                      {/* Fund Breakdown Section */}
                      {project.story?.fundBreakdown && project.story.fundBreakdown.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Funds Will Be Used</h3>
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

                      {/* Project Gallery */}
                      {project.gallery && project.gallery.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Gallery</h3>
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
                          <div className="space-y-4">
                            {project.story.timeline.map((item, index) => (
                              <div key={index} className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-20 h-12 bg-orange-100 text-orange-900 font-semibold rounded-lg flex items-center justify-center">
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risks & Challenges</h3>
                          <div className="whitespace-pre-wrap text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
                            {project.story.risks}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Updates Tab */}
                {activeTab === 'updates' && (
                  <div role="tabpanel" id="updates-panel" aria-labelledby="updates-tab">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Updates</h3>
                    {project.updates && project.updates.length > 0 ? (
                      <div className="space-y-6">
                        {project.updates.map((update, index) => (
                          <div key={index} className="border-l-4 border-orange-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{update.title}</h4>
                              <span className="text-sm text-gray-500">
                                {convertTimestamp(update.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-3">{update.content}</p>
                            {update.image && (
                              <img
                                src={update.image}
                                alt={update.title}
                                className="w-full h-48 object-cover rounded-lg mb-3"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60';
                                }}
                              />
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <button
                                onClick={handleUpdateLike}
                                className="flex items-center space-x-1 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                                aria-label="Like this update"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{update.likes || 0}</span>
                              </button>
                              <button
                                onClick={handleUpdateComment}
                                className="flex items-center space-x-1 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                aria-label="Comment on this update"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{update.comments?.length || 0}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No updates yet. Check back later!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div role="tabpanel" id="comments-panel" aria-labelledby="comments-tab">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
                    {project.comments && project.comments.length > 0 ? (
                      <div className="space-y-4">
                        {project.comments.map((comment, index) => (
                          <div key={index} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                            <img
                              src={comment.userAvatar}
                              alt={comment.userName}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=6b7280&color=fff&size=150`;
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-gray-900">{comment.userName}</h5>
                                <span className="text-sm text-gray-500">
                                  {convertTimestamp(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Supporters Tab */}
                {activeTab === 'supporters' && (
                  <div role="tabpanel" id="supporters-panel" aria-labelledby="supporters-tab">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Supporters ({displayProject.supporters})
                    </h3>
                    <SupportersList projectId={displayProject.id} limit={20} showTitle={false} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Funding Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {/* Project Status Badge */}
              <div className="mb-4">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(projectStatus.status)}`}>
                  {projectStatus.status === 'successful' && '✅ '}
                  {projectStatus.status === 'expired' && '⏰ '}
                  {projectStatus.status === 'failed' && '❌ '}
                  {getStatusLabel(projectStatus.status)}
                </div>
              </div>

              {/* User Backing Badge */}
              {userHasBacked && userTotalDonation > 0 && (
                <div className="mb-4">
                  <PulseBadge variant="success" pulse={true}>
                    You backed this project! ₹{formatCurrency(userTotalDonation)}
                  </PulseBadge>
                </div>
              )}

              <FundingProgress
                raised={displayProject.raised}
                goal={displayProject.goal || displayProject.fundingGoal || 0}
                daysLeft={projectStatus.daysLeft}
                supporters={displayProject.supporters}
                animated={true}
              />

              {/* Expired Project Message */}
              {projectStatus.isExpired && !projectStatus.isSuccessful && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-700">
                    This project has ended
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Donations are no longer accepted
                  </p>
                </div>
              )}

              {/* Success Message */}
              {projectStatus.isExpired && projectStatus.isSuccessful && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm font-medium text-green-800">
                    🎉 Project Successfully Funded!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    This project has reached its goal
                  </p>
                </div>
              )}

              {/* Back Project Button - Only for active projects */}
              {!projectStatus.isExpired && (
                <button
                  onClick={() => setIsBackModalOpen(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-center block mt-6"
                  aria-label="Support this project"
                >
                  Back This Project
                </button>
              )}
            </div>

            {/* Creator Card */}
            {creator && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Creator</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <UserProfilePicture
                    user={creator}
                    size="lg"
                    className="w-16 h-16"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{creator.displayName}</h4>
                    <p className="text-sm text-gray-600">@{creator.username}</p>
                  </div>
                </div>
                {creator.bio && (
                  <p className="text-gray-700 mb-4">{creator.bio}</p>
                )}
                <button
                  onClick={handleCreatorNavigation}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  aria-label={`View ${creator.displayName}'s profile`}
                >
                  View Profile
                </button>
              </div>
            )}

            {/* Donation Leaderboard */}
            <div className="mt-6">
              <DonationLeaderboard projectId={displayProject.id} limit={10} />
            </div>
          </div>
        </div>
      </div>

      {/* Back Project Modal */}
      <BackProjectModal
        project={{
          id: project.id,
          title: project.title,
          creatorName: creator?.displayName || 'Unknown Creator',
          image: project.image,
          rewardTiers: project.rewards || []
        }}
        isOpen={isBackModalOpen}
        onClose={() => setIsBackModalOpen(false)}
        onSuccess={() => {
          // Refresh project data or show success message
          toast.success('Thank you for backing this project!');
        }}
      />
    </div>
  );
}
