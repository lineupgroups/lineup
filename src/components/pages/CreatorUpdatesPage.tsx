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
    color: 'text-brand-acid',
    bgColor: 'bg-brand-acid/10',
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
    color: 'text-brand-orange',
    bgColor: 'bg-brand-orange/10',
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
    color: 'text-brand-acid',
    bgColor: 'bg-brand-acid/10',
    title: '🎉 We Did It! Funding Goal Reached!',
    content: `**AMAZING NEWS!**

Thanks to your incredible support, we've reached our funding goal! 🎊

**The Numbers:**
- Total Raised: ₹[amount]
- Supporters: [number]
- Days to Goal: [days]

**What This Means:**
- [Explain what reaching the goal enables]

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
    color: 'text-brand-orange',
    bgColor: 'bg-brand-orange/10',
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
      color: 'text-neutral-400',
      bgColor: 'bg-neutral-900',
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
      <div className="min-h-screen bg-brand-black text-brand-white font-sans flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-brand-white font-sans py-8">
      {/* Dynamic Page Title */}
      <PageTitle title="Updates" description="Share progress with your supporters" />

      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-brand-orange/10 rounded-3xl border border-brand-orange/20 shadow-[0_0_20px_rgba(255,91,0,0.1)]">
                  <Edit3 className="w-8 h-8 text-brand-orange" />
              </div>
              <span className="px-4 py-1.5 bg-brand-acid/10 text-brand-acid text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-acid/20">
                  Broadcast Mode
              </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
            Project <span className="text-brand-acid">Updates</span>
          </h1>
          <p className="text-lg text-neutral-400 font-medium mt-4 max-w-2xl">
            Share exclusive progress and build trust with your inner circle of supporters.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 mb-8 relative overflow-hidden group/actions">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-acid/5 rounded-full blur-[100px] pointer-events-none group-hover/actions:bg-brand-acid/10 transition-colors duration-700"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
            {/* Show selected project info from context */}
            <div className="flex-1">
              {!selectedProjectId && (
                <p className="text-sm font-medium text-neutral-400">Select a project from the top navigation to broadcast</p>
              )}
            </div>

            {selectedProjectId && (
              <div className="flex items-center gap-3">
                {/* U-MISS-04: Templates button */}
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`flex items-center space-x-2 px-5 py-2.5 border rounded-xl font-bold transition-all ${showTemplates 
                    ? 'bg-brand-acid text-brand-black border-brand-acid' 
                    : 'bg-white/5 border-white/10 text-brand-white hover:bg-white/10'}`}
                >
                  <Sparkles className={`w-4 h-4 ${showTemplates ? 'text-brand-black' : 'text-brand-acid'}`} />
                  <span>Templates</span>
                </button>

                <button
                  onClick={() => {
                    setEditingUpdate(null);
                    setSelectedTemplate(null);
                    setShowUpdateForm(true);
                  }}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-brand-acid/90 shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all transform hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Update</span>
                </button>
              </div>
            )}
          </div>

          {/* U-MISS-04: Templates Section */}
          {showTemplates && selectedProjectId && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-4">Quick Start Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {UPDATE_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => useTemplate(template)}
                    className="flex flex-col items-center p-4 rounded-2xl border border-white/5 bg-white/5 hover:border-brand-acid/40 hover:bg-brand-acid/10 transition-all text-center group"
                  >
                    <div className={`p-3 rounded-2xl ${template.bgColor} mb-3 group-hover:scale-110 transition-transform`}>
                      <template.icon className={`w-5 h-5 ${template.color}`} />
                    </div>
                    <span className="text-xs font-bold text-neutral-300 group-hover:text-brand-acid">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* U-MISS-03: Drafts Section */}
          {projectDrafts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-4">Saved Drafts</h3>
              <div className="space-y-3">
                {projectDrafts.map((draft, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-brand-orange/10 rounded-xl">
                        <FileText className="w-5 h-5 text-brand-orange" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-white">
                          {draft.title || 'Untitled Draft'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Saved {new Date(draft.savedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => loadDraft(draft)}
                        className="px-4 py-2 text-xs font-bold bg-brand-orange text-brand-white rounded-xl hover:bg-brand-orange/90 transition-all"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.projectId)}
                        className="px-4 py-2 text-xs font-bold text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-all"
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
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-acid/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-brand-acid/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-acid/20">
                <Edit3 className="w-6 h-6 text-brand-acid" />
              </div>
              <h3 className="text-2xl font-bold text-brand-white mb-2">
                Select a project to <span className="text-brand-acid">Broadcast</span>
              </h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto font-medium">
                Choose a project from the selector above to start sharing progress with your inner circle.
              </p>
            </div>
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
