import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    User,
    FolderOpen,
    Reply,
    Pin,
    ThumbsUp,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Send,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Heart
} from 'lucide-react';
import { CreatorComment } from '../../hooks/useCreatorComments';
import { convertTimestamp } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';

// Reply templates
const REPLY_TEMPLATES = [
    { id: 'thank_you', label: 'Thank You 🙏', text: 'Thank you for your support! 🙏 It means a lot to us.' },
    { id: 'great_question', label: 'Great Question', text: 'Great question! Let me explain...' },
    { id: 'working_on_it', label: 'Working On It', text: "We're working on it and will share an update soon!" },
    { id: 'check_update', label: 'Check Update', text: 'Check out our latest update for more details on this!' },
    { id: 'appreciate', label: 'Appreciate It', text: 'We really appreciate your feedback! 💛' }
];

// Maximum characters before truncation
const MAX_CONTENT_LENGTH = 250;

// Get time ago string
const getTimeAgo = (date: Date | null): string => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

interface CommentCardProps {
    comment: CreatorComment;
    onReply: (commentId: string, replyText: string) => Promise<void>;
    onPin?: (commentId: string) => Promise<void>;
    onLike?: (commentId: string) => Promise<void>;
    onHeart?: (commentId: string, giveHeart: boolean) => Promise<void>;
}

export default function CommentCard({ comment, onReply, onPin, onLike, onHeart }: CommentCardProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Check if content needs truncation
    const needsTruncation = comment.content.length > MAX_CONTENT_LENGTH;
    const displayContent = needsTruncation && !expanded
        ? comment.content.substring(0, MAX_CONTENT_LENGTH) + '...'
        : comment.content;

    // Handle template selection
    const handleTemplateSelect = (templateText: string) => {
        setReplyText(templateText);
    };

    // Handle reply submission
    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;

        setSubmittingReply(true);
        try {
            await onReply(comment.id, replyText.trim());
            setIsReplying(false);
            setReplyText('');
        } catch (err) {
            console.error('Error sending reply:', err);
        } finally {
            setSubmittingReply(false);
        }
    };

    // Handle cancel reply
    const handleCancelReply = () => {
        setIsReplying(false);
        setReplyText('');
    };

    return (
        <div
            className={`bg-white rounded-xl border transition-all ${!comment.hasCreatorReply
                ? 'border-red-200 shadow-sm ring-1 ring-red-100'
                : 'border-gray-200 hover:shadow-md'
                }`}
        >
            {/* Status Badge */}
            {!comment.hasCreatorReply && (
                <div className="bg-red-50 border-b border-red-100 px-4 py-2 rounded-t-xl">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        NEW - Needs Reply
                    </span>
                </div>
            )}
            {comment.hasCreatorReply && (
                <div className="bg-green-50 border-b border-green-100 px-4 py-2 rounded-t-xl">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Replied
                    </span>
                </div>
            )}

            <div className="p-4">
                {/* Comment Header */}
                <div className="flex items-start gap-3 mb-3">
                    {comment.userAvatar ? (
                        <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{comment.userName}</span>
                            {comment.isSupporter && (
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                    Supporter
                                </span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                                {getTimeAgo(convertTimestamp(comment.createdAt))}
                            </span>
                        </div>
                        <Link
                            to={`/project/${comment.projectId}`}
                            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-0.5"
                        >
                            <FolderOpen className="w-3.5 h-3.5" />
                            {comment.projectTitle}
                        </Link>
                    </div>
                </div>

                {/* Comment Content */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-gray-800 whitespace-pre-wrap">{displayContent}</p>
                    {needsTruncation && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2 flex items-center gap-1"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Read more
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Creator Reply (if exists) */}
                {comment.hasCreatorReply && comment.replyContent && (
                    <div className="ml-8 border-l-4 border-orange-300 bg-orange-50 rounded-r-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-orange-600">Your Reply</span>
                            <span className="text-xs text-gray-500">
                                {comment.repliedAt && getTimeAgo(convertTimestamp(comment.repliedAt))}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.replyContent}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {!comment.hasCreatorReply && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            <Reply className="w-4 h-4" />
                            Reply
                        </button>
                    )}
                    <button
                        onClick={() => onPin?.(comment.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${comment.isPinned
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Pin className={`w-4 h-4 ${comment.isPinned ? 'fill-current' : ''}`} />
                        {comment.isPinned ? 'Pinned' : 'Pin'}
                    </button>

                    {/* Creator Heart Button - Like YouTube's feature */}
                    <button
                        onClick={() => onHeart?.(comment.id, !comment.creatorHeart)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${comment.creatorHeart
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-500'
                            }`}
                        title={comment.creatorHeart ? 'Remove heart' : 'Give heart'}
                    >
                        <Heart className={`w-4 h-4 ${comment.creatorHeart ? 'fill-current' : ''}`} />
                        {comment.creatorHeart ? 'Hearted' : 'Heart'}
                    </button>

                    <button
                        onClick={() => onLike?.(comment.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ThumbsUp className="w-4 h-4" />
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    {comment.hasCreatorReply && (
                        <Link
                            to={`/project/${comment.projectId}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors ml-auto"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Thread
                        </Link>
                    )}
                </div>

                {/* Reply Box */}
                {isReplying && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Quick Templates */}
                        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                Quick:
                            </span>
                            {REPLY_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template.text)}
                                    className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors whitespace-nowrap"
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                            autoFocus
                        />

                        {/* Reply Actions */}
                        <div className="flex items-center justify-end gap-2 mt-3">
                            <button
                                onClick={handleCancelReply}
                                className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReply}
                                disabled={!replyText.trim() || submittingReply}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingReply ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Send Reply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
