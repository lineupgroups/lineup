/**
 * Landing Page Initialization Script
 * 
 * Run this once to create default Firestore documents for the landing page
 * This will prevent errors when using the admin panel for the first time
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const initializeLandingPageDocuments = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing landing page documents...');

    // 1. Create default platform settings
    const settingsRef = doc(db, 'platform-settings', 'landing_page_settings');
    await setDoc(settingsRef, {
      showSuccessStories: false,
      showStatistics: true,
      showTestimonials: false,
      showLiveTicker: false,
      statisticsMode: 'manual',
      liveTickerSpeed: 5,
      liveTickerLimit: 20,
      showTrustBadges: true,
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    });
    console.log('✅ Platform settings created');

    // 2. Create default platform statistics
    const statsRef = doc(db, 'platform-stats', 'current');
    await setDoc(statsRef, {
      totalProjectsCreated: 0,
      totalProjectsFunded: 0,
      totalAmountRaised: 0,
      totalSupporters: 0,
      successRate: 0,
      lastCalculated: serverTimestamp(),
      manualStats: {
        totalProjectsCreated: 100,
        totalProjectsFunded: 85,
        totalAmountRaised: 5000000,
        totalSupporters: 500,
        successRate: 85
      },
      updatedAt: serverTimestamp()
    });
    console.log('✅ Platform statistics created');

    console.log('🎉 Landing page initialization complete!');
    console.log('You can now use the admin panel to manage landing page content.');
    
  } catch (error) {
    console.error('❌ Error initializing landing page documents:', error);
    throw error;
  }
};

// You can call this function from browser console:
// import { initializeLandingPageDocuments } from './lib/initializeLandingPage';
// initializeLandingPageDocuments();


