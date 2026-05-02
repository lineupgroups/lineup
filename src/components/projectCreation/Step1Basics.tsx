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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-brand-white mb-3">
          Project <span className="text-brand-orange">Basics</span>
        </h2>
        <p className="text-neutral-400 font-bold uppercase tracking-[0.2em] text-[10px]">Essential information for your campaign</p>
      </div>

      {/* Project Title */}
      <div className="group">
        <label htmlFor="project-title" className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-acid" />
          Project Title *
        </label>
        <div className="relative">
          <input
            id="project-title"
            type="text"
            value={data.title || ''}
            onChange={(e) => onUpdate({ title: sanitizeText(e.target.value) })}
            placeholder="e.g., Smart Solar Lamp for Rural India"
            maxLength={PROJECT_LIMITS.MAX_TITLE_LENGTH}
            className="w-full px-6 py-5 bg-brand-black border-2 border-neutral-800 rounded-2xl text-xl font-black text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-acid/10 focus:border-brand-acid transition-all duration-300"
          />
          <div className="absolute right-4 bottom-[-1.5rem] text-[10px] font-black italic uppercase tracking-widest text-brand-orange">
            {data.title?.length || 0}/{PROJECT_LIMITS.MAX_TITLE_LENGTH} CHARS
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="group">
        <label htmlFor="project-tagline" className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-orange" />
          Tagline *
        </label>
        <div className="relative">
          <input
            id="project-tagline"
            type="text"
            value={data.tagline || ''}
            onChange={(e) => onUpdate({ tagline: sanitizeText(e.target.value) })}
            placeholder="What is your project in one sentence?"
            maxLength={PROJECT_LIMITS.MAX_TAGLINE_LENGTH}
            className="w-full px-6 py-5 bg-brand-black border-2 border-neutral-800 rounded-2xl text-lg font-medium text-brand-white placeholder-neutral-700 focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all duration-300"
          />
          <div className="absolute right-4 bottom-[-1.5rem] text-[10px] font-black italic uppercase tracking-widest text-brand-orange">
            {data.tagline?.length || 0}/{PROJECT_LIMITS.MAX_TAGLINE_LENGTH} CHARS
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4">
          Category *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES_WITH_ICONS.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => onUpdate({ category: category.value })}
              className={`group relative p-5 border-2 rounded-2xl transition-all duration-500 text-left overflow-hidden ${data.category === category.value
                ? 'border-brand-orange bg-brand-orange/10 shadow-[0_0_25px_rgba(255,91,0,0.15)]'
                : 'border-neutral-800/30 bg-gradient-to-b from-[#121212] to-brand-black hover:border-neutral-700/50 hover:from-[#181818] hover:to-[#0f0f0f]'
                }`}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-brand-orange/0 group-hover:bg-brand-orange/[0.02] transition-colors" />
              
              <div className={`p-2.5 w-fit rounded-xl mb-3 transition-all duration-300 ${
                data.category === category.value 
                ? 'bg-brand-orange/20 text-brand-orange scale-110 shadow-[0_0_15px_rgba(255,91,0,0.2)]' 
                : 'bg-neutral-800/50 text-neutral-400 group-hover:text-neutral-200 group-hover:bg-neutral-700/50'
              }`}>
                <category.icon className="w-6 h-6" />
              </div>
              
              <div className={`text-[10px] font-black italic uppercase tracking-[0.15em] leading-tight transition-colors ${
                data.category === category.value 
                ? 'text-brand-white' 
                : 'text-neutral-400 group-hover:text-neutral-200'
              }`}>
                {category.label}
              </div>

              {/* Selection Indicator */}
              {data.category === category.value && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-brand-orange rounded-full animate-pulse shadow-[0_0_10px_rgba(255,91,0,1)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="project-tags" className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-orange" />
          Tags (Optional - Max {PROJECT_LIMITS.MAX_TAGS})
        </label>

        <div className="bg-[#111] border-2 border-neutral-800 rounded-3xl p-5">
          {/* Tag chips */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-acid/10 text-brand-acid border border-brand-acid/20 rounded-xl text-xs font-black italic uppercase tracking-widest"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-brand-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag input */}
          {(!data.tags || data.tags.length < PROJECT_LIMITS.MAX_TAGS) && (
            <div className="flex gap-3">
              <input
                id="project-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(sanitizeText(e.target.value).toLowerCase())}
                onKeyDown={handleTagKeyDown}
                placeholder="e.g., innovation, technology, education"
                maxLength={PROJECT_LIMITS.MAX_TAG_LENGTH}
                className="flex-1 px-5 py-3 bg-brand-black border-2 border-neutral-800 rounded-xl text-brand-white placeholder-neutral-700 focus:border-brand-acid transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-6 py-3 bg-brand-orange text-brand-black rounded-xl font-black italic uppercase tracking-widest hover:bg-[#ff7b33] transition-all disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}
          <p className="text-[10px] font-medium text-neutral-600 mt-3">
            Press Enter or comma to add. Add tags to help people discover your project.
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-acid" />
            State *
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-brand-orange transition-colors" />
            <select
              value={data.location?.state || ''}
              onChange={(e) => onUpdate({
                location: {
                  state: e.target.value,
                  city: ''
                }
              })}
              className="w-full pl-12 pr-10 py-4 bg-brand-black border-2 border-neutral-800 rounded-2xl text-brand-white font-medium focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all appearance-none cursor-pointer"
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.name}>{state.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-neutral-500" />
            </div>
          </div>
        </div>

        <div className="relative group">
          <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-acid" />
            City *
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-brand-acid transition-colors" />
            <select
              value={data.location?.city || ''}
              onChange={(e) => onUpdate({
                location: {
                  ...data.location!,
                  city: e.target.value
                }
              })}
              disabled={!data.location?.state}
              className="w-full pl-12 pr-10 py-4 bg-brand-black border-2 border-neutral-800 rounded-2xl text-brand-white font-medium focus:ring-4 focus:ring-brand-acid/10 focus:border-brand-acid transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:bg-neutral-900 disabled:cursor-not-allowed"
            >
              <option value="">Select city</option>
              {data.location?.state && getCitiesByState(data.location.state).map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-neutral-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-orange" />
          Cover Image *
        </label>
        <div className={`relative border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-500 overflow-hidden group ${
          data.coverImage 
          ? 'border-neutral-800 bg-[#111]' 
          : 'border-neutral-800 bg-brand-black hover:border-brand-acid hover:bg-brand-acid/[0.02]'
        }`}>
          {data.coverImage ? (
            <div className="relative">
              <img
                src={data.coverImage}
                alt="Cover"
                className="w-full aspect-video object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[1.5rem]">
                <button
                  type="button"
                  onClick={() => document.getElementById('cover-image-input')?.click()}
                  className="px-8 py-3 bg-brand-white text-brand-black rounded-2xl font-black italic uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Replace Image
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10">
              <div className="mx-auto w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-acid/20 transition-all duration-300">
                <Upload className="w-8 h-8 text-neutral-500 group-hover:text-brand-acid" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-wider text-brand-white mb-2">
                Project Cover
              </h3>
              <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm">
                Recommended 16:9 ratio. High resolution images get 40% more engagement.
              </p>
              <button
                type="button"
                onClick={() => document.getElementById('cover-image-input')?.click()}
                disabled={uploading}
                className="px-10 py-4 bg-brand-acid text-brand-black rounded-2xl font-black italic uppercase tracking-widest hover:scale-105 hover:bg-[#b3e600] transition-all disabled:opacity-50"
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
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
          <Youtube className="w-4 h-4 text-brand-acid" />
          Project Video (YouTube)
        </label>
        <div className="bg-[#111] border-2 border-neutral-800 rounded-3xl p-5">
          <div className="relative group">
            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-700 group-focus-within:text-brand-acid transition-colors" />
            <input
              type="url"
              value={data.videoUrl || ''}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-14 pr-6 py-4 bg-brand-black border-2 border-neutral-800 rounded-2xl text-brand-white placeholder-neutral-700 focus:border-brand-acid transition-all"
            />
          </div>
          <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600 mt-3">
            Projects with videos get 300% more funding. Highly recommended.
          </p>

          {videoPreview && (
            <div className="mt-6 relative rounded-2xl overflow-hidden border-2 border-neutral-800 bg-brand-black aspect-video">
              <iframe
                src={videoPreview}
                className="w-full h-full"
                allowFullScreen
                title="Video preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Funding Goal */}
      <div>
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-orange" />
          Funding Goal *
        </label>
        <div className="bg-[#111] border-2 border-neutral-800 rounded-[2rem] p-8 text-center">
          <div className="relative max-w-sm mx-auto">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black italic text-brand-acid">
              ₹
            </div>
            <input
              type="number"
              value={data.fundingGoal || ''}
              onChange={(e) => onUpdate({ fundingGoal: parseInt(e.target.value) || 0 })}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="50,000"
              min={PROJECT_LIMITS.MIN_FUNDING_GOAL}
              max={PROJECT_LIMITS.MAX_FUNDING_GOAL}
              className="w-full pl-14 pr-6 py-6 bg-brand-black border-2 border-neutral-800 rounded-[1.5rem] text-4xl font-black italic text-brand-white placeholder-neutral-800 focus:border-brand-acid transition-all text-center"
            />
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
            <div className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 bg-neutral-900 px-4 py-2 rounded-full">
              MIN: ₹{formatCurrency(PROJECT_LIMITS.MIN_FUNDING_GOAL)}
            </div>
            <div className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 bg-neutral-900 px-4 py-2 rounded-full">
              MAX: ₹{formatCurrency(PROJECT_LIMITS.MAX_FUNDING_GOAL)}
            </div>
          </div>

          {data.fundingGoal && data.fundingGoal > 0 && (
            <div className="mt-6 p-4 bg-brand-acid/5 border border-brand-acid/10 rounded-2xl">
              <p className="text-sm font-black italic uppercase tracking-wider text-brand-acid">
                Platform fee (5%): ₹{formatCurrency(Math.round(data.fundingGoal * 0.05))}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest font-bold">
                You will receive approx ₹{formatCurrency(data.fundingGoal - Math.round(data.fundingGoal * 0.05))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Duration */}
      <div>
        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-acid" />
          Campaign Duration *
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onUpdate({ duration: preset.value })}
              aria-pressed={data.duration === preset.value}
              className={`relative p-5 border-2 rounded-2xl transition-all duration-500 overflow-hidden ${data.duration === preset.value
                ? 'border-brand-orange bg-brand-orange/10 shadow-[0_0_30px_rgba(255,91,0,0.1)] scale-[1.02]'
                : 'border-neutral-800/30 bg-gradient-to-b from-[#121212] to-brand-black hover:border-neutral-700/50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-xl font-black italic uppercase tracking-wider transition-colors ${data.duration === preset.value ? 'text-brand-white' : 'text-neutral-500'}`}>
                    {preset.label.split(' ')[0]} DAYS
                  </div>
                  <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                    {preset.value === 30 ? 'RECOMMENDED REACH' : 'FAST TRACK'}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${data.duration === preset.value ? 'bg-brand-orange text-brand-black shadow-[0_0_15px_rgba(255,91,0,0.4)]' : 'bg-neutral-900 text-neutral-700'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {data.duration && (
          <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-brand-acid/10 rounded-lg">
              <Calendar className="w-4 h-4 text-brand-acid" />
            </div>
            <p className="text-xs font-black italic uppercase tracking-wider text-brand-white">
              Campaign Ends: <span className="text-brand-acid ml-1">{new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-[#111] border-2 border-neutral-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-32 h-32 text-brand-orange" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-orange text-brand-black rounded-2xl shadow-[0_0_15px_rgba(255,91,0,0.4)]">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-wider text-brand-white">Tips for Success</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Authentic storytelling builds the strongest community
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Post frequent updates to maintain momentum and trust
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Rewards should feel limited, unique and high-value
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                Secure early backers to trend on the discovery page
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-12 border-t-2 border-neutral-800">
        <button
          onClick={handleNext}
          className="group flex items-center gap-4 px-12 py-5 bg-brand-orange text-brand-black rounded-[1.5rem] font-black italic uppercase tracking-widest hover:bg-[#ff7b33] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,91,0,0.3)] transition-all duration-300 active:scale-95"
        >
          <span>Continue to Story</span>
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
