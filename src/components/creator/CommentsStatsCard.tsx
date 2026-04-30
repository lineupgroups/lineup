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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className={`bg-white/5 backdrop-blur-xl rounded-[2.5rem] border ${stat.borderColor} p-6 hover:bg-white/10 transition-all group overflow-hidden relative ${stat.pulse ? 'shadow-[0_0_20px_rgba(255,91,0,0.1)]' : ''}`}
                    >
                        {/* Subtle background glow */}
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none ${stat.iconBg}`}></div>
                        
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center ${stat.pulse ? 'animate-pulse' : ''}`}>
                                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{stat.label}</span>
                        </div>
                        <div className={`text-4xl font-black italic tracking-tighter ${stat.valueColor} mb-2 relative z-10`}>
                            {stat.value}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 relative z-10">
                            {stat.label === 'Total Dialogue' && stats.thisWeek > 0 && (
                                <TrendingUp className="w-3.5 h-3.5 text-brand-acid" />
                            )}
                            <span className={stat.pulse ? 'text-brand-orange' : ''}>{stat.subtext}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
