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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-32 bg-gray-200 rounded-lg"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    </div>
                    <span className="text-sm text-gray-500">{subtitle}</span>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.slice(0, 6).map((project) => {
                        const progress = getProjectProgress(project);
                        const daysLeft = getDaysLeft(project.endDate);

                        return (
                            <Link
                                key={project.id}
                                to={`/project/${project.id}`}
                                className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all border border-gray-100"
                            >
                                {/* Project Image */}
                                <div className="relative h-32 overflow-hidden">
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop';
                                        }}
                                    />
                                    {/* Category Badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className="px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                                            {project.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Project Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
                                        {project.title}
                                    </h3>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span className="font-medium text-gray-900">{formatCurrency(project.raised)}</span>
                                            <span>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {project.supporters || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                                            </span>
                                        </div>
                                        {progress >= 100 && (
                                            <span className="flex items-center text-green-600">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                Funded
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* View All Link */}
                <div className="mt-4 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                        Discover more projects
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
