import { MessageSquare, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { CommentStats } from '../../hooks/useCreatorComments';

interface CommentsStatsCardProps {
    stats: CommentStats;
    loading?: boolean;
}

export default function CommentsStatsCard({ stats, loading }: CommentsStatsCardProps) {
    // Format response time for display
    const formatResponseTime = (hours: number | null): string => {
        if (hours === null) return '--';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${Math.round(hours)}h`;
        return `${Math.round(hours / 24)}d`;
    };

    // Get response time color
    const getResponseTimeColor = (hours: number | null): string => {
        if (hours === null) return 'text-neutral-500';
        if (hours < 4) return 'text-green-400';
        if (hours < 24) return 'text-yellow-400';
        return 'text-red-400';
    };

    // Get response time label
    const getResponseTimeLabel = (hours: number | null): string => {
        if (hours === null) return 'No data';
        if (hours < 4) return 'Excellent!';
        if (hours < 24) return 'Good';
        return 'Needs improvement';
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#111] rounded-3xl border border-neutral-800 p-4 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-neutral-800 rounded-2xl" />
                            <div className="h-4 bg-neutral-800 rounded w-20" />
                        </div>
                        <div className="h-8 bg-neutral-800 rounded w-16 mb-1" />
                        <div className="h-3 bg-neutral-800 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Comments',
            value: stats.total,
            subtext: `+${stats.thisWeek} this week`,
            icon: MessageSquare,
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
            valueColor: 'text-brand-white'
        },
        {
            label: 'Unreplied',
            value: stats.unreplied,
            subtext: stats.unreplied > 0 ? 'Need your reply!' : 'All caught up!',
            icon: AlertCircle,
            iconBg: stats.unreplied > 0 ? 'bg-red-100' : 'bg-green-500/20',
            iconColor: stats.unreplied > 0 ? 'text-red-400' : 'text-green-400',
            valueColor: stats.unreplied > 0 ? 'text-red-400' : 'text-green-400',
            pulse: stats.unreplied > 0
        },
        {
            label: 'Replied',
            value: stats.replied,
            subtext: stats.total > 0 ? `${Math.round((stats.replied / stats.total) * 100)}% response rate` : 'No comments yet',
            icon: CheckCircle,
            iconBg: 'bg-green-500/20',
            iconColor: 'text-green-400',
            valueColor: 'text-green-400'
        },
        {
            label: 'Avg. Response',
            value: formatResponseTime(stats.avgResponseTimeHours),
            subtext: getResponseTimeLabel(stats.avgResponseTimeHours),
            icon: Clock,
            iconBg: 'bg-purple-500/20',
            iconColor: 'text-purple-400',
            valueColor: getResponseTimeColor(stats.avgResponseTimeHours)
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className={`bg-[#111] rounded-3xl border border-neutral-800 p-4 hover:shadow-md transition-shadow ${stat.pulse ? 'ring-2 ring-red-200' : ''
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 ${stat.iconBg} rounded-2xl flex items-center justify-center ${stat.pulse ? 'animate-pulse' : ''
                                }`}>
                                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <span className="text-sm font-medium text-neutral-400">{stat.label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${stat.valueColor} mb-1`}>
                            {stat.value}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                            {stat.label === 'Total Comments' && stats.thisWeek > 0 && (
                                <TrendingUp className="w-3 h-3 text-green-500" />
                            )}
                            <span>{stat.subtext}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
