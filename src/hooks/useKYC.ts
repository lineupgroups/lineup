import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserKYC, hasApprovedKYC } from '../lib/kycService';
import { UserKYCData } from '../types/kyc';

/**
 * Custom hook for managing KYC state
 * Fetches and tracks user's KYC data and approval status
 */
export const useKYC = () => {
    const { user } = useAuth();
    const [kycData, setKycData] = useState<UserKYCData | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchKYCData = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch KYC data
                const data = await getUserKYC(user.uid);
                setKycData(data);

                // Check approval status
                if (data) {
                    setIsApproved(data.status === 'approved');
                } else {
                    setIsApproved(false);
                }
            } catch (err) {
                console.error('Error fetching KYC data:', err);
                setError('Failed to load KYC data');
                setKycData(null);
                setIsApproved(false);
            } finally {
                setLoading(false);
            }
        };

        fetchKYCData();
    }, [user?.uid]);

    /**
     * Refresh KYC data (call after submission or update)
     */
    const refreshKYC = async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            const data = await getUserKYC(user.uid);
            setKycData(data);
            setIsApproved(data?.status === 'approved' || false);
        } catch (err) {
            console.error('Error refreshing KYC data:', err);
            setError('Failed to refresh KYC data');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Check if user has completed KYC (submitted or approved)
     */
    const hasKYC = (): boolean => {
        return kycData !== null;
    };

    /**
     * Check if user can submit KYC (hasn't submitted yet or was rejected)
     */
    const canSubmitKYC = (): boolean => {
        return kycData === null || kycData.status === 'rejected';
    };

    /**
     * Get KYC status message for UI display
     */
    const getStatusMessage = (): string => {
        if (!kycData) return 'Not submitted';

        switch (kycData.status) {
            case 'pending':
                return 'Pending review';
            case 'under_review':
                return 'Under review';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            default:
                return 'Unknown status';
        }
    };

    /**
     * Get KYC status color for UI display
     */
    const getStatusColor = (): string => {
        if (!kycData) return 'gray';

        switch (kycData.status) {
            case 'pending':
            case 'under_review':
                return 'yellow';
            case 'approved':
                return 'green';
            case 'rejected':
                return 'red';
            default:
                return 'gray';
        }
    };

    return {
        kycData,
        isApproved,
        loading,
        error,
        hasKYC: hasKYC(),
        canSubmitKYC: canSubmitKYC(),
        refreshKYC,
        getStatusMessage,
        getStatusColor,
    };
};

/**
 * Simple hook to check if user is creator verified (KYC approved)
 */
export const useIsCreatorVerified = (): boolean => {
    const { user } = useAuth();
    return user?.isCreatorVerified || false;
};

/**
 * Hook to check KYC approval status (async)
 */
export const useKYCApproval = () => {
    const { user } = useAuth();
    const [isApproved, setIsApproved] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkApproval = async () => {
            if (!user?.uid) {
                setChecking(false);
                return;
            }

            try {
                const approved = await hasApprovedKYC(user.uid);
                setIsApproved(approved);
            } catch (error) {
                console.error('Error checking KYC approval:', error);
                setIsApproved(false);
            } finally {
                setChecking(false);
            }
        };

        checkApproval();
    }, [user?.uid]);

    return { isApproved, checking };
};
