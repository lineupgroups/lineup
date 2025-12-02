import React, { useState } from 'react';
import { Edit3, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectUpdates } from '../../hooks/useProjectUpdates';
import { FirestoreProjectUpdate } from '../../types/firestore';
import ProjectUpdateForm from '../creator/ProjectUpdateForm';
import ProjectUpdatesList from '../creator/ProjectUpdatesList';
import LoadingSpinner from '../common/LoadingSpinner';

export default function CreatorUpdatesPage() {
  const { user } = useAuth();
  const { projects: userProjects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<FirestoreProjectUpdate | null>(null);

  const {
    updates,
    loading: updatesLoading,
    addUpdate,
    editUpdate,
    removeUpdate,
    pinUpdate
  } = useProjectUpdates(selectedProjectId || '');

  const handleSubmit = async (data: { title: string; content: string; image?: string }) => {
    if (editingUpdate) {
      await editUpdate(editingUpdate.id, data);
    } else {
      await addUpdate(data);
    }
    setShowUpdateForm(false);
    setEditingUpdate(null);
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Updates</h1>
          <p className="text-gray-600">
            Share progress and keep your supporters engaged
          </p>
        </div>

        {/* Project Selector & Action */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Choose a project</option>
                {userProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {selectedProjectId && (
              <button
                onClick={() => {
                  setEditingUpdate(null);
                  setShowUpdateForm(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Post Update</span>
              </button>
            )}
          </div>
        </div>

        {/* Updates Content */}
        {selectedProjectId ? (
          <ProjectUpdatesList
            updates={updates}
            loading={updatesLoading}
            onEdit={(update) => {
              setEditingUpdate(update);
              setShowUpdateForm(true);
            }}
            onDelete={removeUpdate}
            onPin={pinUpdate}
            isCreator={true}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a project to manage updates
            </h3>
            <p className="text-gray-600">
              Choose a project from the dropdown above to post and manage supporters-only updates.
            </p>
          </div>
        )}
      </div>

      {/* Update Form Modal */}
      {selectedProjectId && (
        <ProjectUpdateForm
          isOpen={showUpdateForm}
          onClose={() => {
            setShowUpdateForm(false);
            setEditingUpdate(null);
          }}
          projectId={selectedProjectId}
          onSubmit={handleSubmit}
          editingUpdate={editingUpdate}
        />
      )}
    </div>
  );
}

