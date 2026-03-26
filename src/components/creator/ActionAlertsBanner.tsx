import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    Trophy,
    ChevronUp,
    ChevronDown,
    X,
    Share2,
    ArrowRight
} from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { useUnrepliedComments } from '../../hooks/useUnrepliedComments';

/**
 * Alert Types Configuration
 * Extensible structure for adding new alert types in the future
 */
interface AlertConfig {
    id: string;
    type: 'warning' | 'success' | 'info';
    icon: React.ReactNode;
    message: string;
    actionLabel: string;
    actionRoute: string;
    dismissible: boolean;
    reappearAfterHours?: number; // undefined = never reappear after dismiss
    priority: number; // Lower = higher priority
    projectId?: string; // For milestone tracking
    milestone?: number; // Percentage for milestone alerts
}

interface ActionAlertsBannerProps {
    creatorId: string;
    projects: FirestoreProject[];
    onMilestoneShare?: (project: FirestoreProject, milestone: number) => void;
}

// Helper to get dismissed alerts from localStorage
const getDismissedAlerts = (): Record<string, number> => {
    try {
        const stored = localStorage.getItem('lineup_dismissed_alerts');
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

// Helper to save dismissed alert
// Note: We use -1 to represent "never expires" since Infinity can't be serialized to JSON
const NEVER_EXPIRES = -1;

const dismissAlert = (alertId: string, reappearAfterHours?: number) => {
    const dismissed = getDismissedAlerts();
    dismissed[alertId] = reappearAfterHours
        ? Date.now() + (reappearAfterHours * 60 * 60 * 1000)
        : NEVER_EXPIRES; // -1 means never reappear
    localStorage.setItem('lineup_dismissed_alerts', JSON.stringify(dismissed));
};

// Check if alert should be shown
const shouldShowAlert = (alertId: string): boolean => {
    const dismissed = getDismissedAlerts();
    const expiry = dismissed[alertId];
    if (expiry === undefined || expiry === null) return true; // Not dismissed
    if (expiry === NEVER_EXPIRES) return false; // Permanently dismissed
    return Date.now() > expiry; // Check if temporary dismissal has expired
};

// Milestone thresholds
const MILESTONE_THRESHOLDS = [25, 50, 75, 100];

export default function ActionAlertsBanner({
    creatorId,
    projects,
    onMilestoneShare
}: ActionAlertsBannerProps) {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [visibleAlerts, setVisibleAlerts] = useState<AlertConfig[]>([]);
    // Initialize localDismissed from localStorage to persist across navigation
    const [localDismissed, setLocalDismissed] = useState<Set<string>>(() => {
        const dismissed = getDismissedAlerts();
        // Get all alert IDs that are currently dismissed (either permanently or not yet expired)
        const dismissedIds = Object.entries(dismissed)
            .filter(([_, expiry]) => expiry === NEVER_EXPIRES || Date.now() < expiry)
            .map(([id]) => id);
        return new Set(dismissedIds);
    });

    // Get unreplied comments data
    const { unrepliedCount, loading: commentsLoading } = useUnrepliedComments(creatorId);

    // Build alerts list
    useEffect(() => {
        if (commentsLoading) return;

        const alerts: AlertConfig[] = [];

        // Alert 1: Unreplied Comments (Warning)
        if (unrepliedCount > 0) {
            const alertId = `unreplied-comments-${creatorId}`;
            if (shouldShowAlert(alertId) && !localDismissed.has(alertId)) {
                alerts.push({
                    id: alertId,
                    type: 'warning',
                    icon: <MessageSquare className="w-5 h-5" />,
                    message: `${unrepliedCount} comment${unrepliedCount !== 1 ? 's' : ''} waiting for your reply`,
                    actionLabel: 'Reply Now',
                    actionRoute: '/dashboard/projects', // TODO: Change to /dashboard/comments when route is created
                    dismissible: true,
                    reappearAfterHours: 24, // Reappear after 24 hours if still unreplied
                    priority: 1
                });
            }
        }

        // Alert 2: Milestone Achievements (Success)
        projects.forEach(project => {
            if (project.status !== 'active') return;

            const goal = project.goal || project.fundingGoal || 0;
            const raised = project.raised || 0;
            const percentFunded = goal > 0 ? (raised / goal) * 100 : 0;

            // Check each milestone threshold
            MILESTONE_THRESHOLDS.forEach(threshold => {
                if (percentFunded >= threshold) {
                    // Check if we've crossed this milestone (not the next one yet)
                    const nextThreshold = MILESTONE_THRESHOLDS.find(t => t > threshold);
                    const isCurrentMilestone = !nextThreshold || percentFunded < nextThreshold;

                    if (isCurrentMilestone) {
                        const alertId = `milestone-${project.id}-${threshold}`;
                        if (shouldShowAlert(alertId) && !localDismissed.has(alertId)) {
                            alerts.push({
                                id: alertId,
                                type: 'success',
                                icon: <Trophy className="w-5 h-5" />,
                                message: `"${project.title}" reached ${threshold}% milestone! 🎉`,
                                actionLabel: 'Share',
                                actionRoute: `/project/${project.id}`,
                                dismissible: true,
                                reappearAfterHours: undefined, // One-time alert
                                priority: 2,
                                projectId: project.id,
                                milestone: threshold
                            });
                        }
                    }
                }
            });
        });

        // Sort by priority
        alerts.sort((a, b) => a.priority - b.priority);

        // Limit to 3 alerts
        setVisibleAlerts(alerts.slice(0, 3));
    }, [creatorId, projects, unrepliedCount, commentsLoading, localDismissed]);

    // Handle dismiss
    const handleDismiss = (alert: AlertConfig) => {
        dismissAlert(alert.id, alert.reappearAfterHours);
        setLocalDismissed(prev => new Set([...prev, alert.id]));
    };

    // Handle action click
    const handleAction = (alert: AlertConfig) => {
        if (alert.type === 'success' && alert.projectId && alert.milestone && onMilestoneShare) {
            const project = projects.find(p => p.id === alert.projectId);
            if (project) {
                onMilestoneShare(project, alert.milestone);
                return;
            }
        }
        navigate(alert.actionRoute);
    };

    // Don't render if no alerts
    if (visibleAlerts.length === 0) {
        return null;
    }

    const getAlertColors = (type: AlertConfig['type']) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-300',
                    iconBg: 'bg-amber-100',
                    iconColor: 'text-amber-600',
                    dot: 'bg-amber-500',
                    button: 'bg-amber-600 hover:bg-amber-700 text-white'
                };
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-300',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    dot: 'bg-green-500',
                    button: 'bg-green-600 hover:bg-green-700 text-white'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-300',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    dot: 'bg-blue-500',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        {visibleAlerts.map((alert, idx) => (
                            <span
                                key={idx}
                                className={`w-2 h-2 rounded-full ${getAlertColors(alert.type).dot}`}
                            />
                        ))}
                    </div>
                    <span className="font-medium text-gray-800">
                        {visibleAlerts.length} item{visibleAlerts.length !== 1 ? 's' : ''} need{visibleAlerts.length === 1 ? 's' : ''} your attention
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-sm">{isCollapsed ? 'Show' : 'Hide'}</span>
                    {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronUp className="w-4 h-4" />
                    )}
                </div>
            </button>

            {/* Alerts List - Collapsible */}
            {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                    {visibleAlerts.map((alert) => {
                        const colors = getAlertColors(alert.type);
                        return (
                            <div
                                key={alert.id}
                                className={`p-4 ${colors.bg} flex items-center justify-between gap-4 transition-all`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg ${colors.iconBg} ${colors.iconColor} flex-shrink-0`}>
                                        {alert.icon}
                                    </div>
                                    <span className="text-gray-800 font-medium truncate">
                                        {alert.message}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleAction(alert)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${colors.button}`}
                                    >
                                        {alert.type === 'success' ? (
                                            <>
                                                <Share2 className="w-3.5 h-3.5" />
                                                {alert.actionLabel}
                                            </>
                                        ) : (
                                            <>
                                                {alert.actionLabel}
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </>
                                        )}
                                    </button>

                                    {alert.dismissible && (
                                        <button
                                            onClick={() => handleDismiss(alert)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Dismiss"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
