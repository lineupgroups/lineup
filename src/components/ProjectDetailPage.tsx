import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BackProjectModal from './payments/BackProjectModal';
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ZoomIn, Play, MapPin } from 'lucide-react';
import { FirestoreProject, FirestoreUser } from '../types/firestore';
import { getUser } from '../lib/firestore';
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
import { trackProjectView } from '../lib/analytics';
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
import CommentsSection from './comments/CommentsSection';
import UpdatesSection from './updates/UpdatesSection';
import ImageLightbox from './project/ImageLightbox';
import BookmarkButton from './project/BookmarkButton';
import ProjectFAQs from './project/ProjectFAQs';
import FundBreakdownPieChart from './project/FundBreakdownPieChart';

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

  // Lightbox state for gallery
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Expanded bio state
  const [bioExpanded, setBioExpanded] = useState(false);

  // Media carousel state (0 = video if exists, then images)
  const [mediaIndex, setMediaIndex] = useState(0);

  // Track project view for personalization (hook is called for side effect)
  useProjectViewTracking(
    project?.id || '',
    project ? {
      title: project.title,
      description: project.description,
      category: project.category,
      location: project.location
    } : null
  );

  // Ref to track if we've already tracked this view
  const hasTrackedView = useRef(false);

  // Track project view for analytics (feeds into creator analytics dashboard)
  useEffect(() => {
    if (!projectId || !project || hasTrackedView.current) return;

    // Track the view (with device detection built-in)
    // Location would be passed if we had geolocation, but we'll let it be optional
    trackProjectView(projectId, user?.uid || null);
    hasTrackedView.current = true;

    // Reset on projectId change
    return () => {
      hasTrackedView.current = false;
    };
  }, [projectId, project, user?.uid]);

  // Real-time listener for project updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRealtimeProject({ ...data, id: snapshot.id } as FirestoreProject);
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

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  // Get video info - supports YouTube URL
  const videoId = getYouTubeVideoId(project?.videoUrl);

  // Open lightbox at specific index
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Get all images for gallery (main + gallery)
  const getAllGalleryImages = () => {
    const images: string[] = [];
    if (project?.image) images.push(project.image);
    if (project?.gallery) images.push(...project.gallery);
    return images;
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

  // Get creatorId for passing to components
  const creatorId = project?.createdBy || project?.creatorId || '';


  // Use real-time project data if available, otherwise fall back to initial project data
  const displayProject = realtimeProject || project;

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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={project.title} />
        <meta name="twitter:description" content={project.tagline} />
        <meta name="twitter:image" content={project.image} />

        {/* Issue #19: JSON-LD Structured Data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": project.title,
            "description": project.tagline || project.description,
            "image": project.image,
            "brand": {
              "@type": "Organization",
              "name": "Lineup Crowdfunding"
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": "0",
              "availability": "https://schema.org/InStock",
              "url": window.location.href
            },
            "aggregateRating": displayProject?.likeCount && displayProject.likeCount > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": displayProject.likeCount.toString()
            } : undefined,
            "creator": creator ? {
              "@type": "Person",
              "name": creator.displayName || "Creator",
              "url": creator.username ? `${window.location.origin}/profile/${creator.username}` : undefined
            } : undefined,
            "datePublished": project.createdAt ? new Date(project.createdAt.seconds * 1000).toISOString() : undefined,
            "potentialAction": {
              "@type": "DonateAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": window.location.href
              },
              "result": {
                "@type": "Donation",
                "recipient": {
                  "@type": "Person",
                  "name": creator?.displayName || "Creator"
                }
              }
            }
          })}
        </script>
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
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">


              {/* Project Media Carousel - Video first, then images */}
              <div className="mb-6 relative">
                {(() => {
                  // Build media items array: video (if exists) + cover image + gallery images
                  const mediaItems: { type: 'video' | 'image'; src: string }[] = [];

                  if (videoId) {
                    mediaItems.push({ type: 'video', src: videoId });
                  }
                  if (project.image) {
                    mediaItems.push({ type: 'image', src: project.image });
                  }
                  if (project.gallery) {
                    project.gallery.forEach((img: string) => {
                      mediaItems.push({ type: 'image', src: img });
                    });
                  }

                  const currentItem = mediaItems[mediaIndex] || mediaItems[0];
                  const hasMultipleItems = mediaItems.length > 1;

                  const goNext = () => setMediaIndex((prev) => (prev + 1) % mediaItems.length);
                  const goPrev = () => setMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

                  return (
                    <>
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 relative group">
                        {currentItem?.type === 'video' ? (
                          // YouTube Video Embed
                          <iframe
                            src={`https://www.youtube.com/embed/${currentItem.src}`}
                            title={`Video for ${project.title}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          // Image with click to open lightbox
                          <div
                            className="w-full h-full cursor-pointer"
                            onClick={() => {
                              // Find the image index in gallery for lightbox
                              const imageIndex = videoId ? mediaIndex - 1 : mediaIndex;
                              openLightbox(Math.max(0, imageIndex));
                            }}
                          >
                            <img
                              src={currentItem?.src || project.image}
                              alt={project.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                          </div>
                        )}

                        {/* Navigation Arrows */}
                        {hasMultipleItems && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); goPrev(); }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              aria-label="Previous media"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); goNext(); }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              aria-label="Next media"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Bottom Navigation: Play button + Dots */}
                      {hasMultipleItems && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
                          {mediaItems.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => setMediaIndex(idx)}
                              className={`relative flex items-center justify-center transition-all ${idx === mediaIndex
                                ? 'scale-110'
                                : 'opacity-70 hover:opacity-100'
                                }`}
                              aria-label={`Go to ${item.type === 'video' ? 'video' : `image ${idx}`}`}
                            >
                              {item.type === 'video' ? (
                                // Play icon for video
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${idx === mediaIndex
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white/80 text-gray-700'
                                  }`}>
                                  <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                                </div>
                              ) : (
                                // Dot for images
                                <div className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === mediaIndex
                                  ? 'bg-white'
                                  : 'bg-white/50'
                                  }`} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Overlay Badges - Top Left */}
                      {currentItem?.type !== 'video' && (
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                          {/* Status Badge */}
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${getStatusColor(projectStatus.status)} bg-white/90`}>
                            {projectStatus.status === 'successful' && '✅ '}
                            {projectStatus.status === 'expired' && '⏰ '}
                            {projectStatus.status === 'failed' && '❌ '}
                            {getStatusLabel(projectStatus.status)}
                          </span>
                        </div>
                      )}

                      {/* Overlay Badges - Top Right */}
                      {currentItem?.type !== 'video' && (
                        <div className="absolute top-4 right-4 flex flex-wrap gap-2">
                          {/* Category Badge */}
                          <span className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold shadow-lg">
                            {project.category}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Project Title & Tagline */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{project.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{project.tagline}</p>

              {/* Location Indicator */}
              {project.location && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {typeof project.location === 'string'
                      ? project.location
                      : `${project.location.city || ''}${project.location.city && project.location.state ? ', ' : ''}${project.location.state || ''}`
                    }
                  </span>
                </div>
              )}

              {/* Creator Info & Actions - Redesigned Layout */}
              <div className="border-t pt-6">
                {/* Top Row: Creator + Verified Badge + Stats */}
                <div className="flex items-center justify-between mb-4">
                  {/* Creator Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {loadingCreator ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1.5 animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        </div>
                      </div>
                    ) : creatorError ? (
                      <div className="text-red-500 text-sm">{creatorError}</div>
                    ) : creator ? (
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 py-1.5 px-2 -ml-2 rounded-lg transition-colors min-w-0"
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
                          size="sm"
                          className="w-10 h-10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
                              {creator.displayName}
                            </h3>
                            {creator.isVerifiedCreator && (
                              <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">@{creator.username}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Interaction Stats - Right side on desktop */}
                  <div className="hidden sm:block">
                    <InteractionStats projectId={project.id} />
                  </div>
                </div>

                {/* Mobile: Stats shown here */}
                <div className="sm:hidden mb-3">
                  <InteractionStats projectId={project.id} />
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LikeButton projectId={project.id} />
                    <FollowButton projectId={project.id} />
                    <BookmarkButton
                      projectId={project.id}
                      projectTitle={project.title}
                    />
                    <ShareButton
                      projectId={project.id}
                      projectTitle={project.title}
                      projectDescription={project.tagline}
                    />
                  </div>
                  {/* Report Button - Separated to the right */}
                  <ReportButton
                    targetType="project"
                    targetId={project.id}
                    targetName={project.title}
                  />
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
                  { id: 'faqs', label: 'FAQs' },
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

                      {/* Fund Breakdown Section - Pie Chart */}
                      {project.story?.fundBreakdown && project.story.fundBreakdown.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Funds Will Be Used</h3>
                          <FundBreakdownPieChart breakdown={project.story.fundBreakdown} />
                        </div>
                      )}

                      {/* Project Gallery */}
                      {project.gallery && project.gallery.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Project Gallery</h3>
                            <span className="text-sm text-gray-500">{project.gallery.length} images</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {project.gallery.map((image: string, index: number) => (
                              <div
                                key={index}
                                className="relative group cursor-pointer aspect-video rounded-lg overflow-hidden bg-gray-100"
                                onClick={() => openLightbox(index + 1)} // +1 because main image is at index 0
                              >
                                <img
                                  src={image}
                                  alt={`Gallery ${index + 1}`}
                                  className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <div className="bg-black/60 rounded-full p-2">
                                    <ZoomIn className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline Section */}
                      {project.story?.timeline && project.story.timeline.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
                          <div className="space-y-4">
                            {project.story.timeline.map((item: { month: number; milestone: string }, index: number) => (
                              <div key={index} className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-24 h-12 bg-gradient-to-r from-orange-100 to-red-100 text-orange-900 font-semibold rounded-lg flex items-center justify-center text-sm">
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

                {/* FAQs Tab */}
                {activeTab === 'faqs' && (
                  <div role="tabpanel" id="faqs-panel" aria-labelledby="faqs-tab">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h3>
                      </div>
                      <ProjectFAQs
                        faqs={project.faqs || []}
                        projectId={project.id}
                        showAskQuestion={false}
                      />
                    </div>
                  </div>
                )}

                {/* Updates Tab */}
                {activeTab === 'updates' && (
                  <div role="tabpanel" id="updates-panel" aria-labelledby="updates-tab">
                    <UpdatesSection projectId={project.id} creatorId={creatorId} creatorAvatar={(creator as any)?.profileImage || creator?.photoURL || undefined} projectTitle={project.title} />
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div role="tabpanel" id="comments-panel" aria-labelledby="comments-tab">
                    <CommentsSection projectId={project.id} creatorId={creatorId} creatorAvatar={(creator as any)?.profileImage || creator?.photoURL || undefined} />
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
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Funding Progress Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 overflow-hidden relative">
                {/* Subtle gradient overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-50 to-transparent rounded-bl-full pointer-events-none" />

                {/* Project Status Badge - Only show if NOT active */}
                {projectStatus.status !== 'active' && (
                  <div className="mb-4 relative">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(projectStatus.status)}`}>
                      {projectStatus.status === 'successful' && '🎉 '}
                      {projectStatus.status === 'expired' && '⏰ '}
                      {projectStatus.status === 'failed' && '😔 '}
                      {getStatusLabel(projectStatus.status)}
                    </div>
                  </div>
                )}

                {/* User Backing Badge */}
                {userHasBacked && userTotalDonation > 0 && (
                  <div className="mb-4">
                    <PulseBadge variant="success" pulse={true}>
                      You backed this project! {formatCurrency(userTotalDonation)}
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{creator.displayName}</h4>
                        {creator.isVerifiedCreator && (
                          <BadgeCheck className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{creator.username}</p>
                    </div>
                  </div>
                  {creator.bio && (
                    <div className="mb-4">
                      <p className={`text-gray-700 ${!bioExpanded && creator.bio.length > 150 ? 'line-clamp-3' : ''}`}>
                        {creator.bio}
                      </p>
                      {creator.bio.length > 150 && (
                        <button
                          onClick={() => setBioExpanded(!bioExpanded)}
                          className="text-orange-600 text-sm font-medium hover:text-orange-700 mt-1 flex items-center gap-1"
                        >
                          {bioExpanded ? (
                            <><ChevronUp className="w-4 h-4" /> Show less</>
                          ) : (
                            <><ChevronDown className="w-4 h-4" /> Read more</>
                          )}
                        </button>
                      )}
                    </div>
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

        {/* Image Lightbox */}
        <ImageLightbox
          images={getAllGalleryImages()}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    </div>
  );
}
