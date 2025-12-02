import { CheckCircle, Circle, Target, TrendingUp } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress } from '../../lib/firestore';
import { ReactNode } from 'react';

interface MilestoneTimelineProps {
    project: FirestoreProject;
}

interface Milestone {
    percentage: number;
    title: string;
    reached: boolean;
    date?: Date;
    icon: ReactNode;
}

export default function MilestoneTimeline({ project }: MilestoneTimelineProps) {
    const progress = getProjectProgress(project);

    const milestones: Milestone[] = [
        {
            percentage: 0,
            title: 'Project Created',
            reached: true,
            date: project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt as any),
            icon: <Circle className="w-4 h-4" />
        },
        {
            percentage: 25,
            title: '25% Funded',
            reached: progress >= 25,
            date: progress >= 25 ? new Date() : undefined,
            icon: <TrendingUp className="w-4 h-4" />
        },
        {
            percentage: 50,
            title: '50% Funded',
            reached: progress >= 50,
            date: progress >= 50 ? new Date() : undefined,
            icon: <TrendingUp className="w-4 h-4" />
        },
        {
            percentage: 75,
            title: '75% Funded',
            reached: progress >= 75,
            date: progress >= 75 ? new Date() : undefined,
            icon: <TrendingUp className="w-4 h-4" />
        },
        {
            percentage: 100,
            title: 'Fully Funded!',
            reached: progress >= 100,
            date: progress >= 100 ? new Date() : undefined,
            icon: <Target className="w-4 h-4" />
        }
    ];

    const formatDate = (date?: Date) => {
        if (!date) return null;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Funding Milestones</h3>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Milestones */}
                <div className="space-y-6">
                    {milestones.map((milestone, index) => (
                        <div key={index} className="relative flex items-start space-x-4">
                            {/* Icon */}
                            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${milestone.reached
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-400'
                                }`}>
                                {milestone.reached ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    milestone.icon
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-semibold ${milestone.reached ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {milestone.title}
                                    </h4>
                                    {milestone.reached && milestone.date && (
                                        <span className="text-xs text-gray-500">
                                            {formatDate(milestone.date)}
                                        </span>
                                    )}
                                </div>

                                {milestone.reached && milestone.percentage > 0 && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Milestone reached
                                    </p>
                                )}

                                {!milestone.reached && milestone.percentage > 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {(milestone.percentage - progress).toFixed(0)}% away
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Progress Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Current Progress</p>
                        <p className="text-2xl font-bold text-gray-900">{progress.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Raised</p>
                        <p className="text-lg font-bold text-green-600">
                            ₹{project.raised.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
