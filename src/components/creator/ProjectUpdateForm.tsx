import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreProjectUpdate } from '../../types/firestore';
import ImageUpload from '../common/ImageUpload';
import { ImageFile } from '../../hooks/useImageUpload';
import toast from 'react-hot-toast';

interface ProjectUpdateFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSubmit: (data: { title: string; content: string; image?: string }) => Promise<void>;
  editingUpdate?: FirestoreProjectUpdate | null;
}

export default function ProjectUpdateForm({
  isOpen,
  onClose,
  projectId,
  onSubmit,
  editingUpdate
}: ProjectUpdateFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(editingUpdate?.title || '');
  const [content, setContent] = useState(editingUpdate?.content || '');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [existingImage, setExistingImage] = useState(editingUpdate?.image || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get image URL from uploaded images or existing image
      const imageUrl = images.find(img => img.status === 'completed')?.uploadResult?.secure_url || existingImage;

      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        image: imageUrl || undefined
      });

      // Reset form
      setTitle('');
      setContent('');
      setImages([]);
      setExistingImage('');
      onClose();
    } catch (error) {
      console.error('Error submitting update:', error);
      // Error is already handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setImages([]);
    setExistingImage('');
    onClose();
  };

  const handleImageUploadComplete = (uploadResults: any[]) => {
    if (uploadResults.length > 0) {
      setExistingImage(uploadResults[0].secure_url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingUpdate ? 'Edit Update' : 'Post New Update'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Keep your supporters informed about your progress
            </p>
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
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Supporters-Only Update</p>
              <p className="mt-1">Only people who have donated to your project can see this update.</p>
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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Project Milestone Reached!"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your progress, challenges, or exciting news with your supporters..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              required
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              {content.length}/2000 characters
            </p>
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

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
              <span>{isSubmitting ? 'Posting...' : (editingUpdate ? 'Update' : 'Post Update')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
