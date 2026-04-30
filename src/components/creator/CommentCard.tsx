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
            className={`bg-white/5 backdrop-blur-xl rounded-[2rem] border transition-all relative overflow-hidden group ${!comment.hasCreatorReply
                ? 'border-brand-orange/30 shadow-[0_0_20px_rgba(255,91,0,0.05)]'
                : 'border-white/10 hover:bg-white/10'
                }`}
        >
            {/* Status Indicator */}
            {!comment.hasCreatorReply ? (
                <div className="bg-brand-orange px-6 py-2.5">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-black">
                        <AlertCircle className="w-4 h-4" />
                        Pending Action Required
                    </span>
                </div>
            ) : (
                <div className="bg-brand-acid/10 border-b border-brand-acid/20 px-6 py-2.5">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-acid">
                        <CheckCircle className="w-4 h-4" />
                        Dialogue Complete
                    </span>
                </div>
            )}

            <div className="p-6">
                {/* Comment Header */}
                <div className="flex items-start gap-4 mb-6">
                    {comment.userAvatar ? (
                        <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <User className="w-6 h-6 text-neutral-600" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-black italic uppercase tracking-wider text-brand-white">@{comment.userName.replace(/\s+/g, '')}</span>
                            {comment.isSupporter && (
                                <span className="px-2 py-0.5 bg-brand-acid text-brand-black text-[8px] font-black uppercase tracking-widest rounded-full">
                                    Supporter
                                </span>
                            )}
                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-600">
                                {getTimeAgo(convertTimestamp(comment.createdAt))}
                            </span>
                        </div>
                        <Link
                            to={`/project/${comment.projectId}`}
                            className="inline-flex items-center gap-2 mt-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full hover:border-brand-orange/40 transition-all group/proj"
                        >
                            <FolderOpen className="w-3 h-3 text-brand-orange group-hover/proj:scale-110 transition-transform" />
                            <span className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 group-hover/proj:text-brand-orange">{comment.projectTitle}</span>
                        </Link>
                    </div>
                </div>

                {/* Comment Content */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6 relative overflow-hidden">
                    <p className="text-neutral-300 text-sm leading-relaxed relative z-10">{displayContent}</p>
                    {needsTruncation && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-brand-acid hover:text-brand-acid text-[10px] font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-2 relative z-10"
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    Condense
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3" />
                                    Read Full Dialogue
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Creator Reply (if exists) */}
                {comment.hasCreatorReply && comment.replyContent && (
                    <div className="ml-6 border-l-2 border-brand-acid/30 bg-brand-acid/5 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black italic uppercase tracking-widest text-brand-acid">Elite Response</span>
                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                                {comment.repliedAt && getTimeAgo(convertTimestamp(comment.repliedAt))}
                            </span>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed">{comment.replyContent}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                    {!comment.hasCreatorReply && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-brand-white text-[10px] font-black italic uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-[0_0_15px_rgba(255,91,0,0.2)] active:scale-95"
                        >
                            <Reply className="w-4 h-4" />
                            Synchronize
                        </button>
                    )}
                    <button
                        onClick={() => onPin?.(comment.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black italic uppercase tracking-widest rounded-xl transition-all border ${comment.isPinned
                            ? 'bg-brand-acid/10 border-brand-acid text-brand-acid'
                            : 'bg-white/5 border-white/5 text-neutral-500 hover:border-brand-acid hover:text-brand-acid'
                            }`}
                    >
                        <Pin className={`w-3.5 h-3.5 ${comment.isPinned ? 'fill-current' : ''}`} />
                        {comment.isPinned ? 'Elite' : 'Highlight'}
                    </button>

                    {/* Creator Heart Button */}
                    <button
                        onClick={() => onHeart?.(comment.id, !comment.creatorHeart)}
                        className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black italic uppercase tracking-widest rounded-xl transition-all border ${comment.creatorHeart
                            ? 'bg-brand-orange/10 border-brand-orange text-brand-orange'
                            : 'bg-white/5 border-white/5 text-neutral-500 hover:border-brand-orange hover:text-brand-orange'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${comment.creatorHeart ? 'fill-current' : ''}`} />
                        {comment.creatorHeart ? 'Hearted' : 'Endorse'}
                    </button>

                    <button
                        onClick={() => onLike?.(comment.id)}
                        className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/5 text-neutral-500 text-[10px] font-black italic uppercase tracking-widest rounded-xl hover:border-brand-acid hover:text-brand-acid transition-all"
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    {comment.hasCreatorReply && (
                        <Link
                            to={`/project/${comment.projectId}`}
                            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/5 text-neutral-500 text-[10px] font-black italic uppercase tracking-widest rounded-xl hover:text-brand-acid transition-all ml-auto"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Full Thread
                        </Link>
                    )}
                </div>

                {/* Reply Box */}
                {isReplying && (
                    <div className="mt-8 bg-brand-black/50 rounded-[1.5rem] p-6 border border-white/10 relative overflow-hidden group/reply">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none group-hover/reply:bg-brand-acid/10 transition-colors"></div>
                        
                        {/* Quick Templates */}
                        <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 whitespace-nowrap flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-brand-acid" />
                                Smart Templates:
                            </span>
                            {REPLY_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template.text)}
                                    className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-full text-neutral-400 hover:bg-brand-acid hover:text-brand-black hover:border-brand-acid transition-all whitespace-nowrap active:scale-95"
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Forge your response..."
                            rows={4}
                            className="w-full px-5 py-4 bg-brand-black/50 border border-white/10 rounded-[1.2rem] focus:ring-2 focus:ring-brand-acid focus:border-brand-acid text-brand-white placeholder-neutral-700 resize-none transition-all relative z-10"
                            autoFocus
                        />

                        {/* Reply Actions */}
                        <div className="flex items-center justify-end gap-4 mt-6 relative z-10">
                            <button
                                onClick={handleCancelReply}
                                className="px-6 py-3 text-neutral-500 text-[10px] font-black uppercase tracking-widest hover:text-brand-white transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmitReply}
                                disabled={!replyText.trim() || submittingReply}
                                className="flex items-center gap-3 px-8 py-3 bg-brand-acid text-brand-black text-[10px] font-black italic uppercase tracking-widest rounded-xl hover:bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all disabled:opacity-50 active:scale-95"
                            >
                                {submittingReply ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Sync Dialogue
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
