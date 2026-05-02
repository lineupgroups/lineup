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

    // Get response time label
    const getResponseTimeLabel = (hours: number | null): string => {
        if (hours === null) return 'Silence';
        if (hours < 4) return 'Elite Response';
        if (hours < 24) return 'Active Presence';
        return 'Delayed Dialogue';
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/5 rounded-[2rem] border border-white/10 p-6 animate-pulse">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl" />
                            <div className="h-4 bg-white/5 rounded w-20" />
                        </div>
                        <div className="h-10 bg-white/5 rounded w-16 mb-2" />
                        <div className="h-4 bg-white/5 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Dialogue',
            value: stats.total,
            subtext: `+${stats.thisWeek} this week`,
            icon: MessageSquare,
            iconBg: 'bg-brand-acid/10',
            iconColor: 'text-brand-acid',
            valueColor: 'text-brand-white',
            borderColor: 'border-white/10'
        },
        {
            label: 'Pending Action',
            value: stats.unreplied,
            subtext: stats.unreplied > 0 ? 'Urgent Engagement' : 'Peak Connection',
            icon: AlertCircle,
            iconBg: stats.unreplied > 0 ? 'bg-brand-orange/10' : 'bg-brand-acid/10',
            iconColor: stats.unreplied > 0 ? 'text-brand-orange' : 'text-brand-acid',
            valueColor: stats.unreplied > 0 ? 'text-brand-orange' : 'text-brand-acid',
            pulse: stats.unreplied > 0,
            borderColor: stats.unreplied > 0 ? 'border-brand-orange/30' : 'border-white/10'
        },
        {
            label: 'Closed Loops',
            value: stats.replied,
            subtext: stats.total > 0 ? `${Math.round((stats.replied / stats.total) * 100)}% Rate` : 'Starting Dialogue',
            icon: CheckCircle,
            iconBg: 'bg-brand-acid/10',
            iconColor: 'text-brand-acid',
            valueColor: 'text-brand-acid',
            borderColor: 'border-white/10'
        },
        {
            label: 'Latency',
            value: formatResponseTime(stats.avgResponseTimeHours),
            subtext: getResponseTimeLabel(stats.avgResponseTimeHours),
            icon: Clock,
            iconBg: 'bg-brand-orange/10',
            iconColor: 'text-brand-orange',
            valueColor: 'text-brand-white',
            borderColor: 'border-white/10'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className={`bg-[#111] rounded-3xl p-6 border border-neutral-800 transition-all duration-300 group ${stat.pulse ? 'border-brand-orange/30 hover:border-brand-orange' : stat.iconColor === 'text-brand-orange' ? 'hover:border-brand-orange/50' : 'hover:border-brand-acid/50'}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 ${stat.iconBg} rounded-2xl ${stat.iconColor} ${stat.iconColor === 'text-brand-orange' ? 'group-hover:bg-brand-orange' : 'group-hover:bg-brand-acid'} group-hover:text-brand-black transition-colors ${stat.pulse ? 'animate-pulse' : ''}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                            {stat.value}
                        </h3>
                        <p className="text-sm text-neutral-400 mt-2 font-medium">{stat.label}</p>
                        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                            {stat.label === 'Total Dialogue' && stats.thisWeek > 0 && (
                                <TrendingUp className="w-3 h-3 text-brand-acid" />
                            )}
                            <span className={stat.pulse ? 'text-brand-orange' : ''}>{stat.subtext}</span>
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
