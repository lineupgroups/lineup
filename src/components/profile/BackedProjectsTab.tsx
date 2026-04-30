import React, { useState } from 'react';
import { Heart, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useBackedProjects } from '../../hooks/useEnhancedUserProfile';
import { getProjectStatus, getStatusLabel, getStatusColor as getProjectStatusColor } from '../../utils/projectStatus';

interface BackedProjectsTabProps {
  userId?: string;
  className?: string;
}

const BackedProjectsTab: React.FC<BackedProjectsTabProps> = ({ userId, className = '' }) => {
  const { backedProjects, isLoading, error } = useBackedProjects(userId);
  const [sortBy, setSortBy] = useState<'recent' | 'amount' | 'status'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter and sort projects
  const filteredProjects = backedProjects
    .filter(backing => filterStatus === 'all' || backing.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'recent':
        default:
          const bTime = b.backedAt?.seconds ? new Date(b.backedAt.seconds * 1000).getTime() : 0;
          const aTime = a.backedAt?.seconds ? new Date(a.backedAt.seconds * 1000).getTime() : 0;
          return bTime - aTime;
      }
    });

  const totalBacked = backedProjects.reduce((sum, backing) => sum + backing.amount, 0);
  const statusCounts = backedProjects.reduce((acc, backing) => {
    acc[backing.status] = (acc[backing.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Backed Projects</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6 group hover:border-brand-acid/30 transition-all duration-300">
          <div className="flex items-center gap-3 text-brand-acid mb-4">
            <Heart className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Support</span>
          </div>
          <div className="text-3xl font-black text-brand-white italic tracking-tighter">{backedProjects.length}</div>
        </div>

        <div className="bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6 group hover:border-brand-orange/30 transition-all duration-300">
          <div className="flex items-center gap-3 text-brand-orange mb-4">
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Impact</span>
          </div>
          <div className="text-3xl font-black text-brand-white italic tracking-tighter">{formatCurrency(totalBacked)}</div>
        </div>

        <div className="bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6 group hover:border-brand-acid/30 transition-all duration-300">
          <div className="flex items-center gap-3 text-brand-acid mb-4">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Successes</span>
          </div>
          <div className="text-3xl font-black text-brand-white italic tracking-tighter">{statusCounts.completed || 0}</div>
        </div>

        <div className="bg-neutral-900/30 rounded-3xl border border-neutral-800 p-6 group hover:border-brand-orange/30 transition-all duration-300">
          <div className="flex items-center gap-3 text-brand-orange mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active</span>
          </div>
          <div className="text-3xl font-black text-brand-white italic tracking-tighter">{statusCounts.active || 0}</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 bg-neutral-900/20 p-4 rounded-3xl border border-neutral-800/50">
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'active', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`
                px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300
                ${filterStatus === status
                  ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.15)]'
                  : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-brand-white hover:border-neutral-700'
                }
              `}
            >
              {status} {status !== 'all' && <span className="opacity-60 ml-1">({statusCounts[status] || 0})</span>}
            </button>
          ))}
        </div>

        <div className="relative group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-neutral-900 text-brand-white text-[10px] font-black uppercase tracking-widest border border-neutral-800 rounded-2xl px-6 py-3.5 pr-10 focus:outline-none focus:border-brand-acid transition-all w-full md:w-auto"
          >
            <option value="recent">Timeline</option>
            <option value="amount">Impact</option>
            <option value="status">Status</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            <Clock className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Backed Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-6">
          {filteredProjects.map((backing) => {
            let displayStatus = backing.status;
            let statusLabel = backing.status;
            let statusColorClass = getStatusColor(backing.status);
            let StatusIcon = getStatusIcon(backing.status);

            if (backing.project) {
              const projectStatus = getProjectStatus(
                backing.project.endDate,
                backing.project.raised || 0,
                backing.project.goal || backing.project.fundingGoal || 0
              );

              if (backing.status !== 'cancelled' && projectStatus.status !== 'active') {
                displayStatus = projectStatus.status;
                statusLabel = getStatusLabel(projectStatus.status);
                
                // Map to brand colors
                if (projectStatus.status === 'successful') {
                  statusColorClass = 'bg-brand-acid/10 text-brand-acid border-brand-acid/20 shadow-[0_0_10px_rgba(204,255,0,0.1)]';
                  StatusIcon = <CheckCircle className="w-3.5 h-3.5" />;
                } else if (projectStatus.status === 'failed') {
                  statusColorClass = 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
                  StatusIcon = <XCircle className="w-3.5 h-3.5" />;
                } else {
                  statusColorClass = 'bg-neutral-800 text-neutral-400 border-neutral-700';
                  StatusIcon = <Clock className="w-3.5 h-3.5" />;
                }
              }
            }

            return (
              <div key={backing.id} className="bg-neutral-900/30 rounded-[2rem] border border-neutral-800 p-6 sm:p-8 hover:border-neutral-700 transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row gap-8">
                  {/* Project Image */}
                  <div className="flex-shrink-0 w-full sm:w-48 aspect-video sm:aspect-square rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 to-transparent z-10" />
                    {backing.project?.image ? (
                      <img
                        src={backing.project.image}
                        alt={backing.project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-orange/20 to-brand-acid/20"></div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-xl sm:text-2xl font-black text-brand-white italic tracking-tighter truncate uppercase">
                        {backing.project?.title || 'Project Title'}
                      </h3>
                      <div className={`
                        inline-flex items-center gap-2 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border self-start sm:self-center
                        ${statusColorClass}
                      `}>
                        {StatusIcon}
                        <span>{statusLabel}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Commitment</p>
                        <p className="text-lg font-black text-brand-acid italic">{formatCurrency(backing.amount)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Timeline</p>
                        <p className="text-sm font-bold text-brand-white">{formatDate(backing.backedAt)}</p>
                      </div>
                      {backing.rewardTier && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Tier</p>
                          <p className="text-sm font-bold text-brand-orange truncate">{backing.rewardTier}</p>
                        </div>
                      )}
                      {backing.anonymous && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Status</p>
                          <p className="text-[10px] font-bold text-neutral-400">🕶️ PRIVATE</p>
                        </div>
                      )}
                    </div>

                    {backing.project?.description && (
                      <p className="text-neutral-500 text-sm font-medium line-clamp-2 leading-relaxed">
                        {backing.project.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-neutral-900/20 rounded-[3rem] border border-neutral-800 border-dashed">
          <Heart className="w-20 h-20 text-neutral-800 mx-auto mb-8" />
          <h3 className="text-2xl font-black text-brand-white italic uppercase tracking-tight mb-4">
            {filterStatus === 'all' ? 'Lineup Empty' : `No ${filterStatus} records`}
          </h3>
          <p className="text-neutral-500 max-w-sm mx-auto mb-10 font-medium">
            {filterStatus === 'all'
              ? 'Join the nation by supporting your first project today.'
              : `Try adjusting your status filter to reveal hidden entries.`
            }
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-acid hover:text-brand-acid/80 transition-all"
            >
              Show All History
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BackedProjectsTab;
