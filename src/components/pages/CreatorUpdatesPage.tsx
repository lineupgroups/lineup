import { useState, useEffect, useMemo } from 'react';
import { Edit3, Plus, FileText, Sparkles, PartyPopper, Flag, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectUpdates } from '../../hooks/useProjectUpdates';
import { useProjectContext } from '../../hooks/useProjectContext';
import { FirestoreProjectUpdate } from '../../types/firestore';
import ProjectUpdateForm from '../creator/ProjectUpdateForm';
import ProjectUpdatesList from '../creator/ProjectUpdatesList';
import UpdatesStatsCard from '../creator/UpdatesStatsCard';
import LoadingSpinner from '../common/LoadingSpinner';
import PageTitle from '../common/PageTitle';
import ShareSuccessModal from '../common/ShareSuccessModal';

// U-MISS-04: Pre-defined update templates
const UPDATE_TEMPLATES = [
  {
    id: 'milestone',
    name: 'Milestone Reached',
    icon: Flag,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    title: '🎯 We hit a major milestone!',
    content: `**Exciting news, supporters!**

We've just reached a significant milestone in our project journey. Here's what we've accomplished:

**Progress Update:**
- [Describe the milestone reached]
- [Impact on the project]

**What's Next:**
- [Next steps]
- [Timeline]

Thank you for being part of this journey! Your support makes all the difference.

🙏 *The Team*`
  },
  {
    id: 'thankyou',
    name: 'Thank You',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    title: '❤️ A Heartfelt Thank You',
    content: `**Dear Supporters,**

We wanted to take a moment to express our deepest gratitude for your incredible support.

**What Your Support Means:**
- [Specific impact of their contribution]
- [How it's helping the project]

**Behind the Scenes:**
[Share a personal story or moment]

Every contribution, share, and word of encouragement has meant the world to us.

With love and gratitude,
*The Team*`
  },
  {
    id: 'celebration',
    name: 'Goal Achieved',
    icon: PartyPopper,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    title: '🎉 We Did It! Funding Goal Reached!',
    content: `**AMAZING NEWS!**

Thanks to your incredible support, we've reached our funding goal! 🎊

**The Numbers:**
- Total Raised: ₹[amount]
- Supporters: [number]
- Days to Goal: [days]

**What This Means:**
[Explain what reaching the goal enables]

**What Happens Now:**
1. [Next immediate step]
2. [Timeline for deliverables]
3. [How supporters will be updated]

YOU made this happen. THANK YOU!`
  },
  {
    id: 'progress',
    name: 'Progress Update',
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: '📊 Progress Report',
    content: `**Weekly/Monthly Update**

Here's what we've been working on:

**Completed:**
- ✅ [Task 1]
- ✅ [Task 2]

**In Progress:**
- 🔄 [Current work]

**Challenges:**
- [Any obstacles and how you're addressing them]

**Coming Up:**
- [What to expect next]

Stay tuned for more updates!`
  }
];

// U-MISS-03: Draft storage key
const DRAFTS_STORAGE_KEY = 'lineup_update_drafts';

interface DraftUpdate {
  projectId: string;
  title: string;
  content: string;
  savedAt: string;
}

export default function CreatorUpdatesPage() {
  const { user } = useAuth();
  const { projects: userProjects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');

  // Use project context for global selection sync
  const { selectedProjectId: contextProjectId, setSelectedProjectId: setContextProjectId } = useProjectContext();

  // Local state for this page - initialized from context
  const [localSelectedProjectId, setLocalSelectedProjectId] = useState<string | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<FirestoreProjectUpdate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof UPDATE_TEMPLATES[0] | null>(null);

  // U-MISS-03: Draft state
  const [drafts, setDrafts] = useState<DraftUpdate[]>([]);

  // Share success modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastPostedUpdateTitle, setLastPostedUpdateTitle] = useState('');
  const [lastPostedUpdateId, setLastPostedUpdateId] = useState('');

  // Load drafts from localStorage
  useEffect(() => {
    const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (storedDrafts) {
      try {
        setDrafts(JSON.parse(storedDrafts));
      } catch {
        // Invalid JSON, reset
        localStorage.removeItem(DRAFTS_STORAGE_KEY);
      }
    }
  }, []);

  // U-BUG-01: Auto-select project from context OR first project
  useEffect(() => {
    if (!projectsLoading && userProjects.length > 0) {
      if (contextProjectId) {
        // Use context selection
        setLocalSelectedProjectId(contextProjectId);
      } else if (!localSelectedProjectId) {
        // Auto-select first project if nothing selected
        const firstProject = userProjects[0];
        setLocalSelectedProjectId(firstProject.id);
        setContextProjectId(firstProject.id);
      }
    }
  }, [contextProjectId, userProjects, projectsLoading, localSelectedProjectId, setContextProjectId]);

  // The effective selected project ID
  const selectedProjectId = localSelectedProjectId;

  // Get drafts for current project
  const projectDrafts = useMemo(() => {
    if (!selectedProjectId) return [];
    return drafts.filter(d => d.projectId === selectedProjectId);
  }, [drafts, selectedProjectId]);

  const {
    updates,
    loading: updatesLoading,
    addUpdate,
    editUpdate,
    removeUpdate,
    pinUpdate
  } = useProjectUpdates(selectedProjectId || '', user?.uid);

  // U-MISS-03: Save draft
  const saveDraft = (title: string, content: string) => {
    if (!selectedProjectId || (!title.trim() && !content.trim())) return;

    const newDraft: DraftUpdate = {
      projectId: selectedProjectId,
      title: title.trim(),
      content: content.trim(),
      savedAt: new Date().toISOString()
    };

    // Replace existing draft for this project or add new
    const existingIndex = drafts.findIndex(d => d.projectId === selectedProjectId);
    let newDrafts: DraftUpdate[];

    if (existingIndex > -1) {
      newDrafts = [...drafts];
      newDrafts[existingIndex] = newDraft;
    } else {
      newDrafts = [...drafts, newDraft];
    }

    setDrafts(newDrafts);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(newDrafts));
  };

  // U-MISS-03: Delete draft
  const deleteDraft = (projectId: string) => {
    const newDrafts = drafts.filter(d => d.projectId !== projectId);
    setDrafts(newDrafts);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(newDrafts));
  };

  // U-MISS-03: Load draft into form
  const loadDraft = (draft: DraftUpdate) => {
    setSelectedTemplate({
      id: 'draft',
      name: 'Saved Draft',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      title: draft.title,
      content: draft.content
    });
    setEditingUpdate(null);
    setShowUpdateForm(true);
    setShowTemplates(false);
  };

  // U-MISS-04: Use template
  const useTemplate = (template: typeof UPDATE_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setEditingUpdate(null);
    setShowUpdateForm(true);
    setShowTemplates(false);
  };

  const handleSubmit = async (data: { title: string; content: string; image?: string; isPinned?: boolean; sendNotification?: boolean }) => {
    if (editingUpdate) {
      await editUpdate(editingUpdate.id, data);
    } else {
      const newUpdateId = await addUpdate(data);
      // Delete draft after successful post
      if (selectedProjectId) {
        deleteDraft(selectedProjectId);
      }
      // Show share success modal
      if (newUpdateId) {
        setLastPostedUpdateTitle(data.title);
        setLastPostedUpdateId(newUpdateId);
        setShowShareModal(true);
      }
    }
    setShowUpdateForm(false);
    setEditingUpdate(null);
    setSelectedTemplate(null);
  };

  const handleFormClose = () => {
    setShowUpdateForm(false);
    setEditingUpdate(null);
    setSelectedTemplate(null);
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
      {/* Dynamic Page Title */}
      <PageTitle title="Updates" description="Share progress with your supporters" />

      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Updates</h1>
          <p className="text-gray-600">
            Share exclusive progress updates with your supporters. Only people who have backed your project can see these updates.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Show selected project info from context */}
            <div>
              {selectedProjectId ? (
                <p className="text-sm text-gray-600">
                  Posting updates for: <span className="font-semibold text-gray-900">{userProjects.find(p => p.id === selectedProjectId)?.title}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">Select a project from the navbar dropdown to post updates</p>
              )}
            </div>

            {selectedProjectId && (
              <div className="flex items-center gap-2">
                {/* U-MISS-04: Templates button */}
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Templates</span>
                </button>

                <button
                  onClick={() => {
                    setEditingUpdate(null);
                    setSelectedTemplate(null);
                    setShowUpdateForm(true);
                  }}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Post Update</span>
                </button>
              </div>
            )}
          </div>

          {/* U-MISS-04: Templates Section */}
          {showTemplates && selectedProjectId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Start Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {UPDATE_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => useTemplate(template)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-center group"
                  >
                    <div className={`p-2 rounded-lg ${template.bgColor} mb-2`}>
                      <template.icon className={`w-5 h-5 ${template.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* U-MISS-03: Drafts Section */}
          {projectDrafts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Drafts</h3>
              <div className="space-y-2">
                {projectDrafts.map((draft, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {draft.title || 'Untitled Draft'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saved {new Date(draft.savedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadDraft(draft)}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.projectId)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Updates Content */}
        {selectedProjectId ? (
          <>
            {/* Enhanced Stats Dashboard - Phase 1 */}
            <UpdatesStatsCard
              updates={updates}
              projectTitle={userProjects.find(p => p.id === selectedProjectId)?.title}
            />

            <ProjectUpdatesList
              updates={updates}
              loading={updatesLoading}
              onEdit={(update) => {
                setEditingUpdate(update);
                setSelectedTemplate(null);
                setShowUpdateForm(true);
              }}
              onDelete={removeUpdate}
              onPin={pinUpdate}
              isCreator={true}
              showInlineStats={false}
              projectId={selectedProjectId}
              creatorId={user?.uid}
              creatorAvatar={(user as any)?.profileImage || user?.photoURL || undefined}
              projectTitle={userProjects.find(p => p.id === selectedProjectId)?.title}
            />
          </>
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

      {/* Update Form Modal - with template support */}
      {selectedProjectId && (
        <ProjectUpdateForm
          isOpen={showUpdateForm}
          onClose={handleFormClose}
          projectId={selectedProjectId}
          onSubmit={handleSubmit}
          editingUpdate={editingUpdate}
          initialTitle={selectedTemplate?.title}
          initialContent={selectedTemplate?.content}
          onSaveDraft={saveDraft}
        />
      )}

      {/* Share Success Modal */}
      <ShareSuccessModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        updateTitle={lastPostedUpdateTitle}
        updateId={lastPostedUpdateId}
        projectTitle={userProjects.find(p => p.id === selectedProjectId)?.title}
      />
    </div>
  );
}
