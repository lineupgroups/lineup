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
            <span className="flex items-center text-green-400 text-xs">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Raised */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 hover:bg-white/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Capital</span>
                    </div>
                </div>
                
                <div className="space-y-1 relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                        {formatCurrency(stats.totalRaised)}
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-2">
                        {isFilteringByProject ? 'Project Total' : 'Global Revenue'}
                    </p>
                </div>

                {weeklyStats.amountThisWeek > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Momentum</span>
                        <span className="text-[10px] font-black text-brand-acid uppercase tracking-[0.2em] flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            +{formatCompact(weeklyStats.amountThisWeek)}
                        </span>
                    </div>
                )}
            </div>

            {/* Unique Backers */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 hover:bg-white/10 transition-all group relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-brand-black transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Cohort</span>
                    </div>
                </div>

                <div className="space-y-1 relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                        {stats.totalSupporters}
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-2">
                        {stats.uniqueNonAnonymous} Elite • {stats.anonymousCount} Ghost
                    </p>
                </div>

                {weeklyStats.newBackersThisWeek > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Growth</span>
                        <TrendIndicator value={weeklyStats.newBackersThisWeek} suffix=" NEW" />
                    </div>
                )}
            </div>

            {/* Average Donation */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 hover:bg-white/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Unit</span>
                    </div>
                </div>

                <div className="space-y-1 relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                        {formatCurrency(stats.avgContribution)}
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-2">
                        Average Commitment
                    </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-50">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Efficiency</span>
                    <span className="text-[10px] font-black text-brand-acid uppercase tracking-[0.2em]">Stable</span>
                </div>
            </div>

            {/* Loyalty / Repeat */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-brand-orange/30 p-8 hover:bg-white/10 transition-all group relative overflow-hidden shadow-[0_0_30px_rgba(255,91,0,0.1)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-brand-black transition-colors border border-brand-orange/20">
                        <Repeat className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange/80">Loyalty</span>
                    </div>
                </div>

                <div className="space-y-1 relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                        {repeatPercentage}%
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-2">
                        {stats.repeatSupporters} Recurring Legends
                    </p>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-orange/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Retention</span>
                    {weeklyStats.repeatChange !== 0 ? (
                        <TrendIndicator value={weeklyStats.repeatChange} suffix=" TREND" />
                    ) : (
                        <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em]">Solid</span>
                    )}
                </div>
            </div>
        </div>
    );
}
