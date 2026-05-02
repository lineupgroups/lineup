import { useMemo } from 'react';
import { DollarSign, Users, TrendingUp, Repeat, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Supporter {
    id: string;
    userId: string;
    displayName: string;
    displayProfileImage: string | null;
    totalAmount: number;
    donationCount: number;
    anonymous: boolean;
    latestDonation: Date;
    projects: string[];
    donationHistory: {
        id: string;
        amount: number;
        projectTitle: string;
        projectId: string;
        date: Date;
        transactionId?: string;
    }[];
}

interface BackersStatsCardProps {
    supporters: Supporter[];
    stats: {
        totalSupporters: number;
        uniqueNonAnonymous: number;
        anonymousCount: number;
        totalRaised: number;
        avgContribution: number;
        repeatSupporters: number;
    };
    loading: boolean;
    isFilteringByProject: boolean;
}

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Format compact number
const formatCompact = (num: number): string => {
    if (num >= 100000) {
        return `₹${(num / 100000).toFixed(1)}L`;
    } else if (num >= 1000) {
        return `₹${(num / 1000).toFixed(1)}K`;
    }
    return `₹${num}`;
};

// Trend indicator component
const TrendIndicator = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    if (value === 0) {
        return (
            <span className="flex items-center text-neutral-500 text-xs">
                <Minus className="w-3 h-3 mr-0.5" />
                No change{suffix}
            </span>
        );
    }

    if (value > 0) {
        return (
            <span className="flex items-center text-brand-acid text-xs">
                <ArrowUp className="w-3 h-3 mr-0.5" />
                +{value}{suffix}
            </span>
        );
    }

    return (
        <span className="flex items-center text-brand-orange text-xs">
            <ArrowDown className="w-3 h-3 mr-0.5" />
            {value}{suffix}
        </span>
    );
};

// Loading skeleton
const StatCardSkeleton = () => (
    <div className="bg-[#111] rounded-3xl border border-neutral-800 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-neutral-800 rounded-2xl" />
            <div className="h-4 bg-neutral-800 rounded w-24" />
        </div>
        <div className="h-8 bg-neutral-800 rounded w-32 mb-2" />
        <div className="h-3 bg-neutral-800 rounded w-20" />
    </div>
);

export default function BackersStatsCard({
    supporters,
    stats,
    loading,
    isFilteringByProject
}: BackersStatsCardProps) {
    // Calculate weekly trends
    const weeklyStats = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // This week's donations
        const thisWeekSupporters = supporters.filter(s => s.latestDonation >= oneWeekAgo);
        const thisWeekAmount = thisWeekSupporters.reduce((sum, s) => {
            // Only count amounts from this week
            // Note: This is approximate since we only have latestDonation
            return sum + (s.latestDonation >= oneWeekAgo ? s.totalAmount : 0);
        }, 0);

        // Last week's donations (approximate)
        const lastWeekSupporters = supporters.filter(
            s => s.latestDonation >= twoWeeksAgo && s.latestDonation < oneWeekAgo
        );

        // New backers this week
        const newBackersThisWeek = thisWeekSupporters.length;

        // New repeat backers this week (donated more than once and latest is this week)
        const repeatBackersThisWeek = thisWeekSupporters.filter(s => s.donationCount > 1).length;
        const repeatBackersLastWeek = lastWeekSupporters.filter(s => s.donationCount > 1).length;

        return {
            amountThisWeek: thisWeekAmount,
            newBackersThisWeek,
            backersChange: newBackersThisWeek - lastWeekSupporters.length,
            repeatChange: repeatBackersThisWeek - repeatBackersLastWeek
        };
    }, [supporters]);

    // Calculate percentage for repeat backers
    const repeatPercentage = stats.totalSupporters > 0
        ? Math.round((stats.repeatSupporters / stats.totalSupporters) * 100)
        : 0;

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Total Raised */}
            <div className="bg-[#111] rounded-3xl p-6 border border-neutral-800 hover:border-brand-acid/50 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Capital</span>
                    </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                    {formatCurrency(stats.totalRaised)}
                </h3>
                <p className="text-sm text-neutral-400 mt-2 font-medium">
                    {isFilteringByProject ? 'Project Total' : 'Global Revenue'}
                </p>

                {weeklyStats.amountThisWeek > 0 && (
                    <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 text-brand-acid" />
                        +{formatCompact(weeklyStats.amountThisWeek)} this week
                    </p>
                )}
            </div>

            {/* Unique Backers */}
            <div className="bg-[#111] rounded-3xl p-6 border border-neutral-800 hover:border-brand-orange/50 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-brand-black transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Cohort</span>
                    </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                    {stats.totalSupporters}
                </h3>
                <p className="text-sm text-neutral-400 mt-2 font-medium">
                    {stats.uniqueNonAnonymous} Elite • {stats.anonymousCount} Ghost
                </p>

                {weeklyStats.newBackersThisWeek > 0 && (
                    <p className="text-xs text-neutral-500 mt-1">
                        <TrendIndicator value={weeklyStats.newBackersThisWeek} suffix=" NEW" />
                    </p>
                )}
            </div>

            {/* Average Donation */}
            <div className="bg-[#111] rounded-3xl p-6 border border-neutral-800 hover:border-brand-acid/50 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Unit</span>
                    </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                    {formatCurrency(stats.avgContribution)}
                </h3>
                <p className="text-sm text-neutral-400 mt-2 font-medium">
                    Average Commitment
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                    Stable efficiency
                </p>
            </div>

            {/* Loyalty / Repeat — Special highlighted card */}
            <div className="bg-[#111] rounded-3xl p-6 border border-brand-orange/30 hover:border-brand-orange transition-all duration-300 group shadow-[0_0_15px_rgba(255,91,0,0.1)] hover:shadow-[0_0_25px_rgba(255,91,0,0.2)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-brand-black transition-colors">
                        <Repeat className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange/80">Loyalty</span>
                    </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                    {repeatPercentage}%
                </h3>
                <p className="text-sm text-neutral-400 mt-2 font-medium">
                    {stats.repeatSupporters} Recurring Legends
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                    {weeklyStats.repeatChange !== 0 ? (
                        <TrendIndicator value={weeklyStats.repeatChange} suffix=" TREND" />
                    ) : (
                        <span className="text-brand-orange">Solid retention</span>
                    )}
                </p>
            </div>
        </div>
    );
}
