import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star } from 'lucide-react';
import { useTestimonials } from '../../../hooks/useLandingPage';
import { createTestimonial, updateTestimonial, deleteTestimonial } from '../../../lib/landingPage';
import { CreateTestimonialData, Testimonial } from '../../../types/landingPage';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TestimonialsManager() {
  const { user } = useAuth();
  const { testimonials, loading } = useTestimonials(false); // Get all including drafts
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateTestimonialData>>({
    name: '',
    role: '',
    quote: '',
    type: 'creator',
    projectTitle: '',
    amountRaised: 0,
    amountSupported: 0,
    rating: 5,
    location: { city: '', state: '' },
    photo: '',
    featured: false,
    order: 0,
    status: 'draft'
  });

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!formData.name || !formData.quote) {
      toast.error('Name and quote are required');
      return;
    }

    try {
      if (editingId) {
        await updateTestimonial(editingId, formData as any);
        toast.success('Testimonial updated!');
      } else {
        await createTestimonial(formData as CreateTestimonialData);
        toast.success('Testimonial created!');
      }
      resetForm();
      window.location.reload();
    } catch (error) {
      toast.error('Failed to save');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    
    try {
      await deleteTestimonial(id);
      toast.success('Testimonial deleted!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData(testimonial);
    setIsCreating(true);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      quote: '',
      type: 'creator',
      projectTitle: '',
      amountRaised: 0,
      amountSupported: 0,
      rating: 5,
      location: { city: '', state: '' },
      photo: '',
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
          <h2 className="text-2xl font-bold text-gray-900">Testimonials</h2>
          <p className="text-gray-600 mt-1">Manage testimonials from creators and supporters</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      {/* Form Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Edit' : 'Create'} Testimonial</h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'creator' | 'supporter' })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="creator">Creator</option>
                  <option value="supporter">Supporter</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="John Doe"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-1">Role / Title</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Founder of XYZ"
                />
              </div>

              {/* Quote */}
              <div>
                <label className="block text-sm font-medium mb-1">Quote *</label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                  placeholder="This platform changed my life..."
                  maxLength={300}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.quote?.length || 0}/300 characters</p>
              </div>

              {/* Project Title */}
              {formData.type === 'creator' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Project Title</label>
                  <input
                    type="text"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}

              {/* Amount */}
              <div className="grid grid-cols-2 gap-4">
                {formData.type === 'creator' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount Raised (₹)</label>
                    <input
                      type="number"
                      value={formData.amountRaised}
                      onChange={(e) => setFormData({ ...formData, amountRaised: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount Supported (₹)</label>
                    <input
                      type="number"
                      value={formData.amountSupported}
                      onChange={(e) => setFormData({ ...formData, amountSupported: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
                  <div className="flex gap-2 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (formData.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={formData.location?.city}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location!, city: e.target.value } })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={formData.location?.state}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location!, state: e.target.value } })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium mb-1">Photo URL</label>
                <input
                  type="text"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://example.com/photo.jpg"
                />
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
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
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

      {/* Testimonials List */}
      <div className="grid gap-4">
        {testimonials && testimonials.length > 0 ? testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-white border rounded-lg p-4 flex items-start gap-4">
            {testimonial.photo ? (
              <img src={testimonial.photo} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <span className="text-white font-bold text-xl">{testimonial.name.charAt(0)}</span>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                  {testimonial.role && <p className="text-sm text-gray-600">{testimonial.role}</p>}
                  {testimonial.location && (
                    <p className="text-xs text-gray-500">{testimonial.location.city}, {testimonial.location.state}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(testimonial)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(testimonial.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mt-2 italic">"{testimonial.quote}"</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {testimonial.rating && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating!
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <span className={`px-2 py-1 rounded text-xs ${testimonial.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {testimonial.status}
                </span>
                {testimonial.featured && <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">Featured</span>}
                <span className={`px-2 py-1 rounded text-xs ${testimonial.type === 'creator' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {testimonial.type === 'creator' ? 'Creator' : 'Supporter'}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 text-gray-500">
            No testimonials yet. Click "Add Testimonial" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
