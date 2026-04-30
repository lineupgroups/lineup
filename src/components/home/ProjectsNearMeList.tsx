import React, { useEffect } from 'react';
import { MapPin, Users, Clock } from 'lucide-react';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';
import { LikeButton } from '../interactions/LikeButton';
import { CreatorInfo } from '../common/CreatorInfo';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectsNearMeListProps {
    onProjectClick: (projectId: string) => void;
}

export const ProjectsNearMeList: React.FC<ProjectsNearMeListProps> = ({ onProjectClick }) => {
    const { projects, loading, search } = useAdvancedSearch();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.location) {
            // Parse location string (assuming "City, State" format)
            let city = '';
            let state = '';

            const parts = user.location.split(',').map(p => p.trim());
            if (parts.length > 0) city = parts[0];
            if (parts.length > 1) state = parts[1];

            // Default to Bangalore if parsing fails or empty
            if (!city) city = 'Bangalore';
            if (!state) state = 'Karnataka';

            search({
                nearMe: {
                    enabled: true,
                    userCity: city,
                    userState: state
                },
                limit: 4
            });
        } else {
            // Default fallback
            search({
                nearMe: {
                    enabled: true,
                    userCity: 'Bangalore',
                    userState: 'Karnataka'
                },
                limit: 4
            });
        }
    }, [search, user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden animate-pulse">
                        <div className="h-40 bg-neutral-800"></div>
                        <div className="p-4">
                            <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-neutral-800 rounded w-1/2 mb-4"></div>
                            <div className="flex justify-between">
                                <div className="h-3 bg-neutral-800 rounded w-1/3"></div>
                                <div className="h-3 bg-neutral-800 rounded w-1/3"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-16 bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800">
                <MapPin className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-brand-white mb-2">No projects found nearby</h3>
                <p className="text-neutral-500 font-medium">Be the first to start a project in Bangalore!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="group bg-neutral-900/50 rounded-2xl border border-neutral-800 hover:border-brand-orange/30 hover:bg-neutral-900 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => onProjectClick(project.id)}
                >
                    <div className="relative h-40 overflow-hidden bg-neutral-800">
                        <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent opacity-60"></div>
                        
                        <div className="absolute top-3 right-3">
                            <div
                                className="bg-neutral-900/80 backdrop-blur-md rounded-xl p-1 border border-neutral-700 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <LikeButton projectId={project.id} size="sm" showCount={false} />
                            </div>
                        </div>
                        <div className="absolute bottom-3 left-3">
                            <span className="px-2.5 py-1.5 bg-brand-black/80 backdrop-blur-md border border-neutral-700 text-brand-white rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center">
                                <MapPin className="w-3 h-3 mr-1.5 text-brand-orange" />
                                {typeof project.location === 'string' ? project.location : project.location?.city || 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="mb-4">
                            <h3 className="text-base font-bold text-brand-white mb-2 line-clamp-1 group-hover:text-brand-orange transition-colors">
                                {project.title}
                            </h3>
                            <CreatorInfo
                                creatorId={project.creatorId}
                                size="sm"
                                className="mb-2"
                            />
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs font-bold tracking-wide mb-2 text-brand-white">
                                <span>{formatCurrency(project.raised)}</span>
                                <span className="text-brand-orange">{getProjectProgress(project).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-brand-orange h-1.5 rounded-full transition-all duration-1000 ease-out relative"
                                    style={{ width: `${getProjectProgress(project)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 border-t border-neutral-800/50 pt-4 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-neutral-500" />
                                {project.supporters}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                                {getDaysLeft(project) > 0 ? `${getDaysLeft(project)} days left` : 'Ended'}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
