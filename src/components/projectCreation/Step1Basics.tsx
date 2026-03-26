import React, { useState } from 'react';
import { Upload, DollarSign, Calendar, Youtube, HelpCircle, X, Tag } from 'lucide-react';
import { PROJECT_CATEGORIES, DURATION_PRESETS, PROJECT_LIMITS, validateYouTubeUrl, extractYouTubeVideoId, ProjectBasics } from '../../types/projectCreation';
import { INDIAN_STATES, getCitiesByState } from '../../data/locations';
import { uploadImage } from '../../lib/cloudinary';
import { ImageEditor } from '../common/ImageEditor';
import { sanitizeText } from '../../utils/sanitize';
import toast from 'react-hot-toast';

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Basics</h2>
        <p className="text-gray-600">Let's start with the essential information about your project</p>
      </div>

      {/* Project Title */}
      <div>
        <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          id="project-title"
          type="text"
          value={data.title || ''}
          onChange={(e) => onUpdate({ title: sanitizeText(e.target.value) })}
          placeholder="e.g., Smart Solar Lamp for Rural India"
          maxLength={PROJECT_LIMITS.MAX_TITLE_LENGTH}
          aria-describedby="title-counter"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p id="title-counter" className="text-xs text-gray-500 mt-1">
          {data.title?.length || 0}/{PROJECT_LIMITS.MAX_TITLE_LENGTH} characters
        </p>
      </div>

      {/* Tagline */}
      <div>
        <label htmlFor="project-tagline" className="block text-sm font-medium text-gray-700 mb-2">
          Tagline *
        </label>
        <input
          id="project-tagline"
          type="text"
          value={data.tagline || ''}
          onChange={(e) => onUpdate({ tagline: sanitizeText(e.target.value) })}
          placeholder="What is your project in one sentence?"
          maxLength={PROJECT_LIMITS.MAX_TAGLINE_LENGTH}
          aria-describedby="tagline-counter"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p id="tagline-counter" className="text-xs text-gray-500 mt-1">
          {data.tagline?.length || 0}/{PROJECT_LIMITS.MAX_TAGLINE_LENGTH} characters
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Category *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PROJECT_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => onUpdate({ category: category.value })}
              className={`p-4 border-2 rounded-lg transition-all text-left ${data.category === category.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
                }`}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm font-medium text-gray-900">{category.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="project-tags" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>Tags (Optional - Max {PROJECT_LIMITS.MAX_TAGS})</span>
          </div>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add tags to help people discover your project
        </p>

        {/* Tag chips */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-orange-900 focus:outline-none"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tag input */}
        {(!data.tags || data.tags.length < PROJECT_LIMITS.MAX_TAGS) && (
          <div className="flex gap-2">
            <input
              id="project-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(sanitizeText(e.target.value).toLowerCase())}
              onKeyDown={handleTagKeyDown}
              placeholder="e.g., innovation, technology, education"
              maxLength={PROJECT_LIMITS.MAX_TAG_LENGTH}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <select
            value={data.location?.state || ''}
            onChange={(e) => onUpdate({
              location: {
                state: e.target.value,
                city: ''
              }
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state.code} value={state.name}>{state.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <select
            value={data.location?.city || ''}
            onChange={(e) => onUpdate({
              location: {
                ...data.location!,
                city: e.target.value
              }
            })}
            disabled={!data.location?.state}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select city</option>
            {data.location?.state && getCitiesByState(data.location.state).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Image *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors">
          {data.coverImage ? (
            <div className="relative">
              <img
                src={data.coverImage}
                alt="Cover"
                className="w-full aspect-video object-cover rounded-lg mb-4"
              />
              <button
                type="button"
                onClick={() => document.getElementById('cover-image-input')?.click()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Change Image
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Upload your project cover image
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Recommended: 1920x1080 (16:9 ratio) • Any size supported (Cloudinary will compress)
              </p>
              <button
                type="button"
                onClick={() => document.getElementById('cover-image-input')?.click()}
                disabled={uploading}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Choose Image'}
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Video (YouTube) - Optional but Recommended
        </label>
        <div className="relative">
          <Youtube className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="url"
            value={data.videoUrl || ''}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Paste your YouTube video URL. Projects with videos get 3x more support!
        </p>

        {videoPreview && (
          <div className="mt-4">
            <iframe
              src={videoPreview}
              className="w-full aspect-video rounded-lg"
              allowFullScreen
              title="Video preview"
            />
          </div>
        )}
      </div>

      {/* Funding Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Funding Goal *
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <span className="absolute left-10 top-3 text-gray-600">₹</span>
          <input
            type="number"
            value={data.fundingGoal || ''}
            onChange={(e) => onUpdate({ fundingGoal: parseInt(e.target.value) || 0 })}
            placeholder="50000"
            min={PROJECT_LIMITS.MIN_FUNDING_GOAL}
            max={PROJECT_LIMITS.MAX_FUNDING_GOAL}
            className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Min: ₹{formatCurrency(PROJECT_LIMITS.MIN_FUNDING_GOAL)} • Max: ₹{formatCurrency(PROJECT_LIMITS.MAX_FUNDING_GOAL)}
          </p>
          {data.fundingGoal && data.fundingGoal > 0 && (
            <p className="text-sm text-orange-600 font-medium">
              Platform fee (5%): ₹{formatCurrency(Math.round(data.fundingGoal * 0.05))}
            </p>
          )}
        </div>
      </div>

      {/* Campaign Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Campaign Duration *
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onUpdate({ duration: preset.value })}
              aria-pressed={data.duration === preset.value}
              className={`p-4 border-2 rounded-lg transition-all ${data.duration === preset.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
                }`}
            >
              <Calendar className="w-5 h-5 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium text-gray-900">{preset.label}</div>
            </button>
          ))}
        </div>

        {data.duration && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Your campaign will end on: <strong>{new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-2">Tips for Success</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Projects with videos get 3x more support</li>
              <li>• Clear, eye-catching images attract more supporters</li>
              <li>• 14-30 days is the sweet spot for campaigns</li>
              <li>• Set a realistic goal - it's better to exceed than fall short</li>
              <li>• Add relevant tags to improve discoverability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
        >
          Continue to Story →
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
