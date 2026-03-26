import { Link } from 'react-router-dom';
import { Target, Clock, CheckCircle, Users, Share2 } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { getDaysLeft, getProjectProgress } from '../../lib/firestore';
import { useProjectContext } from '../../hooks/useProjectContext';

interface ProjectMilestonesProps {
    projects: FirestoreProject[];
    onShareMilestone?: (project: FirestoreProject, milestone: number) => void;
}

// Milestone thresholds
const FUNDING_MILESTONES = [25, 50, 75, 100];

/**
 * Phase 3 Implementation: Project Milestones Widget with Context Awareness
 * - All Projects: Shows compact list of all project progress bars
 * - Single Project: Shows detailed view for that project only
 */
export default function ProjectMilestones({ projects, onShareMilestone }: ProjectMilestonesProps) {
    const { selectedProjectId, selectedProject } = useProjectContext();

    // Filter to active projects
    const activeProjects = projects.filter(p => p.status === 'active');

    // If a specific project is selected, show detailed view
    if (selectedProjectId && selectedProject) {
        return <DetailedProjectView project={selectedProject} onShareMilestone={onShareMilestone} />;
    }

    // All projects view - compact list
    return <AllProjectsView projects={activeProjects} />;
}

// Compact view for all projects
function AllProjectsView({ projects }: { projects: FirestoreProject[] }) {
    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount}`;
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
        if (percent >= 75) return 'bg-gradient-to-r from-green-400 to-green-500';
        if (percent >= 50) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
        if (percent >= 25) return 'bg-gradient-to-r from-orange-400 to-orange-500';
        return 'bg-gradient-to-r from-orange-500 to-red-500';
    };

    const getProgressMessage = (percent: number) => {
        if (percent >= 100) return '🎉 Fully funded!';
        if (percent >= 75) return '🚀 Almost there!';
        if (percent >= 50) return '✨ Halfway there!';
        if (percent >= 25) return '📈 Building momentum';
        return '🌱 Just getting started';
    };

    if (projects.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Project Milestones</h2>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No active projects</p>
                    <p className="text-sm mt-1">Create a project to track milestones</p>
                    <Link
                        to="/dashboard/projects/create"
                        className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                        Create Project →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Project Milestones</h2>
                </div>
                <span className="text-sm text-gray-500">
                    {projects.length} active
                </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {projects.map((project) => {
                    const progress = getProjectProgress(project);
                    const daysLeft = getDaysLeft(project.endDate);
                    const goal = project.goal || project.fundingGoal || 0;
                    const raised = project.raised || 0;

                    return (
                        <Link
                            key={project.id}
                            to={`/project/${project.id}`}
                            className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900 truncate flex-1">
                                    {project.title}
                                </h3>
                                <span className="text-lg font-bold text-gray-900 ml-2">
                                    {Math.round(progress)}%
                                </span>
                            </div>

                            {/* Progress Bar with milestone markers */}
                            <div className="relative mb-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                                {/* Milestone markers */}
                                <div className="absolute top-0 left-0 right-0 h-2.5 flex justify-between pointer-events-none">
                                    {[25, 50, 75].map(marker => (
                                        <div
                                            key={marker}
                                            className={`absolute h-2.5 w-0.5 ${progress >= marker ? 'bg-white/50' : 'bg-gray-300'}`}
                                            style={{ left: `${marker}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{formatCurrency(raised)} of {formatCurrency(goal)}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                                </span>
                            </div>

                            <p className="text-xs mt-1.5 font-medium text-gray-600">
                                {getProgressMessage(progress)}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// Detailed view for single project
function DetailedProjectView({
    project,
    onShareMilestone
}: {
    project: FirestoreProject;
    onShareMilestone?: (project: FirestoreProject, milestone: number) => void;
}) {
    const progress = getProjectProgress(project);
    const daysLeft = getDaysLeft(project.endDate);
    const goal = project.goal || project.fundingGoal || 0;
    const raised = project.raised || 0;
    const supporters = project.supporters || 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Find current and next milestone
    const currentMilestone = FUNDING_MILESTONES.filter(m => progress >= m).pop() || 0;
    const nextMilestone = FUNDING_MILESTONES.find(m => progress < m);
    const amountToNextMilestone = nextMilestone
        ? Math.max(0, (goal * nextMilestone / 100) - raised)
        : 0;

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'from-yellow-400 to-yellow-500';
        if (percent >= 75) return 'from-green-400 to-green-500';
        if (percent >= 50) return 'from-yellow-400 to-orange-400';
        if (percent >= 25) return 'from-orange-400 to-orange-500';
        return 'from-orange-500 to-red-500';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                        "{project.title}" Progress
                    </h2>
                </div>
            </div>

            <div className="p-6">
                {/* Main Progress */}
                <div className="text-center mb-6">
                    <div className="relative w-full bg-gray-200 rounded-full h-4 mb-4">
                        <div
                            className={`h-4 rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                        {/* Milestone markers */}
                        {FUNDING_MILESTONES.slice(0, -1).map(marker => (
                            <div
                                key={marker}
                                className={`absolute top-0 h-4 w-0.5 ${progress >= marker ? 'bg-white/50' : 'bg-gray-400'}`}
                                style={{ left: `${marker}%` }}
                            />
                        ))}
                    </div>

                    <div className="text-4xl font-bold text-gray-900 mb-1">
                        {Math.round(progress)}%
                    </div>
                    <p className="text-gray-600">
                        {formatCurrency(raised)} of {formatCurrency(goal)}
                    </p>
                </div>

                {/* Current Milestone Badge */}
                {currentMilestone > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {currentMilestone}% milestone reached!
                        </span>
                        {onShareMilestone && (
                            <button
                                onClick={() => onShareMilestone(project, currentMilestone)}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                title="Share this achievement"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">
                            {daysLeft > 0 ? daysLeft : 0}
                        </p>
                        <p className="text-xs text-gray-500">Days left</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{supporters}</p>
                        <p className="text-xs text-gray-500">Backers</p>
                    </div>
                </div>

                {/* Next Milestone */}
                {nextMilestone && (
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-600">
                            Next milestone: <span className="font-bold text-orange-600">{nextMilestone}%</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency(amountToNextMilestone)} to go
                        </p>
                    </div>
                )}

                {/* Fully Funded Message */}
                {progress >= 100 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 text-center">
                        <span className="text-2xl">🎉</span>
                        <p className="font-bold text-gray-900 mt-1">Fully Funded!</p>
                        <p className="text-sm text-gray-600">
                            Congratulations! Your project has reached its goal.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
