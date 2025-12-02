import { useState, useEffect, useCallback } from 'react';
import {
  getUserAnalytics,
  searchUsers,
  getUserFullDetails,
  UserAnalytics,
  UserSearchFilters
} from '../lib/userAnalytics';
import { FirestoreUser } from '../types/firestore';
import toast from 'react-hot-toast';

export const useUserAnalytics = () => {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserAnalytics();
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
};

export const useUserSearch = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (filters: UserSearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchUsers(filters);
      setUsers(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search users';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setUsers([]);
    setError(null);
  }, []);

  return {
    users,
    loading,
    error,
    search,
    clearResults
  };
};

export const useUserDetails = (userId: string | null) => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!userId) {
      setUserDetails(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const details = await getUserFullDetails(userId);
      setUserDetails(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user details';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    userDetails,
    loading,
    error,
    refetch: fetchDetails
  };
};


