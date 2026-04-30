import { useState, useRef, useEffect } from 'react';
import { useProjectContext } from '../../hooks/useProjectContext';
import { ChevronDown, Check, FolderOpen, Rocket, Clock, FileEdit, AlertCircle, Search } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';

interface ProjectSelectorProps {
    className?: string;
    showInMobile?: boolean;
}

// Project status configuration with brand colors
const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
    active: { color: 'text-brand-acid', bgColor: 'bg-brand-acid', label: 'Active', icon: Rocket },
    pending: { color: 'text-brand-orange', bgColor: 'bg-brand-orange', label: 'Pending', icon: Clock },
    draft: { color: 'text-neutral-500', bgColor: 'bg-neutral-600', label: 'Draft', icon: FileEdit },
    funded: { color: 'text-brand-acid', bgColor: 'bg-brand-acid', label: 'Funded', icon: Check },
    expired: { color: 'text-brand-orange', bgColor: 'bg-brand-orange', label: 'Expired', icon: AlertCircle },
    rejected: { color: 'text-red-500', bgColor: 'bg-red-500', label: 'Rejected', icon: AlertCircle },
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
                className={`w-2 h-2 rounded-full ${config.bgColor} flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.4)]`}
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
                className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-all duration-300 text-left ${isSelected ? 'bg-brand-acid/5' : ''
                    }`}
            >
                {/* Status dot */}
                <StatusDot status={project.status} />

                {/* Project info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm truncate tracking-tight ${isSelected ? 'text-brand-acid italic' : 'text-neutral-200'}`}>
                            {project.title}
                        </span>
                        {isSelected && (
                            <Check className="w-4 h-4 text-brand-acid flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                        {project.status === 'active' && (
                            <>
                                <span className="text-[10px] text-neutral-600">•</span>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
                                    {formatCurrency(project.raised || 0)} raised
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
            <div className={`${className} ${showInMobile ? '' : 'hidden lg:flex'}`}>
                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full animate-pulse w-32" />
            </div>
        );
    }

    // No projects state
    if (!hasProjects) {
        return null; // Don't show selector if no projects
    }

    return (
        <div className={`relative ${className} ${showInMobile ? '' : 'hidden lg:block'}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 bg-black/40 backdrop-blur-md text-brand-white hover:bg-neutral-900 border border-white/5 shadow-xl group"
            >
                {selectedProject ? (
                    <>
                        <StatusDot status={selectedProject.status} />
                        <span className="max-w-[100px] xl:max-w-[150px] truncate text-xs font-black uppercase tracking-wider italic">
                            {selectedProject.title}
                        </span>
                    </>
                ) : (
                    <>
                        <FolderOpen className="w-4 h-4 text-neutral-400 group-hover:text-brand-acid transition-colors" />
                        <span className="text-xs font-black uppercase tracking-wider">Select Project</span>
                    </>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-acid' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-3 w-80 bg-[#111] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-neutral-800 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Search Input (show only if more than 5 projects) */}
                    {projects.length > 5 && (
                        <div className="px-4 py-3 border-b border-neutral-800/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-xl text-brand-white placeholder-neutral-600 focus:outline-none focus:border-brand-acid transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Header text */}
                    <div className="px-5 py-3 flex items-center justify-between border-b border-neutral-800/50 bg-neutral-900/30">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                            Your Projects
                        </p>
                        <span className="px-2 py-0.5 bg-neutral-800 text-neutral-500 text-[9px] font-black rounded-md border border-neutral-700">
                            {projects.length}
                        </span>
                    </div>

                    {/* Projects list */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {sortedProjects.length > 0 ? (
                            sortedProjects.map((project) => (
                                <ProjectItem
                                    key={project.id}
                                    project={project}
                                    isSelected={selectedProjectId === project.id}
                                />
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <AlertCircle className="w-8 h-8 text-neutral-800 mx-auto mb-3" />
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    No results
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-5 py-3 bg-neutral-900/50 border-t border-neutral-800/50">
                        <p className="text-[9px] font-bold text-neutral-600 text-center uppercase tracking-widest">
                            Syncing data across all tabs
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
