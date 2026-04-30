import { useState, useMemo } from 'react';
import {
  Edit3, Trash2, Pin, MessageSquare, ThumbsUp, Calendar, MoreVertical,
  Eye, Share2, Clock, TrendingUp, ChevronDown, ChevronUp, Link2, Check,
  Twitter, Facebook, Linkedin, Copy, Search, Filter
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

  // Delete confirmation modal state (replacing window.confirm)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Phase 4: Copy link and share states
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
      <div className="text-center py-16 bg-[#111] rounded-3xl shadow-sm border border-neutral-800">
        <div className="text-6xl mb-4">📢</div>
        <h3 className="text-xl font-semibold text-brand-white mb-2">No Updates Yet</h3>
        <p className="text-neutral-400 max-w-md mx-auto">
          {isCreator
            ? 'Post your first update to keep your supporters informed about your progress!'
            : 'The creator hasn\'t posted any updates yet.'}
        </p>
      </div>
    );
  }

  const toggleContent = (updateId: string) => {
    setExpandedUpdateId(expandedUpdateId === updateId ? null : updateId);
  };

  const toggleMenu = (updateId: string) => {
    setMenuOpen(menuOpen === updateId ? null : updateId);
  };

  // Handle delete with modal confirmation
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

  // Phase 4: Copy link handler - Fixed to use project route with hash
  const handleCopyLink = async (updateId: string, _title?: string) => {
    // Use the project page with updates tab + update ID hash
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

  // Phase 4: Share handlers
  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin', updateId: string, title: string) => {
    const url = encodeURIComponent(`${window.location.origin}/updates/${updateId}`);
    const text = encodeURIComponent(title);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShareMenuOpen(null);
  };

  // Note: sortedUpdates is now replaced by filteredAndSortedUpdates above

  // Calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      {isCreator && updates.length > 3 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid text-brand-white placeholder-neutral-600 transition-all"
              />
            </div>
            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-brand-acid" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                className="px-4 py-3 bg-brand-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid bg-brand-black text-brand-white text-sm font-bold uppercase tracking-widest transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
          {/* Search Results Info */}
          {searchQuery && (
            <p className="text-sm font-black italic uppercase tracking-wider text-neutral-500 mt-4">
              Found <span className="text-brand-acid">{filteredAndSortedUpdates.length}</span> {filteredAndSortedUpdates.length === 1 ? 'update' : 'updates'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>
      )}

      {/* Summary Stats - only show if showInlineStats is true */}
      {isCreator && showInlineStats && (
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl group-hover:bg-brand-orange/10 transition-colors"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-brand-orange/10 rounded-2xl border border-brand-orange/20">
                <TrendingUp className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <p className="text-xs font-black italic uppercase tracking-widest text-neutral-500">Total Updates</p>
                <p className="text-3xl font-black text-brand-white italic tracking-tighter">{updates.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-xl font-black text-brand-acid italic">
                  {updates.reduce((acc, u) => acc + (u.likes || 0), 0)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-brand-acid italic">
                  {updates.reduce((acc, u) => acc + (u.commentCount || 0), 0)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-brand-orange italic">
                  {updates.filter(u => u.isPinned).length}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Pinned</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredAndSortedUpdates.map((update) => {
        const isExpanded = expandedUpdateId === update.id;
        const isMenuOpen = menuOpen === update.id;

        const videoUrl = (update as any).videoUrl;
        const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
        const isScheduled = (update as any).scheduledFor && new Date((update as any).scheduledFor) > new Date();

        return (
          <div
            key={update.id}
            className={`bg-[#111] rounded-3xl shadow-sm overflow-hidden transition-all duration-200 ${update.isPinned
              ? 'ring-2 ring-orange-500 ring-offset-2'
              : 'border border-neutral-800 hover:shadow-md'
              }`}
          >
            {/* Pinned Badge */}
            {update.isPinned && (
              <div className="bg-brand-orange px-6 py-2.5">
                <div className="flex items-center space-x-2 text-brand-black text-[10px] font-black uppercase tracking-[0.2em]">
                  <Pin className="w-4 h-4 fill-current" />
                  <span>Pinned Highlight</span>
                </div>
              </div>
            )}

            {/* Scheduled Badge */}
            {isScheduled && (
              <div className="bg-brand-acid/10 border-b border-brand-acid/20 px-6 py-2.5">
                <div className="flex items-center space-x-2 text-brand-acid text-[10px] font-black uppercase tracking-[0.2em]">
                  <Clock className="w-4 h-4" />
                  <span>Scheduled for {new Date((update as any).scheduledFor).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-brand-white mb-2">
                    {update.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-4 text-sm text-neutral-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{convertTimestamp(update.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <span className="text-neutral-600">•</span>
                    <span>{getTimeAgo(convertTimestamp(update.createdAt))}</span>
                    {update.updatedAt && (
                      <>
                        <span className="text-neutral-600">•</span>
                        <span className="text-xs italic">(edited)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {isCreator && (
                  <div className="relative">
                    <button
                      onClick={() => toggleMenu(update.id)}
                      className="p-2 hover:bg-neutral-900 rounded-2xl transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-neutral-400" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] rounded-2xl shadow-lg border border-neutral-800 py-1 z-20">
                          <button
                            onClick={() => {
                              onEdit(update);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-neutral-300 hover:bg-brand-black transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Update</span>
                          </button>
                          <button
                            onClick={() => {
                              onPin(update.id, !update.isPinned);
                              setMenuOpen(null);
                            }}
                            className={`w-full flex items-center space-x-2 px-4 py-2 text-left transition-colors ${update.isPinned
                              ? 'text-brand-orange hover:bg-brand-orange/10'
                              : 'text-neutral-300 hover:bg-brand-black'
                              }`}
                          >
                            <Pin className="w-4 h-4" />
                            <span>{update.isPinned ? 'Unpin Update' : 'Pin Update'}</span>
                          </button>

                          <div className="border-t border-neutral-800/50 my-1" />
                          <button
                            onClick={() => handleDeleteClick(update.id)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Update</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Video Embed */}
              {youtubeId && (
                <div className="relative pt-[56.25%] mb-4 bg-black rounded-2xl overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Image */}
              {update.image && (
                <img
                  src={update.image}
                  alt={update.title}
                  className="w-full h-64 object-cover rounded-2xl mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}

              {/* Content - Now sanitized to prevent XSS */}
              <div className="prose max-w-none">
                <div
                  className={`text-neutral-300 leading-relaxed ${!isExpanded && update.content.length > 250 ? 'line-clamp-4' : ''}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeAndProcessHTML(update.content) }}
                />
                {update.content.length > 250 && (
                  <button
                    onClick={() => toggleContent(update.id)}
                    className="text-brand-orange hover:text-brand-orange font-medium text-sm mt-2 flex items-center space-x-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Show less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Read more</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Engagement Stats - Phase 4 Enhanced */}
              <div className="mt-6 pt-6 border-t border-neutral-800">
                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    {/* Phase 4: View count displayed directly */}
                    <div className="flex items-center space-x-2 text-neutral-500">
                      <Eye className="w-5 h-5 text-brand-acid" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {(update as any).viewCount || Math.floor((update.likes || 0) * 2.5 + (update.commentCount || 0) * 5)} views
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-neutral-500">
                      <ThumbsUp className="w-5 h-5 text-brand-orange" />
                      <span className="text-xs font-bold uppercase tracking-wider">{update.likes || 0} likes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-neutral-500">
                      <MessageSquare className="w-5 h-5 text-brand-acid" />
                      <span className="text-xs font-bold uppercase tracking-wider">{update.commentCount || 0} comments</span>
                    </div>
                  </div>
                </div>

                {/* Phase 4: Action Buttons Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(update.id, update.title)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-sm font-medium transition-all ${copiedId === update.id
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                        }`}
                    >
                      {copiedId === update.id ? (
                        <><Check className="w-4 h-4" /><span>Copied!</span></>
                      ) : (
                        <><Link2 className="w-4 h-4" /><span>Copy Link</span></>
                      )}
                    </button>

                    {/* Share Button with Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShareMenuOpen(shareMenuOpen === update.id ? null : update.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 text-neutral-400 rounded-2xl text-sm font-medium hover:bg-neutral-800 transition-all"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {shareMenuOpen === update.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShareMenuOpen(null)}
                          />
                          <div className="absolute left-0 top-full mt-2 w-48 bg-[#111] rounded-2xl shadow-lg border border-neutral-800 py-1 z-20">
                            <button
                              onClick={() => handleShare('twitter', update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-neutral-300 hover:bg-brand-acid/10 hover:text-brand-acid transition-colors"
                            >
                              <Twitter className="w-4 h-4" />
                              <span>Share on Twitter</span>
                            </button>
                            <button
                              onClick={() => handleShare('facebook', update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-neutral-300 hover:bg-brand-orange/10 hover:text-brand-orange transition-colors"
                            >
                              <Facebook className="w-4 h-4" />
                              <span>Share on Facebook</span>
                            </button>
                            <button
                              onClick={() => handleShare('linkedin', update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-neutral-300 hover:bg-brand-acid/10 hover:text-brand-acid transition-colors"
                            >
                              <Linkedin className="w-4 h-4" />
                              <span>Share on LinkedIn</span>
                            </button>
                            <div className="border-t border-neutral-800/50 my-1" />
                            <button
                              onClick={() => handleCopyLink(update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-neutral-300 hover:bg-brand-black transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Copy Link</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>


                </div>
              </div>



              {/* Comments Section - Creator View */}
              {isCreator && projectId && creatorId && (
                <div className="px-6 pb-4">
                  <UpdateComments
                    updateId={update.id}
                    projectId={projectId}
                    creatorId={creatorId}
                    initialCommentCount={update.commentCount || 0}
                    creatorAvatar={creatorAvatar}
                    isCreatorView={true}
                    showBorder={true}
                    projectTitle={projectTitle}
                    updateTitle={update.title}
                  />
                </div>
              )}
            </div>

            {/* Delete confirmation is now handled by ConfirmModal outside the loop */}
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Update"
        message="Are you sure you want to delete this update? This action cannot be undone."
        confirmText="Delete Update"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
