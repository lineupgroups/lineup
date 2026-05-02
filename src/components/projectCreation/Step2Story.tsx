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
  { text: 'text-[#CCFF00]', border: 'border-[#CCFF00]/20', bg: 'bg-[#CCFF00]/10', glow: 'shadow-[0_0_15px_rgba(204,255,0,0.1)]', hoverBorder: 'hover:border-[#CCFF00]/50' },
  { text: 'text-[#FF5B00]', border: 'border-[#FF5B00]/20', bg: 'bg-[#FF5B00]/10', glow: 'shadow-[0_0_15px_rgba(255,91,0,0.1)]', hoverBorder: 'hover:border-[#FF5B00]/50' },
  { text: 'text-[#A855F7]', border: 'border-[#A855F7]/20', bg: 'bg-[#A855F7]/10', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]', hoverBorder: 'hover:border-[#A855F7]/50' },
  { text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/20', bg: 'bg-[#3B82F6]/10', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]', hoverBorder: 'hover:border-[#3B82F6]/50' },
  { text: 'text-[#10B981]', border: 'border-[#10B981]/20', bg: 'bg-[#10B981]/10', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]', hoverBorder: 'hover:border-[#10B981]/50' },
  { text: 'text-[#EC4899]', border: 'border-[#EC4899]/20', bg: 'bg-[#EC4899]/10', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.1)]', hoverBorder: 'hover:border-[#EC4899]/50' },
];

const BREAKDOWN_COLORS = [
  { text: 'text-[#CCFF00]', border: 'border-[#CCFF00]/20', bg: 'bg-[#CCFF00]/10', glow: 'shadow-[0_0_15px_rgba(204,255,0,0.1)]', hoverBorder: 'hover:border-[#CCFF00]/50' },
  { text: 'text-[#FF5B00]', border: 'border-[#FF5B00]/20', bg: 'bg-[#FF5B00]/10', glow: 'shadow-[0_0_15px_rgba(255,91,0,0.1)]', hoverBorder: 'hover:border-[#FF5B00]/50' },
  { text: 'text-[#A855F7]', border: 'border-[#A855F7]/20', bg: 'bg-[#A855F7]/10', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]', hoverBorder: 'hover:border-[#A855F7]/50' },
  { text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/20', bg: 'bg-[#3B82F6]/10', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]', hoverBorder: 'hover:border-[#3B82F6]/50' },
  { text: 'text-[#10B981]', border: 'border-[#10B981]/20', bg: 'bg-[#10B981]/10', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]', hoverBorder: 'hover:border-[#10B981]/50' },
  { text: 'text-[#EC4899]', border: 'border-[#EC4899]/20', bg: 'bg-[#EC4899]/10', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.1)]', hoverBorder: 'hover:border-[#EC4899]/50' },
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
    const tolerance = expectedTotal * 0.1; // 10% tolerance

    if (Math.abs(totalBreakdown - expectedTotal) > tolerance) {
      toast.error(
        `Fund breakdown total (₹${formatCurrency(totalBreakdown)}) should be close to goal minus platform fee (₹${formatCurrency(expectedTotal)}). Please adjust your breakdown.`
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
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-brand-white mb-3">
          Project <span className="text-brand-orange">Story</span>
        </h2>
        <p className="text-neutral-400 font-bold uppercase tracking-[0.2em] text-[10px]">
          Tell your story and explain how you'll use the funds
        </p>
      </div>

      <div className="group">
        <label htmlFor="project-description" className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-3 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-brand-acid" />
          What are you creating? *
        </label>
        <div className="relative">
          <textarea
            id="project-description"
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: sanitizeText(e.target.value) })}
            placeholder="Describe your project in detail. What is it? Who is it for? What problem does it solve?"
            rows={8}
            maxLength={PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH}
            aria-describedby="description-counter"
            className="w-full px-6 py-5 bg-brand-black border-2 border-neutral-800 rounded-2xl text-lg font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-acid/10 focus:border-brand-acid transition-all duration-300 resize-none"
          />
          <div className="absolute right-4 bottom-[-1.5rem] text-[10px] font-black italic uppercase tracking-widest text-brand-orange">
            {data.description?.length || 0}/{PROJECT_LIMITS.MAX_DESCRIPTION_LENGTH} CHARS
          </div>
        </div>
      </div>

      {/* Why does this matter */}
      <div className="group">
        <label htmlFor="project-why" className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-brand-orange" />
          Why does this matter? *
        </label>
        <div className="relative">
          <textarea
            id="project-why"
            value={data.why || ''}
            onChange={(e) => onUpdate({ why: sanitizeText(e.target.value) })}
            placeholder="Why should people support this? What impact will it have? Why now?"
            rows={6}
            maxLength={PROJECT_LIMITS.MAX_WHY_LENGTH}
            aria-describedby="why-counter"
            className="w-full px-6 py-5 bg-brand-black border-2 border-neutral-800 rounded-2xl text-lg font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all duration-300 resize-none"
          />
          <div className="absolute right-4 bottom-[-1.5rem] text-[10px] font-black italic uppercase tracking-widest text-brand-orange">
            {data.why?.length || 0}/{PROJECT_LIMITS.MAX_WHY_LENGTH} CHARS
          </div>
        </div>
      </div>

      {/* Fund Breakdown */}
      <div className="group">
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-brand-acid" />
          How will you use the funds? *
        </label>

        <div className="bg-[#0a0a0a] border-2 border-neutral-800/50 rounded-[1.5rem] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <input
              type="text"
              value={breakdownItem}
              onChange={(e) => setBreakdownItem(e.target.value)}
              placeholder="e.g., Development, Marketing"
              className="flex-1 px-5 py-3.5 bg-brand-black border-2 border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-acid/10 focus:border-brand-acid transition-all duration-300"
            />
            <div className="flex gap-3">
              <input
                type="number"
                value={breakdownAmount}
                onChange={(e) => setBreakdownAmount(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                placeholder="Amount"
                className="w-36 px-5 py-3.5 bg-brand-black border-2 border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-acid/10 focus:border-brand-acid transition-all duration-300"
              />
              <button
                type="button"
                onClick={addBreakdownItem}
                className="px-6 py-3.5 bg-brand-acid text-brand-black rounded-xl font-black italic uppercase tracking-widest hover:bg-[#b3e600] hover:scale-105 transition-all duration-300 active:scale-95"
              >
                {editingBreakdownIndex !== null ? 'Update' : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {
          data.fundBreakdown && data.fundBreakdown.length > 0 && (
            <div className="space-y-3 mb-6">
              {data.fundBreakdown.map((item, index) => {
                const color = BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
                return (
                  <div key={index} className={`flex items-center justify-between p-4 bg-[#0a0a0a] border-2 border-neutral-800/50 rounded-xl group/item ${color.hoverBorder} transition-colors ${color.glow}`}>
                    <div className="flex-1">
                      <span className={`font-black italic uppercase tracking-wider ${color.text}`}>{item.item}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="font-bold text-base text-brand-white">{formatCurrency(item.amount)}</span>
                      <button onClick={() => editBreakdownItem(index)} className={`text-neutral-600 ${color.text} transition-colors font-bold uppercase tracking-widest text-[10px]`}>
                        Edit
                      </button>
                      <button onClick={() => removeBreakdownItem(index)} className="text-neutral-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between p-5 bg-brand-acid/5 border-2 border-brand-acid/20 rounded-2xl">
                <span className="font-black italic uppercase tracking-wider text-brand-acid">Platform Fee (5%)</span>
                <span className="font-bold text-brand-white text-lg">{formatCurrency(getPlatformFee())}</span>
              </div>

              <div className="flex items-center justify-between p-6 bg-brand-acid text-brand-black rounded-[1.5rem] shadow-[0_0_30px_rgba(204,255,0,0.15)]">
                <span className="font-black italic uppercase tracking-widest text-xl">Total Goal</span>
                <span className="font-black italic text-2xl">{formatCurrency(fundingGoal)}</span>
              </div>

              {getTotalBreakdown() !== fundingGoal - getPlatformFee() && (
                <p className="text-xs font-bold uppercase tracking-widest text-brand-acid mt-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Breakdown total (₹{formatCurrency(getTotalBreakdown())}) should match goal minus platform fee (₹{formatCurrency(fundingGoal - getPlatformFee())})
                </p>
              )}
            </div>
          )
        }
      </div>

      {/* Gallery */}
      <div className="group">
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-orange" />
          Project Gallery (Max {PROJECT_LIMITS.MAX_GALLERY_IMAGES})
          <span className="text-neutral-600 text-[10px] tracking-widest ml-2">- Optional</span>
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-4">
          {data.gallery?.map((image, index) => (
            <div key={`gallery-${index}`} className="relative group/image overflow-hidden rounded-[1.5rem] border-2 border-neutral-800">
              <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-36 object-cover" />
              <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity" />
              
              {/* Reorder buttons */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, 'up')}
                    className="p-1.5 bg-brand-black text-brand-white rounded-lg shadow-lg hover:text-brand-acid transition-colors"
                    aria-label={`Move image ${index + 1} up`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {data.gallery && index < data.gallery.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, 'down')}
                    className="p-1.5 bg-brand-black text-brand-white rounded-lg shadow-lg hover:text-brand-acid transition-colors"
                    aria-label={`Move image ${index + 1} down`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Delete button */}
              <button
                 type="button"
                 onClick={() => removeGalleryImage(index)}
                 className="absolute top-3 right-3 p-2 bg-brand-orange text-brand-black rounded-full opacity-0 group-hover/image:opacity-100 hover:scale-110 transition-all"
                 aria-label={`Remove image ${index + 1}`}
               >
                 <X className="w-4 h-4" />
               </button>
               {/* Position indicator */}
               <div className="absolute bottom-3 left-3 w-6 h-6 flex items-center justify-center bg-brand-orange text-brand-black text-xs font-black italic rounded-full">
                 {index + 1}
               </div>
            </div>
          ))}

          {(!data.gallery || data.gallery.length < PROJECT_LIMITS.MAX_GALLERY_IMAGES) && (
            <button
              type="button"
              onClick={() => document.getElementById('gallery-input')?.click()}
              disabled={uploading}
              className="h-36 border-2 border-dashed border-neutral-800 bg-[#0f0f0f] rounded-[1.5rem] flex flex-col items-center justify-center hover:border-brand-acid hover:bg-brand-acid/5 transition-all duration-300 group/btn"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mb-3 group-hover/btn:bg-brand-acid/20 transition-colors">
                <Upload className="w-5 h-5 text-neutral-500 group-hover/btn:text-brand-acid transition-colors" />
              </div>
              <span className="text-xs font-black italic uppercase tracking-widest text-neutral-500 group-hover/btn:text-brand-white transition-colors">Add Image</span>
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

        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-3">
          Add photos, mockups, prototypes, or infographics. {data.gallery?.length || 0}/{PROJECT_LIMITS.MAX_GALLERY_IMAGES} IMAGES
        </p>
      </div>

      {/* Timeline */}
      <div className="group">
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-brand-acid" />
          Project Timeline
          <span className="text-neutral-600 text-[10px] tracking-widest ml-2">- Optional</span>
        </label>

        {
          data.timeline && data.timeline.length > 0 && (
            <div className="space-y-4 mb-5">
              {data.timeline.map((item, index) => {
                const color = TIMELINE_COLORS[index % TIMELINE_COLORS.length];
                return (
                  <div key={index} className={`flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#0a0a0a] border-2 border-neutral-800/50 p-3 rounded-[1.5rem] group/timeline ${color.hoverBorder} transition-colors`}>
                    <div className={`px-5 py-2.5 ${color.bg} border-2 ${color.border} ${color.text} font-black italic uppercase tracking-widest rounded-xl text-center whitespace-nowrap text-[11px] ${color.glow}`}>
                      Month {item.month}
                    </div>
                    <input
                      type="text"
                      value={item.milestone}
                      onChange={(e) => updateTimelineItem(index, e.target.value)}
                      placeholder="What will you accomplish?"
                      className="flex-1 w-full px-5 py-3 bg-brand-black border-2 border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all duration-300"
                    />
                    <button onClick={() => removeTimelineItem(index)} className="p-3 text-neutral-600 hover:text-red-500 bg-brand-black border-2 border-neutral-800 rounded-xl hover:border-red-500/50 transition-all self-end md:self-auto">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        }

        <button
          type="button"
          onClick={addTimelineItem}
          className="flex items-center gap-3 px-6 py-4 bg-[#0f0f0f] border-2 border-neutral-800 text-brand-white font-black italic uppercase tracking-widest rounded-2xl hover:border-brand-acid hover:text-brand-acid transition-colors group/btn"
        >
          <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center group-hover/btn:bg-brand-acid/20 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Risks */}
      <div className="group">
        <label htmlFor="project-risks" className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-brand-orange" />
          Risks & Challenges
          <span className="text-neutral-600 text-[10px] tracking-widest ml-2">- Optional but Recommended</span>
        </label>
        <div className="relative">
          <textarea
            id="project-risks"
            value={data.risks || ''}
            onChange={(e) => onUpdate({ risks: sanitizeText(e.target.value) })}
            placeholder="What could go wrong and how will you handle it? Being transparent builds trust."
            rows={4}
            maxLength={PROJECT_LIMITS.MAX_RISKS_LENGTH}
            aria-describedby="risks-counter"
            className="w-full px-6 py-5 bg-brand-black border-2 border-neutral-800 rounded-2xl text-lg font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all duration-300 resize-none"
          />
          <div className="absolute right-4 bottom-[-1.5rem] text-[10px] font-black italic uppercase tracking-widest text-brand-orange">
            {data.risks?.length || 0}/{PROJECT_LIMITS.MAX_RISKS_LENGTH} CHARS
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-[#111] border-2 border-neutral-800 rounded-[2rem] p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-brand-orange" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-wider text-brand-white">Story Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Be specific about how exactly the funds will be used
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Add images showing your progress, prototypes, or team
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Set realistic timelines - supporters appreciate honesty
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Address potential challenges upfront to build trust
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-12 border-t-2 border-neutral-800">
        <button
          onClick={onBack}
          className="group flex items-center gap-4 px-10 py-5 bg-[#111] border-2 border-neutral-800 text-brand-white rounded-[1.5rem] font-black italic uppercase tracking-widest hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Basics</span>
        </button>
        <button
          onClick={handleNext}
          className="group flex items-center gap-4 px-12 py-5 bg-brand-acid text-brand-black rounded-[1.5rem] font-black italic uppercase tracking-widest hover:bg-[#b3e600] hover:scale-105 hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all duration-300 active:scale-95"
        >
          <span>Continue to Verification</span>
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
              <div className="bg-[#111] rounded-2xl p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-acid mb-4"></div>
                <p className="text-neutral-300 font-medium">Uploading image...</p>
              </div>
            </div>
          )}
        </>
      )
      }
    </div>
  );
}
