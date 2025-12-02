import { useState, useCallback, useRef } from 'react';
import { uploadImage, UploadResult, UploadOptions } from '../lib/cloudinary';
import { createImagePreview, revokeImagePreview } from '../utils/imageUtils';
import toast from 'react-hot-toast';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  uploadResult?: UploadResult;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ImageUploadOptions {
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  autoUpload?: boolean;
  createVariants?: boolean;
}

export interface UseImageUploadReturn {
  images: ImageFile[];
  isUploading: boolean;
  uploadProgress: number;
  addImages: (files: FileList | File[]) => void;
  removeImage: (id: string) => void;
  uploadImages: (folder: string, tags?: string[]) => Promise<UploadResult[]>;
  clearImages: () => void;
  retryUpload: (id: string, folder: string, tags?: string[]) => Promise<void>;
  reorderImages: (startIndex: number, endIndex: number) => void;
}

export const useImageUpload = (options: ImageUploadOptions = {}): UseImageUploadReturn => {
  const {
    maxFiles = 10,
    acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize = 10 * 1024 * 1024, // 10MB
    autoUpload = false,
    createVariants = false
  } = options;

  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAbortController = useRef<AbortController | null>(null);

  // Simple file validation function
  const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'File must be an image' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return { isValid: false, error: 'File size exceeds 10MB' };
    }
    
    return { isValid: true };
  };

  // Add images to the list
  const addImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    // Validate each file
    fileArray.forEach(file => {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`);
        return;
      }
      
      if (!acceptedFileTypes.includes(file.type)) {
        toast.error(`${file.name}: File type not supported`);
        return;
      }
      
      if (file.size > maxFileSize) {
        toast.error(`${file.name}: File too large (max ${maxFileSize / (1024 * 1024)}MB)`);
        return;
      }
      
      validFiles.push(file);
    });

    // Check if adding these files would exceed maxFiles
    if (images.length + validFiles.length > maxFiles) {
      toast.error(`Cannot add more than ${maxFiles} images`);
      return;
    }

    // Create image objects
    const newImages: ImageFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: createImagePreview(file),
      progress: 0,
      status: 'pending'
    }));

    setImages(prev => [...prev, ...newImages]);
    
    if (validFiles.length > 0) {
      toast.success(`Added ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}`);
    }
  }, [images.length, maxFiles, acceptedFileTypes, maxFileSize]);

  // Remove image
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        revokeImagePreview(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Upload images
  const uploadImages = useCallback(async (folder: string, tags: string[] = []): Promise<UploadResult[]> => {
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error');
    
    if (pendingImages.length === 0) {
      return images
        .filter(img => img.uploadResult)
        .map(img => img.uploadResult!);
    }

    setIsUploading(true);
    uploadAbortController.current = new AbortController();
    const results: UploadResult[] = [];

    try {
      for (let i = 0; i < pendingImages.length; i++) {
        const imageFile = pendingImages[i];
        
        // Update status to uploading
        setImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { ...img, status: 'uploading' as const, progress: 0 }
            : img
        ));

        try {
          // Upload to Cloudinary
          const uploadResult = await uploadImage(imageFile.file, {
            folder,
            tags: [...tags, 'lineup-project'],
            public_id: `${Date.now()}-${imageFile.file.name.replace(/\.[^/.]+$/, '')}`
          });

          // Simulate progress updates (Cloudinary doesn't provide real-time progress)
          const progressSteps = [20, 40, 60, 80, 100];
          for (const progress of progressSteps) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setImages(prev => prev.map(img => 
              img.id === imageFile.id 
                ? { ...img, progress }
                : img
            ));
            
            // Update overall progress
            const overallProgress = ((i + progress / 100) / pendingImages.length) * 100;
            setUploadProgress(overallProgress);
          }

          // Update status to completed
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, status: 'completed' as const, uploadResult, progress: 100 }
              : img
          ));

          results.push(uploadResult);
          
        } catch (error) {
          console.error(`Failed to upload image ${imageFile.file.name}:`, error);
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { 
                  ...img, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                }
              : img
          ));
        }
      }

      const successCount = results.length;
      const failureCount = pendingImages.length - successCount;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to upload ${failureCount} image${failureCount > 1 ? 's' : ''}`);
      }

    } catch (error) {
      toast.error('Upload process failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      uploadAbortController.current = null;
    }

    return results;
  }, [images]);

  // Retry upload for a specific image
  const retryUpload = useCallback(async (id: string, folder: string, tags: string[] = []): Promise<void> => {
    const imageFile = images.find(img => img.id === id);
    if (!imageFile || imageFile.status !== 'error') return;

    setImages(prev => prev.map(img => 
      img.id === id 
        ? { ...img, status: 'uploading' as const, progress: 0, error: undefined }
        : img
    ));

    try {
      const uploadResult = await uploadImage(imageFile.file, {
        folder,
        tags: [...tags, 'lineup-project'],
        public_id: `${Date.now()}-${imageFile.file.name.replace(/\.[^/.]+$/, '')}`
      });

      // Simulate progress
      const progressSteps = [20, 40, 60, 80, 100];
      for (const progress of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setImages(prev => prev.map(img => 
          img.id === id ? { ...img, progress } : img
        ));
      }

      setImages(prev => prev.map(img => 
        img.id === id 
          ? { ...img, status: 'completed' as const, uploadResult, progress: 100 }
          : img
      ));

      toast.success('Image uploaded successfully');
    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === id 
          ? { 
              ...img, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : img
      ));
      toast.error('Failed to retry upload');
    }
  }, [images]);

  // Clear all images
  const clearImages = useCallback(() => {
    // Revoke all preview URLs
    images.forEach(img => {
      revokeImagePreview(img.preview);
    });
    setImages([]);
    setUploadProgress(0);
  }, [images]);

  // Reorder images
  const reorderImages = useCallback((startIndex: number, endIndex: number) => {
    setImages(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // Cleanup on unmount
  useState(() => {
    return () => {
      images.forEach(img => {
        revokeImagePreview(img.preview);
      });
    };
  });

  return {
    images,
    isUploading,
    uploadProgress,
    addImages,
    removeImage,
    uploadImages,
    clearImages,
    retryUpload,
    reorderImages
  };
};
