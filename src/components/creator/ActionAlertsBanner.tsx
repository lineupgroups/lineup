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
    
    const [localDismissed, setLocalDismissed] = useState<Set<string>>(() => {
        const dismissed = getDismissedAlerts();
        const dismissedIds = Object.entries(dismissed)
            .filter(([_, expiry]) => expiry === NEVER_EXPIRES || Date.now() < expiry)
            .map(([id]) => id);
        return new Set(dismissedIds);
    });

    const { unrepliedCount, loading: commentsLoading } = useUnrepliedComments(creatorId);

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
                    reappearAfterHours: 24,
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

            MILESTONE_THRESHOLDS.forEach(threshold => {
                if (percentFunded >= threshold) {
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
                                reappearAfterHours: undefined,
                                priority: 2,
                                projectId: project.id,
                                milestone: threshold
                            });
                        }
                    }
                }
            });
        });

        alerts.sort((a, b) => a.priority - b.priority);
        setVisibleAlerts(alerts.slice(0, 3));
    }, [creatorId, projects, unrepliedCount, commentsLoading, localDismissed]);

    const handleDismiss = (alert: AlertConfig) => {
        dismissAlert(alert.id, alert.reappearAfterHours);
        setLocalDismissed(prev => new Set([...prev, alert.id]));
    };

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

    if (visibleAlerts.length === 0) {
        return null;
    }

    const getAlertColors = (type: AlertConfig['type']) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-brand-orange/10',
                    border: 'border-brand-orange/20',
                    iconBg: 'bg-brand-orange/20',
                    iconColor: 'text-brand-orange',
                    dot: 'bg-brand-orange',
                    button: 'bg-brand-orange hover:bg-[#ff7529] text-brand-black shadow-[0_0_10px_rgba(255,91,0,0.2)]'
                };
            case 'success':
                return {
                    bg: 'bg-brand-acid/10',
                    border: 'border-brand-acid/20',
                    iconBg: 'bg-brand-acid/20',
                    iconColor: 'text-brand-acid',
                    dot: 'bg-brand-acid',
                    button: 'bg-brand-acid hover:bg-[#b3e600] text-brand-black shadow-[0_0_10px_rgba(204,255,0,0.2)]'
                };
            case 'info':
                return {
                    bg: 'bg-sky-500/10',
                    border: 'border-sky-500/20',
                    iconBg: 'bg-sky-500/20',
                    iconColor: 'text-sky-400',
                    dot: 'bg-sky-400',
                    button: 'bg-sky-500 hover:bg-sky-400 text-brand-black'
                };
        }
    };

    return (
        <div className="bg-[#111] rounded-3xl shadow-sm border border-neutral-800 overflow-hidden mb-6">
            {/* Header */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full px-6 py-4 flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {visibleAlerts.map((alert, idx) => (
                            <span
                                key={idx}
                                className={`w-2 h-2 rounded-full ${getAlertColors(alert.type).dot} ${alert.type === 'warning' ? 'animate-pulse' : ''}`}
                            />
                        ))}
                    </div>
                    <span className="font-bold text-brand-white">
                        {visibleAlerts.length} item{visibleAlerts.length !== 1 ? 's' : ''} need{visibleAlerts.length === 1 ? 's' : ''} your attention
                    </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                    <span className="text-xs font-bold uppercase tracking-wider">{isCollapsed ? 'Show' : 'Hide'}</span>
                    {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronUp className="w-5 h-5" />
                    )}
                </div>
            </button>

            {/* Alerts List */}
            {!isCollapsed && (
                <div className="divide-y divide-neutral-800/50">
                    {visibleAlerts.map((alert) => {
                        const colors = getAlertColors(alert.type);
                        return (
                            <div
                                key={alert.id}
                                className={`p-5 ${colors.bg} flex items-center justify-between gap-4 transition-all`}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`p-2.5 rounded-xl ${colors.iconBg} ${colors.iconColor} flex-shrink-0`}>
                                        {alert.icon}
                                    </div>
                                    <span className="text-brand-white font-bold truncate">
                                        {alert.message}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <button
                                        onClick={() => handleAction(alert)}
                                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${colors.button}`}
                                    >
                                        {alert.type === 'success' ? (
                                            <>
                                                <Share2 className="w-4 h-4" />
                                                {alert.actionLabel}
                                            </>
                                        ) : (
                                            <>
                                                {alert.actionLabel}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    {alert.dismissible && (
                                        <button
                                            onClick={() => handleDismiss(alert)}
                                            className="p-2 text-neutral-500 hover:text-brand-white hover:bg-neutral-800 rounded-xl transition-colors"
                                            title="Dismiss"
                                        >
                                            <X className="w-5 h-5" />
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
