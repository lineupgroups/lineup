import { useState, useEffect, useCallback } from 'react';
import {
  getCreatorEarnings,
  getPayoutHistory,
  requestPayout,
  saveBankDetails,
  getEarningsSummary
} from '../lib/earnings';
import { FirestoreCreatorEarnings, FirestorePayout } from '../types/firestore';
import toast from 'react-hot-toast';

export const useEarnings = (userId: string | undefined) => {
  const [earnings, setEarnings] = useState<FirestoreCreatorEarnings | null>(null);
  const [payouts, setPayouts] = useState<FirestorePayout[]>([]);
  const [summary, setSummary] = useState<{
    totalRaised: number;
    availableBalance: number;
    pendingBalance: number;
    totalWithdrawn: number;
    platformFees: number;
    platformFeePercentage: number;
    hasBankDetails: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayout, setProcessingPayout] = useState(false);

  const fetchEarnings = useCallback(async () => {
    if (!userId) {
      setEarnings(null);
      setPayouts([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const [fetchedEarnings, fetchedPayouts, fetchedSummary] = await Promise.all([
        getCreatorEarnings(userId),
        getPayoutHistory(userId),
        getEarningsSummary(userId)
      ]);
      
      setEarnings(fetchedEarnings);
      setPayouts(fetchedPayouts);
      setSummary(fetchedSummary);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const updateBankDetails = async (bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }) => {
    if (!userId) return;
    
    try {
      await saveBankDetails(userId, bankDetails);
      await fetchEarnings();
      toast.success('Bank details saved successfully!');
    } catch (err) {
      console.error('Error saving bank details:', err);
      toast.error('Failed to save bank details');
      throw err;
    }
  };

  const withdrawFunds = async (
    amount: number,
    method: 'bank_transfer' | 'upi',
    upiId?: string
  ) => {
    if (!userId) return;
    
    try {
      setProcessingPayout(true);
      const payoutId = await requestPayout(userId, amount, method, upiId);
      await fetchEarnings();
      toast.success('Payout requested successfully! Processing...');
      return payoutId;
    } catch (err) {
      console.error('Error requesting payout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request payout';
      toast.error(errorMessage);
      throw err;
    } finally {
      setProcessingPayout(false);
    }
  };

  return {
    earnings,
    payouts,
    summary,
    loading,
    error,
    processingPayout,
    updateBankDetails,
    withdrawFunds,
    refetch: fetchEarnings
  };
};
