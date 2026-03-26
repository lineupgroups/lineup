import { useState } from 'react';
import { X, Users, Calendar, MapPin, Play, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { ProjectBasics, ProjectStory, calculatePlatformFee } from '../../types/projectCreation';
import FundBreakdownPieChart from '../project/FundBreakdownPieChart';

interface ProjectPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    projectData: {
        basics?: Partial<ProjectBasics>;
        story?: Partial<ProjectStory>;
    };
}

export default function ProjectPreview({ isOpen, onClose, projectData }: ProjectPreviewProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showVideo, setShowVideo] = useState(false);

    if (!isOpen) return null;

    const { basics, story } = projectData;
    const gallery = story?.gallery || [];
    const allImages = basics?.coverImage ? [basics.coverImage, ...gallery] : gallery;
    const fundingGoal = basics?.fundingGoal || 0;
    const platformFee = calculatePlatformFee(fundingGoal);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    // Extract YouTube video ID
    const getYouTubeId = (url?: string) => {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
        return match ? match[1] : null;
    };

    const videoId = getYouTubeId(basics?.videoUrl);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-black/80 to-transparent z-10 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white">
                    <Eye className="w-5 h-5" />
                    <span className="font-medium">Project Preview</span>
                    <span className="text-sm text-gray-300">(How supporters will see your project)</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Close preview"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto pb-20 px-4">
                {/* Cover Image / Gallery */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-800">
                    {showVideo && videoId ? (
                        <div className="aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                title="Project video"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : (
                        <>
                            <img
                                src={allImages[currentImageIndex] || '/placeholder-project.jpg'}
                                alt="Project"
                                className="w-full aspect-video object-cover"
                            />

                            {/* Video overlay button */}
                            {videoId && (
                                <button
                                    onClick={() => setShowVideo(true)}
                                    className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    Watch Video
                                </button>
                            )}

                            {/* Image navigation */}
                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {allImages.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                                    }`}
                                                aria-label={`Go to image ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Project Info */}
                <div className="bg-white rounded-xl p-6 mb-6">
                    {/* Category Badge */}
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-3">
                        {basics?.category || 'Category'}
                    </span>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {basics?.title || 'Project Title'}
                    </h1>

                    {/* Tagline */}
                    <p className="text-lg text-gray-600 mb-4">
                        {basics?.tagline || 'Your project tagline will appear here'}
                    </p>

                    {/* Location */}
                    {basics?.location?.city && basics?.location?.state && (
                        <div className="flex items-center gap-2 text-gray-500 mb-6">
                            <MapPin className="w-4 h-4" />
                            <span>{basics.location.city}, {basics.location.state}</span>
                        </div>
                    )}

                    {/* Tags */}
                    {basics?.tags && basics.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {basics.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Funding Progress */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>₹0 raised</span>
                            <span>0% of {formatCurrency(fundingGoal)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full w-0" />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>0 supporters</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{basics?.duration || 30} days</span>
                                </div>
                            </div>
                            <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium">
                                Back This Project
                            </button>
                        </div>
                    </div>

                    {/* Story Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About This Project</h2>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {story?.description || 'Your project description will appear here...'}
                        </div>
                    </div>

                    {/* Why It Matters */}
                    {story?.why && (
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Why This Matters</h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{story.why}</p>
                        </div>
                    )}

                    {/* Fund Breakdown */}
                    {story?.fundBreakdown && story.fundBreakdown.length > 0 && (
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">How Funds Will Be Used</h2>

                            {/* Pie Chart */}
                            <div className="mb-6">
                                <FundBreakdownPieChart breakdown={story.fundBreakdown} />
                            </div>

                            {/* List breakdown */}
                            <div className="space-y-3">
                                {story.fundBreakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">{item.item}</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-2 text-sm text-gray-500">
                                    <span>Platform Fee (5%)</span>
                                    <span>{formatCurrency(platformFee)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {story?.timeline && story.timeline.length > 0 && (
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Timeline</h2>
                            <div className="space-y-4">
                                {story.timeline.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-16 h-8 bg-orange-100 text-orange-800 rounded-lg flex items-center justify-center text-sm font-medium">
                                            Month {item.month}
                                        </div>
                                        <p className="text-gray-700">{item.milestone}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risks */}
                    {story?.risks && (
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Risks & Challenges</h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{story.risks}</p>
                        </div>
                    )}
                </div>

                {/* Preview Note */}
                <div className="text-center text-gray-400 text-sm">
                    This is a preview. Your project will look similar to this after approval.
                </div>
            </div>
        </div>
    );
}
