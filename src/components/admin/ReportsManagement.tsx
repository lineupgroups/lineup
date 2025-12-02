import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flag, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter
} from 'lucide-react';
import { FirestoreReport } from '../../types/firestore';
import { useReports } from '../../hooks/useReports';

interface ReportsManagementProps {
  adminId: string;
  adminEmail: string;
}

export default function ReportsManagement({ adminId, adminEmail }: ReportsManagementProps) {
  const {
    reports,
    statistics,
    loading,
    updateStatus,
    resolveReport,
    dismissReport
  } = useReports();

  const [statusFilter, setStatusFilter] = useState<'all' | FirestoreReport['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | FirestoreReport['priority']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FirestoreReport['targetType']>('all');
  const [selectedReport, setSelectedReport] = useState<FirestoreReport | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [actionTaken, setActionTaken] = useState<FirestoreReport['actionTaken']>('none');

  // Filter reports
  const filteredReports = reports.filter(report => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && report.priority !== priorityFilter) return false;
    if (typeFilter !== 'all' && report.targetType !== typeFilter) return false;
    return true;
  });

  const handleResolve = async () => {
    if (!selectedReport || !resolution.trim()) return;
    
    const success = await resolveReport(
      selectedReport.id,
      resolution,
      actionTaken,
      adminId,
      adminEmail
    );

    if (success) {
      setShowResolveModal(false);
      setSelectedReport(null);
      setResolution('');
      setActionTaken('none');
    }
  };

  const handleDismiss = async () => {
    if (!selectedReport || !resolution.trim()) return;
    
    const success = await dismissReport(
      selectedReport.id,
      resolution,
      adminId,
      adminEmail
    );

    if (success) {
      setShowDismissModal(false);
      setSelectedReport(null);
      setResolution('');
    }
  };

  const handleMarkReviewing = async (report: FirestoreReport) => {
    await updateStatus(report.id, 'reviewing', adminId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <div>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Critical Priority</p>
            <p className="text-2xl font-bold text-red-600">{statistics.byPriority.critical}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Auto-Flagged</p>
            <p className="text-2xl font-bold text-orange-600">{statistics.autoFlagged}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="project">Projects</option>
              <option value="user">Users</option>
              <option value="comment">Comments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {report.category.replace('_', ' ').toUpperCase()}
                        </span>
                        {report.autoFlagged && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
                            Auto-flagged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {report.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By: {report.reporterName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {report.targetType.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {report.projectTitle || report.userName || report.targetId.substring(0, 8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleMarkReviewing(report)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Mark as Reviewing"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {(report.status === 'pending' || report.status === 'reviewing') && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowResolveModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Resolve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDismissModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Dismiss"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No reports found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resolve Report
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Category:</strong> {report.category}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Description:</strong> {selectedReport.description}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Taken
                </label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="none">No Action</option>
                  <option value="warning">Warning Issued</option>
                  <option value="content_removed">Content Removed</option>
                  <option value="user_suspended">User Suspended</option>
                  <option value="user_banned">User Banned</option>
                  <option value="project_suspended">Project Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this report was resolved..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedReport(null);
                  setResolution('');
                  setActionTaken('none');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dismiss Report
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Why is this report being dismissed?
            </p>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Reason for dismissal..."
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setSelectedReport(null);
                  setResolution('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDismiss}
                disabled={!resolution.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Dismiss Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


