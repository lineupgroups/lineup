import { useState, useEffect, useCallback } from 'react';
import {
    getUpdateComments,
    createUpdateComment,
    editUpdateComment,
    toggleUpdateCommentLike,
    deleteUpdateComment,
    toggleCreatorHeart,
    getUpdateCommentById
} from '../lib/updateComments';
import {
    createUpdateCommentNotification,
    createUpdateCommentReplyNotification,
    createUpdateCommentHeartNotification
} from '../lib/notifications';
import { FirestoreUpdateComment } from '../types/firestore';
import toast from 'react-hot-toast';

interface NotificationContext {
    creatorId?: string;
    creatorName?: string;
    projectTitle?: string;
    updateTitle?: string;
}

export const useUpdateComments = (
    updateId: string,
    projectId: string,
    notificationContext?: NotificationContext
) => {
    const [comments, setComments] = useState<FirestoreUpdateComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        if (!updateId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const fetchedComments = await getUpdateComments(updateId);
            setComments(fetchedComments);
        } catch (err) {
            console.error('Error fetching update comments:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }, [updateId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Get top-level comments (no parent)
    const topLevelComments = comments.filter(c => !c.parentCommentId);

    // Get replies for a specific comment
    const getReplies = (parentId: string) =>
        comments.filter(c => c.parentCommentId === parentId);

    const addComment = async (data: {
        userId: string;
        userName: string;
        userAvatar: string;
        content: string;
        isCreatorComment: boolean;
        parentCommentId?: string;
    }) => {
        try {
            await createUpdateComment({
                updateId,
                projectId,
                ...data
            });
            await fetchComments();
            toast.success('Comment posted!');

            // Send notifications
            if (notificationContext?.creatorId && notificationContext?.projectTitle && notificationContext?.updateTitle) {
                if (data.isCreatorComment && data.parentCommentId) {
                    // Creator is replying to someone - notify the original commenter
                    const parentComment = await getUpdateCommentById(data.parentCommentId);
                    if (parentComment && parentComment.userId !== notificationContext.creatorId) {
                        await createUpdateCommentReplyNotification(
                            parentComment.userId,
                            data.userName,
                            data.userId,
                            projectId,
                            notificationContext.projectTitle,
                            updateId,
                            notificationContext.updateTitle
                        );
                    }
                } else if (!data.isCreatorComment) {
                    // Supporter commented - notify the creator
                    await createUpdateCommentNotification(
                        notificationContext.creatorId,
                        projectId,
                        notificationContext.projectTitle,
                        updateId,
                        notificationContext.updateTitle,
                        data.userName,
                        data.userId
                    );
                }
            }
        } catch (err) {
            console.error('Error adding comment:', err);
            toast.error('Failed to post comment');
            throw err;
        }
    };

    const updateComment = async (commentId: string, newContent: string) => {
        try {
            await editUpdateComment(commentId, newContent);
            await fetchComments();
            toast.success('Comment updated!');
        } catch (err) {
            console.error('Error updating comment:', err);
            toast.error('Failed to update comment');
            throw err;
        }
    };

    const likeComment = async (commentId: string, userId: string) => {
        try {
            await toggleUpdateCommentLike(commentId, userId);
            await fetchComments();
        } catch (err) {
            console.error('Error liking comment:', err);
            toast.error('Failed to like comment');
            throw err;
        }
    };

    const removeComment = async (commentId: string) => {
        try {
            await deleteUpdateComment(commentId);
            await fetchComments();
            toast.success('Comment deleted');
        } catch (err) {
            console.error('Error deleting comment:', err);
            toast.error('Failed to delete comment');
            throw err;
        }
    };

    const toggleHeart = async (
        commentId: string,
        giveHeart: boolean,
        commentUserId?: string,
        creatorName?: string
    ) => {
        try {
            await toggleCreatorHeart(commentId, giveHeart);
            await fetchComments();

            // Send notification when giving heart (not removing)
            if (giveHeart && commentUserId && creatorName && notificationContext?.projectTitle && notificationContext?.updateTitle) {
                await createUpdateCommentHeartNotification(
                    commentUserId,
                    creatorName,
                    notificationContext.creatorId || '',
                    projectId,
                    notificationContext.projectTitle,
                    updateId,
                    notificationContext.updateTitle
                );
            }
        } catch (err) {
            console.error('Error toggling heart:', err);
            toast.error('Failed to update heart');
            throw err;
        }
    };

    return {
        comments,
        topLevelComments,
        getReplies,
        loading,
        error,
        addComment,
        updateComment,
        likeComment,
        removeComment,
        toggleHeart,
        refetch: fetchComments
    };
};
