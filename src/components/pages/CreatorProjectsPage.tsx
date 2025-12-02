import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit3, Settings, Play, Pause, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator, useProjectMutations } from '../../hooks/useProjects';
import { FirestoreProject } from '../../types/firestore';
import { convertTimestamp, getProjectProgress, getDaysLeft } from '../../lib/firestore';
import ProjectForm from '../projects/ProjectForm';
import ProjectStatusControls from '../projects/ProjectStatusControls';
import LoadingSpinner, { ProjectCardSkeleton } from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { getProjectStatus, getStatusLabel, getStatusColor as getProjectStatusColor } from '../../utils/projectStatus';

export default function CreatorProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | undefined>();
  const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<FirestoreProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<FirestoreProject | null>(null);

  const { projects: userProjects, loading, error, refetch } = useProjectsByCreator(user?.uid || '');
  const { deleteProject, loading: isDeleting } = useProjectMutations();

  const handleCreateProject = () => {
    navigate('/dashboard/projects/create');
  };

  const handleEditProject = (projectId: string) => {
    setEditingProjectId(projectId);
    setShowProjectForm(true);
  };

  const handleProjectFormSuccess = () => {
    setShowProjectForm(false);
    setEditingProjectId(undefined);
    refetch();
    toast.success(editingProjectId ? 'Project updated successfully!' : 'Project created successfully!');
  };

  const handleDeleteClick = (project: FirestoreProject) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      refetch();
      // Success message is handled by the hook
    } catch (error) {
      console.error('Error deleting project:', error);
      // Error message is handled by the hook
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <ProjectCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-600">
              Manage and track all your crowdfunding projects
            </p>
          </div>
          <button
            onClick={handleCreateProject}
            className="mt-4 sm:mt-0 flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {userProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">
              Start your crowdfunding journey by creating your first project
            </p>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((project) => {
              const progress = getProjectProgress(project.raised, project.goal);

              const projectStatus = getProjectStatus(
                project.endDate,
                project.raised,
                project.goal || project.fundingGoal || 0
              );

              // Use the calculated status if the project is active in DB but actually expired/completed
              // Otherwise respect manual statuses like 'paused' or 'draft'
              const displayStatus = (project.status === 'active' && projectStatus.status !== 'active')
                ? projectStatus.status
                : project.status;

              // Use our utility for status color if it's one of our calculated statuses, otherwise fallback to local helper
              const statusColorClass = ['expired', 'successful', 'failed'].includes(displayStatus)
                ? getProjectStatusColor(displayStatus as any)
                : getStatusColor(displayStatus);

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
                >
                  {/* Project Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Project+Image';
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColorClass}`}>
                        {getStatusIcon(displayStatus)}
                        <span className="capitalize ml-1">{displayStatus === 'successful' ? 'Funded' : displayStatus}</span>
                      </span>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.tagline}
                    </p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(project.raised)}
                        </span>
                        <span className="text-gray-600">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{project.supporters} supporters</span>
                        <span>{projectStatus.daysLeft > 0 ? `${projectStatus.daysLeft} days left` : 'Ended'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedProjectForStatus(project)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Status</span>
                      </button>
                      <button
                        onClick={() => handleEditProject(project.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(project)}
                        className="flex items-center justify-center px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={showProjectForm}
        onClose={() => {
          setShowProjectForm(false);
          setEditingProjectId(undefined);
        }}
        projectId={editingProjectId}
        onSuccess={handleProjectFormSuccess}
      />

      {/* Project Status Management Modal */}
      {selectedProjectForStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Project Status
                </h2>
                <button
                  onClick={() => setSelectedProjectForStatus(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <ProjectStatusControls
                project={selectedProjectForStatus}
                onUpdate={() => {
                  refetch();
                  setSelectedProjectForStatus(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{projectToDelete.title}</strong>"?
              This action cannot be undone and will permanently remove all project data.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isDeleting && <LoadingSpinner size="sm" color="text-white" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
