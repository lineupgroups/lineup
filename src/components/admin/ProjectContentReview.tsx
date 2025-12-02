import React, { useState } from 'react';
import { FirestoreProject } from '../../types/firestore';
import { 
  Star, 
  Ban, 
  Play, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useAdminActions } from '../../hooks/useAdminActions';

interface ProjectContentReviewProps {
  project: FirestoreProject;
  adminId: string;
  adminEmail: string;
  onRefresh: () => void;
}

export default function ProjectContentReview({ 
  project, 
  adminId, 
  adminEmail, 
  onRefresh 
}: ProjectContentReviewProps) {
  const {
    toggleFeatured,
    suspendProject,
    reactivateProject,
    requestChanges
  } = useAdminActions(adminId, adminEmail);

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [changeMessage, setChangeMessage] = useState('');
  const [changeField, setChangeField] = useState('');

  const handleToggleFeatured = async () => {
    const success = await toggleFeatured(project.id);
    if (success) onRefresh();
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) return;
    const success = await suspendProject(project.id, suspensionReason);
    if (success) {
      setShowSuspendModal(false);
      setSuspensionReason('');
      onRefresh();
    }
  };

  const handleReactivate = async () => {
    const success = await reactivateProject(project.id);
    if (success) onRefresh();
  };

  const handleRequestChanges = async () => {
    if (!changeMessage.trim()) return;
    const success = await requestChanges(project.id, changeMessage, changeField || undefined);
    if (success) {
      setShowRequestModal(false);
      setChangeMessage('');
      setChangeField('');
      onRefresh();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      pending_verification: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
        {project.status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
            {project.featured && (
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
            )}
            {project.isVerifiedCreator && (
              <CheckCircle className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <p className="text-gray-600 mb-3">{project.tagline}</p>
          {getStatusBadge()}
          {project.reportCount && project.reportCount > 0 && (
            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              {project.reportCount} {project.reportCount === 1 ? 'Report' : 'Reports'}
            </span>
          )}
        </div>
      </div>

      {/* Project Image */}
      <div className="mb-6">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Goal</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(project.goal || project.fundingGoal || 0)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Raised</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(project.raised)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Supporters</p>
          <p className="text-lg font-semibold text-gray-900">{project.supporters}</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{project.fullDescription}</p>
      </div>

      {/* Suspension Info */}
      {project.status === 'suspended' && project.suspensionReason && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Suspended</p>
              <p className="text-sm text-red-700">{project.suspensionReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Change Requests */}
      {project.adminChangeRequests && project.adminChangeRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Change Requests</h3>
          <div className="space-y-2">
            {project.adminChangeRequests.map((request) => (
              <div key={request.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">{request.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: <span className="font-medium">{request.status}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleToggleFeatured}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            project.featured
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>{project.featured ? 'Unfeature' : 'Feature'}</span>
        </button>

        {project.status !== 'suspended' ? (
          <button
            onClick={() => setShowSuspendModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Ban className="w-4 h-4" />
            <span>Suspend</span>
          </button>
        ) : (
          <button
            onClick={handleReactivate}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Reactivate</span>
          </button>
        )}

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Request Changes</span>
        </button>

        <a
          href={`/projects/${project.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View Public Page</span>
        </a>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suspend Project
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Suspending this project will hide it from public view. The creator will be notified.
            </p>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspensionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Suspend Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Changes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The creator will receive this request via in-app notification and email.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field (Optional)
                </label>
                <input
                  type="text"
                  value={changeField}
                  onChange={(e) => setChangeField(e.target.value)}
                  placeholder="e.g., description, images, goal"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={changeMessage}
                  onChange={(e) => setChangeMessage(e.target.value)}
                  placeholder="Describe what needs to be changed..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setChangeMessage('');
                  setChangeField('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={!changeMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


