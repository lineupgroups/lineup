import { Eye, X, ThumbsUp, MessageSquare, Calendar, Edit3, Send, Clock } from 'lucide-react';

interface UpdatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onPost: () => void;
    title: string;
    content: string;
    image?: string;
    videoUrl?: string;
    isScheduled?: boolean;
    scheduledDate?: string;
    scheduledTime?: string;
    isPinned?: boolean;
    isSubmitting?: boolean;
}

// Helper to extract YouTube ID
const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Phase 3: Update Preview Modal
 * Shows how the update will appear to supporters before posting
 */
export default function UpdatePreviewModal({
    isOpen,
    onClose,
    onEdit,
    onPost,
    title,
    content,
    image,
    videoUrl,
    isScheduled = false,
    scheduledDate,
    scheduledTime,
    isPinned = false,
    isSubmitting = false
}: UpdatePreviewModalProps) {
    if (!isOpen) return null;

    const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;

    // Format scheduled date/time for display
    const getScheduledDisplay = () => {
        if (!scheduledDate || !scheduledTime) return null;
        const date = new Date(`${scheduledDate}T${scheduledTime}`);
        return date.toLocaleString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Preview Update</h2>
                            <p className="text-sm text-gray-600">This is how your update will appear to supporters</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Preview Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Update Card Preview */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {/* Pinned Badge */}
                        {isPinned && (
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2">
                                <div className="flex items-center space-x-2 text-white text-sm font-medium">
                                    <span>📌</span>
                                    <span>Pinned Update</span>
                                </div>
                            </div>
                        )}

                        {/* Scheduled Badge */}
                        {isScheduled && scheduledDate && scheduledTime && (
                            <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
                                <div className="flex items-center space-x-2 text-purple-700 text-sm font-medium">
                                    <Clock className="w-4 h-4" />
                                    <span>Scheduled for {getScheduledDisplay()}</span>
                                </div>
                            </div>
                        )}

                        <div className="p-6">
                            {/* Title and Meta */}
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {title || 'Untitled Update'}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Just now</span>
                                    </div>
                                    <span>•</span>
                                    <span>by You</span>
                                </div>
                            </div>

                            {/* Video Embed Preview */}
                            {youtubeId && (
                                <div className="relative pt-[56.25%] mb-4 bg-black rounded-lg overflow-hidden">
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={`https://www.youtube.com/embed/${youtubeId}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}

                            {/* Image Preview */}
                            {image && (
                                <img
                                    src={image}
                                    alt="Update preview"
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                            )}

                            {/* Content */}
                            <div className="prose prose-sm max-w-none">
                                <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: content || '<em>No content</em>' }}
                                />
                            </div>

                            {/* Engagement Stats (Mock) */}
                            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <ThumbsUp className="w-5 h-5" />
                                    <span className="text-sm">0 likes</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <MessageSquare className="w-5 h-5" />
                                    <span className="text-sm">0 comments</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> Only supporters who have backed your project will see this update.
                        </p>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                        disabled={isSubmitting}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onPost}
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            <span>
                                {isSubmitting
                                    ? (isScheduled ? 'Scheduling...' : 'Posting...')
                                    : (isScheduled ? 'Schedule Update' : 'Post Update')
                                }
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
