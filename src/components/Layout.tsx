import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import RoleAwareNavbar from './navigation/RoleAwareNavbar';
import Footer from './Footer';
import AccountSetupModal from './onboarding/AccountSetupModal_fixed';
import SupporterOnboarding from './onboarding/SupporterOnboarding';
import OnboardingBanner from './common/OnboardingBanner';
import ScrollToTopButton from './common/ScrollToTopButton';
import { useAuth } from '../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { EnhancedOnboardingData, OnboardingProgress, calculateOnboardingProgress, shouldShowOnboarding } from '../types/onboarding';
import { parseLocationString } from '../data/locations';
import toast from 'react-hot-toast';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, refreshUserData, currentMode } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSupporterOnboarding, setShowSupporterOnboarding] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);

  // Determine if we should wrap with ProjectProvider (creator mode)
  const isCreatorMode = currentMode === 'creator';

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && user.uid) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');

          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          let currentUserData: any = {};

          if (userDoc.exists()) {
            currentUserData = userDoc.data();
          }

          // Convert current user data to enhanced onboarding data format
          const enhancedData: Partial<EnhancedOnboardingData> = {
            displayName: currentUserData.displayName || user.displayName || '',
            username: currentUserData.username || '',
            bio: currentUserData.bio || '',
            profileImage: currentUserData.profileImage || user.photoURL || '',
            location: currentUserData.locationData || parseLocationString(currentUserData.location || ''),
            website: currentUserData.website || '',
            socialLinks: currentUserData.socialLinks || {}
          };

          // Calculate current progress
          const progress = calculateOnboardingProgress(enhancedData);
          setOnboardingProgress(progress);

          // Determine if we should show onboarding
          const shouldShow = shouldShowOnboarding(
            progress,
            currentUserData.lastOnboardingPrompt ? new Date(currentUserData.lastOnboardingPrompt.seconds * 1000) : undefined,
            currentUserData.onboardingSkippedCount || 0
          );

          // Check if user needs supporter onboarding
          const needsSupporterOnboarding = !currentUserData.supporterOnboardingComplete &&
            (progress.level === 'incomplete' && progress.completionPercentage < 50);

          if (needsSupporterOnboarding) {
            setShowSupporterOnboarding(true);
          } else {
            setShowOnboarding(shouldShow && progress.level === 'incomplete');
            setShowBanner(shouldShow && progress.level !== 'incomplete' && progress.level !== 'complete');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // If there's an error, show supporter onboarding for users who haven't completed it
          if (user && !user.supporterOnboardingComplete) {
            setShowSupporterOnboarding(true);
          }
        }
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleOnboardingComplete = async (data: EnhancedOnboardingData) => {
    try {
      setShowOnboarding(false);
      setShowBanner(false);

      // Recalculate progress
      const newProgress = calculateOnboardingProgress(data);
      setOnboardingProgress(newProgress);

      // Refresh user data to update profile picture in navbar
      await refreshUserData();

      toast.success('Profile updated successfully! 🎉');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete profile setup. Please try again.');
    }
  };

  const handleBannerDismiss = async () => {
    if (!user || !onboardingProgress) return;

    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastOnboardingPrompt: new Date(),
        onboardingSkippedCount: increment(1)
      });

      setShowBanner(false);
    } catch (error) {
      console.error('Error dismissing banner:', error);
    }
  };

  const handleBannerComplete = () => {
    setShowBanner(false);
    setShowOnboarding(true);
  };

  const handleSupporterOnboardingComplete = () => {
    setShowSupporterOnboarding(false);
    // Optionally show the detailed onboarding after supporter onboarding
    // setShowOnboarding(true);
  };

  // The main content that needs to be wrapped with ProjectProvider when in creator mode
  const layoutContent = (
    <div className="min-h-screen bg-brand-black flex flex-col overflow-x-hidden">
      <Helmet>
        <title>Lineup - For the Idea Nation™</title>
        <meta name="description" content="Turn your innovative ideas into reality. Get funded by a community that believes in your vision." />
        <meta name="keywords" content="crowdfunding, startup, innovation, funding, projects, entrepreneurs" />
        <meta property="og:title" content="Lineup - For the Idea Nation™" />
        <meta property="og:description" content="Turn your innovative ideas into reality. Get funded by a community that believes in your vision." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <RoleAwareNavbar />

      {/* Onboarding Banner */}
      {showBanner && onboardingProgress && (
        <OnboardingBanner
          progress={onboardingProgress}
          onComplete={handleBannerComplete}
          onDismiss={handleBannerDismiss}
        />
      )}

      <main className="flex-1">
        {children || <Outlet />}
      </main>

      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />

      {/* Supporter Onboarding for new users */}
      <SupporterOnboarding
        isOpen={showSupporterOnboarding}
        onClose={() => setShowSupporterOnboarding(false)}
        onComplete={handleSupporterOnboardingComplete}
      />

      {/* Account Setup Modal for detailed profile setup */}
      <AccountSetupModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
        initialProgress={onboardingProgress || undefined}
      />
    </div>
  );

  // Wrap with ProjectProvider when in creator mode
  return isCreatorMode ? (
    <ProjectProvider>{layoutContent}</ProjectProvider>
  ) : (
    layoutContent
  );
}
