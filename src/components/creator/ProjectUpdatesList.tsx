import { useState, useMemo } from 'react';
import {
  Edit3, Trash2, Pin, MessageSquare, ThumbsUp, Calendar, MoreVertical,
  Eye, Share2, Clock, TrendingUp, ChevronDown, ChevronUp, Link2, Check,
  Twitter, Facebook, Linkedin, Copy, Search, Filter, Zap, Target, Activity
} from 'lucide-react';
import { FirestoreProjectUpdate } from '../../types/firestore';
import { convertTimestamp } from '../../lib/firestore';
import { sanitizeAndProcessHTML } from '../../lib/sanitize';
import UpdateComments from '../updates/UpdateComments';
import { UpdatesListSkeleton } from '../common/UpdatesSkeleton';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';

interface ProjectUpdatesListProps {
  updates: FirestoreProjectUpdate[];
  loading: boolean;
  onEdit: (update: FirestoreProjectUpdate) => void;
  onDelete: (updateId: string) => void;
  onPin: (updateId: string, isPinned: boolean) => void;
  isCreator?: boolean;
  showInlineStats?: boolean;
  projectId?: string;
  creatorId?: string;
  creatorAvatar?: string;
  projectTitle?: string;
}

// Helper to extract YouTube ID
const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function ProjectUpdatesList({
  updates,
  loading,
  onEdit,
  onDelete,
  onPin,
  isCreator = false,
  showInlineStats = true,
  projectId,
  creatorId,
  creatorAvatar,
  projectTitle
}: ProjectUpdatesListProps) {
  const [expandedUpdateId, setExpandedUpdateId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy link and share states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');

  // Filter and sort updates
  const filteredAndSortedUpdates = useMemo(() => {
    let result = [...updates];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.title.toLowerCase().includes(query) ||
        u.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      // Pinned always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortOrder) {
        case 'oldest':
          return convertTimestamp(a.createdAt).getTime() - convertTimestamp(b.createdAt).getTime();
        case 'popular':
          return ((b.likes || 0) + (b.commentCount || 0) * 2) - ((a.likes || 0) + (a.commentCount || 0) * 2);
        case 'newest':
        default:
          return convertTimestamp(b.createdAt).getTime() - convertTimestamp(a.createdAt).getTime();
      }
    });

    return result;
  }, [updates, searchQuery, sortOrder]);

  // Use skeleton loading
  if (loading) {
    return <UpdatesListSkeleton count={3} />;
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-acid/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Zap className="w-10 h-10 text-neutral-700" />
          </div>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white mb-4">
            NO DISPATCHES <span className="text-neutral-500">FOUND</span>
          </h3>
          <p className="text-neutral-500 max-w-md mx-auto text-[10px] font-black uppercase tracking-[0.3em]">
            {isCreator
              ? 'INITIALIZE BROADCAST TO UPDATE YOUR SYSTEM'
              : 'CREATOR HAS NOT INITIALIZED ANY BROADCASTS YET'}
          </p>
        </div>
      </div>
    );
  }

  const toggleContent = (updateId: string) => {
    setExpandedUpdateId(expandedUpdateId === updateId ? null : updateId);
  };

  const toggleMenu = (updateId: string) => {
    setMenuOpen(menuOpen === updateId ? null : updateId);
  };

  const handleDeleteClick = (updateId: string) => {
    setPendingDeleteId(updateId);
    setDeleteModalOpen(true);
    setMenuOpen(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setIsDeleting(true);
      await onDelete(pendingDeleteId);
      setDeleteModalOpen(false);
      setPendingDeleteId(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async (updateId: string, _title?: string) => {
    const url = projectId
      ? `${window.location.origin}/project/${projectId}#update-${updateId}`
      : `${window.location.origin}/dashboard/updates#${updateId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(updateId);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin', updateId: string, title: string) => {
    const url = encodeURIComponent(`${window.location.origin}/updates/${updateId}`);
    const text = encodeURIComponent(title);
    let shareUrl = '';
    switch (platform) {
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShareMenuOpen(null);
  };

  const getTimeAgo = (date: Date): string => {
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

  return (
    <div className="space-y-10">
      {/* Search and Sort - Tactical Dashboard */}
      {isCreator && updates.length > 3 && (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group/controls">
           <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl group-hover/controls:bg-brand-acid/10 transition-colors"></div>
           
           <div className="flex flex-col lg:flex-row gap-6 relative z-10">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-brand-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid text-brand-white placeholder-neutral-600 text-sm font-medium transition-all"
              />
            </div>
            
            {/* Filter Pill */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-3 bg-brand-black/40 border border-white/10 rounded-xl">
                <Filter className="w-4 h-4 text-brand-acid" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                  className="bg-transparent border-none focus:ring-0 text-brand-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer outline-none min-w-[140px]"
                >
                  <option value="newest" className="bg-brand-black">NEWEST FIRST</option>
                  <option value="oldest" className="bg-brand-black">OLDEST FIRST</option>
                  <option value="popular" className="bg-brand-black">MOST POPULAR</option>
                </select>
              </div>
            </div>
          </div>
          
          {searchQuery && (
            <p className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-500 mt-6 pl-2">
              FOUND <span className="text-brand-acid">{filteredAndSortedUpdates.length}</span> DISPATCHES MATCHING KEYWORD
            </p>
          )}
        </div>
      )}

      {/* Stats Summary - Redesigned as Tactical Telemetry */}
      {isCreator && showInlineStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:border-brand-acid/30 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-acid/5 rounded-full blur-3xl group-hover:bg-brand-acid/10 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-400">Total Updates</p>
                <div className="p-2 bg-brand-acid/10 rounded-xl text-brand-acid">
                    <TrendingUp className="w-5 h-5" />
                </div>
            </div>
            <h4 className="text-3xl font-bold text-brand-white tracking-tight">{updates.length}</h4>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:border-brand-orange/30 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-3xl group-hover:bg-brand-orange/10 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-400">Engagement</p>
                <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
                    <Activity className="w-5 h-5" />
                </div>
            </div>
            <h4 className="text-3xl font-bold text-brand-white tracking-tight">
              {updates.reduce((acc, u) => acc + (u.likes || 0) + (u.commentCount || 0), 0)}
            </h4>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:border-brand-acid/30 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-acid/5 rounded-full blur-3xl group-hover:bg-brand-acid/10 transition-all"></div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-400">Pinned</p>
                <div className="p-2 bg-brand-acid/10 rounded-xl text-brand-acid">
                    <Pin className="w-5 h-5" />
                </div>
            </div>
            <h4 className="text-3xl font-bold text-brand-white tracking-tight">
              {updates.filter(u => u.isPinned).length}
            </h4>
          </div>
        </div>
      )}

      {/* Main Updates Stream */}
      <div className="grid grid-cols-1 gap-12">
        {filteredAndSortedUpdates.map((update) => {
          const isExpanded = expandedUpdateId === update.id;
          const isMenuOpen = menuOpen === update.id;
          const videoUrl = (update as any).videoUrl;
          const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
          const isScheduled = (update as any).scheduledFor && new Date((update as any).scheduledFor) > new Date();

          return (
            <div
              key={update.id}
              className={`
                bg-[#111] rounded-3xl border transition-all duration-500 relative group/card overflow-hidden
                ${update.isPinned 
                  ? 'border-brand-acid/50 shadow-[0_0_30px_rgba(204,255,0,0.1)]' 
                  : 'border-neutral-800 hover:border-brand-acid/30 hover:shadow-[0_0_40px_rgba(204,255,0,0.05)]'}
              `}
            >
              {/* Subtle Corner Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-acid/5 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>
              
              {/* Card Header & Status */}
              <div className="relative">
                {update.isPinned && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-acid text-brand-black text-xs font-bold rounded-bl-2xl z-20">
                    <div className="flex items-center gap-1.5">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                      <span>Pinned</span>
                    </div>
                  </div>
                )}
                
                {isScheduled && (
                  <div className="absolute top-0 left-0 px-8 py-3 bg-brand-orange text-brand-white text-[10px] font-black italic uppercase tracking-[0.3em] rounded-br-[2rem] z-20">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>DISPATCH QUEUED: {new Date((update as any).scheduledFor).toLocaleString('en-IN').toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                {/* Information Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <span className="text-xs font-medium text-neutral-400">
                          ID: {update.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="h-px w-6 bg-white/10"></div>
                      <span className="text-xs font-bold text-brand-acid">
                        {getTimeAgo(convertTimestamp(update.createdAt))}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-bold text-brand-white tracking-tight leading-tight mb-4">
                      {update.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-orange" />
                        <span>{convertTimestamp(update.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {update.updatedAt && (
                        <div className="flex items-center gap-1.5 text-brand-acid">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edited</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Creator Actions Menu */}
                  {isCreator && (
                    <div className="relative self-start">
                      <button
                        onClick={() => toggleMenu(update.id)}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-brand-acid hover:text-brand-black transition-all group/menu"
                      >
                        <MoreVertical className="w-6 h-6 text-neutral-400 group-hover/menu:text-brand-black transition-colors" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-4 w-64 bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-300">
                            <button
                              onClick={() => { onEdit(update); setMenuOpen(null); }}
                              className="w-full flex items-center gap-4 px-6 py-5 text-left text-[11px] font-black italic uppercase tracking-widest text-neutral-300 hover:bg-brand-acid hover:text-brand-black transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>MODULATE DISPATCH</span>
                            </button>
                            <button
                              onClick={() => { onPin(update.id, !update.isPinned); setMenuOpen(null); }}
                              className={`w-full flex items-center gap-4 px-6 py-5 text-left text-[11px] font-black italic uppercase tracking-widest transition-all ${update.isPinned ? 'text-brand-orange bg-brand-orange/5 hover:bg-brand-orange hover:text-brand-white' : 'text-neutral-300 hover:bg-brand-acid hover:text-brand-black'}`}
                            >
                              <Pin className="w-4 h-4" />
                              <span>{update.isPinned ? 'UNSET HIGHLIGHT' : 'SET AS HIGHLIGHT'}</span>
                            </button>
                            <div className="h-px bg-white/5 mx-6" />
                            <button
                              onClick={() => handleDeleteClick(update.id)}
                              className="w-full flex items-center gap-4 px-6 py-5 text-left text-[11px] font-black italic uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>TERMINATE DISPATCH</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Tactical Media Section */}
                {(youtubeId || update.image) && (
                  <div className="grid grid-cols-1 gap-8 mb-12">
                    {youtubeId && (
                      <div className="relative pt-[56.25%] bg-black rounded-[2.5rem] overflow-hidden border border-white/10 group/video shadow-2xl">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full grayscale-[0.2] group-hover/video:grayscale-0 transition-all duration-700"
                          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&showinfo=0`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {update.image && (
                      <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group/image">
                        <img
                          src={update.image}
                          alt={update.title}
                          className="w-full h-auto max-h-[600px] object-cover grayscale-[0.3] group-hover/image:grayscale-0 group-hover/image:scale-105 transition-all duration-1000"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Narrative Content */}
                <div className="relative">
                   <div className={`prose prose-invert max-w-none transition-all duration-700 ${!isExpanded && update.content.length > 350 ? 'max-h-[180px] overflow-hidden' : ''}`}>
                      <div
                        className="text-neutral-400 text-lg md:text-xl font-medium leading-[1.6] tracking-tight"
                        dangerouslySetInnerHTML={{ __html: sanitizeAndProcessHTML(update.content) }}
                      />
                   </div>
                   
                   {!isExpanded && update.content.length > 350 && (
                      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#111] to-transparent pointer-events-none"></div>
                   )}
                   
                   {update.content.length > 350 && (
                    <button
                      onClick={() => toggleContent(update.id)}
                      className="group flex items-center gap-2 mt-4 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-brand-acid hover:text-brand-black transition-all text-xs font-bold"
                    >
                      <span>
                        {isExpanded ? 'Show Less' : 'Read Full Update'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 animate-bounce" />}
                    </button>
                   )}
                </div>

                {/* High-Fidelity Engagement Bar */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Telemetry Stats */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3 group/stat">
                        <div className="p-2.5 bg-brand-acid/5 border border-brand-acid/10 rounded-xl group-hover/stat:bg-brand-acid/10 transition-colors">
                          <Eye className="w-4 h-4 text-brand-acid" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-white leading-none">{(update as any).viewCount || '24.1K'}</p>
                          <p className="text-[10px] font-medium text-neutral-500 mt-0.5">Views</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 group/stat">
                        <div className="p-2.5 bg-brand-orange/5 border border-brand-orange/10 rounded-xl group-hover/stat:bg-brand-orange/10 transition-colors">
                          <ThumbsUp className="w-4 h-4 text-brand-orange" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-white leading-none">{update.likes || 0}</p>
                          <p className="text-[10px] font-medium text-neutral-500 mt-0.5">Likes</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 group/stat">
                        <div className="p-2.5 bg-brand-acid/5 border border-brand-acid/10 rounded-xl group-hover/stat:bg-brand-acid/10 transition-colors">
                          <MessageSquare className="w-4 h-4 text-brand-acid" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-white leading-none">{update.commentCount || 0}</p>
                          <p className="text-[10px] font-medium text-neutral-500 mt-0.5">Comments</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopyLink(update.id, update.title)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${copiedId === update.id
                          ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.2)]'
                          : 'bg-white/5 text-neutral-300 border border-white/10 hover:border-brand-acid/40 hover:text-brand-acid'
                          }`}
                      >
                        {copiedId === update.id ? <><Check className="w-4 h-4" /><span>Copied</span></> : <><Link2 className="w-4 h-4" /><span>Copy Link</span></>}
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShareMenuOpen(shareMenuOpen === update.id ? null : update.id)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-neutral-300 border border-white/10 rounded-xl text-xs font-bold hover:border-brand-orange/40 hover:text-brand-orange transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>

                        {shareMenuOpen === update.id && (
                          <div className="absolute right-0 bottom-full mb-4 w-56 bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <button onClick={() => handleShare('twitter', update.id, update.title)} className="w-full flex items-center gap-4 px-6 py-5 text-[10px] font-black italic uppercase tracking-widest text-neutral-300 hover:bg-brand-acid hover:text-brand-black transition-all">
                              <Twitter className="w-4 h-4" /> <span>TWITTER</span>
                            </button>
                            <button onClick={() => handleShare('facebook', update.id, update.title)} className="w-full flex items-center gap-4 px-6 py-5 text-[10px] font-black italic uppercase tracking-widest text-neutral-300 hover:bg-brand-orange hover:text-brand-white transition-all">
                              <Facebook className="w-4 h-4" /> <span>FACEBOOK</span>
                            </button>
                            <button onClick={() => handleShare('linkedin', update.id, update.title)} className="w-full flex items-center gap-4 px-6 py-5 text-[10px] font-black italic uppercase tracking-widest text-neutral-300 hover:bg-brand-acid hover:text-brand-black transition-all">
                              <Linkedin className="w-4 h-4" /> <span>LINKEDIN</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global Debate Section (Comments) */}
              {isCreator && projectId && creatorId && (
                <div className="px-6 pb-6 md:px-8 md:pb-8">
                   <div className="bg-white/[0.02] border border-white/10 rounded-2xl">
                      <UpdateComments
                        updateId={update.id}
                        projectId={projectId}
                        creatorId={creatorId}
                        initialCommentCount={update.commentCount || 0}
                        creatorAvatar={creatorAvatar}
                        isCreatorView={true}
                        showBorder={false}
                        projectTitle={projectTitle}
                        updateTitle={update.title}
                      />
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setPendingDeleteId(null); }}
        onConfirm={handleConfirmDelete}
        title="TERMINATE DISPATCH"
        message="ARE YOU SURE YOU WANT TO PERMANENTLY TERMINATE THIS BROADCAST PROTOCOL? THIS ACTION CANNOT BE REVERSED."
        confirmText="CONFIRM TERMINATION"
        cancelText="ABORT"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
