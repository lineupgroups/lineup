import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { useSuccessStories } from '../../../hooks/useLandingPage';
import { createSuccessStory, updateSuccessStory, deleteSuccessStory } from '../../../lib/landingPage';
import { CreateSuccessStoryData, SuccessStory } from '../../../types/landingPage';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

export default function SuccessStoriesManager() {
  const { user } = useAuth();
  const { stories, loading } = useSuccessStories(false); // Get all stories including drafts
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateSuccessStoryData>>({
    title: '',
    subtitle: '',
    projectTitle: '',
    creatorName: '',
    amountRaised: 0,
    goal: 0,
    supportersCount: 0,
    location: { city: '', state: '' },
    category: '',
    image: '',
    excerpt: '',
    featured: false,
    order: 0,
    status: 'draft'
  });

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      if (editingId) {
        await updateSuccessStory(editingId, formData as any);
        toast.success('Success story updated!');
      } else {
        await createSuccessStory({
          ...formData,
          createdBy: user.uid
        } as CreateSuccessStoryData);
        toast.success('Success story created!');
      }
      resetForm();
      window.location.reload(); // Refresh data
    } catch (error) {
      toast.error('Failed to save');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this success story?')) return;
    
    try {
      await deleteSuccessStory(id);
      toast.success('Success story deleted!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (story: SuccessStory) => {
    setEditingId(story.id);
    setFormData(story);
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      projectTitle: '',
      creatorName: '',
      amountRaised: 0,
      goal: 0,
      supportersCount: 0,
      location: { city: '', state: '' },
      category: '',
      image: '',
      excerpt: '',
      featured: false,
      order: 0,
      status: 'draft'
    });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Success Stories</h2>
          <p className="text-gray-600 mt-1">Manage success stories displayed on landing page</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Story
        </button>
      </div>

      {/* Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Edit' : 'Create'} Success Story</h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Young Entrepreneur Raises ₹5L"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="From Idea to Reality in 30 Days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Creator Name *</label>
                  <input
                    type="text"
                    value={formData.creatorName}
                    onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount Raised *</label>
                  <input
                    type="number"
                    value={formData.amountRaised}
                    onChange={(e) => setFormData({ ...formData, amountRaised: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Goal *</label>
                  <input
                    type="number"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image URL *</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Excerpt (Short Description) *</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Brief description of the success story..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Featured</label>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  Save
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      <div className="grid gap-4">
        {stories && stories.length > 0 ? stories.map((story) => (
          <div key={story.id} className="bg-white border rounded-lg p-4 flex items-center gap-4">
            <img src={story.image} alt={story.title} className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{story.title}</h3>
              <p className="text-sm text-gray-600">{story.projectTitle}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs ${story.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {story.status}
                </span>
                {story.featured && <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">Featured</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(story)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Edit2 className="w-5 h-5 text-blue-600" />
              </button>
              <button onClick={() => handleDelete(story.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 text-gray-500">
            No success stories yet. Click "Add Story" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

