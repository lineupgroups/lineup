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
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="flex justify-between">
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found nearby</h3>
                <p className="text-gray-500">Be the first to start a project in Bangalore!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
                    onClick={() => onProjectClick(project.id)}
                >
                    <div className="relative h-40 overflow-hidden">
                        <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2">
                            <div
                                className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <LikeButton projectId={project.id} size="sm" showCount={false} />
                            </div>
                        </div>
                        <div className="absolute bottom-2 left-2">
                            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white rounded text-xs font-medium flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {typeof project.location === 'string' ? project.location : project.location?.city || 'Unknown'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="mb-3">
                            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {project.title}
                            </h3>
                            <CreatorInfo
                                creatorId={project.creatorId}
                                size="sm"
                                className="mb-2"
                            />
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span className="font-medium text-gray-900">{formatCurrency(project.raised)}</span>
                                <span>{getProjectProgress(project).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${getProjectProgress(project)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                            <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {project.supporters}
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {getDaysLeft(project)} days left
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
