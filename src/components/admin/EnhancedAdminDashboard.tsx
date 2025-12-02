import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FolderOpen,
  Users,
  Flag,
  TrendingUp,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  FileCheck
} from 'lucide-react';
import ProjectContentReview from './ProjectContentReview';
import UserManagement from './UserManagement';
import ReportsManagement from './ReportsManagement';
import UserAnalyticsDashboard from './UserAnalyticsDashboard';
import LandingPageManager from './LandingPageManager';
import AdminKYCReview from './AdminKYCReview';
import { useAdmin as useAdminContext } from '../../contexts/AdminContext';
import { useReports } from '../../hooks/useReports';
import { FirestoreProject } from '../../types/firestore';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'pending' | 'kyc' | 'all_projects' | 'users' | 'reports' | 'analytics' | 'content_review' | 'landing_page';

const EnhancedAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    isAdmin,
    pendingProjects,
    allProjects,
    allUsers,
    loading,
    approveProject,
    rejectProject,
    refreshData
  } = useAdminContext();

  const { reports, statistics: reportStats } = useReports();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedProject, setSelectedProject] = useState<FirestoreProject | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (projectId: string) => {
    try {
      await approveProject(projectId);
      await refreshData();
    } catch (error) {
      // Error handled in context
    }
  };

  const handleReject = (project: FirestoreProject) => {
    setSelectedProject(project);
    setShowRejectionModal(true);
  };

  const confirmReject = async () => {
    if (!selectedProject || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectProject(selectedProject.id, rejectionReason);
      setShowRejectionModal(false);
      setSelectedProject(null);
      setRejectionReason('');
      await refreshData();
    } catch (error) {
      // Error handled in context
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
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics
  const stats = {
    totalProjects: allProjects.length,
    pendingProjects: pendingProjects.length,
    approvedProjects: allProjects.filter(p => p.approvalStatus === 'approved').length,
    suspendedProjects: allProjects.filter(p => p.status === 'suspended').length,
    totalUsers: allUsers.length,
    suspendedUsers: allUsers.filter(u => u.isSuspended).length,
    bannedUsers: allUsers.filter(u => u.isBanned).length,
    verifiedCreators: allUsers.filter(u => u.isVerifiedCreator).length,
    totalReports: reportStats?.total || 0,
    pendingReports: reportStats?.pending || 0,
    totalRaised: allProjects.reduce((sum, p) => sum + (p.raised || 0), 0)
  };

  // Filter projects for search
  const filteredProjects = allProjects.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  const paginatedProjects = filteredProjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive platform management and analytics</p>
        </div>

        {/* Quick Stats Cards */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Projects */}
              <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('pending')}>
                <div className="flex items-center justify-between mb-2">
                  <FolderOpen className="h-8 w-8 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Projects</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
                <p className="text-sm text-yellow-600 mt-1">{stats.pendingProjects} pending approval</p>
                <p className="text-sm text-red-600">{stats.suspendedProjects} suspended</p>
              </div>

              {/* Users */}
              <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('users')}>
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Users</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-blue-600 mt-1">{stats.verifiedCreators} verified creators</p>
                <p className="text-sm text-red-600">{stats.suspendedUsers + stats.bannedUsers} suspended/banned</p>
              </div>

              {/* Reports */}
              <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('reports')}>
                <div className="flex items-center justify-between mb-2">
                  <Flag className="h-8 w-8 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Reports</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
                <p className="text-sm text-yellow-600 mt-1">{stats.pendingReports} need review</p>
                <p className="text-sm text-gray-600">{reportStats?.byPriority?.critical || 0} critical</p>
              </div>

              {/* Total Raised */}
              <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('analytics')}>
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Analytics</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRaised)}</p>
                <p className="text-sm text-gray-600 mt-1">Total raised</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                  onClick={() => setActiveTab('pending')}
                  className="p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 transition-colors"
                >
                  <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Review Pending</p>
                  <p className="text-xs text-gray-600">{stats.pendingProjects} projects</p>
                </button>
                <button
                  onClick={() => setActiveTab('kyc')}
                  className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 transition-colors"
                >
                  <FileCheck className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Review KYC</p>
                  <p className="text-xs text-gray-600">Verify creators</p>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-4 border-2 border-red-200 rounded-lg hover:border-red-400 transition-colors"
                >
                  <Flag className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Review Reports</p>
                  <p className="text-xs text-gray-600">{stats.pendingReports} pending</p>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-600">{stats.totalUsers} total</p>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors"
                >
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">View Analytics</p>
                  <p className="text-xs text-gray-600">Insights & data</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Pending Projects</h2>
              {pendingProjects.slice(0, 5).map(project => (
                <div key={project.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <img src={project.image} alt={project.title} className="w-12 h-12 rounded object-cover" />
                    <div>
                      <p className="font-medium text-gray-900">{project.title}</p>
                      <p className="text-sm text-gray-600">{formatDate(project.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(project.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(project)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setActiveTab('content_review');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Review"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-lg shadow mb-6">
            <nav className="flex space-x-8 px-6 border-b border-gray-200 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'pending', label: 'Pending Approval', badge: stats.pendingProjects },
                { id: 'kyc', label: 'KYC Review' },
                { id: 'all_projects', label: 'All Projects' },
                { id: 'users', label: 'User Management' },
                { id: 'reports', label: 'Reports', badge: stats.pendingReports },
                { id: 'analytics', label: 'Analytics' },
                { id: 'landing_page', label: 'Landing Page' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Projects Pending Approval ({pendingProjects.length})
              </h2>
              {pendingProjects.map(project => (
                <div key={project.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <img src={project.image} alt={project.title} className="w-16 h-16 object-cover rounded-lg" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-600">{project.tagline}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {formatDate(project.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Goal: {formatCurrency(project.goal || project.fundingGoal || 0)}</span>
                        <span>Category: {project.category}</span>
                        <span>Duration: {project.daysLeft} days</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(project.id)}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(project)}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setActiveTab('content_review');
                        }}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingProjects.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-gray-600">No projects pending approval!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kyc' && (
            <AdminKYCReview />
          )}

          {activeTab === 'all_projects' && (
            <div>
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goal/Raised</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedProjects.map(project => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img src={project.image} alt={project.title} className="w-10 h-10 rounded object-cover mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">{project.title}</div>
                              <div className="text-sm text-gray-500">{project.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                            project.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{formatCurrency(project.goal || project.fundingGoal || 0)}</div>
                          <div className="text-gray-500">{formatCurrency(project.raised)} raised</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(project.createdAt)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setActiveTab('content_review');
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t flex items-center justify-between">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'content_review' && selectedProject && user && (
            <ProjectContentReview
              project={selectedProject}
              adminId={user.uid}
              adminEmail={user.email || ''}
              onRefresh={() => {
                refreshData();
                setActiveTab('all_projects');
                setSelectedProject(null);
              }}
            />
          )}

          {activeTab === 'users' && user && (
            <UserManagement
              users={allUsers}
              adminId={user.uid}
              adminEmail={user.email || ''}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'reports' && user && (
            <ReportsManagement
              adminId={user.uid}
              adminEmail={user.email || ''}
            />
          )}

          {activeTab === 'analytics' && (
            <UserAnalyticsDashboard />
          )}

          {activeTab === 'landing_page' && (
            <LandingPageManager />
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Project: {selectedProject.title}
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedProject(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminDashboard;


