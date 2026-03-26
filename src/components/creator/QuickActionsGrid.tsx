import { useNavigate } from 'react-router-dom';
import { Rocket, Edit3, BarChart3, Users, Wallet, MessageSquare, ArrowRight } from 'lucide-react';

interface QuickActionsGridProps {
    projectCount: number;
    unrepliedCount: number;
    newBackersThisWeek: number;
    availableBalance: number;
    projectsNeedingUpdate: number;
}

interface QuickActionCard {
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    iconHoverBg: string;
    hoverBorder: string;
    label: string;
    description: string;
    route: string;
    badge?: string | number;
    badgeColor?: string;
    showRedDot?: boolean;
}

/**
 * Section 4: Quick Actions Grid
 * 6 action cards in a 2x3 grid with badges as per the plan
 */
export default function QuickActionsGrid({
    projectCount,
    unrepliedCount,
    newBackersThisWeek,
    availableBalance
}: Omit<QuickActionsGridProps, 'projectsNeedingUpdate'>) {
    const navigate = useNavigate();

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(0)}K`;
        }
        return `₹${amount.toFixed(0)}`;
    };

    const actions: QuickActionCard[] = [
        {
            id: 'create-project',
            icon: <Rocket className="w-6 h-6 text-orange-600" />,
            iconBg: 'bg-orange-100',
            iconHoverBg: 'group-hover:bg-orange-200',
            hoverBorder: 'hover:border-orange-300',
            label: 'Create Project',
            description: 'Start a new campaign',
            route: '/dashboard/projects/create',
            badge: projectCount === 0 ? 'New' : undefined,
            badgeColor: 'bg-orange-500 text-white'
        },
        {
            id: 'post-update',
            icon: <Edit3 className="w-6 h-6 text-blue-600" />,
            iconBg: 'bg-blue-100',
            iconHoverBg: 'group-hover:bg-blue-200',
            hoverBorder: 'hover:border-blue-300',
            label: 'Post Update',
            description: 'Share progress with backers',
            route: '/dashboard/updates?action=new'
        },
        {
            id: 'view-analytics',
            icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
            iconBg: 'bg-purple-100',
            iconHoverBg: 'group-hover:bg-purple-200',
            hoverBorder: 'hover:border-purple-300',
            label: 'View Analytics',
            description: 'Track views & engagement',
            route: '/dashboard/analytics'
        },
        {
            id: 'view-backers',
            icon: <Users className="w-6 h-6 text-green-600" />,
            iconBg: 'bg-green-100',
            iconHoverBg: 'group-hover:bg-green-200',
            hoverBorder: 'hover:border-green-300',
            label: 'View Backers',
            description: 'See who\'s supporting you',
            route: '/dashboard/backers',
            badge: newBackersThisWeek > 0 ? `${newBackersThisWeek} new` : undefined,
            badgeColor: 'bg-green-500 text-white'
        },
        {
            id: 'withdraw-funds',
            icon: <Wallet className="w-6 h-6 text-yellow-600" />,
            iconBg: 'bg-yellow-100',
            iconHoverBg: 'group-hover:bg-yellow-200',
            hoverBorder: 'hover:border-yellow-300',
            label: 'Withdraw Funds',
            description: 'Transfer to your bank',
            route: '/dashboard/earnings?tab=payout',
            badge: availableBalance >= 500 ? formatCurrency(availableBalance) : undefined,
            badgeColor: 'bg-green-500 text-white'
        },
        {
            id: 'reply-comments',
            icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
            iconBg: 'bg-indigo-100',
            iconHoverBg: 'group-hover:bg-indigo-200',
            hoverBorder: 'hover:border-indigo-300',
            label: 'Reply Comments',
            description: 'Engage with supporters',
            route: '/dashboard/comments',
            badge: unrepliedCount > 0 ? unrepliedCount : undefined,
            badgeColor: 'bg-red-500 text-white',
            showRedDot: unrepliedCount > 0
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-orange-500" />
                    Quick Actions
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.route)}
                        className={`relative p-4 rounded-xl border border-gray-200 ${action.hoverBorder} hover:shadow-md transition-all text-left group`}
                    >
                        {/* Badge */}
                        {action.badge && (
                            <span className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full ${action.badgeColor}`}>
                                {action.badge}
                            </span>
                        )}

                        {/* Red Dot for urgent items */}
                        {action.showRedDot && (
                            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}

                        <div className="flex flex-col items-center text-center">
                            <div className={`p-3 ${action.iconBg} ${action.iconHoverBg} rounded-lg transition-colors mb-3`}>
                                {action.icon}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{action.label}</h3>
                            <p className="text-xs text-gray-500 hidden sm:block">{action.description}</p>
                        </div>

                        <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}
