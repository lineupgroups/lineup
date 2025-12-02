import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, HelpCircle } from 'lucide-react';
import { useFAQItems } from '../../../hooks/useLandingPage';
import { createFAQItem, updateFAQItem, deleteFAQItem } from '../../../lib/landingPage';
import { CreateFAQItemData, FAQItem } from '../../../types/landingPage';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function FAQManager() {
  const { user } = useAuth();
  const { faqs, loading } = useFAQItems(false); // Get all including drafts
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateFAQItemData>>({
    question: '',
    answer: '',
    category: 'general',
    featured: false,
    order: 0,
    status: 'draft'
  });

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.question || !formData.answer) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      if (editingId) {
        await updateFAQItem(editingId, formData as any);
        toast.success('FAQ updated!');
      } else {
        await createFAQItem(formData as CreateFAQItemData);
        toast.success('FAQ created!');
      }
      resetForm();
      window.location.reload();
    } catch (error) {
      toast.error('Failed to save');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      await deleteFAQItem(id);
      toast.success('FAQ deleted!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setFormData(faq);
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      featured: false,
      order: 0,
      status: 'draft'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      creator: 'bg-orange-100 text-orange-700',
      supporter: 'bg-blue-100 text-blue-700',
      general: 'bg-gray-100 text-gray-700',
      payment: 'bg-green-100 text-green-700',
      legal: 'bg-purple-100 text-purple-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">FAQ Items</h2>
          <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add FAQ
        </button>
      </div>

      {/* Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Edit' : 'Create'} FAQ Item</h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium mb-1">Question *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="How do I start a campaign?"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-sm font-medium mb-1">Answer *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={5}
                  placeholder="Provide a detailed answer here..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="general">General</option>
                  <option value="creator">For Creators</option>
                  <option value="supporter">For Supporters</option>
                  <option value="payment">Payment</option>
                  <option value="legal">Legal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Category helps organize FAQs and enables filtering on landing page
                </p>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Show on landing page</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower = shows first</p>
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

      {/* FAQ List */}
      <div className="space-y-3">
        {faqs && faqs.length > 0 ? faqs.map((faq) => (
          <div key={faq.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(faq.category)}`}>
                    {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${faq.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {faq.status}
                  </span>
                  {faq.featured && <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">Featured</span>}
                  <span className="text-xs text-gray-500">Order: {faq.order}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">
                  <HelpCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                  {faq.question}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-2">{faq.answer}</p>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(faq)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </button>
                <button onClick={() => handleDelete(faq.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No FAQ items yet</p>
            <p className="text-sm text-gray-500 mb-4">Click "Add FAQ" to create your first FAQ item</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add FAQ
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      {faqs && faqs.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Mark FAQs as "Featured" to show them on the landing page</li>
            <li>Use clear, concise questions that users actually ask</li>
            <li>Categorize properly for better organization and filtering</li>
            <li>Keep answers informative but not too long (2-4 sentences ideal)</li>
            <li>Update FAQs based on actual support questions</li>
          </ul>
        </div>
      )}
    </div>
  );
}
