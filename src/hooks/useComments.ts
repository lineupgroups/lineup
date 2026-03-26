import { useState, useEffect, useCallback } from 'react';
import {
  getProjectComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  toggleCommentPin,
  toggleCreatorHeart,
  getProjectCommentCount,
  isUserSupporter
} from '../lib/comments';
import { FirestoreComment, CreateCommentData } from '../types/firestore';
import toast from 'react-hot-toast';

export const useComments = (projectId: string, userId?: string) => {
  const [comments, setComments] = useState<FirestoreComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [canComment, setCanComment] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const [fetchedComments, count] = await Promise.all([
        getProjectComments(projectId),
        getProjectCommentCount(projectId)
      ]);

      setComments(fetchedComments);
      setCommentCount(count);

      // Check if user can comment (is a supporter)
      if (userId) {
        const isSupporter = await isUserSupporter(projectId, userId);
        setCanComment(isSupporter);
      } else {
        setCanComment(false);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (commentData: CreateCommentData) => {
    try {
      await createComment(commentData);
      await fetchComments();
      toast.success('Comment posted successfully!');
    } catch (err) {
      console.error('Error adding comment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to post comment';
      toast.error(errorMessage);
      throw err;
    }
  };

  const editComment = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
      await fetchComments();
      toast.success('Comment edited successfully!');
    } catch (err) {
      console.error('Error editing comment:', err);
      toast.error('Failed to edit comment');
      throw err;
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      await fetchComments();
      toast.success('Comment deleted successfully!');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
      throw err;
    }
  };

  const likeComment = async (commentId: string, likeUserId: string) => {
    try {
      const isLiked = await toggleCommentLike(commentId, likeUserId);
      await fetchComments();
      return isLiked;
    } catch (err) {
      console.error('Error liking comment:', err);
      toast.error('Failed to like comment');
      throw err;
    }
  };

  const pinComment = async (commentId: string, isPinned: boolean) => {
    try {
      await toggleCommentPin(commentId, isPinned);
      await fetchComments();
      toast.success(isPinned ? 'Comment pinned!' : 'Comment unpinned!');
    } catch (err) {
      console.error('Error pinning comment:', err);
      toast.error('Failed to pin comment');
      throw err;
    }
  };

  const heartComment = async (commentId: string, giveHeart: boolean) => {
    try {
      await toggleCreatorHeart(commentId, giveHeart);
      await fetchComments();
      if (giveHeart) {
        toast.success('❤️ Heart given!');
      }
    } catch (err) {
      console.error('Error toggling heart:', err);
      toast.error('Failed to update heart');
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    commentCount,
    canComment,
    addComment,
    editComment,
    removeComment,
    likeComment,
    pinComment,
    heartComment,
    refetch: fetchComments
  };
};
