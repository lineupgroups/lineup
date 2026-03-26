import { useMemo } from 'react';
import { useContextualDonations } from './useContextualDonations';

interface DonationHistoryItem {
    id: string;
    amount: number;
    projectTitle: string;
    projectId: string;
    date: Date;
    transactionId?: string;
    thankedAt?: Date;
}

interface Supporter {
    id: string;
    visibleDonationId: string; // The donation ID to use for thank you (most recent)
    userId: string;
    displayName: string;
    displayProfileImage: string | null;
    totalAmount: number;
    donationCount: number;
    anonymous: boolean;
    latestDonation: Date;
    projects: string[];
    donationHistory: DonationHistoryItem[];
    // Thanked status - true if ANY donation from this supporter was thanked
    isThanked: boolean;
    thankedAt?: Date;
}

/**
 * A contextual hook that returns supporters aggregated by user,
 * filtered by the selected project.
 * If a specific project is selected, returns supporters for that project only.
 * If "All Projects" is selected, returns all supporters across all projects.
 */
export function useContextualSupporters() {
    const {
        donations,
        loading,
        error,
        isFiltered,
        selectedProjectId,
        selectedProject
    } = useContextualDonations({ limitCount: 500 });

    // Aggregate donations by supporter
    const supporters = useMemo(() => {
        const supporterMap = new Map<string, Supporter>();

        donations.forEach(donation => {
            // Use a unique key for anonymous donors
            const key = donation.anonymous ? `anon-${donation.id}` : donation.userId;
            const existing = supporterMap.get(key);

            const donationDate = donation.backedAt?.toDate?.() || new Date();
            const donationThankedAt = donation.thankedAt?.toDate?.() || undefined;

            const historyItem: DonationHistoryItem = {
                id: donation.id,
                amount: donation.amount,
                projectTitle: donation.projectTitle,
                projectId: donation.projectId,
                date: donationDate,
                transactionId: donation.transactionId,
                thankedAt: donationThankedAt
            };

            if (existing) {
                existing.totalAmount += donation.amount;
                existing.donationCount += 1;
                existing.donationHistory.push(historyItem);
                if (!existing.projects.includes(donation.projectTitle)) {
                    existing.projects.push(donation.projectTitle);
                }
                // Update latest donation date and visibleDonationId
                if (donationDate > existing.latestDonation) {
                    existing.latestDonation = donationDate;
                    existing.visibleDonationId = donation.id;
                }
                // Update thanked status if any donation was thanked
                if (donationThankedAt) {
                    existing.isThanked = true;
                    if (!existing.thankedAt || donationThankedAt > existing.thankedAt) {
                        existing.thankedAt = donationThankedAt;
                    }
                }
            } else {
                supporterMap.set(key, {
                    id: key,
                    visibleDonationId: donation.id,
                    userId: donation.userId,
                    displayName: donation.displayName || 'Anonymous',
                    displayProfileImage: donation.displayProfileImage || null,
                    totalAmount: donation.amount,
                    donationCount: 1,
                    anonymous: donation.anonymous,
                    latestDonation: donationDate,
                    projects: [donation.projectTitle],
                    donationHistory: [historyItem],
                    isThanked: !!donationThankedAt,
                    thankedAt: donationThankedAt
                });
            }
        });

        // Convert to array, sort by total amount, and sort each donor's history by date
        return Array.from(supporterMap.values())
            .map(s => ({
                ...s,
                donationHistory: s.donationHistory.sort((a, b) => b.date.getTime() - a.date.getTime())
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
    }, [donations]);

    // Get top supporters (top 5 by amount)
    const topSupporters = useMemo(() => {
        return supporters.slice(0, 5);
    }, [supporters]);

    // Calculate stats
    const stats = useMemo(() => {
        return {
            totalSupporters: supporters.length,
            uniqueNonAnonymous: supporters.filter(s => !s.anonymous).length,
            anonymousCount: supporters.filter(s => s.anonymous).length,
            totalRaised: supporters.reduce((sum, s) => sum + s.totalAmount, 0),
            avgContribution: supporters.length > 0
                ? supporters.reduce((sum, s) => sum + s.totalAmount, 0) / supporters.length
                : 0,
            repeatSupporters: supporters.filter(s => s.donationCount > 1).length
        };
    }, [supporters]);

    return {
        supporters,
        topSupporters,
        stats,
        donations,
        loading,
        error,
        isFiltered,
        selectedProjectId,
        selectedProject
    };
}

export default useContextualSupporters;
