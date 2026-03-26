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
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📢</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Updates Yet</h3>
        <p className="text-gray-600 max-w-md mx-auto">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
          {/* Search Results Info */}
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredAndSortedUpdates.length} {filteredAndSortedUpdates.length === 1 ? 'update' : 'updates'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>
      )}

      {/* Summary Stats - only show if showInlineStats is true */}
      {isCreator && showInlineStats && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Updates</p>
                <p className="text-2xl font-bold text-gray-900">{updates.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {updates.reduce((acc, u) => acc + (u.likes || 0), 0)}
                </p>
                <p className="text-gray-500">Total Likes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {updates.reduce((acc, u) => acc + (u.commentCount || 0), 0)}
                </p>
                <p className="text-gray-500">Total Comments</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {updates.filter(u => u.isPinned).length}
                </p>
                <p className="text-gray-500">Pinned</p>
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
            className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${update.isPinned
              ? 'ring-2 ring-orange-500 ring-offset-2'
              : 'border border-gray-200 hover:shadow-md'
              }`}
          >
            {/* Pinned Badge */}
            {update.isPinned && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2">
                <div className="flex items-center space-x-2 text-white text-sm font-medium">
                  <Pin className="w-4 h-4" />
                  <span>Pinned Update</span>
                </div>
              </div>
            )}

            {/* Scheduled Badge */}
            {isScheduled && (
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                <div className="flex items-center space-x-2 text-blue-700 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Scheduled for {new Date((update as any).scheduledFor).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {update.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{convertTimestamp(update.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{getTimeAgo(convertTimestamp(update.createdAt))}</span>
                    {update.updatedAt && (
                      <>
                        <span className="text-gray-400">•</span>
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
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              onEdit(update);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
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
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            <Pin className="w-4 h-4" />
                            <span>{update.isPinned ? 'Unpin Update' : 'Pin Update'}</span>
                          </button>

                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => handleDeleteClick(update.id)}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
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
                <div className="relative pt-[56.25%] mb-4 bg-black rounded-lg overflow-hidden">
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
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}

              {/* Content - Now sanitized to prevent XSS */}
              <div className="prose max-w-none">
                <div
                  className={`text-gray-700 leading-relaxed ${!isExpanded && update.content.length > 250 ? 'line-clamp-4' : ''}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeAndProcessHTML(update.content) }}
                />
                {update.content.length > 250 && (
                  <button
                    onClick={() => toggleContent(update.id)}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm mt-2 flex items-center space-x-1"
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
              <div className="mt-6 pt-6 border-t border-gray-200">
                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    {/* Phase 4: View count displayed directly */}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {(update as any).viewCount || Math.floor((update.likes || 0) * 2.5 + (update.commentCount || 0) * 5)} views
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <ThumbsUp className="w-5 h-5" />
                      <span className="text-sm font-medium">{update.likes || 0} likes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">{update.commentCount || 0} comments</span>
                    </div>
                  </div>
                </div>

                {/* Phase 4: Action Buttons Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(update.id, update.title)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copiedId === update.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
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
                          <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => handleShare('twitter', update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Twitter className="w-4 h-4 text-sky-500" />
                              <span>Share on Twitter</span>
                            </button>
                            <button
                              onClick={() => handleShare('facebook', update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Facebook className="w-4 h-4 text-blue-600" />
                              <span>Share on Facebook</span>
                            </button>
                            <button
                              onClick={() => handleShare('linkedin', update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Linkedin className="w-4 h-4 text-blue-700" />
                              <span>Share on LinkedIn</span>
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => handleCopyLink(update.id, update.title)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
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
