import { Calendar, Users, Edit, Eye, Clock } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';
import { useNavigate } from 'react-router-dom';

interface EnhancedProjectCardProps {
    project: FirestoreProject;
    onEdit?: (projectId: string) => void;
}

export default function EnhancedProjectCard({ project, onEdit }: EnhancedProjectCardProps) {
    const navigate = useNavigate();
    const progress = getProjectProgress(project);
    const daysLeft = getDaysLeft(project);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = () => {
        switch (project.status) {
            case 'draft':
                return <span className="px-2 py-1 bg-neutral-900 text-neutral-300 text-xs font-medium rounded">Draft</span>;
            case 'active':
                return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">Active</span>;
            case 'funded':
                return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">Funded</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">Completed</span>;
            case 'cancelled':
                return <span className="px-2 py-1 bg-red-100 text-red-400 text-xs font-medium rounded">Cancelled</span>;
            default:
                return <span className="px-2 py-1 bg-neutral-900 text-neutral-300 text-xs font-medium rounded">{project.status}</span>;
        }
    };

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden hover:shadow-lg transition-all duration-300 group">
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-neutral-900">
                <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=60';
                    }}
                />
                <div className="absolute top-3 right-3">
                    {getStatusBadge()}
                </div>
                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(project.id);
                        }}
                        className="absolute top-3 left-3 bg-[#111]/90 backdrop-blur-sm p-2 rounded-2xl hover:bg-[#111] transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Edit className="w-4 h-4 text-neutral-300" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <h3
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="text-lg font-bold text-brand-white mb-2 line-clamp-2 cursor-pointer hover:text-brand-orange transition-colors"
                >
                    {project.title}
                </h3>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-brand-black rounded-2xl">
                        <Users className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-brand-white">{project.supporters || 0}</p>
                        <p className="text-xs text-neutral-500">Backers</p>
                    </div>
                    <div className="text-center p-2 bg-brand-black rounded-2xl">
                        <Eye className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-brand-white">{project.views || project.viewCount || 0}</p>
                        <p className="text-xs text-neutral-500">Views</p>
                    </div>
                    <div className="text-center p-2 bg-brand-black rounded-2xl">
                        <Clock className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-brand-white">{daysLeft}</p>
                        <p className="text-xs text-neutral-500">Days left</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-bold text-brand-white">{formatCurrency(project.raised)}</span>
                        <span className="text-neutral-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-brand-orange/100 to-red-500/100 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                        Goal: {formatCurrency(project.fundingGoal || project.goal)}
                    </p>
                </div>

                {/* Category & Date */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-800/50">
                    <span className="px-2 py-1 bg-neutral-900 rounded">{project.category}</span>
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {(() => {
                            const date = project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt as any);
                            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
