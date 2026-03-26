import { useState, useRef, useEffect } from 'react';
import { useProjectContext } from '../../hooks/useProjectContext';
import { ChevronDown, Check, FolderOpen, Rocket, Clock, FileEdit, AlertCircle, Search } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';

interface ProjectSelectorProps {
    className?: string;
    showInMobile?: boolean;
}

// Project status configuration
const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
    active: { color: 'text-green-600', bgColor: 'bg-green-500', label: 'Active', icon: Rocket },
    pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-500', label: 'Pending', icon: Clock },
    draft: { color: 'text-gray-500', bgColor: 'bg-gray-400', label: 'Draft', icon: FileEdit },
    funded: { color: 'text-blue-600', bgColor: 'bg-blue-500', label: 'Funded', icon: Check },
    expired: { color: 'text-red-600', bgColor: 'bg-red-500', label: 'Expired', icon: AlertCircle },
    rejected: { color: 'text-red-600', bgColor: 'bg-red-500', label: 'Rejected', icon: AlertCircle },
};

// Format currency helper
const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
};

export default function ProjectSelector({ className = '', showInMobile = false }: ProjectSelectorProps) {
    const {
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        projects,
        loading,
        hasProjects
    } = useProjectContext();

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Filter projects based on search query
    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort projects: active first, then pending, then others
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        const order: Record<string, number> = {
            active: 0,
            pending: 1,
            pending_verification: 1,
            approved_scheduled: 2,
            draft: 3,
            funded: 4,
            completed: 5,
            paused: 6,
            expired: 7,
            rejected: 8,
            cancelled: 9,
            suspended: 10
        };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    });

    // Handle project selection
    const handleSelectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
        setIsOpen(false);
        setSearchQuery('');
    };

    // Get status indicator component
    const StatusDot = ({ status }: { status: string }) => {
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span
                className={`w-2 h-2 rounded-full ${config.bgColor} flex-shrink-0`}
                title={config.label}
            />
        );
    };

    // Render project item in dropdown
    const ProjectItem = ({ project, isSelected }: { project: FirestoreProject; isSelected: boolean }) => {
        const config = statusConfig[project.status] || statusConfig.draft;

        return (
            <button
                onClick={() => handleSelectProject(project.id)}
                className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${isSelected ? 'bg-orange-50' : ''
                    }`}
            >
                {/* Status dot */}
                <StatusDot status={project.status} />

                {/* Project info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm truncate ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}>
                            {project.title}
                        </span>
                        {isSelected && (
                            <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${config.color}`}>{config.label}</span>
                        {project.status === 'active' && (
                            <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                    {formatCurrency(project.raised || 0)} raised
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                    {project.supporters || 0} supporters
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </button>
        );
    };

    // Auto-select first project if none selected
    useEffect(() => {
        if (!selectedProjectId && sortedProjects.length > 0) {
            setSelectedProjectId(sortedProjects[0].id);
        }
    }, [selectedProjectId, sortedProjects, setSelectedProjectId]);

    // Loading state
    if (loading) {
        return (
            <div className={`${className} ${showInMobile ? '' : 'hidden md:flex'}`}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse">
                    <div className="w-4 h-4 bg-gray-300 rounded" />
                    <div className="w-20 h-4 bg-gray-300 rounded" />
                </div>
            </div>
        );
    }

    // No projects state
    if (!hasProjects) {
        return null; // Don't show selector if no projects
    }

    return (
        <div className={`relative ${className} ${showInMobile ? '' : 'hidden md:block'}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
            >
                {selectedProject ? (
                    <>
                        <StatusDot status={selectedProject.status} />
                        <span className="max-w-[80px] xl:max-w-[120px] truncate text-xs">
                            {selectedProject.title}
                        </span>
                    </>
                ) : (
                    <>
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-xs">Select Project</span>
                    </>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 overflow-hidden">
                    {/* Search Input (show only if more than 5 projects) */}
                    {projects.length > 5 && (
                        <div className="px-3 py-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Header text */}
                    <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Your Projects
                        </p>
                    </div>

                    {/* Projects list */}
                    <div className="max-h-64 overflow-y-auto">
                        {sortedProjects.length > 0 ? (
                            sortedProjects.map((project) => (
                                <ProjectItem
                                    key={project.id}
                                    project={project}
                                    isSelected={selectedProjectId === project.id}
                                />
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                                No projects found
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            Select a project to filter all dashboard tabs
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
