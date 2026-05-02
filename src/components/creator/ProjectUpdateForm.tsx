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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-black rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/10 bg-brand-black/50 backdrop-blur-xl z-10">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">
              {editingUpdate ? 'Edit Broadcast' : 'Create Broadcast'}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-xs font-black italic uppercase tracking-widest text-neutral-500">
                Supporters Only Update
              </p>
              {/* Auto-save indicator */}
              {!editingUpdate && onSaveDraft && (
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  {isAutoSaving ? (
                    <>
                      <Save className="w-3 h-3 text-brand-orange animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Syncing...</span>
                    </>
                  ) : lastAutoSaved ? (
                    <>
                      <Check className="w-3 h-3 text-brand-acid" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-acid">
                        Draft Saved {lastAutoSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  ) : hasUnsavedChanges() ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Pending Changes</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-white/5"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6 text-neutral-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner - Improved Mental Model */}
          <div className="bg-[#111] border border-neutral-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl"></div>
            <div className="flex items-start space-x-4 relative z-10">
              <div className="p-3 bg-brand-acid/10 border border-brand-acid/20 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-brand-acid flex-shrink-0" />
              </div>
              <div className="flex-1 mt-1">
                <p className="text-sm font-black italic uppercase tracking-wider text-brand-acid">Broadcasting Privacy</p>
                <p className="text-brand-white/80 mt-2 leading-relaxed">
                  This update is <span className="text-brand-acid font-bold italic">Supporters-Only</span>. 
                  Only backers who have funded your project will see this exclusive content.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-black text-brand-acid text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-acid/20 shadow-[0_0_10px_rgba(204,255,0,0.1)]">
                    <Check className="w-3 h-3" /> Visible to Backers
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-black text-neutral-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-neutral-800">
                    <X className="w-3 h-3" /> Private to Others
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <label className="text-xs font-black italic uppercase tracking-[0.2em] text-neutral-500 ml-1">
              Broadcast Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="e.g., Major Project Milestone Reached!"
              className={`w-full px-5 py-4 bg-white/5 border rounded-[1.2rem] focus:ring-2 focus:ring-brand-acid focus:border-brand-acid text-brand-white placeholder-neutral-600 transition-all ${title.length > 54 ? 'border-brand-orange' : title.length > 48 ? 'border-brand-acid' : 'border-white/10'
                }`}
              required
              maxLength={60}
              disabled={isSubmitting}
            />
            {/* Phase 2: Color-coded character counter */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                Keep it short and impactful
              </p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${title.length > 54 ? 'text-brand-orange' : title.length > 48 ? 'text-brand-acid' : 'text-neutral-500'
                }`}>
                {title.length}/60
              </p>
            </div>
          </div>

          {/* Content with Rich Text Editor */}
          <div className="space-y-3">
            <label className="text-xs font-black italic uppercase tracking-[0.2em] text-neutral-500 ml-1">
              Broadcast Message
            </label>

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Share exclusive progress or behind-the-scenes content..."
              maxLength={5000}
              disabled={isSubmitting}
              rows={12}
            />
          </div>

          {/* Video Embed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-300">
                YouTube Video (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowVideoInput(!showVideoInput)}
                className={`text-sm flex items-center space-x-1 ${showVideoInput ? 'text-red-400' : 'text-brand-orange'
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
                  className="w-full px-4 py-3 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-brand-acid focus:border-brand-acid"
                  disabled={isSubmitting}
                />

                {/* U-LOG-02: Video Preview with availability check button */}
                {videoUrl && isValidYouTubeUrl(videoUrl) && (
                  <div className="space-y-2">
                    <div className="relative pt-[56.25%] bg-black rounded-2xl overflow-hidden">
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
                        <span className="text-neutral-500">Checking video availability...</span>
                      ) : videoValid === true ? (
                        <span className="text-green-400 flex items-center gap-1">
                          ✓ Video is accessible
                        </span>
                      ) : videoValid === false ? (
                        <span className="text-red-400 flex items-center gap-1">
                          ⚠ Video may not be available or is private
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {videoUrl && !isValidYouTubeUrl(videoUrl) && (
                  <p className="text-sm text-red-400">Please enter a valid YouTube URL</p>
                )}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Update Image (Optional)
            </label>

            {existingImage && (
              <div className="mb-4">
                <img
                  src={existingImage}
                  alt="Update preview"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => setExistingImage('')}
                  className="mt-2 text-sm text-red-400 hover:text-red-400"
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
          <div className="bg-brand-black rounded-2xl p-4 space-y-4">
            <h3 className="font-medium text-neutral-300 mb-2">Options</h3>

            {/* Pin Update Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pin className="w-5 h-5 text-brand-orange" />
                <div>
                  <span className="font-medium text-neutral-300">Pin this update</span>
                  <p className="text-xs text-neutral-500">Shows at top of updates list</p>
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
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-orange/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-brand-black after:border-neutral-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange/100"></div>
              </label>
            </div>

            {/* Send Notification Toggle - Coming Soon */}
            <div className="flex items-center justify-between opacity-40">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-acid/5 rounded-xl">
                  <Bell className="w-5 h-5 text-brand-acid" />
                </div>
                <div>
                  <span className="text-sm font-black italic uppercase tracking-wider text-neutral-300">Push Notifications</span>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Email all backers instantly</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-brand-acid/20 text-brand-acid rounded-full border border-brand-acid/20">
                      <Info className="w-2.5 h-2.5" />
                      Locked
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
                <div className="w-11 h-6 bg-white/5 border border-white/10 rounded-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-neutral-600 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Schedule Update Toggle - Coming Soon */}
            <div className="flex items-center justify-between opacity-40">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-acid/5 rounded-xl">
                  <Clock className="w-5 h-5 text-brand-acid" />
                </div>
                <div>
                  <span className="text-sm font-black italic uppercase tracking-wider text-neutral-300">Schedule for later</span>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Auto-post at selected time</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-brand-acid/20 text-brand-acid rounded-full border border-brand-acid/20">
                      <Info className="w-2.5 h-2.5" />
                      Locked
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
                <div className="w-11 h-6 bg-white/5 border border-white/10 rounded-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-neutral-600 after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Hidden for now since scheduling is Coming Soon */}
            {isScheduled && false && (
              <div className="grid grid-cols-2 gap-4 mt-4 ml-7 pl-4 border-l-2 border-purple-200">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-purple-500"
                    required={isScheduled}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-700 rounded-2xl focus:ring-2 focus:ring-purple-500"
                    required={isScheduled}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-2 text-sm text-neutral-500 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>The update will be automatically posted at the scheduled time (IST).</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-8 sticky bottom-0 bg-brand-black p-8 -mx-8 -mb-6 z-10">
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
                  className="px-6 py-3 border border-brand-orange/40 text-brand-orange bg-brand-orange/10 rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-brand-orange hover:text-brand-black transition-all disabled:opacity-50"
                >
                  Save Draft
                </button>
              )}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Phase 3: Preview Button */}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 text-brand-acid rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-brand-acid hover:text-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-8 py-3 text-neutral-500 font-black italic uppercase tracking-widest text-[10px] hover:text-brand-white transition-colors"
                disabled={isSubmitting}
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-10 py-3 bg-brand-acid text-brand-black rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-brand-acid shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                <span>
                  {isSubmitting
                    ? (isScheduled ? 'Scheduling...' : 'Broadcasting...')
                    : (editingUpdate
                      ? 'Update Broadcast'
                      : (isScheduled ? 'Schedule Broadcast' : 'Post Broadcast')
                    )
                  }
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
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
