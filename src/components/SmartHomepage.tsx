import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import LandingPage from './LandingPage';
import LoadingSpinner from './common/LoadingSpinner';
import PageErrorBoundary from './common/PageErrorBoundary';
import PersonalizedHeader from './homepage/PersonalizedHeader';
import QuickActionBar from './homepage/QuickActionBar';
import ForYouSection from './homepage/sections/ForYouSection';
import NearYouSection from './homepage/sections/NearYouSection';
import DiscoverySection from './homepage/sections/DiscoverySection';
import AlmostFundedSection from './homepage/sections/AlmostFundedSection';
import FreshLaunchesSection from './homepage/sections/FreshLaunchesSection';
import TrendingSection from './homepage/sections/TrendingSection';
import { useRecommendations } from '../hooks/useRecommendations';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import { initializeUserPreferences } from '../lib/behaviorTracking';
import InterestSelection from './onboarding/InterestSelection';
import { useTrendingProjects } from '../hooks/useTrendingProjects';
import { usePopularProjects } from '../hooks/usePopularProjects';
import { ProjectsNearMeList } from './home/ProjectsNearMeList';

export default function SmartHomepage() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, loading: prefsLoading, refreshPreferences } = useBehaviorTracking();
  const [searchParams] = useSearchParams();
  const {
    loading: recsLoading,
    forYou,
    nearYou,
    discovery,
    almostFunded,
    freshLaunches
  } = useRecommendations();

  // Fallback data for new users
  const { projects: trendingProjects, loading: trendingLoading } = useTrendingProjects();
  const { projects: popularProjects, loading: popularLoading } = usePopularProjects();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Refs for scrolling to sections
  const trendingRef = useRef<HTMLDivElement>(null);
  const nearMeRef = useRef<HTMLDivElement>(null);
  const almostFundedRef = useRef<HTMLDivElement>(null);
  const freshLaunchesRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);

  // Check if user has enough data for personalization
  const hasPersonalizationData = preferences &&
    preferences.preferredLocation?.city &&
    preferences.favoriteCategories?.length >= 3 &&
    preferences.totalProjectsViewed > 0;

  // Initialize preferences for new users
  useEffect(() => {
    if (user && !prefsLoading && !preferences) {
      initializeUserPreferences(user.uid);
    }
  }, [user, preferences, prefsLoading]);

  // Show onboarding only if user truly needs it (check actual data, not session)
  useEffect(() => {
    if (preferences) {
      const hasLocation = !!(preferences.preferredLocation?.city && preferences.preferredLocation?.state);
      const hasCategories = preferences.favoriteCategories && preferences.favoriteCategories.length >= 3;

      // Only show if both are missing - once they're set, never show again
      const needsOnboarding = !hasLocation || !hasCategories;

      console.log('🔍 ONBOARDING CHECK:', {
        hasLocation,
        hasCategories,
        needsOnboarding,
        location: preferences.preferredLocation,
        categories: preferences.favoriteCategories,
        fullPreferences: preferences
      });

      setShowOnboarding(needsOnboarding);
    } else {
      console.log('🔍 ONBOARDING CHECK: No preferences yet');
    }
  }, [preferences]);

  // Handle filter navigation from QuickActionBar
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (!filter) return;

    // Small delay to ensure content is rendered
    const scrollToSection = setTimeout(() => {
      let targetRef = null;

      switch (filter) {
        case 'trending':
          targetRef = trendingRef;
          break;
        case 'nearme':
          targetRef = nearMeRef;
          break;
        case 'almost':
          targetRef = almostFundedRef;
          break;
        case 'fresh':
          targetRef = freshLaunchesRef;
          break;
        default:
          break;
      }

      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    return () => clearTimeout(scrollToSection);
  }, [searchParams]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is not logged in, show the marketing landing page
  if (!user) {
    return (
      <PageErrorBoundary>
        <LandingPage />
      </PageErrorBoundary>
    );
  }

  // If user is logged in, show personalized homepage
  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-brand-black text-brand-white font-sans">
        {/* Personalized Header */}
        <PersonalizedHeader />

        {/* Quick Action Bar */}
        <QuickActionBar />

        {/* Onboarding Modal for new users */}
        <InterestSelection
          isOpen={showOnboarding}
          onClose={() => {
            console.log('🚪 Modal closed');
            setShowOnboarding(false);
          }}
          onComplete={async () => {
            console.log('🔄 HOMEPAGE: Onboarding completed, refreshing preferences...');
            await refreshPreferences();
            console.log('🔄 HOMEPAGE: Preferences refreshed, setting modal to false');
            setShowOnboarding(false);
          }}
        />

        {/* Main Content */}
        <div className="pb-12">
          {hasPersonalizationData ? (
            // Personalized content for users with data
            <>
              {/* Trending Section - Most engaged projects */}
              <div ref={trendingRef}>
                <TrendingSection projects={trendingProjects} loading={trendingLoading} />
              </div>

              {/* For You Section - Personalized */}
              <div ref={forYouRef}>
                <ForYouSection projects={forYou} loading={recsLoading} />
              </div>

              {/* Near You Section */}
              <div ref={nearMeRef}>
                <NearYouSection projects={nearYou} loading={recsLoading} />
              </div>

              {/* Almost Funded Section */}
              <div ref={almostFundedRef}>
                <AlmostFundedSection projects={almostFunded} loading={recsLoading} />
              </div>

              {/* Fresh Launches Section */}
              <div ref={freshLaunchesRef}>
                <FreshLaunchesSection projects={freshLaunches} loading={recsLoading} />
              </div>

              {/* Discovery Section */}
              <DiscoverySection projects={discovery} loading={recsLoading} />
            </>
          ) : (
            // Fallback content for new users
            <>
              {/* Trending Section */}
              <div ref={trendingRef}>
                <TrendingSection
                  projects={trendingProjects}
                  loading={trendingLoading}
                />
              </div>

              {/* For You Section with fallback data */}
              <div ref={forYouRef}>
                <ForYouSection
                  projects={
                    forYou.length > 0
                      ? forYou
                      : popularProjects.slice(0, 15).map(p => ({
                        ...p,
                        score: 50,
                        reasons: ['Popular on platform']
                      }))
                  }
                  loading={recsLoading || popularLoading}
                />
              </div>

              {/* Near You Section */}
              <div ref={nearMeRef} className="py-8 border-t border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-brand-white">Projects Near You</h2>
                      <p className="text-neutral-400">Support local creators in your area</p>
                    </div>
                  </div>
                  <ProjectsNearMeList onProjectClick={(id) => window.location.href = `/project/${id}`} />
                </div>
              </div>

              {/* Almost Funded Section */}
              <div ref={almostFundedRef}>
                <AlmostFundedSection
                  projects={almostFunded.length > 0 ? almostFunded : popularProjects.slice(6, 12)}
                  loading={recsLoading || popularLoading}
                />
              </div>

              {/* Fresh Launches Section */}
              <div ref={freshLaunchesRef}>
                <FreshLaunchesSection
                  projects={freshLaunches.length > 0 ? freshLaunches : trendingProjects.slice(0, 6)}
                  loading={recsLoading || trendingLoading}
                />
              </div>

              {/* Discovery Section */}
              <DiscoverySection
                projects={discovery.length > 0 ? discovery : trendingProjects.slice(6, 14)}
                loading={recsLoading || trendingLoading}
              />
            </>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
