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
        if (hours === null) return 'text-gray-500';
        if (hours < 4) return 'text-green-600';
        if (hours < 24) return 'text-yellow-600';
        return 'text-red-600';
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
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="h-4 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
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
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            valueColor: 'text-gray-900'
        },
        {
            label: 'Unreplied',
            value: stats.unreplied,
            subtext: stats.unreplied > 0 ? 'Need your reply!' : 'All caught up!',
            icon: AlertCircle,
            iconBg: stats.unreplied > 0 ? 'bg-red-100' : 'bg-green-100',
            iconColor: stats.unreplied > 0 ? 'text-red-600' : 'text-green-600',
            valueColor: stats.unreplied > 0 ? 'text-red-600' : 'text-green-600',
            pulse: stats.unreplied > 0
        },
        {
            label: 'Replied',
            value: stats.replied,
            subtext: stats.total > 0 ? `${Math.round((stats.replied / stats.total) * 100)}% response rate` : 'No comments yet',
            icon: CheckCircle,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            valueColor: 'text-green-600'
        },
        {
            label: 'Avg. Response',
            value: formatResponseTime(stats.avgResponseTimeHours),
            subtext: getResponseTimeLabel(stats.avgResponseTimeHours),
            icon: Clock,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
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
                        className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow ${stat.pulse ? 'ring-2 ring-red-200' : ''
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center ${stat.pulse ? 'animate-pulse' : ''
                                }`}>
                                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${stat.valueColor} mb-1`}>
                            {stat.value}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
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
