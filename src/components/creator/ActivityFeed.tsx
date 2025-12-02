import React from 'react';
import { Users, MessageSquare, Heart, TrendingUp, Calendar } from 'lucide-react';
import { useRecentActivity } from '../../hooks/useRecentActivity';
import LoadingSpinner from '../common/LoadingSpinner';

interface ActivityFeedProps {
    creatorId: string;
    limit?: number;
}

export default function ActivityFeed({ creatorId, limit = 10 }: ActivityFeedProps) {
    const { activities, loading, error } = useRecentActivity(creatorId, limit);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-600">No activity yet</p>
                <p className="text-sm text-gray-500 mt-1">
                    Activity will appear when supporters interact with your projects
                </p>
            </div>
        );
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'pledge':
                return { Icon: Users, color: 'text-green-600', bg: 'bg-green-100' };
            case 'comment':
                return { Icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' };
            case 'like':
                return { Icon: Heart, color: 'text-red-600', bg: 'bg-red-100' };
            case 'milestone':
                return { Icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' };
            default:
                return { Icon: Calendar, color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-3">
            {activities.map((activity) => {
                const { Icon, color, bg } = getActivityIcon(activity.type);

                return (
                    <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium">
                                {activity.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                                {activity.description}
                            </p>
                            {activity.projectTitle && (
                                <p className="text-xs text-gray-500 mt-1">
                                    on <span className="font-medium">{activity.projectTitle}</span>
                                </p>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTimeAgo(activity.createdAt)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
