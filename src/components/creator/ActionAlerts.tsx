import { AlertTriangle, Clock, TrendingDown, Target, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FirestoreProject } from '../../types/firestore';
import { getDaysLeft, getProjectProgress } from '../../lib/firestore';

interface ActionAlertsProps {
    projects: FirestoreProject[];
}

interface Alert {
    id: string;
    type: 'warning' | 'danger' | 'info';
    title: string;
    message: string;
    action?: {
        label: string;
        href: string;
    };
    icon: React.ReactNode;
}

export default function ActionAlerts({ projects }: ActionAlertsProps) {
    const alerts: Alert[] = [];

    // Check active projects for various conditions
    projects.forEach((project) => {
        if (project.status !== 'active') return;

        const daysLeft = getDaysLeft(project.endDate);
        const progress = getProjectProgress(project);

        // Project ending soon (less than 7 days)
        if (daysLeft > 0 && daysLeft <= 7) {
            alerts.push({
                id: `ending-${project.id}`,
                type: 'warning',
                title: 'Project Ending Soon',
                message: `"${project.title}" has only ${daysLeft} day${daysLeft > 1 ? 's' : ''} left!`,
                action: {
                    label: 'View Project',
                    href: `/project/${project.id}`
                },
                icon: <Clock className="w-5 h-5" />
            });
        }

        // Low funding velocity (less than 50% funded and past halfway point)
        if (progress < 50 && daysLeft < 15 && project.goal > 0) {
            alerts.push({
                id: `velocity-${project.id}`,
                type: 'danger',
                title: 'Low Funding Velocity',
                message: `"${project.title}" is ${progress.toFixed(0)}% funded with ${daysLeft} days left. Consider promoting it!`,
                action: {
                    label: 'View Analytics',
                    href: `/dashboard/analytics`
                },
                icon: <TrendingDown className="w-5 h-5" />
            });
        }

        // Near goal (80%+ funded)
        if (progress >= 80 && progress < 100) {
            alerts.push({
                id: `near-goal-${project.id}`,
                type: 'info',
                title: 'Almost There!',
                message: `"${project.title}" is ${progress.toFixed(0)}% funded! Just a little push to reach the goal.`,
                action: {
                    label: 'Share Project',
                    href: `/project/${project.id}`
                },
                icon: <Target className="w-5 h-5" />
            });
        }

        // No updates in the last 7 days (simplified check)
        const lastUpdate = project.updates?.[0]?.createdAt;
        if (lastUpdate) {
            const daysSinceUpdate = Math.floor(
                (Date.now() - (lastUpdate?.toDate?.()?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceUpdate > 7) {
                alerts.push({
                    id: `update-${project.id}`,
                    type: 'warning',
                    title: 'Post an Update',
                    message: `"${project.title}" hasn't had an update in ${daysSinceUpdate} days. Keep supporters engaged!`,
                    action: {
                        label: 'Post Update',
                        href: `/dashboard/updates`
                    },
                    icon: <Calendar className="w-5 h-5" />
                });
            }
        }
    });

    if (alerts.length === 0) {
        return null;
    }

    const getAlertStyles = (type: Alert['type']) => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    icon: 'text-red-600 bg-red-100',
                    text: 'text-red-800',
                    button: 'text-red-600 hover:text-red-800'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    icon: 'text-amber-600 bg-amber-100',
                    text: 'text-amber-800',
                    button: 'text-amber-600 hover:text-amber-800'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    icon: 'text-blue-600 bg-blue-100',
                    text: 'text-blue-800',
                    button: 'text-blue-600 hover:text-blue-800'
                };
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Action Needed</h2>
                </div>
                <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => {
                    const styles = getAlertStyles(alert.type);
                    return (
                        <div
                            key={alert.id}
                            className={`p-4 ${styles.bg} border-l-4 ${styles.border}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${styles.icon} flex-shrink-0`}>
                                    {alert.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-medium ${styles.text}`}>{alert.title}</h3>
                                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{alert.message}</p>
                                    {alert.action && (
                                        <Link
                                            to={alert.action.href}
                                            className={`inline-flex items-center gap-1 text-sm font-medium mt-2 ${styles.button}`}
                                        >
                                            {alert.action.label}
                                            <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {alerts.length > 5 && (
                <div className="p-3 bg-gray-50 text-center">
                    <span className="text-sm text-gray-500">
                        +{alerts.length - 5} more alert{alerts.length - 5 !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}
