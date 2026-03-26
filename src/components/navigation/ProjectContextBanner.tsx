import { useProjectContext } from '../../hooks/useProjectContext';
import { X, ExternalLink, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectContextBannerProps {
    className?: string;
}

// Format currency helper
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Calculate progress percentage
const getProgress = (raised: number, goal: number): number => {
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
};

export default function ProjectContextBanner({ className = '' }: ProjectContextBannerProps) {
    const { selectedProject, clearSelection } = useProjectContext();

    // Don't render if no project is selected
    if (!selectedProject) return null;

    const progress = getProgress(selectedProject.raised || 0, selectedProject.goal || 1);

    return (
        <div className={`bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-2">
                    {/* Left side: Project info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Project thumbnail */}
                        {selectedProject.image && (
                            <div className="hidden sm:block flex-shrink-0">
                                <img
                                    src={selectedProject.image}
                                    alt={selectedProject.title}
                                    className="w-10 h-10 rounded-lg object-cover border border-orange-200"
                                />
                            </div>
                        )}

                        {/* Project details */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-orange-600 font-medium uppercase tracking-wide">
                                    Viewing:
                                </span>
                                <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">
                                    {selectedProject.title}
                                </h3>
                            </div>

                            {/* Quick stats */}
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-gray-600">
                                    {formatCurrency(selectedProject.raised || 0)} raised
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-600">
                                    {selectedProject.supporters || 0} supporters
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-600">
                                    {progress}% funded
                                </span>
                            </div>
                        </div>

                        {/* Mini progress bar */}
                        <div className="hidden md:block w-24 flex-shrink-0">
                            <div className="w-full bg-orange-100 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {/* View project page */}
                        <Link
                            to={`/project/${selectedProject.id}`}
                            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-md transition-colors"
                            title="View project page"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Live</span>
                        </Link>

                        {/* Analytics link */}
                        <Link
                            to={`/dashboard/analytics?projectId=${selectedProject.id}`}
                            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-md transition-colors"
                            title="View analytics"
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Analytics</span>
                        </Link>

                        {/* Clear selection */}
                        <button
                            onClick={clearSelection}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="View all projects"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
