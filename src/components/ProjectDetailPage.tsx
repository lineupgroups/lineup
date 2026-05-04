import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BackProjectModal from './payments/BackProjectModal';
import { ArrowLeft, ArrowRight, BadgeCheck, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ZoomIn, Play, MapPin } from 'lucide-react';
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
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
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
    <div className="min-h-screen bg-brand-black font-sans">
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
            className="inline-flex items-center space-x-2 text-neutral-400 hover:text-brand-acid transition-all duration-300 group"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Project Header */}
            <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 mb-6">


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
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 relative group border border-neutral-800">
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
                                  ? 'bg-brand-orange text-white'
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
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-black shadow-lg backdrop-blur-md ${getStatusColor(projectStatus.status)} bg-black/60 border border-neutral-700`}>
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
                          <span className="inline-flex items-center px-3 py-1.5 bg-brand-orange text-white rounded-full text-sm font-black shadow-lg border border-brand-orange/50">
                            {project.category}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Project Title & Tagline */}
              <h1 className="text-2xl sm:text-3xl font-black text-brand-white mb-3 tracking-tight">{project.title}</h1>
              <p className="text-lg text-neutral-400 mb-4">{project.tagline}</p>

              {/* Location Indicator */}
              {project.location && (
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-6">
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
              <div className="border-t border-neutral-800 pt-6">
                {/* Top Row: Creator + Verified Badge + Stats */}
                <div className="flex items-center justify-between mb-4">
                  {/* Creator Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {loadingCreator ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-800 rounded-full animate-pulse flex-shrink-0" />
                        <div>
                          <div className="h-4 bg-neutral-800 rounded w-24 mb-1.5 animate-pulse" />
                          <div className="h-3 bg-neutral-800 rounded w-16 animate-pulse" />
                        </div>
                      </div>
                    ) : creatorError ? (
                      <div className="text-brand-orange text-sm">{creatorError}</div>
                    ) : creator ? (
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-white/5 py-1.5 px-2 -ml-2 rounded-xl transition-all duration-300 min-w-0"
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
                            <h3 className="font-black italic uppercase tracking-tight text-brand-white truncate max-w-[150px] sm:max-w-[200px]">
                              {creator.displayName}
                            </h3>
                            {creator.isVerifiedCreator && (
                              <BadgeCheck className="w-4 h-4 text-brand-acid flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 truncate">@{creator.username}</p>
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
            <div className="bg-[#111] rounded-[2.5rem] border border-neutral-800 mb-8">
              <div className="px-8 pt-8 pb-2">
                <div
                  className="flex items-center gap-2 flex-nowrap pb-4 border-b border-neutral-800/30"
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
                      className={`px-6 py-2.5 rounded-full text-[10px] font-black italic uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap focus:outline-none ${activeTab === tab.id
                        ? 'bg-brand-acid text-brand-black'
                        : 'text-neutral-500 hover:text-brand-white'
                        }`}
                      onClick={() => handleTabChange(tab.id)}
                      onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
                    <div className="prose max-w-none space-y-8">
                      {/* About Section */}
                      <div>
                        <div className="mb-8">
                          <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-brand-acid" />
                            Core Protocol
                          </h3>
                          <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">About This Project</h4>
                        </div>
                        <div className="whitespace-pre-wrap text-neutral-300 leading-relaxed">
                          {project.description}
                        </div>
                      </div>

                      {/* Why This Matters Section */}
                      {project.story?.why && (
                        <div>
                          <div className="mb-8">
                            <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                              <span className="w-8 h-[2px] bg-brand-acid" />
                              Impact Intel
                            </h3>
                            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Why This Matters</h4>
                          </div>
                          <div className="whitespace-pre-wrap text-neutral-300 leading-relaxed">
                            {project.story.why}
                          </div>
                        </div>
                      )}

                      {/* Fund Breakdown Section - Pie Chart */}
                      {project.story?.fundBreakdown && project.story.fundBreakdown.length > 0 && (
                        <div>
                          <div className="mb-8">
                            <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                              <span className="w-8 h-[2px] bg-brand-acid" />
                              Fund Strategy
                            </h3>
                            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Budget Breakdown</h4>
                          </div>
                          <FundBreakdownPieChart breakdown={project.story.fundBreakdown} />
                        </div>
                      )}

                      {/* Project Gallery */}
                      {project.gallery && project.gallery.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                           <div className="mb-8">
                             <div className="flex items-center justify-between mb-2">
                               <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 flex items-center gap-3">
                                 <span className="w-8 h-[2px] bg-brand-acid" />
                                 Visual Assets
                               </h3>
                               <span className="text-[10px] font-black italic uppercase tracking-[0.1em] text-neutral-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{project.gallery.length} frames</span>
                             </div>
                             <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Project Gallery</h4>
                           </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {project.gallery.map((image: string, index: number) => (
                              <div
                                key={index}
                                className="relative group cursor-pointer aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800"
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
                          <div className="mb-8">
                            <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                              <span className="w-8 h-[2px] bg-brand-acid" />
                              Operational Sync
                            </h3>
                            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Execution Roadmap</h4>
                          </div>
                          <div className="space-y-4">
                            {project.story.timeline.map((item: { month: number; milestone: string }, index: number) => (
                              <div key={index} className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-24 h-12 bg-gradient-to-r from-brand-orange/20 to-brand-orange/10 text-brand-orange font-black rounded-xl flex items-center justify-center text-sm border border-brand-orange/20">
                                  Month {item.month}
                                </div>
                                <div className="flex-1 pt-2">
                                  <p className="text-neutral-300">{item.milestone}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risks & Challenges Section */}
                      {project.story?.risks && (
                        <div>
                           <div className="mb-8">
                             <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                               <span className="w-8 h-[2px] bg-brand-acid" />
                               Stability Check
                             </h3>
                             <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Risks & Challenges</h4>
                           </div>
                          <div className="whitespace-pre-wrap text-neutral-300 bg-neutral-800/50 border border-neutral-700 rounded-2xl p-5 leading-relaxed">
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
                      <div className="mb-8">
                        <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                          <span className="w-8 h-[2px] bg-brand-acid" />
                          Support Node
                        </h3>
                        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Common Inquiries</h4>
                      </div>
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
                    <div className="mb-8">
                      <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-brand-acid" />
                        Live Feed
                      </h3>
                      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Project Updates</h4>
                    </div>
                    <UpdatesSection projectId={project.id} creatorId={creatorId} creatorAvatar={(creator as any)?.profileImage || creator?.photoURL || undefined} projectTitle={project.title} />
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div role="tabpanel" id="comments-panel" aria-labelledby="comments-tab">
                    <div className="mb-8">
                      <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-brand-acid" />
                        Community Pulse
                      </h3>
                      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Discussion</h4>
                    </div>
                    <CommentsSection projectId={project.id} creatorId={creatorId} creatorAvatar={(creator as any)?.profileImage || creator?.photoURL || undefined} />
                  </div>
                )}

                {/* Supporters Tab */}
                {activeTab === 'supporters' && (
                  <div role="tabpanel" id="supporters-panel" aria-labelledby="supporters-tab">
                    <div className="mb-8">
                      <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-brand-acid" />
                        Backer Network
                      </h3>
                      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Supporters ({displayProject.supporters})</h4>
                    </div>
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
              <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                {/* Subtle gradient overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-orange/5 to-transparent rounded-bl-full pointer-events-none" />

                {/* Project Status Badge - Only show if NOT active */}
                {projectStatus.status !== 'active' && (
                  <div className="mb-4 relative">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-black ${getStatusColor(projectStatus.status)}`}>
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
                  <div className="mt-4 p-3 bg-neutral-800/50 border border-neutral-700 rounded-2xl text-center">
                    <p className="text-sm font-bold text-neutral-300">
                      This project has ended
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Donations are no longer accepted
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {projectStatus.isExpired && projectStatus.isSuccessful && (
                  <div className="mt-4 p-3 bg-brand-acid/10 border border-brand-acid/30 rounded-2xl text-center">
                    <p className="text-sm font-black text-brand-acid">
                      🎉 Project Successfully Funded!
                    </p>
                    <p className="text-xs text-brand-acid/70 mt-1">
                      This project has reached its goal
                    </p>
                  </div>
                )}

                {/* Back Project Button - Only for active projects */}
                {!projectStatus.isExpired && (
                  <button
                    onClick={() => setIsBackModalOpen(true)}
                    className="w-full bg-gradient-to-r from-brand-orange to-[#ff7529] text-brand-black py-3.5 px-4 rounded-2xl font-black text-base hover:shadow-[0_0_25px_rgba(255,91,0,0.3)] transition-all duration-300 text-center block mt-6 uppercase tracking-wider active:scale-[0.98]"
                    aria-label="Support this project"
                  >
                    Back This Project
                  </button>
                )}
              </div>

              {/* Creator Card */}
              {creator && (
                <div className="bg-[#111] rounded-[2.5rem] border border-neutral-800 p-8 relative overflow-hidden group transition-all duration-500 hover:border-brand-acid/30 hover:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  {/* Luxury Background Accents */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-acid/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-brand-acid/10 transition-all duration-1000" />
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="mb-10">
                      <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-brand-acid" />
                        Master Intelligence
                      </h3>
                      <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">About The Creator</h4>
                    </div>
                    
                    <div className="flex items-center gap-5 mb-8">
                      <div className="relative flex-shrink-0">
                        <UserProfilePicture
                          user={creator}
                          size="xl"
                          className="w-20 h-20 ring-4 ring-brand-acid ring-offset-4 ring-offset-brand-black shadow-[0_0_20px_rgba(204,255,0,0.1)] group-hover:shadow-[0_0_30px_rgba(204,255,0,0.2)] transition-all duration-500"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-acid rounded-full border-4 border-[#111] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-brand-black rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black italic uppercase tracking-tighter text-brand-white text-2xl leading-none truncate">
                            {creator.displayName}
                          </h4>
                          {creator.isVerifiedCreator && (
                            <BadgeCheck className="w-5 h-5 text-brand-acid fill-brand-acid/10 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">@{creator.username}</p>
                      </div>
                    </div>
                    
                    {creator.bio && (
                      <div className="mb-8 relative">
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-brand-acid/30 to-transparent rounded-full" />
                        <div className="pl-6">
                          <p className={`text-neutral-400 text-sm leading-relaxed font-medium italic ${!bioExpanded && creator.bio.length > 150 ? 'line-clamp-3' : ''}`}>
                            "{creator.bio}"
                          </p>
                          {creator.bio.length > 150 && (
                            <button
                              onClick={() => setBioExpanded(!bioExpanded)}
                              className="text-brand-acid text-[9px] font-black italic uppercase tracking-[0.2em] hover:text-brand-white mt-4 flex items-center gap-2 transition-all group/bio"
                            >
                              <div className="w-4 h-px bg-brand-acid group-hover:w-8 transition-all" />
                              {bioExpanded ? 'Collapse Data' : 'Expand Intelligence'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleCreatorNavigation}
                      className="w-full bg-brand-acid text-brand-black py-4 px-6 rounded-[1.25rem] font-black italic uppercase tracking-[0.2em] text-[11px] hover:bg-[#b3e600] transition-all duration-500 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(204,255,0,0.1)] hover:shadow-[0_0_35px_rgba(204,255,0,0.3)] active:scale-[0.96] group/btn"
                    >
                      Connect with Creator
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                    </button>
                  </div>
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
