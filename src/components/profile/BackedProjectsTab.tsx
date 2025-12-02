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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Heart className="w-5 h-5" />
            <span className="font-medium">Total Backed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{backedProjects.length}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Total Amount</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalBacked)}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{statusCounts.completed || 0}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{statusCounts.active || 0}</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Filter by status:</span>
            {['all', 'active', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`
                  px-3 py-1 text-sm rounded-full transition-colors duration-200 capitalize
                  ${filterStatus === status
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                {status} {status !== 'all' && `(${statusCounts[status] || 0})`}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="amount">Amount (High to Low)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backed Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-4">
          {filteredProjects.map((backing) => {
            // Calculate dynamic status based on project data if available
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

              // If the project is expired/successful/failed, override the backing status (unless backing was cancelled)
              if (backing.status !== 'cancelled' && projectStatus.status !== 'active') {
                displayStatus = projectStatus.status;
                statusLabel = getStatusLabel(projectStatus.status);
                statusColorClass = getProjectStatusColor(projectStatus.status as any);

                // Map project status to icons
                if (projectStatus.status === 'successful') StatusIcon = <CheckCircle className="w-4 h-4 text-green-600" />;
                else if (projectStatus.status === 'failed') StatusIcon = <XCircle className="w-4 h-4 text-red-600" />;
                else if (projectStatus.status === 'expired') StatusIcon = <Clock className="w-4 h-4 text-gray-600" />;
              }
            }

            return (
              <div key={backing.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex gap-4">
                  {/* Project Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      {backing.project?.image ? (
                        <img
                          src={backing.project.image}
                          alt={backing.project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                      )}
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {backing.project?.title || 'Project Title'}
                      </h3>
                      <div className={`
                        inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border
                        ${statusColorClass}
                      `}>
                        {StatusIcon}
                        <span className="capitalize">{statusLabel}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{formatCurrency(backing.amount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Backed {formatDate(backing.backedAt)}</span>
                      </div>
                      {backing.anonymous && (
                        <div className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                          🕶️ Backed Anonymously
                        </div>
                      )}
                      {backing.rewardTier && (
                        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {backing.rewardTier}
                        </div>
                      )}
                    </div>

                    {backing.project?.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
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
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus === 'all' ? 'No Backed Projects' : `No ${filterStatus} projects`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filterStatus === 'all'
              ? 'Start supporting amazing projects to see them here!'
              : `Try changing the filter to see other projects.`
            }
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Show All Projects
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BackedProjectsTab;
