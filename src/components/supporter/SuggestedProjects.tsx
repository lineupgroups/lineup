import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, Users, Clock } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';

interface SuggestedProjectsProps {
    projects: FirestoreProject[];
    loading?: boolean;
    title?: string;
    subtitle?: string;
}

export default function SuggestedProjects({
    projects,
    loading,
    title = "Recommended For You",
    subtitle = "Based on your interests"
}: SuggestedProjectsProps) {
    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount}`;
    };

    if (loading) {
        return (
            <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 flex flex-col">
                <div className="animate-pulse">
                    <div className="h-6 bg-neutral-800 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="h-32 bg-neutral-800 rounded-2xl"></div>
                                <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                                <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return null;
    }

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-orange/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-brand-orange" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-white tracking-tight">{title}</h2>
                </div>
                <span className="text-sm font-medium text-neutral-500 hidden sm:block">{subtitle}</span>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {projects.slice(0, 4).map((project) => {
                        const progress = getProjectProgress(project);
                        const daysLeft = getDaysLeft(project.endDate);

                        return (
                            <Link
                                key={project.id}
                                to={`/project/${project.id}`}
                                className="group bg-neutral-900/50 rounded-2xl overflow-hidden hover:bg-neutral-900 transition-all border border-neutral-800 hover:border-brand-orange/30 flex flex-col h-full"
                            >
                                {/* Project Image */}
                                <div className="relative h-40 overflow-hidden">
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-80"></div>
                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="px-3 py-1 bg-brand-black/80 text-brand-white text-xs font-bold uppercase tracking-wider rounded-md backdrop-blur-md border border-neutral-700">
                                            {project.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Project Info */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-brand-white text-base line-clamp-2 group-hover:text-brand-orange transition-colors mb-2">
                                            {project.title}
                                        </h3>
                                    </div>

                                    <div>
                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs font-bold mb-2 tracking-wide">
                                                <span className="text-brand-white">{formatCurrency(project.raised)}</span>
                                                <span className="text-brand-orange">{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-brand-orange h-full rounded-full transition-all duration-1000 ease-out relative"
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                                                    {project.supporters || 0}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                                    {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                                                </span>
                                            </div>
                                            {progress >= 100 && (
                                                <span className="flex items-center text-brand-acid font-bold">
                                                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                                    Funded
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* View All Link */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-brand-orange hover:text-[#ff7b33] font-bold text-sm tracking-wide group"
                    >
                        Discover more projects
                        <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
