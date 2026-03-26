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
            <span className="flex items-center text-gray-500 text-xs">
                <Minus className="w-3 h-3 mr-0.5" />
                No change{suffix}
            </span>
        );
    }

    if (value > 0) {
        return (
            <span className="flex items-center text-green-600 text-xs">
                <ArrowUp className="w-3 h-3 mr-0.5" />
                +{value}{suffix}
            </span>
        );
    }

    return (
        <span className="flex items-center text-red-500 text-xs">
            <ArrowDown className="w-3 h-3 mr-0.5" />
            {value}{suffix}
        </span>
    );
};

// Loading skeleton
const StatCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-20" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Raised */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Total Raised</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRaised)}
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                        {isFilteringByProject ? 'For this project' : 'Across all projects'}
                    </span>
                    {weeklyStats.amountThisWeek > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                            +{formatCompact(weeklyStats.amountThisWeek)} this week
                        </span>
                    )}
                </div>
            </div>

            {/* Unique Backers */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Unique Backers</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {stats.totalSupporters}
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                        {stats.uniqueNonAnonymous} named, {stats.anonymousCount} anon
                    </span>
                    {weeklyStats.newBackersThisWeek > 0 && (
                        <TrendIndicator value={weeklyStats.newBackersThisWeek} suffix=" new" />
                    )}
                </div>
            </div>

            {/* Average Donation */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Avg. Donation</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.avgContribution)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Per backer
                </div>
            </div>

            {/* Repeat Backers */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg">
                        <Repeat className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Repeat Backers</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {stats.repeatSupporters}
                    <span className="text-lg font-medium text-gray-500 ml-1">
                        ({repeatPercentage}%)
                    </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                        Backed {isFilteringByProject ? 'multiple times' : 'multiple projects'}
                    </span>
                    {weeklyStats.repeatChange !== 0 && (
                        <TrendIndicator value={weeklyStats.repeatChange} suffix=" this week" />
                    )}
                </div>
            </div>
        </div>
    );
}
