import { useState, useEffect } from 'react';
import {
  SuccessStory,
  Testimonial,
  PlatformStats,
  PlatformSettings,
  RecentActivity,
  FAQItem
} from '../types/landingPage';
import {
  getSuccessStories,
  getFeaturedSuccessStories,
  getTestimonials,
  getFeaturedTestimonials,
  getPlatformStats,
  getPlatformSettings,
  getRecentActivities,
  getFAQItems,
  getFeaturedFAQs
} from '../lib/landingPage';

// Hook for success stories
export const useSuccessStories = (featured = false) => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = featured 
          ? await getFeaturedSuccessStories()
          : await getSuccessStories(true);
        setStories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load success stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [featured]);

  return { stories, loading, error };
};

// Hook for testimonials
export const useTestimonials = (featured = false) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = featured
          ? await getFeaturedTestimonials()
          : await getTestimonials(true);
        setTestimonials(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [featured]);

  return { testimonials, loading, error };
};

// Hook for platform statistics
export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlatformStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

// Hook for platform settings
export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlatformSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { settings, loading, error, refresh };
};

// Hook for recent activities (live ticker)
export const useRecentActivities = (limitCount = 20, refreshInterval = 30000) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      if (loading) setError(null); // Only clear error on initial load
      const data = await getRecentActivities(limitCount);
      setActivities(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Set up polling for real-time updates
    const interval = setInterval(fetchActivities, refreshInterval);

    return () => clearInterval(interval);
  }, [limitCount, refreshInterval]);

  return { activities, loading, error, refresh: fetchActivities };
};

// Hook for FAQ items
export const useFAQItems = (featured = false) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = featured
          ? await getFeaturedFAQs()
          : await getFAQItems(true);
        setFaqs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load FAQ items');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [featured]);

  return { faqs, loading, error };
};

