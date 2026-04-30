import { Heart, Users, Target, TrendingUp, Layers, IndianRupee } from 'lucide-react';

interface ImpactStatsProps {
    totalBacked: number;
    projectsSupported: number;
    creatorsHelped: number;
    projectsReachedGoal: number;
    uniqueCategories: number;
    averageDonation: number;
}

export default function ImpactStats({
    totalBacked,
    projectsSupported,
    creatorsHelped,
    projectsReachedGoal,
    uniqueCategories,
    averageDonation
}: ImpactStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const stats = [
        {
            label: 'Total Backed',
            value: formatCurrency(totalBacked),
            icon: IndianRupee,
            accentColor: 'text-brand-acid',
            bgColor: 'bg-brand-acid/10',
            borderColor: 'group-hover:border-brand-acid/50'
        },
        {
            label: 'Projects Supported',
            value: projectsSupported.toString(),
            icon: Heart,
            accentColor: 'text-brand-orange',
            bgColor: 'bg-brand-orange/10',
            borderColor: 'group-hover:border-brand-orange/50'
        },
        {
            label: 'Creators Helped',
            value: creatorsHelped.toString(),
            icon: Users,
            accentColor: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'group-hover:border-purple-500/50'
        },
        {
            label: 'Reached Goal',
            value: projectsReachedGoal.toString(),
            icon: Target,
            accentColor: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'group-hover:border-cyan-500/50'
        },
        {
            label: 'Categories',
            value: uniqueCategories.toString(),
            icon: Layers,
            accentColor: 'text-pink-400',
            bgColor: 'bg-pink-500/10',
            borderColor: 'group-hover:border-pink-500/50'
        },
        {
            label: 'Avg. Donation',
            value: formatCurrency(averageDonation),
            icon: TrendingUp,
            accentColor: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'group-hover:border-amber-500/50'
        }
    ];

    return (
        <div className="mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-2">
                <h2 className="text-2xl font-bold text-brand-white">Your Impact</h2>
                <span className="text-sm font-medium text-neutral-400">Making a difference, one project at a time</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`group bg-[#111] rounded-2xl border border-neutral-800 p-5 transition-all duration-300 hover:bg-[#1a1a1a] ${stat.borderColor}`}
                        >
                            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                                <Icon className={`w-6 h-6 ${stat.accentColor}`} />
                            </div>
                            <p className="text-2xl md:text-3xl font-extrabold text-brand-white mb-1 tracking-tight">{stat.value}</p>
                            <p className="text-xs md:text-sm font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
