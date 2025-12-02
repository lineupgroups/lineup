import React, { useState } from 'react';
import { Upload, Plus, Trash2, PieChart, Calendar, HelpCircle, X } from 'lucide-react';
import { ProjectStory, PROJECT_LIMITS, calculatePlatformFee } from '../../types/projectCreation';
import { uploadImage } from '../../lib/cloudinary';
import { ImageEditor } from '../common/ImageEditor';
import toast from 'react-hot-toast';

interface Step2StoryProps {
  data: Partial<ProjectStory>;
  fundingGoal: number;
  onUpdate: (data: Partial<ProjectStory>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Story({ data, fundingGoal, onUpdate, onNext, onBack }: Step2StoryProps) {
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [editingBreakdownIndex, setEditingBreakdownIndex] = useState<number | null>(null);
  const [breakdownItem, setBreakdownItem] = useState('');
  const [breakdownAmount, setBreakdownAmount] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentGallery = data.gallery || [];
    if (currentGallery.length + files.length > PROJECT_LIMITS.MAX_GALLERY_IMAGES) {
      toast.error(`Maximum ${PROJECT_LIMITS.MAX_GALLERY_IMAGES} images allowed`);
      return;
    }

    setTempImageFile(files[0]);
    setShowImageEditor(true);
  };

  const handleImageSave = async (croppedImage: string) => {
    try {
      setUploading(true);
      
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], tempImageFile?.name || 'gallery.jpg', { type: 'image/jpeg' });
      
      const result = await uploadImage(file, {
        folder: 'project-gallery',
        tags: ['project', 'gallery']
      });
      
      const currentGallery = data.gallery || [];
      onUpdate({ gallery: [...currentGallery, result.secure_url] });
      setShowImageEditor(false);
      setTempImageFile(null);
      toast.success('Image added to gallery!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...(data.gallery || [])];
    newGallery.splice(index, 1);
    onUpdate({ gallery: newGallery });
  };

  const addBreakdownItem = () => {
    if (!breakdownItem.trim() || !breakdownAmount) {
      toast.error('Please enter both item and amount');
      return;
    }

    const amount = parseInt(breakdownAmount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const currentBreakdown = data.fundBreakdown || [];
    if (currentBreakdown.length >= PROJECT_LIMITS.MAX_FUND_BREAKDOWN_ITEMS) {
      toast.error(`Maximum ${PROJECT_LIMITS.MAX_FUND_BREAKDOWN_ITEMS} items allowed`);
      return;
    }

    if (editingBreakdownIndex !== null) {
      const newBreakdown = [...currentBreakdown];
      newBreakdown[editingBreakdownIndex] = { item: breakdownItem.trim(), amount };
      onUpdate({ fundBreakdown: newBreakdown });
      setEditingBreakdownIndex(null);
    } else {
      onUpdate({ fundBreakdown: [...currentBreakdown, { item: breakdownItem.trim(), amount }] });
    }

    setBreakdownItem('');
    setBreakdownAmount('');
  };

  const editBreakdownItem = (index: number) => {
    const item = data.fundBreakdown?.[index];
    if (item) {
      setBreakdownItem(item.item);
      setBreakdownAmount(item.amount.toString());
      setEditingBreakdownIndex(index);
    }
  };

  const removeBreakdownItem = (index: number) => {
    const newBreakdown = [...(data.fundBreakdown || [])];
    newBreakdown.splice(index, 1);
    onUpdate({ fundBreakdown: newBreakdown });
  };

  const addTimelineItem = () => {
    const currentTimeline = data.timeline || [];
    if (currentTimeline.length >= PROJECT_LIMITS.MAX_TIMELINE_ITEMS) {
      toast.error(`Maximum ${PROJECT_LIMITS.MAX_TIMELINE_ITEMS} milestones allowed`);
      return;
    }
    onUpdate({ timeline: [...currentTimeline, { month: currentTimeline.length + 1, milestone: '' }] });
  };

  const updateTimelineItem = (index: number, milestone: string) => {
    const newTimeline = [...(data.timeline || [])];
    newTimeline[index] = { ...newTimeline[index], milestone };
    onUpdate({ timeline: newTimeline });
  };

  const removeTimelineItem = (index: number) => {
    const newTimeline = [...(data.timeline || [])];
    newTimeline.splice(index, 1);
    onUpdate({ timeline: newTimeline });
  };

  const getTotalBreakdown = () => {
    return (data.fundBreakdown || []).reduce((sum, item) => sum + item.amount, 0);
  };

  const getPlatformFee = () => {
    return calculatePlatformFee(fundingGoal);
  };

  const handleNext = () => {
    if (!data.description?.trim()) {
      toast.error('Please describe what you are creating');
      return;
    }
    if (data.description.length > PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description must be less than ${PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }
    if (!data.why?.trim()) {
      toast.error('Please explain why this matters');
      return;
    }
    if (data.why.length > PROJECT_LIMITS.MAX_WHY_LENGTH) {
      toast.error(`Why section must be less than ${PROJECT_LIMITS.MAX_WHY_LENGTH} characters`);
      return;
    }
    if (!data.fundBreakdown || data.fundBreakdown.length === 0) {
      toast.error('Please add at least one fund breakdown item');
      return;
    }

    onNext();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Story</h2>
        <p className="text-gray-600">Tell your story and explain how you'll use the funds</p>
      </div>

      {/* What are you creating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What are you creating? *
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe your project in detail. What is it? Who is it for? What problem does it solve?"
          rows={8}
          maxLength={PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.description?.length || 0}/{PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH} characters
        </p>
      </div>

      {/* Why does this matter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Why does this matter? *
        </label>
        <textarea
          value={data.why || ''}
          onChange={(e) => onUpdate({ why: e.target.value })}
          placeholder="Why should people support this? What impact will it have? Why now?"
          rows={6}
          maxLength={PROJECT_LIMITS.MAX_WHY_LENGTH}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.why?.length || 0}/{PROJECT_LIMITS.MAX_WHY_LENGTH} characters
        </p>
      </div>

      {/* Fund Breakdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How will you use the funds? *
        </label>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <input
              type="text"
              value={breakdownItem}
              onChange={(e) => setBreakdownItem(e.target.value)}
              placeholder="e.g., Materials, Marketing"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={breakdownAmount}
                onChange={(e) => setBreakdownAmount(e.target.value)}
                placeholder="Amount"
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={addBreakdownItem}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                {editingBreakdownIndex !== null ? 'Update' : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {data.fundBreakdown && data.fundBreakdown.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.fundBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{item.item}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  <button onClick={() => editBreakdownItem(index)} className="text-blue-600 hover:text-blue-700">
                    Edit
                  </button>
                  <button onClick={() => removeBreakdownItem(index)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="font-semibold text-orange-900">Platform Fee (5%)</span>
              <span className="font-bold text-orange-900">{formatCurrency(getPlatformFee())}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <span className="font-bold text-white text-lg">Total Goal</span>
              <span className="font-bold text-white text-lg">{formatCurrency(fundingGoal)}</span>
            </div>
            
            {getTotalBreakdown() !== fundingGoal - getPlatformFee() && (
              <p className="text-sm text-amber-600">
                ⚠️ Breakdown total (₹{formatCurrency(getTotalBreakdown())}) should match goal minus platform fee (₹{formatCurrency(fundingGoal - getPlatformFee())})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Project Gallery (Max {PROJECT_LIMITS.MAX_GALLERY_IMAGES} images) - Optional
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {data.gallery?.map((image, index) => (
            <div key={index} className="relative group">
              <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
              <button
                onClick={() => removeGalleryImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {(!data.gallery || data.gallery.length < PROJECT_LIMITS.MAX_GALLERY_IMAGES) && (
            <button
              type="button"
              onClick={() => document.getElementById('gallery-input')?.click()}
              disabled={uploading}
              className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-500 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add Image</span>
            </button>
          )}
        </div>
        
        <input
          id="gallery-input"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <p className="text-xs text-gray-500">
          Add photos, mockups, prototypes, or infographics. {data.gallery?.length || 0}/{PROJECT_LIMITS.MAX_GALLERY_IMAGES} images
        </p>
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Project Timeline - Optional
        </label>
        
        {data.timeline && data.timeline.length > 0 && (
          <div className="space-y-3 mb-4">
            {data.timeline.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 px-3 py-2 bg-orange-100 text-orange-900 font-medium rounded-lg text-center">
                  Month {item.month}
                </div>
                <input
                  type="text"
                  value={item.milestone}
                  onChange={(e) => updateTimelineItem(index, e.target.value)}
                  placeholder="What will you accomplish?"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <button onClick={() => removeTimelineItem(index)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button
          type="button"
          onClick={addTimelineItem}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Risks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Risks & Challenges - Optional but Recommended
        </label>
        <textarea
          value={data.risks || ''}
          onChange={(e) => onUpdate({ risks: e.target.value })}
          placeholder="What could go wrong and how will you handle it? Being transparent builds trust."
          rows={4}
          maxLength={PROJECT_LIMITS.MAX_RISKS_LENGTH}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.risks?.length || 0}/{PROJECT_LIMITS.MAX_RISKS_LENGTH} characters
        </p>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Story Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about how funds will be used</li>
              <li>• Add images showing your progress or prototypes</li>
              <li>• Set realistic timelines - supporters appreciate honesty</li>
              <li>• Address potential challenges upfront</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600"
        >
          Continue to Verification →
        </button>
      </div>

      {showImageEditor && tempImageFile && (
        <>
          <ImageEditor
            isOpen={showImageEditor}
            imageFile={tempImageFile}
            onSave={handleImageSave}
            onClose={() => {
              setShowImageEditor(false);
              setTempImageFile(null);
            }}
            aspectRatio={4 / 3}
          />
          
          {/* Upload Loading Overlay */}
          {uploading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
              <div className="bg-white rounded-lg p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-gray-700 font-medium">Uploading image...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
