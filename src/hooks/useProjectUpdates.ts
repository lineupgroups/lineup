import { useState, useEffect, useCallback } from 'react';
import {
  getProjectUpdates,
  createProjectUpdate,
  updateProjectUpdate,
  deleteProjectUpdate,
  toggleUpdateLike,
  toggleUpdatePin,
  getProjectUpdateCount
} from '../lib/projectUpdates';
import { FirestoreProjectUpdate, CreateProjectUpdateData } from '../types/firestore';
import toast from 'react-hot-toast';

export const useProjectUpdates = (projectId: string, userId?: string) => {
  const [updates, setUpdates] = useState<FirestoreProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const fetchUpdates = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedUpdates = await getProjectUpdates(projectId);
      setUpdates(fetchedUpdates);
      setUpdateCount(fetchedUpdates.length);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch updates');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Accept simplified update data - lib function sets defaults for visibility and isPinned
  const addUpdate = async (updateData: {
    title: string;
    content: string;
    image?: string;
    videoUrl?: string;
    scheduledFor?: Date | null;
    isPinned?: boolean;
    sendNotification?: boolean; // Note: Email notifications coming soon
  }) => {
    if (!userId) {
      toast.error('You must be logged in to post updates');
      throw new Error('User not authenticated');
    }

    try {
      const { isPinned, sendNotification, ...restData } = updateData;

      // Create the update
      const updateId = await createProjectUpdate(projectId, restData as any, userId);

      // If isPinned is true, pin the update after creation
      if (isPinned && updateId) {
        await toggleUpdatePin(updateId, true, projectId);
      }

      // Note: sendNotification is stored but email sending is coming soon

      await fetchUpdates();
      toast.success('Update posted successfully!');

      return updateId;
    } catch (err) {
      console.error('Error adding update:', err);
      toast.error('Failed to post update');
      throw err;
    }
  };

  const editUpdate = async (updateId: string, updateData: Partial<FirestoreProjectUpdate>) => {
    try {
      await updateProjectUpdate(updateId, updateData);
      await fetchUpdates();
      toast.success('Update edited successfully!');
    } catch (err) {
      console.error('Error editing update:', err);
      toast.error('Failed to edit update');
      throw err;
    }
  };

  const removeUpdate = async (updateId: string) => {
    try {
      await deleteProjectUpdate(updateId);
      await fetchUpdates();
      toast.success('Update deleted successfully!');
    } catch (err) {
      console.error('Error deleting update:', err);
      toast.error('Failed to delete update');
      throw err;
    }
  };

  const likeUpdate = async (updateId: string, userId: string) => {
    try {
      const isLiked = await toggleUpdateLike(updateId, userId);
      await fetchUpdates();
      return isLiked;
    } catch (err) {
      console.error('Error liking update:', err);
      toast.error('Failed to like update');
      throw err;
    }
  };

  // U-LOG-01: Pass projectId so pinning auto-unpins previous
  const pinUpdate = async (updateId: string, isPinned: boolean) => {
    try {
      await toggleUpdatePin(updateId, isPinned, projectId);
      await fetchUpdates();
      toast.success(isPinned ? 'Update pinned! (Previous pin removed)' : 'Update unpinned!');
    } catch (err) {
      console.error('Error pinning update:', err);
      toast.error('Failed to pin update');
      throw err;
    }
  };

  return {
    updates,
    loading,
    error,
    updateCount,
    addUpdate,
    editUpdate,
    removeUpdate,
    likeUpdate,
    pinUpdate,
    refetch: fetchUpdates
  };
};
