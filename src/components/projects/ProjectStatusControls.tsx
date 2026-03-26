import React, { useState } from 'react';
import { Play, Pause, Eye, EyeOff, AlertCircle, CheckCircle, Clock, Ban } from 'lucide-react';
import { FirestoreProject } from '../../types/firestore';
import { updateProject } from '../../lib/firestore';
import toast from 'react-hot-toast';

interface ProjectStatusControlsProps {
  project: FirestoreProject;
  onStatusChange?: (newStatus: string) => void;
  onUpdate?: () => void; // Called after any status change
  className?: string;
}

type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'pending_verification' | 'rejected' | 'approved_scheduled';

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: Clock,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    description: 'Project is being prepared and not visible to the public'
  },
  active: {
    label: 'Active',
    icon: Play,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    description: 'Project is live and accepting contributions'
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    description: 'Project is temporarily paused and not accepting new contributions'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    description: 'Project has successfully reached its goal or ended'
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    description: 'Project has been cancelled and contributions will be refunded'
  },
  pending_verification: {
    label: 'Pending Verification',
    icon: AlertCircle,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    description: 'Project is under review and will be live once approved'
  },
  rejected: {
    label: 'Rejected',
    icon: Ban,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    description: 'Project was rejected during verification and needs revision'
  },
  approved_scheduled: {
    label: 'Approved - Scheduled',
    icon: Clock,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    description: 'Project is approved and will launch automatically on the scheduled date'
  }
};

export default function ProjectStatusControls({
  project,
  onStatusChange,
  onUpdate,
  className = ''
}: ProjectStatusControlsProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<ProjectStatus | null>(null);

  const currentStatus = project.status as ProjectStatus;
  const currentConfig = statusConfig[currentStatus] || statusConfig.draft; // Fallback to draft if status not found

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (newStatus === currentStatus) return;

    // Show confirmation for certain status changes
    if (newStatus === 'cancelled' || newStatus === 'completed') {
      setShowConfirmDialog(newStatus);
      return;
    }

    await executeStatusChange(newStatus);
  };

  const executeStatusChange = async (newStatus: ProjectStatus) => {
    try {
      setIsChangingStatus(true);

      await updateProject(project.id, {
        status: newStatus,
        updatedAt: new Date() as any
      });

      onStatusChange?.(newStatus);
      onUpdate?.(); // Call onUpdate callback
      toast.success(`Project status changed to ${statusConfig[newStatus].label}`);

    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    } finally {
      setIsChangingStatus(false);
      setShowConfirmDialog(null);
    }
  };

  const getAvailableActions = (): ProjectStatus[] => {
    switch (currentStatus) {
      case 'draft':
        return ['active'];
      case 'active':
        return ['paused', 'completed', 'cancelled'];
      case 'paused':
        return ['active', 'completed', 'cancelled'];
      case 'completed':
        return []; // No actions available for completed projects
      case 'cancelled':
        return []; // No actions available for cancelled projects
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

  const getActionButton = (status: ProjectStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <button
        key={status}
        onClick={() => handleStatusChange(status)}
        disabled={isChangingStatus}
        className={`flex items-center space-x-2 px-3 py-2 border rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${config.bgColor} ${config.textColor} ${config.borderColor} hover:bg-opacity-80`}
      >
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </button>
    );
  };

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${currentConfig.bgColor}`}>
              <currentConfig.icon className={`w-5 h-5 ${currentConfig.textColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Current Status: {currentConfig.label}
              </h3>
              <p className="text-sm text-gray-600">{currentConfig.description}</p>
            </div>
          </div>

          {/* Project Visibility Indicator */}
          <div className="flex items-center space-x-2">
            {currentStatus === 'active' ? (
              <>
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Public</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">Hidden</span>
              </>
            )}
          </div>
        </div>

        {/* Available Actions */}
        {availableActions.length > 0 && (
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="font-medium text-gray-900 mb-3">Available Actions</h4>
            <div className="flex flex-wrap gap-2">
              {availableActions.map(getActionButton)}
            </div>
          </div>
        )}

        {/* Status History or Additional Info */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Status Information</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Created:</strong> {project.createdAt.toDate().toLocaleDateString()}
            </p>
            <p>
              <strong>Last Updated:</strong> {project.updatedAt.toDate().toLocaleDateString()}
            </p>
            {project.endDate && (
              <p>
                <strong>Campaign End Date:</strong> {project.endDate.toDate().toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Status Guidelines */}
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Status Guidelines</span>
          </h4>
          <div className="space-y-1 text-sm text-blue-700">
            <p><strong>Draft:</strong> Use this while preparing your project. Not visible to supporters.</p>
            <p><strong>Active:</strong> Project is live and accepting contributions. Can be discovered by supporters.</p>
            <p><strong>Paused:</strong> Temporarily stop accepting contributions while keeping the project visible.</p>
            <p><strong>Completed:</strong> Mark as completed when you've reached your goal or campaign period ended.</p>
            <p><strong>Cancelled:</strong> Cancel the project. All contributions will need to be refunded.</p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${statusConfig[showConfirmDialog].bgColor}`}>
                {React.createElement(statusConfig[showConfirmDialog].icon, {
                  className: `w-6 h-6 ${statusConfig[showConfirmDialog].textColor}`
                })}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Status Change
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to change the project status to{' '}
              <strong>{statusConfig[showConfirmDialog].label}</strong>?
              {showConfirmDialog === 'cancelled' && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ This action cannot be undone. All contributions will need to be refunded.
                </span>
              )}
              {showConfirmDialog === 'completed' && (
                <span className="block mt-2 text-blue-600 font-medium">
                  ℹ️ This will mark the project as successfully completed.
                </span>
              )}
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeStatusChange(showConfirmDialog)}
                disabled={isChangingStatus}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${showConfirmDialog === 'cancelled'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isChangingStatus ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
