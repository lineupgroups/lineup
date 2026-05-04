import React, { useState } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  HelpCircle, 
  X, 
  ChevronUp, 
  ChevronDown,
  PenTool,
  Heart,
  PieChart,
  Image as ImageIcon,
  CalendarDays,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { ProjectStory, PROJECT_LIMITS, calculatePlatformFee } from '../../types/projectCreation';
import { uploadImage } from '../../lib/cloudinary';
import { ImageEditor } from '../common/ImageEditor';
import { sanitizeText } from '../../utils/sanitize';
import toast from 'react-hot-toast';

const TIMELINE_COLORS = [
  { text: 'text-[#CCFF00]', border: 'border-[#CCFF00]/20', bg: 'bg-[#CCFF00]/10', hoverBorder: 'hover:border-[#CCFF00]/50' },
  { text: 'text-[#FF5B00]', border: 'border-[#FF5B00]/20', bg: 'bg-[#FF5B00]/10', hoverBorder: 'hover:border-[#FF5B00]/50' },
  { text: 'text-[#A855F7]', border: 'border-[#A855F7]/20', bg: 'bg-[#A855F7]/10', hoverBorder: 'hover:border-[#A855F7]/50' },
  { text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/20', bg: 'bg-[#3B82F6]/10', hoverBorder: 'hover:border-[#3B82F6]/50' },
  { text: 'text-[#10B981]', border: 'border-[#10B981]/20', bg: 'bg-[#10B981]/10', hoverBorder: 'hover:border-[#10B981]/50' },
  { text: 'text-[#EC4899]', border: 'border-[#EC4899]/20', bg: 'bg-[#EC4899]/10', hoverBorder: 'hover:border-[#EC4899]/50' },
];

const BREAKDOWN_COLORS = [
  { text: 'text-[#CCFF00]', border: 'border-[#CCFF00]/20', bg: 'bg-[#CCFF00]/10', hoverBorder: 'hover:border-[#CCFF00]/50' },
  { text: 'text-[#FF5B00]', border: 'border-[#FF5B00]/20', bg: 'bg-[#FF5B00]/10', hoverBorder: 'hover:border-[#FF5B00]/50' },
  { text: 'text-[#A855F7]', border: 'border-[#A855F7]/20', bg: 'bg-[#A855F7]/10', hoverBorder: 'hover:border-[#A855F7]/50' },
  { text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/20', bg: 'bg-[#3B82F6]/10', hoverBorder: 'hover:border-[#3B82F6]/50' },
  { text: 'text-[#10B981]', border: 'border-[#10B981]/20', bg: 'bg-[#10B981]/10', hoverBorder: 'hover:border-[#10B981]/50' },
  { text: 'text-[#EC4899]', border: 'border-[#EC4899]/20', bg: 'bg-[#EC4899]/10', hoverBorder: 'hover:border-[#EC4899]/50' },
];

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

  // Issue #9: Move gallery image up or down to reorder
  const moveGalleryImage = (fromIndex: number, direction: 'up' | 'down') => {
    const gallery = [...(data.gallery || [])];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

    // Bounds check
    if (toIndex < 0 || toIndex >= gallery.length) return;

    // Swap images
    [gallery[fromIndex], gallery[toIndex]] = [gallery[toIndex], gallery[fromIndex]];
    onUpdate({ gallery });
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

    const availableAmount = fundingGoal - getPlatformFee() - getTotalBreakdown();
    if (amount > (editingBreakdownIndex !== null ? availableAmount + currentBreakdown[editingBreakdownIndex].amount : availableAmount)) {
      toast.error('Amount exceeds remaining budget!');
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

    // Issue #5: Validate fund breakdown totals
    const totalBreakdown = getTotalBreakdown();
    const expectedTotal = fundingGoal - getPlatformFee();

    if (totalBreakdown !== expectedTotal) {
      toast.error(
        totalBreakdown > expectedTotal 
        ? `You are over budget by ₹${formatCurrency(totalBreakdown - expectedTotal)}!` 
        : `Please allocate the remaining ₹${formatCurrency(expectedTotal - totalBreakdown)}.`
      );
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
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-acid/60 mb-3">Step 02</p>
        <h2 className="text-4xl font-black italic uppercase tracking-tight text-brand-white">
          The <span className="text-brand-orange">Story</span>
        </h2>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="project-description" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          What are you creating? <span className="text-brand-orange">*</span>
        </label>
        <div className="relative">
          <textarea
            id="project-description"
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: sanitizeText(e.target.value) })}
            placeholder="Describe your project in detail..."
            rows={8}
            maxLength={PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH}
            className="w-full px-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors duration-200 resize-none"
          />
          <span className="absolute right-4 bottom-4 text-[10px] font-medium text-neutral-700">
            {data.description?.length || 0}/{PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      {/* Why */}
      <div>
        <label htmlFor="project-why" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Why does this matter? <span className="text-brand-orange">*</span>
        </label>
        <div className="relative">
          <textarea
            id="project-why"
            value={data.why || ''}
            onChange={(e) => onUpdate({ why: sanitizeText(e.target.value) })}
            placeholder="Why should people support this? What impact will it have?"
            rows={6}
            maxLength={PROJECT_LIMITS.MAX_WHY_LENGTH}
            className="w-full px-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors duration-200 resize-none"
          />
          <span className="absolute right-4 bottom-4 text-[10px] font-medium text-neutral-700">
            {data.why?.length || 0}/{PROJECT_LIMITS.MAX_WHY_LENGTH}
          </span>
        </div>
      </div>

      {/* Fund Breakdown */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Fund Allocation <span className="text-brand-orange">*</span>
        </label>

        <div className="bg-white/[0.02] border border-neutral-800 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Total Goal</p>
              <h4 className="text-xl font-bold text-brand-white">{formatCurrency(fundingGoal)}</h4>
            </div>
            
            <div className="md:border-x border-neutral-800 md:px-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Platform Fee (5%)</p>
              <h4 className="text-xl font-bold text-brand-orange/60">{formatCurrency(getPlatformFee())}</h4>
            </div>

            <div className="md:text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-acid/60 mb-1">Available Budget</p>
              <h4 className="text-xl font-bold text-brand-acid">{formatCurrency(fundingGoal - getPlatformFee())}</h4>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${
                getTotalBreakdown() > (fundingGoal - getPlatformFee()) ? 'text-red-500' : 'text-neutral-500'
              }`}>
                {getTotalBreakdown() > (fundingGoal - getPlatformFee()) ? 'Over Budget' : 'Remaining Allocation'}
              </p>
              <p className="text-[10px] font-bold text-brand-white">
                {formatCurrency(Math.abs(fundingGoal - getPlatformFee() - getTotalBreakdown()))}
              </p>
            </div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${
                  getTotalBreakdown() > (fundingGoal - getPlatformFee()) ? 'bg-red-500' : 'bg-brand-acid'
                }`}
                style={{ width: `${Math.min(100, (getTotalBreakdown() / (fundingGoal - getPlatformFee())) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown Input Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            value={breakdownItem}
            onChange={(e) => setBreakdownItem(e.target.value)}
            placeholder="Expense item (e.g., Marketing)"
            className="flex-1 px-5 py-3.5 bg-transparent border border-neutral-800 rounded-xl text-sm text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700 text-xs font-bold">₹</div>
              <input
                type="number"
                value={breakdownAmount}
                onChange={(e) => setBreakdownAmount(e.target.value)}
                placeholder="0"
                className="w-32 pl-8 pr-4 py-3.5 bg-transparent border border-neutral-800 rounded-xl text-sm text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={addBreakdownItem}
              className="px-6 py-3.5 bg-brand-acid text-brand-black rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-[#b3e600] transition-colors flex items-center justify-center min-w-[80px]"
            >
              {editingBreakdownIndex !== null ? 'Update' : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Breakdown Items List */}
        {data.fundBreakdown && data.fundBreakdown.length > 0 && (
          <div className="space-y-2">
            {data.fundBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/[0.02] border border-neutral-800/40 rounded-xl group transition-colors hover:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-acid/40" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">{item.item}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-bold text-brand-white">{formatCurrency(item.amount)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editBreakdownItem(index)} className="p-2 text-neutral-600 hover:text-brand-acid transition-colors">
                       <PenTool className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeBreakdownItem(index)} className="p-2 text-neutral-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Gallery <span className="text-neutral-700">— Optional, max {PROJECT_LIMITS.MAX_GALLERY_IMAGES}</span>
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.gallery?.map((image, index) => (
            <div key={`gallery-${index}`} className="relative group overflow-hidden rounded-xl border border-neutral-800 aspect-square">
              <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  {index > 0 && (
                    <button onClick={() => moveGalleryImage(index, 'up')} className="p-2 bg-white/10 rounded-lg hover:text-brand-acid transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {data.gallery && index < data.gallery.length - 1 && (
                    <button onClick={() => moveGalleryImage(index, 'down')} className="p-2 bg-white/10 rounded-lg hover:text-brand-acid transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeGalleryImage(index)}
                  className="px-3 py-1.5 bg-brand-orange text-brand-black rounded-lg text-[10px] font-bold uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
              <div className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center bg-brand-black/60 text-[10px] font-bold text-brand-white rounded-md border border-white/10">
                {index + 1}
              </div>
            </div>
          ))}

          {(!data.gallery || data.gallery.length < PROJECT_LIMITS.MAX_GALLERY_IMAGES) && (
            <button
              type="button"
              onClick={() => document.getElementById('gallery-input')?.click()}
              disabled={uploading}
              className="aspect-square border border-dashed border-neutral-800 bg-transparent rounded-xl flex flex-col items-center justify-center hover:border-neutral-600 transition-colors group"
            >
              <Upload className="w-5 h-5 text-neutral-700 group-hover:text-neutral-500 mb-2 transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Add Photo</span>
            </button>
          )}
        </div>
        <input id="gallery-input" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">
          Project Timeline <span className="text-neutral-700">— Optional</span>
        </label>

        <div className="space-y-3 mb-4">
          {data.timeline?.map((item, index) => (
            <div key={index} className="flex gap-3 items-center">
              <div className="w-20 px-3 py-3 bg-white/5 border border-white/10 text-neutral-400 font-bold uppercase text-[10px] tracking-widest rounded-xl text-center">
                Month {item.month}
              </div>
              <input
                type="text"
                value={item.milestone}
                onChange={(e) => updateTimelineItem(index, e.target.value)}
                placeholder="Target milestone..."
                className="flex-1 px-5 py-3 bg-transparent border border-neutral-800 rounded-xl text-sm text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors"
              />
              <button onClick={() => removeTimelineItem(index)} className="p-3 text-neutral-700 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTimelineItem}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-neutral-800 text-neutral-400 rounded-full text-[11px] font-bold uppercase tracking-widest hover:text-brand-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Milestone
        </button>
      </div>

      {/* Risks */}
      <div>
        <label htmlFor="project-risks" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Risks & Challenges <span className="text-neutral-700">— Optional</span>
        </label>
        <div className="relative">
          <textarea
            id="project-risks"
            value={data.risks || ''}
            onChange={(e) => onUpdate({ risks: sanitizeText(e.target.value) })}
            placeholder="Transparency builds trust. What are the potential obstacles?"
            rows={4}
            maxLength={PROJECT_LIMITS.MAX_RISKS_LENGTH}
            className="w-full px-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors duration-200 resize-none"
          />
          <span className="absolute right-4 bottom-4 text-[10px] font-medium text-neutral-700">
            {data.risks?.length || 0}/{PROJECT_LIMITS.MAX_RISKS_LENGTH}
          </span>
        </div>
      </div>

      {/* Tips */}
      <div className="border-t border-neutral-800/50 pt-8 mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600 mb-4">Quick tips</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            'Detailed allocation breakdowns build trust',
            'High-quality gallery images increase conversion',
            'Set realistic milestones for your community',
            'Address risks to show you are prepared'
          ].map((tip, i) => (
            <p key={i} className="text-[11px] text-neutral-600 flex items-start gap-2">
              <span className="text-brand-orange/40 mt-0.5">—</span>
              {tip}
            </p>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 bg-white/5 text-neutral-400 rounded-full text-[11px] font-bold uppercase tracking-wider hover:text-brand-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-3 px-8 py-3.5 bg-brand-acid text-brand-black rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-[#b3e600] transition-all active:scale-95"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Image Editor Modal Overlay */}
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

          {uploading && (
            <div className="fixed inset-0 bg-brand-black/90 backdrop-blur-sm flex items-center justify-center z-[100]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-acid border-t-transparent mx-auto mb-4"></div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-white">Uploading Story Image</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
