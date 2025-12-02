import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, formatActivityText, getActivityIcon } from '../../lib/activityService';

interface ActivityItemProps {
    activity: Activity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        // Navigate to project if targetId exists
        if (activity.targetId && (activity.type.includes('project') || activity.type === 'new_backer')) {
            navigate(`/projects/${activity.targetId}`);
        }
    };

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return '';

        const now = new Date();
        const activityDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffMs = now.getTime() - activityDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return activityDate.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
        });
    };

    const isClickable = activity.targetId && (
        activity.type.includes('project') ||
        activity.type === 'new_backer'
    );

    return (
        <div
            onClick={isClickable ? handleClick : undefined}
            className={`
        flex items-start gap-3 p-4 rounded-lg border border-gray-200
        ${isClickable ? 'cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all' : ''}
      `}
        >
            {/* Icon */}
            <div className="flex-shrink-0 text-2xl">
                {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                    {formatActivityText(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(activity.createdAt)}
                </p>
            </div>
        </div>
    );
};

export default ActivityItem;
