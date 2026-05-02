import { useState, useRef, useEffect } from 'react';
import { useProjectContext } from '../../hooks/useProjectContext';
import { ChevronDown, Check, FolderOpen, Rocket, Clock, FileEdit, AlertCircle, Search, Target } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';

interface ProjectSelectorProps {
    className?: string;
    showInMobile?: boolean;
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
    active: { color: 'text-brand-acid', bgColor: 'bg-brand-acid', label: 'ACTIVE', icon: Rocket },
    pending: { color: 'text-brand-orange', bgColor: 'bg-brand-orange', label: 'PENDING', icon: Clock },
    draft: { color: 'text-neutral-500', bgColor: 'bg-neutral-600', label: 'DRAFT', icon: FileEdit },
    funded: { color: 'text-brand-acid', bgColor: 'bg-brand-acid', label: 'FUNDED', icon: Check },
    expired: { color: 'text-brand-orange', bgColor: 'bg-brand-orange', label: 'EXPIRED', icon: AlertCircle },
    rejected: { color: 'text-red-500', bgColor: 'bg-red-500', label: 'REJECTED', icon: AlertCircle },
};

const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
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

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        const order: Record<string, number> = { active: 0, pending: 1, funded: 2, draft: 3 };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    });

    const handleSelectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
        setIsOpen(false);
        setSearchQuery('');
    };

    const StatusDot = ({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) => {
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <div className={`relative ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`}>
                <div className={`absolute inset-0 rounded-full ${config.bgColor} animate-pulse blur-[4px] opacity-60`}></div>
                <div className={`relative w-full h-full rounded-full ${config.bgColor} shadow-[0_0_10px_rgba(204,255,0,0.4)]`}></div>
            </div>
        );
    };

    if (loading || !hasProjects) return null;

    return (
        <div className={`relative ${className} ${showInMobile ? '' : 'hidden lg:block'}`} ref={dropdownRef}>
            {/* Tactical Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-500 border group ${
                    isOpen 
                    ? 'bg-brand-acid text-brand-black border-brand-acid shadow-[0_0_20px_rgba(204,255,0,0.2)]' 
                    : 'bg-white/5 border-white/10 text-brand-white hover:bg-white/10'
                }`}
            >
                {selectedProject ? (
                    <>
                        <StatusDot status={selectedProject.status} />
                        <span className="max-w-[120px] xl:max-w-[180px] truncate text-[10px] font-black uppercase tracking-[0.1em] italic">
                            {selectedProject.title}
                        </span>
                    </>
                ) : (
                    <>
                        <Target className="w-3.5 h-3.5 text-brand-acid" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic text-neutral-400">SELECT INTEL</span>
                    </>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${isOpen ? 'rotate-180 opacity-100' : 'opacity-40'}`} />
            </button>

            {/* Cinematic Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-4 w-80 bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 px-2">
                            <span className="text-[11px] font-black italic uppercase tracking-[0.4em] text-neutral-500">CORE SELECT</span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-black text-neutral-600 rounded-lg">
                                {projects.length}
                            </span>
                        </div>

                        {/* Search */}
                        {projects.length > 3 && (
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-700" />
                                <input
                                    type="text"
                                    placeholder="SEARCH INTEL..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black italic uppercase tracking-widest text-brand-white placeholder-neutral-800 focus:outline-none focus:border-brand-acid/30 transition-all"
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* List */}
                        <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-hide">
                            {sortedProjects.map((project) => {
                                const isSelected = selectedProjectId === project.id;
                                const config = statusConfig[project.status] || statusConfig.draft;
                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => handleSelectProject(project.id)}
                                        className={`w-full group/item relative p-4 rounded-2xl transition-all duration-300 text-left border ${
                                            isSelected 
                                            ? 'bg-brand-acid/10 border-brand-acid/30' 
                                            : 'bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="pt-1.5">
                                                <StatusDot status={project.status} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className={`text-[11px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-brand-acid italic' : 'text-neutral-200'}`}>
                                                        {project.title}
                                                    </span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-acid flex-shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                                                    {project.status === 'active' && (
                                                        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                                                            {formatCurrency(project.raised || 0)} RAISED
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subtle Footer */}
                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 text-center">
                        <span className="text-[8px] font-black italic uppercase tracking-[0.4em] text-neutral-700">PROTOCOLS SYNCED</span>
                    </div>
                </div>
            )}
        </div>
    );
}
