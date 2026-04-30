import { useMemo } from 'react';
import { FileText, Eye, ThumbsUp, MessageSquare, TrendingUp, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { FirestoreProjectUpdate } from '../../types/firestore';
import { convertTimestamp } from '../../lib/firestore';

interface UpdatesStatsCardProps {
    updates: FirestoreProjectUpdate[];
    projectTitle?: string;
}

interface StatCard {
    label: string;
    value: number | string;
    trend?: number;
    trendLabel: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    isRate?: boolean;
}

/**
 * Phase 1: Enhanced Summary Stats Dashboard for Updates Tab
 * Shows 4 cards with weekly trends + Best Performing Update
 */
export default function UpdatesStatsCard({ updates, projectTitle }: UpdatesStatsCardProps) {
    // Calculate stats and trends
    const stats = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Total counts - only use actual viewCount, not fake formula
        const totalPosts = updates.length;
        const totalViews = updates.reduce((acc, u) => acc + ((u as any).viewCount || 0), 0);
        const totalLikes = updates.reduce((acc, u) => acc + (u.likes || 0), 0);
        const totalComments = updates.reduce((acc, u) => acc + (u.commentCount || 0), 0);

        // This week counts
        const thisWeekUpdates = updates.filter(u => convertTimestamp(u.createdAt) >= oneWeekAgo);
        const thisWeekPosts = thisWeekUpdates.length;
        const thisWeekViews = thisWeekUpdates.reduce((acc, u) => acc + ((u as any).viewCount || 0), 0);
        const thisWeekLikes = thisWeekUpdates.reduce((acc, u) => acc + (u.likes || 0), 0);
        const thisWeekComments = thisWeekUpdates.reduce((acc, u) => acc + (u.commentCount || 0), 0);

        // Last week counts (for trend comparison)
        const lastWeekUpdates = updates.filter(u => {
            const date = convertTimestamp(u.createdAt);
            return date >= twoWeeksAgo && date < oneWeekAgo;
        });
        const lastWeekPosts = lastWeekUpdates.length;
        const lastWeekViews = lastWeekUpdates.reduce((acc, u) => acc + ((u as any).viewCount || 0), 0);
        const lastWeekLikes = lastWeekUpdates.reduce((acc, u) => acc + (u.likes || 0), 0);
        const lastWeekComments = lastWeekUpdates.reduce((acc, u) => acc + (u.commentCount || 0), 0);

        // Calculate trends (percentage change)
        const calculateTrend = (current: number, previous: number): number => {
            if (previous === 0 && current === 0) return 0;
            if (previous === 0) return 100;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Find best performing update - based on likes and comments (actual engagement)
        const bestUpdate = [...updates].sort((a, b) => {
            const scoreA = (a.likes || 0) * 2 + (a.commentCount || 0) * 3;
            const scoreB = (b.likes || 0) * 2 + (b.commentCount || 0) * 3;
            return scoreB - scoreA;
        })[0] || null;

        // Calculate engagement rate - if no views tracked, use likes+comments ratio
        const hasViews = totalViews > 0;
        const engagementRate = hasViews
            ? ((totalLikes + totalComments * 2) / totalViews * 100).toFixed(1)
            : totalPosts > 0 ? ((totalLikes + totalComments) / totalPosts).toFixed(1) : '0.0';

        return {
            totalPosts,
            totalViews,
            totalLikes,
            totalComments,
            thisWeekPosts,
            thisWeekLikes,
            thisWeekComments,
            thisWeekViews,
            postsTrend: calculateTrend(thisWeekPosts, lastWeekPosts),
            viewsTrend: calculateTrend(thisWeekViews, lastWeekViews),
            likesTrend: calculateTrend(thisWeekLikes, lastWeekLikes),
            commentsTrend: calculateTrend(thisWeekComments, lastWeekComments),
            bestUpdate,
            engagementRate
        };
    }, [updates]);

    const statCards: StatCard[] = [
        {
            label: 'Total Posts',
            value: stats.totalPosts,
            trend: stats.postsTrend,
            trendLabel: `${stats.thisWeekPosts > 0 ? '+' : ''}${stats.thisWeekPosts} this week`,
            icon: <FileText className="w-5 h-5" />,
            iconBg: 'bg-brand-orange/20',
            iconColor: 'text-brand-orange'
        },
        {
            label: 'Engagement Rate',
            value: stats.totalViews > 0 ? stats.totalViews : `${stats.engagementRate}/post`,
            trend: stats.viewsTrend,
            trendLabel: stats.totalViews > 0 ? `${stats.thisWeekViews > 0 ? '+' : ''}${stats.thisWeekViews} this week` : 'Avg. engagement',
            icon: <Eye className="w-5 h-5" />,
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
            isRate: stats.totalViews === 0
        },
        {
            label: 'Total Likes',
            value: stats.totalLikes,
            trend: stats.likesTrend,
            trendLabel: `${stats.thisWeekLikes > 0 ? '+' : ''}${stats.thisWeekLikes} this week`,
            icon: <ThumbsUp className="w-5 h-5" />,
            iconBg: 'bg-green-500/20',
            iconColor: 'text-green-400'
        },
        {
            label: 'Comments',
            value: stats.totalComments,
            trend: stats.commentsTrend,
            trendLabel: `${stats.thisWeekComments > 0 ? '+' : ''}${stats.thisWeekComments} this week`,
            icon: <MessageSquare className="w-5 h-5" />,
            iconBg: 'bg-purple-500/20',
            iconColor: 'text-purple-400'
        }
    ];

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString('en-IN');
    };

    const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    // Show "Get Started" card when no updates
    if (updates.length === 0) {
        return (
            <div className="bg-[#111] rounded-3xl shadow-sm border border-neutral-800 overflow-hidden mb-6">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800 bg-gradient-to-r from-brand-orange/10 to-red-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#111] rounded-2xl shadow-sm">
                            <TrendingUp className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-brand-white">Updates Overview</h2>
                            {projectTitle && (
                                <p className="text-sm text-neutral-400">Showing stats for "{projectTitle}"</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Getting Started Content */}
                <div className="p-6">
                    {/* Empty Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statCards.map((stat) => (
                            <div
                                key={stat.label}
                                className="bg-brand-black rounded-3xl p-4 border border-neutral-800/50"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 rounded-2xl ${stat.iconBg}`}>
                                        <span className={stat.iconColor}>{stat.icon}</span>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-neutral-600 mb-1">0</p>
                                <p className="text-sm text-neutral-400">{stat.label}</p>
                                <p className="text-xs text-neutral-600 mt-1">No data yet</p>
                            </div>
                        ))}
                    </div>

                    {/* Getting Started Card */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl p-6 border border-blue-500/30">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-2xl">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-brand-white mb-2">
                                    🚀 Get Started with Updates
                                </h3>
                                <p className="text-sm text-neutral-400 mb-4">
                                    Keep your supporters engaged by sharing progress updates! Here are some ideas:
                                </p>
                                <ul className="text-sm text-neutral-400 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Share milestone achievements with the "Milestone Reached" template
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Thank your backers with the "Thank You" template
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Post weekly progress updates to build trust
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Add images and videos to make updates more engaging
                                    </li>
                                </ul>
                                <p className="text-sm text-blue-400 mt-4 font-medium">
                                    💡 Tip: Projects with regular updates raise 3x more on average!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111] rounded-3xl shadow-sm border border-neutral-800 overflow-hidden mb-6">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-800 bg-gradient-to-r from-brand-orange/10 to-red-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#111] rounded-2xl shadow-sm">
                            <TrendingUp className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-brand-white">Updates Overview</h2>
                            {projectTitle && (
                                <p className="text-sm text-neutral-400">Showing stats for "{projectTitle}"</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-neutral-500">Engagement Rate</p>
                        <p className="text-xl font-bold text-brand-orange">{stats.engagementRate}%</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-brand-black rounded-3xl p-4 border border-neutral-800/50 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-2xl ${stat.iconBg}`}>
                                    <span className={stat.iconColor}>{stat.icon}</span>
                                </div>
                                {stat.trend !== undefined && stat.trend !== 0 && (
                                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stat.trend > 0 ? (
                                            <ArrowUpRight className="w-3 h-3" />
                                        ) : (
                                            <ArrowDownRight className="w-3 h-3" />
                                        )}
                                        <span>{Math.abs(stat.trend)}%</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-brand-white mb-1">
                                {typeof stat.value === 'string' ? stat.value : formatNumber(stat.value)}
                            </p>
                            <p className="text-sm text-neutral-400">{stat.label}</p>
                            <p className="text-xs text-neutral-500 mt-1">{stat.trendLabel}</p>
                        </div>
                    ))}
                </div>

                {/* Best Performing Update */}
                {stats.bestUpdate && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-brand-orange/10 rounded-3xl p-4 border border-yellow-500/30">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-2xl">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                                        🏆 Best Performing Update
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-brand-white truncate">
                                    {stats.bestUpdate.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {(stats.bestUpdate as any).viewCount || Math.floor((stats.bestUpdate.likes || 0) * 2.5 + (stats.bestUpdate.commentCount || 0) * 5)} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ThumbsUp className="w-4 h-4" />
                                        {stats.bestUpdate.likes || 0} likes
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="w-4 h-4" />
                                        {stats.bestUpdate.commentCount || 0} comments
                                    </span>
                                    <span className="text-neutral-600">•</span>
                                    <span>{getTimeAgo(convertTimestamp(stats.bestUpdate.createdAt))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
