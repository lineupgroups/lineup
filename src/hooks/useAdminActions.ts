import { useState } from 'react';
import {
  toggleFeaturedProject,
  suspendProject,
  reactivateProject,
  requestProjectChanges,
  suspendUser,
  banUser,
  unbanUser,
  verifyCreator,
  unverifyCreator,
  getUserActivityLogs
} from '../lib/adminActions';
import { FirestoreActivityLog } from '../types/firestore';
import toast from 'react-hot-toast';

export const useAdminActions = (adminId: string | undefined, adminEmail: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Project actions
  const handleToggleFeatured = async (projectId: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await toggleFeaturedProject(projectId, adminId, adminEmail);
      toast.success('Project featured status updated');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update featured status';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendProject = async (projectId: string, reason: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await suspendProject(projectId, reason, adminId, adminEmail);
      toast.success('Project suspended');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend project';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateProject = async (projectId: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await reactivateProject(projectId, adminId, adminEmail);
      toast.success('Project reactivated');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reactivate project';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async (projectId: string, message: string, field?: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await requestProjectChanges(projectId, message, field, adminId, adminEmail);
      toast.success('Change request sent to creator');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request changes';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // User actions
  const handleSuspendUser = async (userId: string, reason: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await suspendUser(userId, reason, adminId, adminEmail);
      toast.success('User suspended');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend user';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await banUser(userId, reason, adminId, adminEmail);
      toast.success('User banned');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to ban user';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await unbanUser(userId, adminId, adminEmail);
      toast.success('User unbanned');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unban user';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCreator = async (userId: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyCreator(userId, adminId, adminEmail);
      toast.success('Creator verified');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify creator';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUnverifyCreator = async (userId: string) => {
    if (!adminId || !adminEmail) {
      toast.error('Unauthorized');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      await unverifyCreator(userId, adminId, adminEmail);
      toast.success('Creator verification removed');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unverify creator';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Activity logs
  const fetchUserActivityLogs = async (userId: string): Promise<FirestoreActivityLog[]> => {
    setLoading(true);
    setError(null);
    try {
      const logs = await getUserActivityLogs(userId);
      return logs;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activity logs';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Project actions
    toggleFeatured: handleToggleFeatured,
    suspendProject: handleSuspendProject,
    reactivateProject: handleReactivateProject,
    requestChanges: handleRequestChanges,
    // User actions
    suspendUser: handleSuspendUser,
    banUser: handleBanUser,
    unbanUser: handleUnbanUser,
    verifyCreator: handleVerifyCreator,
    unverifyCreator: handleUnverifyCreator,
    // Activity logs
    fetchUserActivityLogs
  };
};


