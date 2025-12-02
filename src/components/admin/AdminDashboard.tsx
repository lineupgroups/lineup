import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { FirestoreProject } from '../../types/firestore';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FolderOpen,
  AlertTriangle,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjectDisplayStatus } from '../../lib/scheduledLaunches';
import AdminKYCReview from './AdminKYCReview';

const AdminDashboard: React.FC = () => {
  const {
    isAdmin,
    pendingProjects,
    allProjects,
    allUsers,
    loading,
    approveProject,
    rejectProject
  } = useAdmin();

  const [selectedProject, setSelectedProject] = useState<FirestoreProject | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'kyc' | 'all' | 'users' | 'analytics'>('pending');

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
    } catch (error) {
      // Error already handled in context
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
    } catch (error) {
      // Error already handled in context
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const stats = {
    totalProjects: allProjects.length,
    pendingProjects: pendingProjects.length,
    approvedProjects: allProjects.filter(p => p.approvalStatus === 'approved').length,
    rejectedProjects: allProjects.filter(p => p.approvalStatus === 'rejected').length,
    totalUsers: allUsers.length,
    totalRaised: allProjects.reduce((sum, p) => sum + (p.raised || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage projects, users, and platform content</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Raised</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRaised)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
              {[
                { id: 'pending', label: 'Pending Projects', count: stats.pendingProjects, icon: Clock },
                { id: 'kyc', label: 'KYC Review', count: null, icon: Shield },
                { id: 'all', label: 'All Projects', count: stats.totalProjects, icon: FolderOpen },
                { id: 'users', label: 'Users', count: stats.totalUsers, icon: Users },
                { id: 'analytics', label: 'Analytics', count: null, icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== null && (
                      <span className={`ml-1 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Pending Projects Tab */}
            {activeTab === 'pending' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Projects Pending Approval ({pendingProjects.length})
                </h2>
                {pendingProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <p className="text-gray-600">No projects pending approval!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProjects.map((project) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div>
                                <h3 className="font-semibold text-gray-900">{project.title}</h3>
                                <p className="text-sm text-gray-600">{project.tagline}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {formatDate(project.createdAt)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span>Goal: {formatCurrency(project.goal || project.fundingGoal || 0)}</span>
                              <span>Category: {project.category}</span>
                              <span>Duration: {project.daysLeft} days</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.launchType === 'scheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                                }`}>
                                {project.launchType === 'scheduled' ? '📅 Scheduled Launch' : '🚀 Immediate Launch'}
                              </span>
                              {project.launchType === 'scheduled' && project.scheduledDate && (
                                <span className="text-gray-600">
                                  Launch Date: {formatDate(project.scheduledDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleApprove(project.id)}
                              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(project)}
                              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KYC Review Tab */}
            {activeTab === 'kyc' && (
              <AdminKYCReview />
            )}

            {/* All Projects Tab */}
            {activeTab === 'all' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  All Projects ({allProjects.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Goal / Raised
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allProjects.slice(0, 20).map((project) => (
                        <tr key={project.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-10 h-10 object-cover rounded-lg mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {project.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project.category}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.approvalStatus)}`}>
                              {project.approvalStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{formatCurrency(project.goal || project.fundingGoal || 0)}</div>
                            <div className="text-gray-500">{formatCurrency(project.raised)} raised</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(project.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {project.approvalStatus === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(project.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(project)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Platform Users ({allUsers.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projects Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projects Supported
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.slice(0, 20).map((user) => (
                        <tr key={user.uid}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.displayName || 'Unnamed User'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.stats?.projectsCreated || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.stats?.projectsSupported || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Platform Analytics</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Project Status</h3>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Approved</span>
                        <span className="text-sm font-medium text-green-600">{stats.approvedProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="text-sm font-medium text-yellow-600">{stats.pendingProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rejected</span>
                        <span className="text-sm font-medium text-red-600">{stats.rejectedProjects}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Funding Stats</h3>
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Raised</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(stats.totalRaised)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg per Project</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(stats.totalProjects > 0 ? stats.totalRaised / stats.totalProjects : 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">User Activity</h3>
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Users</span>
                        <span className="text-sm font-medium text-gray-900">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Creators</span>
                        <span className="text-sm font-medium text-gray-900">
                          {allUsers.filter(u => (u.stats?.projectsCreated || 0) > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Project: {selectedProject?.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this project. This will be visible to the creator.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AdminDashboard;
