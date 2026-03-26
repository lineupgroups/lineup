import { useMemo } from 'react';
import { useProjectContext } from './useProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useEarnings } from './useEarnings';
import { useContextualDonations } from './useContextualDonations';

/**
 * A contextual hook that returns earnings data filtered by the selected project.
 * Combines the global earnings summary with project-filtered donation data.
 */
export function useContextualEarnings() {
    const { user } = useAuth();
    const { selectedProjectId, selectedProject } = useProjectContext();

    // Get global earnings summary (this is always for the entire creator account)
    const {
        summary: globalSummary,
        payouts,
        loading: earningsLoading,
        error: earningsError,
        updateBankDetails,
        withdrawFunds,
        processingPayout
    } = useEarnings(user?.uid);

    // Get filtered donations for project-specific calculations
    const {
        donations,
        stats: donationStats,
        loading: donationsLoading,
        projectsToFetch
    } = useContextualDonations({ limitCount: 500 });

    // Calculate project-specific earnings based on filtered donations
    const projectEarnings = useMemo(() => {
        if (!selectedProjectId) {
            // When viewing all projects, use global summary
            return {
                grossEarnings: globalSummary?.totalRaised || 0,
                platformFee: globalSummary?.platformFees || (globalSummary?.totalRaised || 0) * 0.05,
                paymentGatewayFee: (globalSummary?.totalRaised || 0) * 0.02,
                netEarnings: 0,
                tds: 0,
                takeHome: 0
            };
        }

        // Calculate from filtered donations
        const grossEarnings = donationStats.totalAmount;
        const platformFee = grossEarnings * 0.05;
        const paymentGatewayFee = grossEarnings * 0.02;
        const netEarnings = grossEarnings - platformFee - paymentGatewayFee;
        const tds = netEarnings > 50000 ? netEarnings * 0.10 : 0;
        const takeHome = netEarnings - tds;

        return {
            grossEarnings,
            platformFee,
            paymentGatewayFee,
            netEarnings,
            tds,
            takeHome
        };
    }, [selectedProjectId, globalSummary, donationStats]);

    // Calculate net earnings and take home
    const earnings = useMemo(() => {
        const netEarnings = projectEarnings.grossEarnings - projectEarnings.platformFee - projectEarnings.paymentGatewayFee;
        return {
            ...projectEarnings,
            netEarnings,
            takeHome: netEarnings - projectEarnings.tds
        };
    }, [projectEarnings]);

    // Earnings by project breakdown (from filtered donations)
    const earningsByProject = useMemo(() => {
        const projectMap = new Map<string, { id: string; title: string; amount: number; count: number }>();

        donations.forEach(d => {
            const existing = projectMap.get(d.projectId);
            if (existing) {
                existing.amount += d.amount;
                existing.count += 1;
            } else {
                projectMap.set(d.projectId, {
                    id: d.projectId,
                    title: d.projectTitle,
                    amount: d.amount,
                    count: 1
                });
            }
        });

        return Array.from(projectMap.values()).sort((a, b) => b.amount - a.amount);
    }, [donations]);

    const isFiltered = selectedProjectId !== null;

    return {
        // Summary data
        globalSummary,
        earnings,
        earningsByProject,

        // Filtered donation data
        donations,
        donationStats,

        // Payout data (always global)
        payouts,

        // Actions (always global)
        updateBankDetails,
        withdrawFunds,
        processingPayout,

        // Loading states
        loading: earningsLoading || donationsLoading,
        error: earningsError,

        // Filter info
        isFiltered,
        selectedProjectId,
        selectedProject,
        projectsToFetch
    };
}

export default useContextualEarnings;
