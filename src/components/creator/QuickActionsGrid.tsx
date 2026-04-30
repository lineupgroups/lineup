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
            icon: <Rocket className="w-5 h-5 text-brand-acid group-hover:text-brand-black transition-colors" />,
            iconBg: 'bg-brand-acid/10',
            iconHoverBg: 'group-hover:bg-brand-acid',
            hoverBorder: 'hover:border-brand-acid/50',
            label: 'Create Project',
            description: 'Start a new campaign',
            route: '/dashboard/projects/create',
            badge: projectCount === 0 ? 'New' : undefined,
            badgeColor: 'bg-brand-acid text-brand-black'
        },
        {
            id: 'post-update',
            icon: <Edit3 className="w-5 h-5 text-brand-orange group-hover:text-brand-black transition-colors" />,
            iconBg: 'bg-brand-orange/10',
            iconHoverBg: 'group-hover:bg-brand-orange',
            hoverBorder: 'hover:border-brand-orange/50',
            label: 'Post Update',
            description: 'Share progress with backers',
            route: '/dashboard/updates?action=new'
        },
        {
            id: 'view-analytics',
            icon: <BarChart3 className="w-5 h-5 text-purple-400 group-hover:text-brand-black transition-colors" />,
            iconBg: 'bg-purple-500/10',
            iconHoverBg: 'group-hover:bg-purple-400',
            hoverBorder: 'hover:border-purple-400/50',
            label: 'View Analytics',
            description: 'Track views & engagement',
            route: '/dashboard/analytics'
        },
        {
            id: 'view-backers',
            icon: <Users className="w-5 h-5 text-blue-400 group-hover:text-brand-black transition-colors" />,
            iconBg: 'bg-blue-500/10',
            iconHoverBg: 'group-hover:bg-blue-400',
            hoverBorder: 'hover:border-blue-400/50',
            label: 'View Backers',
            description: 'See who\'s supporting you',
            route: '/dashboard/backers',
            badge: newBackersThisWeek > 0 ? `${newBackersThisWeek} new` : undefined,
            badgeColor: 'bg-brand-acid text-brand-black'
        },
        {
            id: 'withdraw-funds',
            icon: <Wallet className="w-5 h-5 text-emerald-400 group-hover:text-brand-black transition-colors" />,
            iconBg: 'bg-emerald-500/10',
            iconHoverBg: 'group-hover:bg-emerald-400',
            hoverBorder: 'hover:border-emerald-400/50',
            label: 'Withdraw Funds',
            description: 'Transfer to your bank',
            route: '/dashboard/earnings?tab=payout',
            badge: availableBalance >= 500 ? formatCurrency(availableBalance) : undefined,
            badgeColor: 'bg-brand-acid text-brand-black'
        },
        {
            id: 'reply-comments',
            icon: <MessageSquare className="w-5 h-5 text-pink-400 group-hover:text-brand-black transition-colors" />,
            iconBg: 'bg-pink-500/10',
            iconHoverBg: 'group-hover:bg-pink-400',
            hoverBorder: 'hover:border-pink-400/50',
            label: 'Reply Comments',
            description: 'Engage with supporters',
            route: '/dashboard/comments',
            badge: unrepliedCount > 0 ? unrepliedCount : undefined,
            badgeColor: 'bg-red-500 text-white',
            showRedDot: unrepliedCount > 0
        }
    ];

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-neutral-800 rounded-lg">
                        <Rocket className="w-5 h-5 text-brand-white" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-white tracking-tight">
                        Quick Actions
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.route)}
                        className={`relative p-5 rounded-2xl border border-neutral-800 bg-neutral-900 ${action.hoverBorder} hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-300 text-left group overflow-hidden`}
                    >
                        {/* Subtle background glow on hover */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${action.iconHoverBg}`}></div>
                        
                        {/* Badge */}
                        {action.badge && (
                            <span className={`absolute -top-2 -right-2 px-2.5 py-0.5 text-xs font-bold rounded-full border border-neutral-800 shadow-lg ${action.badgeColor} z-10`}>
                                {action.badge}
                            </span>
                        )}

                        {/* Red Dot for urgent items */}
                        {action.showRedDot && (
                            <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse z-10" />
                        )}

                        <div className="flex flex-col relative z-10">
                            <div className={`p-3 w-fit ${action.iconBg} ${action.iconHoverBg} rounded-xl transition-colors duration-300 mb-4`}>
                                {action.icon}
                            </div>
                            <h3 className="text-base font-bold text-brand-white mb-1 group-hover:text-brand-acid transition-colors">{action.label}</h3>
                            <p className="text-sm text-neutral-400 hidden sm:block font-medium">{action.description}</p>
                        </div>

                        <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-neutral-600 group-hover:text-brand-white transition-colors z-10 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
                    </button>
                ))}
            </div>
        </div>
    );
}
