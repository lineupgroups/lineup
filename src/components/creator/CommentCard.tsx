import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    User,
    Reply,
    Pin,
    ThumbsUp,
    ExternalLink,
    Send,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Heart,
    Zap,
    MessageCircle,
    Target,
    MoreVertical,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { CreatorComment } from '../../hooks/useCreatorComments';
import { convertTimestamp } from '../../lib/firestore';
import LoadingSpinner from '../common/LoadingSpinner';

// Reply templates
const REPLY_TEMPLATES = [
    { id: 'thank_you', label: 'THANK YOU 🙏', text: 'Thank you for your support! 🙏 It means a lot to us.' },
    { id: 'great_question', label: 'GREAT QUESTION', text: 'Great question! Let me explain...' },
    { id: 'working_on_it', label: 'WORKING ON IT', text: "We're working on it and will share an update soon!" },
    { id: 'check_update', label: 'CHECK UPDATE', text: 'Check out our latest update for more details on this!' },
    { id: 'appreciate', label: 'APPRECIATE IT', text: 'We really appreciate your feedback! 💛' }
];

const MAX_CONTENT_LENGTH = 180;

const getTimeAgo = (date: Date | null): string => {
    if (!date) return 'UNKNOWN';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}M`;
    if (diffHours < 24) return `${diffHours}H`;
    if (diffDays < 7) return `${diffDays}D`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase();
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

    const needsTruncation = comment.content.length > MAX_CONTENT_LENGTH;
    const displayContent = needsTruncation && !expanded
        ? comment.content.substring(0, MAX_CONTENT_LENGTH) + '...'
        : comment.content;

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;
        setSubmittingReply(true);
        try {
            await onReply(comment.id, replyText.trim());
            setIsReplying(false);
            setReplyText('');
        } catch (err) { console.error(err); }
        finally { setSubmittingReply(false); }
    };

    return (
        <div className={`group relative w-full bg-white/[0.015] hover:bg-white/[0.03] border-b border-white/5 transition-all duration-300 p-6 md:p-8 ${!comment.hasCreatorReply ? 'border-l-4 border-l-brand-orange/40' : ''}`}>
            <div className="flex gap-6">
                {/* Compact Left: Avatar */}
                <div className="flex-shrink-0">
                    <div className="relative">
                        {comment.userAvatar ? (
                            <img src={comment.userAvatar} alt="" className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10" />
                        ) : (
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                <User className="w-6 h-6 text-neutral-600" />
                            </div>
                        )}
                        {comment.creatorHeart && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-orange rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
                                <Heart className="w-2.5 h-2.5 text-white fill-current" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Everything else */}
                <div className="flex-1 min-w-0 pt-0.5">
                    {/* Compact Header */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm font-black italic uppercase tracking-wider text-brand-white">@{comment.userName.replace(/\s+/g, '').toUpperCase()}</span>
                        {comment.isSupporter && (
                            <span className="px-2 py-0.5 bg-brand-acid/10 text-brand-acid text-[8px] font-black uppercase tracking-widest rounded-md border border-brand-acid/20">SUPPORTER</span>
                        )}
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{getTimeAgo(convertTimestamp(comment.createdAt))}</span>
                        
                        <div className="flex-1"></div>
                        
                        {!comment.hasCreatorReply ? (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">
                                <AlertCircle className="w-3 h-3" /> PENDING
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-acid/10 text-brand-acid text-[8px] font-black uppercase tracking-widest rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> SYNCED
                            </span>
                        )}
                        
                        <Link to={`/project/${comment.projectId}`} className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full hover:border-brand-orange transition-all group/proj">
                            <Target className="w-3 h-3 text-brand-orange" />
                            <span className="text-[8px] font-black italic uppercase tracking-widest text-neutral-500 group-hover/proj:text-brand-orange truncate max-w-[120px]">{comment.projectTitle}</span>
                        </Link>
                    </div>

                    {/* Content: Clean text, no box */}
                    <div className="mb-4">
                        <p className="text-base text-neutral-300 font-medium leading-relaxed">{displayContent}</p>
                        {needsTruncation && (
                            <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[10px] font-black italic uppercase tracking-widest text-brand-acid hover:text-white transition-colors">
                                {expanded ? 'CONDENSE' : 'READ MORE'}
                            </button>
                        )}
                    </div>

                    {/* Actions Row: YouTube Style */}
                    <div className="flex items-center gap-8 mb-4">
                        <button onClick={() => onLike?.(comment.id)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${comment.likes > 0 ? 'text-brand-acid' : 'text-neutral-500 hover:text-brand-white'}`}>
                            <ThumbsUp className={`w-3.5 h-3.5 ${comment.likes > 0 ? 'fill-current' : ''}`} />
                            <span>{comment.likes || 0}</span>
                        </button>

                        <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-brand-acid transition-all">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>REPLY</span>
                        </button>

                        <button onClick={() => onHeart?.(comment.id, !comment.creatorHeart)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${comment.creatorHeart ? 'text-brand-orange' : 'text-neutral-500 hover:text-brand-orange'}`}>
                            <Heart className={`w-3.5 h-3.5 ${comment.creatorHeart ? 'fill-current' : ''}`} />
                            <span>HEART</span>
                        </button>

                        <button onClick={() => onPin?.(comment.id)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${comment.isPinned ? 'text-brand-acid' : 'text-neutral-500 hover:text-brand-acid'}`}>
                            <Pin className={`w-3.5 h-3.5 ${comment.isPinned ? 'fill-current' : ''}`} />
                            <span>PIN</span>
                        </button>

                        <Link to={`/project/${comment.projectId}`} className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-brand-white transition-all">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Elite Response: Slim nested list item style */}
                    {comment.hasCreatorReply && comment.replyContent && (
                        <div className="mt-4 pl-6 border-l-2 border-brand-acid/20 animate-in slide-in-from-left-2 duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Zap className="w-3 h-3 text-brand-acid fill-current" />
                                <span className="text-[10px] font-black italic uppercase tracking-widest text-brand-acid">CREATOR REPLY</span>
                                <span className="text-[9px] font-black text-neutral-600 tracking-widest">{comment.repliedAt && getTimeAgo(convertTimestamp(comment.repliedAt))}</span>
                            </div>
                            <p className="text-sm text-neutral-400 font-medium leading-relaxed">{comment.replyContent}</p>
                        </div>
                    )}

                    {/* Compact Reply Box */}
                    {isReplying && (
                        <div className="mt-6 bg-[#0F0F0F] rounded-2xl p-6 border border-white/5 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                {REPLY_TEMPLATES.map(template => (
                                    <button key={template.id} onClick={() => setReplyText(template.text)} className="px-4 py-1.5 text-[8px] font-black italic uppercase tracking-widest bg-white/5 border border-white/5 rounded-full text-neutral-400 hover:bg-brand-acid hover:text-brand-black transition-all whitespace-nowrap">
                                        {template.label}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="SYNC DIALOGUE..."
                                rows={2}
                                className="w-full px-0 py-3 bg-transparent border-b border-white/10 focus:border-brand-acid text-base text-brand-white placeholder-neutral-700 resize-none transition-all outline-none"
                                autoFocus
                            />
                            <div className="flex items-center justify-end gap-6 mt-4">
                                <button onClick={() => { setIsReplying(false); setReplyText(''); }} className="text-[9px] font-black uppercase tracking-widest text-neutral-600 hover:text-white">DISCARD</button>
                                <button onClick={handleSubmitReply} disabled={!replyText.trim() || submittingReply} className="flex items-center gap-3 px-6 py-2.5 bg-brand-acid text-brand-black text-[9px] font-black italic uppercase tracking-widest rounded-xl hover:bg-[#B3E600] disabled:opacity-50">
                                    {submittingReply ? <LoadingSpinner size="sm" /> : <Send className="w-3 h-3" />} DISPATCH
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
