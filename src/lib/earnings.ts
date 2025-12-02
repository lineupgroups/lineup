import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreCreatorEarnings,
  FirestorePayout
} from '../types/firestore';
import { getProjectsByCreator } from './firestore';

const EARNINGS_COLLECTION = 'creator-earnings';
const PAYOUTS_COLLECTION = 'payouts';

// Platform fee percentage (mocked)
const PLATFORM_FEE_PERCENTAGE = 5;

// Calculate platform fees
const calculatePlatformFee = (amount: number): number => {
  return Math.floor((amount * PLATFORM_FEE_PERCENTAGE) / 100);
};

// Get or create earnings record for a creator
export const getCreatorEarnings = async (userId: string): Promise<FirestoreCreatorEarnings> => {
  try {
    const docRef = doc(db, EARNINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreCreatorEarnings;
    }
    
    // Create initial earnings record
    const initialEarnings: FirestoreCreatorEarnings = {
      userId,
      totalRaised: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      platformFees: 0,
      currency: 'INR',
      lastUpdated: Timestamp.now()
    };
    
    await setDoc(docRef, initialEarnings);
    return initialEarnings;
  } catch (error) {
    console.error('Error getting creator earnings:', error);
    throw new Error('Failed to get creator earnings');
  }
};

// Update earnings after a new donation
export const updateEarningsAfterDonation = async (
  creatorId: string,
  amount: number
): Promise<void> => {
  try {
    const docRef = doc(db, EARNINGS_COLLECTION, creatorId);
    const earnings = await getCreatorEarnings(creatorId);
    
    const platformFee = calculatePlatformFee(amount);
    const netAmount = amount - platformFee;
    
    await updateDoc(docRef, {
      totalRaised: earnings.totalRaised + amount,
      availableBalance: earnings.availableBalance + netAmount,
      platformFees: earnings.platformFees + platformFee,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating earnings:', error);
    throw new Error('Failed to update earnings');
  }
};

// Save bank details (mocked - for display only)
export const saveBankDetails = async (
  userId: string,
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }
): Promise<void> => {
  try {
    const docRef = doc(db, EARNINGS_COLLECTION, userId);
    
    // Mask account number (show only last 4 digits)
    const maskedAccountNumber = 'XXXX XXXX ' + bankDetails.accountNumber.slice(-4);
    
    await updateDoc(docRef, {
      bankDetails: {
        ...bankDetails,
        accountNumber: maskedAccountNumber,
        verified: true // Auto-verify in mocked system
      },
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    throw new Error('Failed to save bank details');
  }
};

// Request a payout (mocked)
export const requestPayout = async (
  creatorId: string,
  amount: number,
  method: 'bank_transfer' | 'upi',
  upiId?: string
): Promise<string> => {
  try {
    const earnings = await getCreatorEarnings(creatorId);
    
    // Validate payout amount
    if (amount > earnings.availableBalance) {
      throw new Error('Insufficient balance');
    }
    
    if (amount < 500) {
      throw new Error('Minimum payout amount is ₹500');
    }
    
    // Generate mock reference number
    const reference = `PAY${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Create payout record
    const payout: Omit<FirestorePayout, 'id'> = {
      creatorId,
      amount,
      status: 'pending',
      requestedAt: Timestamp.now(),
      method,
      upiId: method === 'upi' ? upiId : undefined,
      reference
    };
    
    const docRef = await addDoc(collection(db, PAYOUTS_COLLECTION), payout);
    
    // Update earnings balance
    const earningsDocRef = doc(db, EARNINGS_COLLECTION, creatorId);
    await updateDoc(earningsDocRef, {
      availableBalance: earnings.availableBalance - amount,
      pendingBalance: earnings.pendingBalance + amount,
      lastUpdated: serverTimestamp()
    });
    
    // Simulate processing (in a real system, this would be handled by a backend)
    setTimeout(async () => {
      try {
        await simulatePayoutProcessing(docRef.id, creatorId, amount);
      } catch (error) {
        console.error('Error processing payout:', error);
      }
    }, 5000); // Simulate 5 second processing
    
    return docRef.id;
  } catch (error) {
    console.error('Error requesting payout:', error);
    throw new Error(`Failed to request payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Simulate payout processing (mocked)
const simulatePayoutProcessing = async (
  payoutId: string,
  creatorId: string,
  amount: number
): Promise<void> => {
  try {
    // Update payout status to processing
    const payoutDocRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    await updateDoc(payoutDocRef, {
      status: 'processing',
      processedAt: serverTimestamp()
    });
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Randomly succeed or fail (90% success rate for demo)
    const success = Math.random() > 0.1;
    
    if (success) {
      // Mark as completed
      await updateDoc(payoutDocRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      
      // Update earnings
      const earnings = await getCreatorEarnings(creatorId);
      const earningsDocRef = doc(db, EARNINGS_COLLECTION, creatorId);
      await updateDoc(earningsDocRef, {
        pendingBalance: earnings.pendingBalance - amount,
        totalWithdrawn: earnings.totalWithdrawn + amount,
        lastUpdated: serverTimestamp()
      });
    } else {
      // Mark as failed
      await updateDoc(payoutDocRef, {
        status: 'failed',
        completedAt: serverTimestamp(),
        failureReason: 'Bank details verification failed. Please update your bank information.'
      });
      
      // Refund to available balance
      const earnings = await getCreatorEarnings(creatorId);
      const earningsDocRef = doc(db, EARNINGS_COLLECTION, creatorId);
      await updateDoc(earningsDocRef, {
        availableBalance: earnings.availableBalance + amount,
        pendingBalance: earnings.pendingBalance - amount,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error simulating payout processing:', error);
  }
};

// Get payout history for a creator
export const getPayoutHistory = async (
  creatorId: string,
  limitCount: number = 50
): Promise<FirestorePayout[]> => {
  try {
    const q = query(
      collection(db, PAYOUTS_COLLECTION),
      where('creatorId', '==', creatorId),
      orderBy('requestedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestorePayout[];
  } catch (error) {
    console.error('Error getting payout history:', error);
    return [];
  }
};

// Get a single payout
export const getPayout = async (payoutId: string): Promise<FirestorePayout | null> => {
  try {
    const docRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestorePayout;
    }
    return null;
  } catch (error) {
    console.error('Error getting payout:', error);
    return null;
  }
};

// Calculate total earnings across all projects
export const calculateTotalEarnings = async (creatorId: string): Promise<void> => {
  try {
    const projects = await getProjectsByCreator(creatorId);
    
    let totalRaised = 0;
    projects.forEach(project => {
      totalRaised += project.raised || 0;
    });
    
    const platformFee = calculatePlatformFee(totalRaised);
    
    const earnings = await getCreatorEarnings(creatorId);
    const docRef = doc(db, EARNINGS_COLLECTION, creatorId);
    
    await updateDoc(docRef, {
      totalRaised,
      platformFees: platformFee,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error calculating total earnings:', error);
  }
};

// Get earnings summary
export const getEarningsSummary = async (creatorId: string): Promise<{
  totalRaised: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  platformFees: number;
  platformFeePercentage: number;
  hasBankDetails: boolean;
}> => {
  try {
    const earnings = await getCreatorEarnings(creatorId);
    
    return {
      totalRaised: earnings.totalRaised,
      availableBalance: earnings.availableBalance,
      pendingBalance: earnings.pendingBalance,
      totalWithdrawn: earnings.totalWithdrawn,
      platformFees: earnings.platformFees,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
      hasBankDetails: !!earnings.bankDetails?.verified
    };
  } catch (error) {
    console.error('Error getting earnings summary:', error);
    return {
      totalRaised: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      platformFees: 0,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
      hasBankDetails: false
    };
  }
};
