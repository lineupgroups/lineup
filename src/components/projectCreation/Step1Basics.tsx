import React, { useState } from 'react';
import { 
  Upload, 
  DollarSign, 
  Calendar, 
  Youtube, 
  HelpCircle, 
  X, 
  Tag, 
  Palette, 
  Cpu, 
  Globe, 
  GraduationCap, 
  Film, 
  Music, 
  Gamepad2, 
  Shirt, 
  Coffee, 
  Dumbbell, 
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronRight,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { DURATION_PRESETS, PROJECT_LIMITS, validateYouTubeUrl, extractYouTubeVideoId, ProjectBasics } from '../../types/projectCreation';
import { INDIAN_STATES, getCitiesByState } from '../../data/locations';
import { uploadImage } from '../../lib/cloudinary';
import { ImageEditor } from '../common/ImageEditor';
import { sanitizeText } from '../../utils/sanitize';
import toast from 'react-hot-toast';

const CATEGORIES_WITH_ICONS = [
  { value: 'art_design', label: 'Art & Design', icon: Palette },
  { value: 'technology', label: 'Technology & Innovation', icon: Cpu },
  { value: 'social_impact', label: 'Social Impact', icon: Globe },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'film_video', label: 'Film & Video', icon: Film },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'fashion', label: 'Fashion', icon: Shirt },
  { value: 'food_beverage', label: 'Food & Beverage', icon: Coffee },
  { value: 'sports_fitness', label: 'Sports & Fitness', icon: Dumbbell },
  { value: 'others', label: 'Others', icon: Sparkles }
];

interface Step1BasicsProps {
  data: Partial<ProjectBasics>;
  onUpdate: (data: Partial<ProjectBasics>) => void;
  onNext: () => void;
}

export default function Step1Basics({ data, onUpdate, onNext }: Step1BasicsProps) {
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setTempImageFile(file);
      setShowImageEditor(true);
    }
  };

  const handleImageSave = async (croppedImage: string) => {
    try {
      setUploading(true);

      // Convert base64 to file
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], tempImageFile?.name || 'cover.jpg', { type: 'image/jpeg' });

      // Upload to Cloudinary (it will handle compression)
      const result = await uploadImage(file, {
        folder: 'project-covers',
        tags: ['project', 'cover']
      });

      onUpdate({ coverImage: result.secure_url });
      setShowImageEditor(false);
      setTempImageFile(null);
      toast.success('Cover image uploaded!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    // Don't sanitize URLs - they're validated separately and encoding breaks them
    const trimmedUrl = url.trim();
    onUpdate({ videoUrl: trimmedUrl });

    if (trimmedUrl && validateYouTubeUrl(trimmedUrl)) {
      const videoId = extractYouTubeVideoId(trimmedUrl);
      if (videoId) {
        setVideoPreview(`https://www.youtube.com/embed/${videoId}`);
      }
    } else {
      setVideoPreview(null);
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (!trimmedTag) return;

    if (trimmedTag.length > PROJECT_LIMITS.MAX_TAG_LENGTH) {
      toast.error(`Tag must be ${PROJECT_LIMITS.MAX_TAG_LENGTH} characters or less`);
      return;
    }

    const currentTags = data.tags || [];
    if (currentTags.length >= PROJECT_LIMITS.MAX_TAGS) {
      toast.error(`Maximum ${PROJECT_LIMITS.MAX_TAGS} tags allowed`);
      return;
    }

    if (currentTags.includes(trimmedTag)) {
      toast.error('Tag already added');
      return;
    }

    onUpdate({ tags: [...currentTags, trimmedTag] });
    setTagInput('');
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = data.tags || [];
    onUpdate({ tags: currentTags.filter(tag => tag !== tagToRemove) });
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleNext = () => {
    // Validation
    if (!data.title?.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    if (data.title.length > PROJECT_LIMITS.MAX_TITLE_LENGTH) {
      toast.error(`Title must be less than ${PROJECT_LIMITS.MAX_TITLE_LENGTH} characters`);
      return;
    }
    if (!data.tagline?.trim()) {
      toast.error('Please enter a tagline');
      return;
    }
    if (data.tagline.length > PROJECT_LIMITS.MAX_TAGLINE_LENGTH) {
      toast.error(`Tagline must be less than ${PROJECT_LIMITS.MAX_TAGLINE_LENGTH} characters`);
      return;
    }
    if (!data.category) {
      toast.error('Please select a category');
      return;
    }
    if (!data.location?.state || !data.location?.city) {
      toast.error('Please select your location');
      return;
    }
    if (!data.coverImage) {
      toast.error('Please upload a cover image');
      return;
    }
    if (!data.fundingGoal || data.fundingGoal < PROJECT_LIMITS.MIN_FUNDING_GOAL) {
      toast.error(`Minimum funding goal is ₹${PROJECT_LIMITS.MIN_FUNDING_GOAL.toLocaleString('en-IN')}`);
      return;
    }
    if (data.fundingGoal > PROJECT_LIMITS.MAX_FUNDING_GOAL) {
      toast.error(`Maximum funding goal is ₹${PROJECT_LIMITS.MAX_FUNDING_GOAL.toLocaleString('en-IN')}`);
      return;
    }
    if (!data.duration || data.duration < PROJECT_LIMITS.MIN_DURATION_DAYS || data.duration > PROJECT_LIMITS.MAX_DURATION_DAYS) {
      toast.error(`Please select a campaign duration (${PROJECT_LIMITS.MIN_DURATION_DAYS} or ${PROJECT_LIMITS.MAX_DURATION_DAYS} days)`);
      return;
    }
    if (data.videoUrl && !validateYouTubeUrl(data.videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    onNext();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  // Custom Select Component for State/City
  const CustomSelect = ({ 
    label, 
    value, 
    options, 
    onChange, 
    placeholder, 
    disabled = false,
    searchPlaceholder = "Search..."
  }: { 
    label: string, 
    value: string, 
    options: string[], 
    onChange: (val: string) => void, 
    placeholder: string,
    disabled?: boolean,
    searchPlaceholder?: string
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
      opt.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          {label} <span className="text-brand-orange">*</span>
        </label>
        
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-5 py-4 bg-transparent border rounded-xl text-brand-white font-medium transition-all duration-200 ${
            isOpen ? 'border-brand-acid/40 ring-4 ring-brand-acid/5' : 'border-neutral-800 hover:border-neutral-700'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={value ? 'text-brand-white' : 'text-neutral-700'}>
            {value || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-[100] mt-2 w-full bg-brand-black border border-neutral-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-neutral-800/50">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2 bg-white/5 border border-neutral-800/50 rounded-lg text-sm text-brand-white placeholder-neutral-700 focus:outline-none focus:border-brand-acid/30 transition-colors"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-brand-acid hover:text-brand-black transition-all"
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-center text-xs text-neutral-600 italic">
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-acid/60 mb-3">Step 01</p>
        <h2 className="text-4xl font-black italic uppercase tracking-tight text-brand-white">
          The <span className="text-brand-orange">Basics</span>
        </h2>
      </div>

      {/* Project Title */}
      <div>
        <label htmlFor="project-title" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Project Title <span className="text-brand-orange">*</span>
        </label>
        <div className="relative">
          <input
            id="project-title"
            type="text"
            value={data.title || ''}
            onChange={(e) => onUpdate({ title: sanitizeText(e.target.value) })}
            placeholder="Give your project a name"
            maxLength={PROJECT_LIMITS.MAX_TITLE_LENGTH}
            className="w-full px-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-lg font-semibold text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors duration-200"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-neutral-700">
            {data.title?.length || 0}/{PROJECT_LIMITS.MAX_TITLE_LENGTH}
          </span>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label htmlFor="project-tagline" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Tagline <span className="text-brand-orange">*</span>
        </label>
        <div className="relative">
          <input
            id="project-tagline"
            type="text"
            value={data.tagline || ''}
            onChange={(e) => onUpdate({ tagline: sanitizeText(e.target.value) })}
            placeholder="Describe it in one line"
            maxLength={PROJECT_LIMITS.MAX_TAGLINE_LENGTH}
            className="w-full px-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-base font-medium text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors duration-200"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-neutral-700">
            {data.tagline?.length || 0}/{PROJECT_LIMITS.MAX_TAGLINE_LENGTH}
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Category <span className="text-brand-orange">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES_WITH_ICONS.map((category) => {
            const isSelected = data.category === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => onUpdate({ category: category.value })}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${isSelected
                  ? 'bg-brand-acid text-brand-black'
                  : 'bg-transparent border border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                }`}
              >
                <category.icon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="project-tags" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Tags <span className="text-neutral-700">— Optional, max {PROJECT_LIMITS.MAX_TAGS}</span>
        </label>

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-full text-[11px] font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-neutral-600 hover:text-brand-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {(!data.tags || data.tags.length < PROJECT_LIMITS.MAX_TAGS) && (
          <div className="flex gap-2">
            <input
              id="project-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(sanitizeText(e.target.value).toLowerCase())}
              onKeyDown={handleTagKeyDown}
              placeholder="Type a tag and press Enter"
              maxLength={PROJECT_LIMITS.MAX_TAG_LENGTH}
              className="flex-1 px-5 py-3 bg-transparent border border-neutral-800 rounded-xl text-sm text-brand-white placeholder-neutral-700 focus:border-brand-acid/40 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="px-5 py-3 bg-white/5 border border-neutral-800 text-neutral-400 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-brand-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomSelect 
          label="State"
          value={data.location?.state || ''}
          placeholder="Select state"
          searchPlaceholder="Search states..."
          options={INDIAN_STATES.map(s => s.name)}
          onChange={(val) => onUpdate({
            location: {
              state: val,
              city: ''
            }
          })}
        />

        <CustomSelect 
          label="City"
          value={data.location?.city || ''}
          placeholder="Select city"
          searchPlaceholder="Search cities..."
          disabled={!data.location?.state}
          options={data.location?.state ? getCitiesByState(data.location.state) : []}
          onChange={(val) => onUpdate({
            location: {
              ...data.location!,
              city: val
            }
          })}
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Cover Image <span className="text-brand-orange">*</span>
        </label>
        <div className={`relative border border-dashed rounded-2xl transition-all duration-300 overflow-hidden group ${
          data.coverImage 
          ? 'border-neutral-800 p-2' 
          : 'border-neutral-800 hover:border-brand-acid/30 p-12'
        }`}>
          {data.coverImage ? (
            <div className="relative">
              <img
                src={data.coverImage}
                alt="Cover"
                className="w-full aspect-video object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <button
                  type="button"
                  onClick={() => document.getElementById('cover-image-input')?.click()}
                  className="px-6 py-2.5 bg-brand-white text-brand-black rounded-full text-[11px] font-bold uppercase tracking-wider hover:scale-105 transition-transform"
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 text-neutral-700 group-hover:text-brand-acid/60 transition-colors mx-auto mb-4" />
              <p className="text-sm font-medium text-neutral-500 mb-1">16:9 recommended</p>
              <p className="text-[10px] text-neutral-700 mb-6">High-res images get 40% more engagement</p>
              <button
                type="button"
                onClick={() => document.getElementById('cover-image-input')?.click()}
                disabled={uploading}
                className="px-6 py-2.5 bg-white/5 border border-neutral-800 text-neutral-300 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {uploading ? 'Processing...' : 'Choose File'}
              </button>
            </div>
          )}
          <input
            id="cover-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* YouTube Video */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Video <span className="text-neutral-700">— YouTube, optional</span>
        </label>
        <div className="relative">
          <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-700" />
          <input
            type="url"
            value={data.videoUrl || ''}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full pl-12 pr-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-sm text-brand-white placeholder-neutral-700 focus:border-neutral-500 focus:outline-none transition-colors"
          />
        </div>
        <p className="text-[10px] text-neutral-700 mt-2">Projects with videos raise 300% more</p>

        {videoPreview && (
          <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800 aspect-video">
            <iframe
              src={videoPreview}
              className="w-full h-full"
              allowFullScreen
              title="Video preview"
            />
          </div>
        )}
      </div>

      {/* Funding Goal */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Funding Goal <span className="text-brand-orange">*</span>
        </label>
        <div className="relative max-w-md">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-brand-acid/60">₹</div>
          <input
            type="number"
            value={data.fundingGoal || ''}
            onChange={(e) => onUpdate({ fundingGoal: parseInt(e.target.value) || 0 })}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            placeholder="50,000"
            min={PROJECT_LIMITS.MIN_FUNDING_GOAL}
            max={PROJECT_LIMITS.MAX_FUNDING_GOAL}
            className="w-full pl-12 pr-5 py-4 bg-transparent border border-neutral-800 rounded-xl text-2xl font-bold text-brand-white placeholder-neutral-800 focus:border-brand-acid/40 focus:outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] font-medium text-neutral-700">Min ₹{formatCurrency(PROJECT_LIMITS.MIN_FUNDING_GOAL)}</span>
          <span className="text-neutral-800">·</span>
          <span className="text-[10px] font-medium text-neutral-700">Max ₹{formatCurrency(PROJECT_LIMITS.MAX_FUNDING_GOAL)}</span>
        </div>

        {data.fundingGoal && data.fundingGoal > 0 && (
          <div className="mt-4 flex items-center gap-6 text-[11px] font-medium">
            <span className="text-neutral-500">
              Platform fee (5%): <span className="text-neutral-400">₹{formatCurrency(Math.round(data.fundingGoal * 0.05))}</span>
            </span>
            <span className="text-neutral-500">
              You receive: <span className="text-brand-white">₹{formatCurrency(data.fundingGoal - Math.round(data.fundingGoal * 0.05))}</span>
            </span>
          </div>
        )}
      </div>

      {/* Campaign Duration */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Duration <span className="text-brand-orange">*</span>
        </label>

        <div className="flex gap-3">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onUpdate({ duration: preset.value })}
              aria-pressed={data.duration === preset.value}
              className={`flex-1 py-4 px-6 rounded-xl text-center transition-all duration-200 ${data.duration === preset.value
                ? 'bg-brand-acid text-brand-black'
                : 'bg-transparent border border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
              }`}
            >
              <div className="text-lg font-bold">{preset.label.split(' ')[0]}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">Days</div>
            </button>
          ))}
        </div>

        {data.duration && (
          <p className="text-[11px] text-neutral-600 mt-3">
            Ends {new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="border-t border-neutral-800/50 pt-8 mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600 mb-4">Quick tips</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            'Authentic storytelling builds the strongest community',
            'Post frequent updates to maintain momentum',
            'Rewards should feel limited, unique and high-value',
            'Early backers help you trend on discovery'
          ].map((tip, i) => (
            <p key={i} className="text-[11px] text-neutral-600 flex items-start gap-2">
              <span className="text-brand-orange/40 mt-0.5">—</span>
              {tip}
            </p>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-8">
        <button
          onClick={handleNext}
          className="group flex items-center gap-3 px-8 py-3.5 bg-brand-acid text-brand-black rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-[#b3e600] transition-all active:scale-95"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Image Editor Modal */}
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
            aspectRatio={16 / 9}
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
      )}
    </div>
  );
}
