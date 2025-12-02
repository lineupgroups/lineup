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

export const useProjectUpdates = (projectId: string) => {
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

  const addUpdate = async (updateData: Omit<CreateProjectUpdateData, 'projectId'>) => {
    try {
      await createProjectUpdate(projectId, updateData);
      await fetchUpdates();
      toast.success('Update posted successfully!');
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

  const pinUpdate = async (updateId: string, isPinned: boolean) => {
    try {
      await toggleUpdatePin(updateId, isPinned);
      await fetchUpdates();
      toast.success(isPinned ? 'Update pinned!' : 'Update unpinned!');
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
