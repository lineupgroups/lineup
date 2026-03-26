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
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600'
        },
        {
            label: 'Projects Supported',
            value: projectsSupported.toString(),
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            bgColor: 'bg-pink-50',
            iconColor: 'text-pink-600'
        },
        {
            label: 'Creators Helped',
            value: creatorsHelped.toString(),
            icon: Users,
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Projects Reached Goal',
            value: projectsReachedGoal.toString(),
            icon: Target,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
        },
        {
            label: 'Categories Explored',
            value: uniqueCategories.toString(),
            icon: Layers,
            color: 'from-purple-500 to-violet-500',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        {
            label: 'Avg. Donation',
            value: formatCurrency(averageDonation),
            icon: TrendingUp,
            color: 'from-amber-500 to-yellow-500',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600'
        }
    ];

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Impact</h2>
                <span className="text-sm text-gray-500">Making a difference, one project at a time</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
