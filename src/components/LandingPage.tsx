import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePlatformSettings } from '../hooks/useLandingPage';
import LoadingSpinner from './common/LoadingSpinner';

// Import new sections
import HeroCTA from './landing/HeroCTA';
import TrustBadges from './landing/TrustBadges';
import PlatformStatsSection from './landing/PlatformStatsSection';
import HowItWorksSection from './landing/HowItWorksSection';
import SuccessStoriesSection from './landing/SuccessStoriesSection';
import TestimonialsSection from './landing/TestimonialsSection';
import ComparisonTable from './landing/ComparisonTable';
import FAQSection from './landing/FAQSection';
import LiveTicker from './landing/LiveTicker';

// Lazy load old sections for better performance
const TrendingSection = lazy(() => import('./landing/TrendingSection'));
const PopularSection = lazy(() => import('./landing/PopularSection'));
const HighlyFundedSection = lazy(() => import('./landing/HighlyFundedSection'));

export default function LandingPage() {
  const { settings, loading } = usePlatformSettings();

  return (
    <div className="min-h-screen bg-brand-black overflow-x-hidden selection:bg-brand-acid selection:text-brand-black">
      <Helmet>
        <title>Lineup - For the Idea Nation™ | Turn Ideas Into Reality</title>
        <meta name="description" content="Join the Idea Nation! Turn your innovative ideas into reality with crowdfunding. Discover trending projects, support creators, and bring amazing ideas to life across India." />
        <meta name="keywords" content="crowdfunding, startup, innovation, funding, projects, entrepreneurs, ideas, creators, India, UPI" />
        <meta property="og:title" content="Lineup - For the Idea Nation™ | Turn Ideas Into Reality" />
        <meta property="og:description" content="Join the Idea Nation! Turn your innovative ideas into reality with crowdfunding." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://lineup.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lineup - For the Idea Nation™" />
        <meta name="twitter:description" content="Turn your innovative ideas into reality with crowdfunding." />
      </Helmet>

      {/* Hero Section with CTA */}
      <HeroCTA />

      {/* Trust Badges - Always show */}
      {settings?.showTrustBadges !== false && <TrustBadges />}

      {/* Platform Statistics - Controlled by admin */}
      {!loading && settings?.showStatistics && <PlatformStatsSection />}

      {/* How It Works - Enhanced Version */}
      <HowItWorksSection />

      {/* Success Stories - Controlled by admin */}
      {!loading && settings?.showSuccessStories && (
        <Suspense fallback={<div className="py-16"><LoadingSpinner size="lg" /></div>}>
          <SuccessStoriesSection />
        </Suspense>
      )}

      {/* Trending Projects */}
      <Suspense fallback={<div className="py-16 bg-gray-50"><LoadingSpinner size="lg" /></div>}>
        <TrendingSection />
      </Suspense>

      {/* Popular Projects */}
      <Suspense fallback={<div className="py-16"><LoadingSpinner size="lg" /></div>}>
        <PopularSection />
      </Suspense>

      {/* Testimonials - Controlled by admin */}
      {!loading && settings?.showTestimonials && <TestimonialsSection />}

      {/* Highly Funded Projects */}
      <Suspense fallback={<div className="py-16 bg-gray-50"><LoadingSpinner size="lg" /></div>}>
        <HighlyFundedSection />
      </Suspense>

      {/* Creator vs Supporter Comparison */}
      <ComparisonTable />

      {/* FAQ Section */}
      <FAQSection />

      {/* Live Ticker - Controlled by admin */}
      {!loading && settings?.showLiveTicker && <LiveTicker />}
    </div>
  );
}
