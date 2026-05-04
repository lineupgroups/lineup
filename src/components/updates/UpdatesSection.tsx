import { useState } from 'react';
import { MessageSquare, ThumbsUp, Pin, Clock, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectUpdates } from '../../hooks/useProjectUpdates';
import { convertTimestamp } from '../../lib/firestore';
import { sanitizeAndProcessHTML } from '../../lib/sanitize';
import LoadingSpinner from '../common/LoadingSpinner';
import UpdateComments from './UpdateComments';
import toast from 'react-hot-toast';

interface UpdatesSectionProps {
    projectId: string;
    creatorId: string;
    creatorAvatar?: string;
    projectTitle?: string;
}

export default function UpdatesSection({ projectId, creatorId, creatorAvatar, projectTitle }: UpdatesSectionProps) {
    const { user } = useAuth();
    const {
        updates,
        loading,
        updateCount,
        likeUpdate
    } = useProjectUpdates(projectId);

    const [likingUpdateId, setLikingUpdateId] = useState<string | null>(null);

    const handleLikeUpdate = async (updateId: string) => {
        if (!user) {
            toast.error('Please sign in to like updates');
            return;
        }

        try {
            setLikingUpdateId(updateId);
            await likeUpdate(updateId, user.uid);
        } catch (error) {
            console.error('Error liking update:', error);
        } finally {
            setLikingUpdateId(null);
        }
    };

    const formatDate = (timestamp: any) => {
        try {
            const date = convertTimestamp(timestamp);
            return date.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Unknown date';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Edit3 className="w-6 h-6 text-brand-acid" />
                    <div>
                        <h3 className="text-xl font-black text-brand-white">
                            Project Updates ({updateCount})
                        </h3>
                        <p className="text-sm text-neutral-500">Exclusive updates for supporters</p>
                    </div>
                </div>
            </div>

            {/* Updates List */}
            {updates.length === 0 ? (
                <div className="text-center py-12 bg-neutral-800/30 rounded-2xl border border-neutral-800">
                    <MessageSquare className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-brand-white mb-2">No updates yet</h4>
                    <p className="text-neutral-400 max-w-md mx-auto mb-4">
                        The creator hasn't posted any updates yet. Once they do, you'll see exclusive behind-the-scenes content here!
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-brand-orange border border-neutral-700">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Support this project to get notified of updates</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {updates.map((update) => {
                        const isLiked = update.likedBy?.includes(user?.uid || '');
                        const isLiking = likingUpdateId === update.id;

                        return (
                            <div
                                key={update.id}
                                className={`bg-[#111] rounded-2xl p-6 border ${update.isPinned ? 'border-brand-orange border-2' : 'border-neutral-800'
                                    }`}
                            >
                                {/* Pinned Badge */}
                                {update.isPinned && (
                                    <div className="flex items-center space-x-2 text-brand-orange text-sm font-bold mb-3">
                                        <Pin className="w-4 h-4" />
                                        <span>Pinned Update</span>
                                    </div>
                                )}

                                {/* Update Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-brand-white">
                                        {update.title}
                                    </h4>
                                    <div className="flex items-center space-x-2 text-sm text-neutral-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDate(update.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Update Content */}
                                <div className="prose max-w-none mb-4">
                                    <div
                                        className="text-neutral-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sanitizeAndProcessHTML(update.content) }}
                                    />
                                </div>

                                {/* Update Image */}
                                {update.image && (
                                    <div className="mb-4">
                                        <img
                                            src={update.image}
                                            alt={update.title}
                                            className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                                            onClick={() => window.open(update.image, '_blank')}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center space-x-6 pt-4 border-t border-neutral-800">
                                    <button
                                        onClick={() => handleLikeUpdate(update.id)}
                                        disabled={!user || isLiking}
                                        className={`flex items-center space-x-2 text-sm transition-colors ${isLiked
                                            ? 'text-brand-orange font-bold'
                                            : 'text-neutral-400 hover:text-brand-orange'
                                            } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
                                        aria-label={isLiked ? 'Unlike this update' : 'Like this update'}
                                    >
                                        {isLiking ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                        )}
                                        <span>{update.likes || 0} {(update.likes || 0) === 1 ? 'Like' : 'Likes'}</span>
                                    </button>
                                </div>

                                {/* Comments Section */}
                                <UpdateComments
                                    updateId={update.id}
                                    projectId={projectId}
                                    creatorId={creatorId}
                                    initialCommentCount={update.commentCount || 0}
                                    creatorAvatar={creatorAvatar}
                                    projectTitle={projectTitle}
                                    updateTitle={update.title}
                                />

                                {/* Visibility Badge */}
                                {update.visibility === 'supporters-only' && (
                                    <div className="mt-4 inline-flex items-center px-3 py-1 bg-brand-acid/10 text-brand-acid text-xs font-bold rounded-full border border-brand-acid/20">
                                        Supporters Only
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
