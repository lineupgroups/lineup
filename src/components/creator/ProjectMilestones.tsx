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
 * - Brand Dark UI implementation
 * - Compact list of all project progress bars
 * - Detailed view for single project
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
        if (percent >= 100) return 'bg-brand-acid shadow-[0_0_10px_rgba(204,255,0,0.5)]';
        if (percent >= 75) return 'bg-brand-acid';
        if (percent >= 50) return 'bg-brand-orange';
        if (percent >= 25) return 'bg-amber-500';
        return 'bg-neutral-600';
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
            <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-brand-acid/10 rounded-lg">
                        <Target className="w-5 h-5 text-brand-acid" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-white tracking-tight">Project Milestones</h2>
                </div>
                <div className="text-center py-8 text-neutral-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                    <p className="font-bold text-brand-white">No active projects</p>
                    <p className="text-sm mt-1">Create a project to track milestones</p>
                    <Link
                        to="/dashboard/projects/create"
                        className="inline-block mt-5 px-5 py-2.5 bg-brand-acid text-brand-black rounded-xl text-sm font-bold hover:bg-[#b3e600] transition-colors shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                    >
                        Create Project →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-acid/10 rounded-lg border border-brand-acid/20">
                        <Target className="w-5 h-5 text-brand-acid" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-white tracking-tight">Project Milestones</h2>
                </div>
                <span className="text-xs font-bold tracking-wide uppercase px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full border border-neutral-700">
                    {projects.length} active
                </span>
            </div>

            <div className="divide-y divide-neutral-800/50 overflow-y-auto custom-scrollbar">
                {projects.map((project) => {
                    const progress = getProjectProgress(project);
                    const daysLeft = getDaysLeft(project.endDate);
                    const goal = project.goal || project.fundingGoal || 0;
                    const raised = project.raised || 0;

                    return (
                        <Link
                            key={project.id}
                            to={`/project/${project.id}`}
                            className="block p-6 hover:bg-neutral-900 transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-brand-white truncate flex-1 group-hover:text-brand-acid transition-colors">
                                    {project.title}
                                </h3>
                                <span className="text-lg font-bold text-brand-white ml-3">
                                    {Math.round(progress)}%
                                </span>
                            </div>

                            {/* Progress Bar with milestone markers */}
                            <div className="relative mb-3">
                                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 relative ${getProgressColor(progress)}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    >
                                        {progress >= 100 && (
                                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                        )}
                                    </div>
                                </div>
                                {/* Milestone markers */}
                                <div className="absolute top-0 left-0 right-0 h-2 flex justify-between pointer-events-none">
                                    {[25, 50, 75].map(marker => (
                                        <div
                                            key={marker}
                                            className={`absolute h-2 w-[2px] ${progress >= marker ? 'bg-[#111]' : 'bg-neutral-700'}`}
                                            style={{ left: `${marker}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                                <span><span className="text-brand-white">{formatCurrency(raised)}</span> of {formatCurrency(goal)}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                                </span>
                            </div>

                            <p className="text-xs mt-2 font-bold text-neutral-400">
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
        if (percent >= 100) return 'bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.5)]';
        if (percent >= 75) return 'bg-brand-acid';
        if (percent >= 50) return 'bg-brand-orange';
        if (percent >= 25) return 'bg-amber-500';
        return 'bg-neutral-600';
    };

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-acid/10 rounded-lg border border-brand-acid/20">
                        <Target className="w-5 h-5 text-brand-acid" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-white tracking-tight truncate">
                        "{project.title}" Progress
                    </h2>
                </div>
            </div>

            <div className="p-6">
                {/* Main Progress */}
                <div className="text-center mb-8">
                    <div className="relative w-full bg-neutral-800 rounded-full h-3 mb-5 overflow-hidden border border-neutral-700">
                        <div
                            className={`h-full rounded-full transition-all duration-500 relative ${getProgressColor(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                            {progress >= 100 && (
                                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                            )}
                        </div>
                        {/* Milestone markers */}
                        {FUNDING_MILESTONES.slice(0, -1).map(marker => (
                            <div
                                key={marker}
                                className={`absolute top-0 h-3 w-[2px] ${progress >= marker ? 'bg-[#111]' : 'bg-neutral-600'}`}
                                style={{ left: `${marker}%` }}
                            />
                        ))}
                    </div>

                    <div className="text-5xl font-extrabold text-brand-white mb-2 tracking-tighter">
                        {Math.round(progress)}%
                    </div>
                    <p className="text-neutral-400 font-medium">
                        <span className="text-brand-white">{formatCurrency(raised)}</span> of {formatCurrency(goal)}
                    </p>
                </div>

                {/* Current Milestone Badge */}
                {currentMilestone > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="px-4 py-1.5 bg-brand-acid/10 border border-brand-acid/30 text-brand-acid rounded-full text-sm font-bold flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {currentMilestone}% milestone reached!
                        </span>
                        {onShareMilestone && (
                            <button
                                onClick={() => onShareMilestone(project, currentMilestone)}
                                className="p-2 text-brand-acid hover:bg-brand-acid/20 rounded-full transition-colors border border-transparent hover:border-brand-acid/30"
                                title="Share this achievement"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-neutral-900 rounded-2xl p-4 text-center border border-neutral-800">
                        <Clock className="w-5 h-5 text-neutral-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-brand-white">
                            {daysLeft > 0 ? daysLeft : 0}
                        </p>
                        <p className="text-xs font-bold tracking-wider uppercase text-neutral-500 mt-1">Days left</p>
                    </div>
                    <div className="bg-neutral-900 rounded-2xl p-4 text-center border border-neutral-800">
                        <Users className="w-5 h-5 text-neutral-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-brand-white">{supporters}</p>
                        <p className="text-xs font-bold tracking-wider uppercase text-neutral-500 mt-1">Backers</p>
                    </div>
                </div>

                {/* Next Milestone */}
                {nextMilestone && (
                    <div className="bg-brand-orange/10 rounded-2xl p-4 text-center border border-brand-orange/20">
                        <p className="text-sm font-medium text-neutral-300">
                            Next milestone: <span className="font-bold text-brand-orange text-lg ml-1">{nextMilestone}%</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1.5">
                            <span className="font-bold text-brand-white">{formatCurrency(amountToNextMilestone)}</span> to go
                        </p>
                    </div>
                )}

                {/* Fully Funded Message */}
                {progress >= 100 && (
                    <div className="bg-brand-acid/10 rounded-2xl p-5 text-center border border-brand-acid/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-brand-acid/5 animate-pulse"></div>
                        <span className="text-3xl relative z-10">🎉</span>
                        <p className="font-extrabold text-brand-acid mt-2 text-lg relative z-10">Fully Funded!</p>
                        <p className="text-sm font-medium text-neutral-300 mt-1 relative z-10">
                            Congratulations! Your project has reached its goal.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
