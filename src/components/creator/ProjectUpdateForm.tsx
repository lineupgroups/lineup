import { useState, useEffect, useCallback } from 'react';
import {
  X, Loader, AlertCircle, Calendar, Clock, Youtube, Pin, Bell, Eye, Info, Save, Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreProjectUpdate } from '../../types/firestore';
import ImageUpload from '../common/ImageUpload';
import { ImageFile } from '../../hooks/useImageUpload';
import RichTextEditor from '../common/RichTextEditor';
import UpdatePreviewModal from './UpdatePreviewModal';
import UnsavedChangesModal from '../common/UnsavedChangesModal';
import toast from 'react-hot-toast';

interface ProjectUpdateFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSubmit: (data: {
    title: string;
    content: string;
    image?: string;
    videoUrl?: string;
    scheduledFor?: Date | null;
    isPinned?: boolean;
    sendNotification?: boolean;
  }) => Promise<void>;
  editingUpdate?: FirestoreProjectUpdate | null;
  // U-MISS-03 & U-MISS-04: Template/Draft support
  initialTitle?: string;
  initialContent?: string;
  onSaveDraft?: (title: string, content: string) => void;
}

export default function ProjectUpdateForm({
  isOpen,
  onClose,
  projectId,
  onSubmit,
  editingUpdate,
  initialTitle,
  initialContent,
  onSaveDraft
}: ProjectUpdateFormProps) {
  const { user } = useAuth();

  // U-MISS-03/04: Initialize from editing update OR template/draft
  const [title, setTitle] = useState(editingUpdate?.title || initialTitle || '');
  const [content, setContent] = useState(editingUpdate?.content || initialContent || '');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [existingImage, setExistingImage] = useState(editingUpdate?.image || '');
  const [videoUrl, setVideoUrl] = useState((editingUpdate as any)?.videoUrl || '');
  const [showVideoInput, setShowVideoInput] = useState(false);

  // U-LOG-02: YouTube video validation state
  const [videoValid, setVideoValid] = useState<boolean | null>(null);
  const [checkingVideo, setCheckingVideo] = useState(false);

  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Phase 2: Pin and Notification options
  const [isPinned, setIsPinned] = useState(false);
  const [sendNotification, setSendNotification] = useState(true); // Default to true

  // Phase 3: Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unsaved changes detection
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const initialTitleRef = editingUpdate?.title || initialTitle || '';
  const initialContentRef = editingUpdate?.content || initialContent || '';

  // Auto-save indicator state
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Check if form has been modified
  const hasUnsavedChanges = useCallback(() => {
    return title !== initialTitleRef || content !== initialContentRef || images.length > 0 || videoUrl !== '';
  }, [title, content, images.length, videoUrl, initialTitleRef, initialContentRef]);

  // Auto-save draft every 30 seconds if there are changes
  useEffect(() => {
    if (!onSaveDraft || editingUpdate) return;

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges() && title.trim()) {
        setIsAutoSaving(true);
        onSaveDraft(title, content);
        setLastAutoSaved(new Date());
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [title, content, onSaveDraft, editingUpdate, hasUnsavedChanges]);

  // U-MISS-04: Update state when template props change (for pre-filling)
  useEffect(() => {
    if (initialTitle && !editingUpdate) {
      setTitle(initialTitle);
    }
  }, [initialTitle, editingUpdate]);

  useEffect(() => {
    if (initialContent && !editingUpdate) {
      setContent(initialContent);
    }
  }, [initialContent, editingUpdate]);


  if (!isOpen) return null;

  // YouTube URL validation and extraction
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    return extractYouTubeId(url) !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (videoUrl && !isValidYouTubeUrl(videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate scheduled date/time (Note: Scheduling is coming soon - just stores the date)
      let scheduledFor: Date | null = null;
      if (isScheduled && scheduledDate && scheduledTime) {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledFor <= new Date()) {
          toast.error('Scheduled time must be in the future');
          setIsSubmitting(false);
          return;
        }
      }

      // Get image URL from uploaded images or existing image
      const imageUrl = images.find(img => img.status === 'completed')?.uploadResult?.secure_url || existingImage;

      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        image: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        scheduledFor,
        isPinned,
        sendNotification
      });

      // Reset form
      setTitle('');
      setContent('');
      setImages([]);
      setExistingImage('');
      setVideoUrl('');
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
      setIsPinned(false);
      setSendNotification(true);
      onClose();
    } catch (error) {
      console.error('Error submitting update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      closeAndReset();
    }
  };

  const closeAndReset = () => {
    setTitle('');
    setContent('');
    setImages([]);
    setExistingImage('');
    setVideoUrl('');
    setIsScheduled(false);
    setScheduledDate('');
    setScheduledTime('');
    setIsPinned(false);
    setSendNotification(true);
    setShowUnsavedModal(false);
    onClose();
  };

  const handleSaveDraftAndClose = () => {
    if (onSaveDraft && title.trim()) {
      onSaveDraft(title, content);
      toast.success('Draft saved!');
    }
    closeAndReset();
  };

  const handleImageUploadComplete = (uploadResults: any[]) => {
    if (uploadResults.length > 0) {
      setExistingImage(uploadResults[0].secure_url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingUpdate ? 'Edit Update' : 'Post New Update'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-600">
                Keep your supporters informed about your progress
              </p>
              {/* Auto-save indicator */}
              {!editingUpdate && onSaveDraft && (
                <div className="flex items-center gap-1.5">
                  {isAutoSaving ? (
                    <>
                      <Save className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                      <span className="text-xs text-orange-600">Saving...</span>
                    </>
                  ) : lastAutoSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-600">
                        Draft saved {lastAutoSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  ) : hasUnsavedChanges() ? (
                    <span className="text-xs text-gray-400">Unsaved changes</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner - Improved Mental Model */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Who can see this update?</p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Only your supporters</strong> — people who have donated to your project can see this update.
                  This creates an exclusive experience for your backers and encourages more people to support you!
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                    <Check className="w-3 h-3" /> Visible to backers
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/60 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                    <X className="w-3 h-3" /> Hidden from non-backers
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="e.g., Project Milestone Reached!"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${title.length > 54 ? 'border-red-300' : title.length > 48 ? 'border-yellow-300' : 'border-gray-300'
                }`}
              required
              maxLength={60}
              disabled={isSubmitting}
            />
            {/* Phase 2: Color-coded character counter */}
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Keep it short and engaging
              </p>
              <p className={`text-sm font-medium ${title.length > 54 ? 'text-red-600' : title.length > 48 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                {title.length}/60
              </p>
            </div>
          </div>

          {/* Content with Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Content *
            </label>

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Share your progress, challenges, or exciting news with your supporters..."
              maxLength={5000}
              disabled={isSubmitting}
              rows={10}
            />
          </div>

          {/* Video Embed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                YouTube Video (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowVideoInput(!showVideoInput)}
                className={`text-sm flex items-center space-x-1 ${showVideoInput ? 'text-red-600' : 'text-orange-600'
                  }`}
              >
                <Youtube className="w-4 h-4" />
                <span>{showVideoInput ? 'Remove' : 'Add Video'}</span>
              </button>
            </div>

            {showVideoInput && (
              <div className="space-y-3">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoValid(null); // Reset validation when URL changes
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSubmitting}
                />

                {/* U-LOG-02: Video Preview with availability check button */}
                {videoUrl && isValidYouTubeUrl(videoUrl) && (
                  <div className="space-y-2">
                    <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => {
                          // Video loaded successfully
                          setVideoValid(true);
                          setCheckingVideo(false);
                        }}
                        onError={() => {
                          setVideoValid(false);
                          setCheckingVideo(false);
                        }}
                      />
                    </div>
                    {/* Video validity indicator */}
                    <div className="flex items-center gap-2 text-sm">
                      {checkingVideo ? (
                        <span className="text-gray-500">Checking video availability...</span>
                      ) : videoValid === true ? (
                        <span className="text-green-600 flex items-center gap-1">
                          ✓ Video is accessible
                        </span>
                      ) : videoValid === false ? (
                        <span className="text-red-600 flex items-center gap-1">
                          ⚠ Video may not be available or is private
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {videoUrl && !isValidYouTubeUrl(videoUrl) && (
                  <p className="text-sm text-red-600">Please enter a valid YouTube URL</p>
                )}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Image (Optional)
            </label>

            {existingImage && (
              <div className="mb-4">
                <img
                  src={existingImage}
                  alt="Update preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setExistingImage('')}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove image
                </button>
              </div>
            )}

            {!existingImage && (
              <ImageUpload
                maxFiles={1}
                uploadFolder="lineup-updates"
                uploadTags={[user?.uid || 'anonymous', projectId, 'update']}
                onImagesChange={setImages}
                onUploadComplete={handleImageUploadComplete}
                onUploadError={(error) => {
                  console.error('Image upload error:', error);
                  toast.error('Failed to upload image');
                }}
              />
            )}
          </div>

          {/* Phase 2: Options Section */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-700 mb-2">Options</h3>

            {/* Pin Update Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pin className="w-5 h-5 text-orange-600" />
                <div>
                  <span className="font-medium text-gray-700">Pin this update</span>
                  <p className="text-xs text-gray-500">Shows at top of updates list</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Send Notification Toggle - Coming Soon */}
            <div className="flex items-center justify-between opacity-60">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-medium text-gray-700">Notify backers</span>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Send email notification to all backers</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      <Info className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="sr-only peer"
                  disabled={true}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Schedule Update Toggle - Coming Soon */}
            <div className="flex items-center justify-between opacity-60">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-medium text-gray-700">Schedule for later</span>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Auto-post at selected time</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      <Info className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="sr-only peer"
                  disabled={true}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Hidden for now since scheduling is Coming Soon */}
            {isScheduled && false && (
              <div className="grid grid-cols-2 gap-4 mt-4 ml-7 pl-4 border-l-2 border-purple-200">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required={isScheduled}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required={isScheduled}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-2 text-sm text-gray-500 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>The update will be automatically posted at the scheduled time (IST).</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {/* U-MISS-03: Save Draft button (left side) */}
            <div>
              {onSaveDraft && !editingUpdate && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveDraft(title, content);
                    toast.success('Draft saved!');
                  }}
                  disabled={isSubmitting || (!title.trim() && !content.trim())}
                  className="px-4 py-2 border border-yellow-400 text-yellow-700 bg-yellow-50 rounded-lg font-medium hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
              )}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-3">
              {/* Phase 3: Preview Button */}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="flex items-center space-x-2 px-4 py-2 border border-blue-300 text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                <span>
                  {isSubmitting
                    ? (isScheduled ? 'Scheduling...' : 'Posting...')
                    : (editingUpdate
                      ? 'Update'
                      : (isScheduled ? 'Schedule Update' : 'Post Update')
                    )
                  }
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Phase 3: Preview Modal */}
      <UpdatePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onEdit={() => setShowPreview(false)}
        onPost={async () => {
          setShowPreview(false);
          // Trigger form submission
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }}
        title={title}
        content={content}
        image={images.find(img => img.status === 'completed')?.uploadResult?.secure_url || existingImage}
        videoUrl={videoUrl}
        isScheduled={isScheduled}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        isPinned={isPinned}
        isSubmitting={isSubmitting}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onDiscard={closeAndReset}
        onSave={onSaveDraft ? handleSaveDraftAndClose : undefined}
        showSaveOption={!!onSaveDraft && !!title.trim()}
      />
    </div>
  );
}
