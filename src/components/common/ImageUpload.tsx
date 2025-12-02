import React, { useRef, useState, DragEvent } from 'react';
import { Upload, X, RotateCw, AlertCircle, Check, Loader } from 'lucide-react';
import { useImageUpload, ImageFile, ImageUploadOptions } from '../../hooks/useImageUpload';
import { formatFileSize } from '../../utils/imageUtils';

interface ImageUploadProps extends ImageUploadOptions {
  onImagesChange?: (images: ImageFile[]) => void;
  onUploadComplete?: (results: any[]) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  allowReorder?: boolean;
  uploadFolder?: string;
  uploadTags?: string[];
}

export default function ImageUpload({
  onImagesChange,
  onUploadComplete,
  onUploadError,
  className = '',
  disabled = false,
  showPreview = true,
  allowReorder = true,
  uploadFolder = 'lineup-uploads',
  uploadTags = [],
  ...uploadOptions
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const {
    images,
    isUploading,
    uploadProgress,
    addImages,
    removeImage,
    uploadImages,
    clearImages,
    retryUpload,
    reorderImages
  } = useImageUpload(uploadOptions);

  // Notify parent of changes
  React.useEffect(() => {
    onImagesChange?.(images);
  }, [images, onImagesChange]);

  // Handle file selection
  const handleFileSelect = (files: FileList | File[]) => {
    addImages(files);
  };

  // Handle drag and drop
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFolder) return;
    
    try {
      const results = await uploadImages(uploadFolder, uploadTags);
      onUploadComplete?.(results);
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadError?.(error as Error);
    }
  };

  // Handle drag start for reordering
  const handleDragStart = (e: DragEvent, index: number) => {
    if (!allowReorder) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over for reordering
  const handleImageDragOver = (e: DragEvent, index: number) => {
    if (!allowReorder || draggedIndex === null) return;
    e.preventDefault();
    
    if (draggedIndex !== index) {
      reorderImages(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-orange-500 bg-orange-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={uploadOptions.acceptedFileTypes?.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-orange-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-6 h-6 ${
              isDragOver ? 'text-orange-600' : 'text-gray-400'
            }`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop images here' : 'Upload Images'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your images here, or click to browse
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Supported formats: JPG, PNG, WebP</p>
              <p>Maximum file size: {uploadOptions.maxFileSize ? `${uploadOptions.maxFileSize / (1024 * 1024)}MB` : '10MB'}</p>
              <p>Maximum files: {uploadOptions.maxFiles || 10}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Uploading...</span>
            <span className="text-sm text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {showPreview && images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              Images ({images.length})
            </h4>
            <div className="flex space-x-2">
              {uploadFolder && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading || images.every(img => img.status === 'completed')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </button>
              )}
              <button
                onClick={clearImages}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden"
                draggable={allowReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
              >
                {/* Image */}
                <div className="aspect-square relative">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    {image.status === 'uploading' && (
                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <Loader className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {image.status === 'uploading' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50">
                      <div
                        className="bg-blue-500 h-1 transition-all duration-300"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {image.file.name}
                    </span>
                    {getStatusIcon(image.status)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(image.file.size)}</span>
                    {image.status === 'error' && (
                      <button
                        onClick={() => uploadFolder && retryUpload(image.id, uploadFolder, uploadTags)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Retry
                      </button>
                    )}
                  </div>

                  {image.error && (
                    <p className="text-xs text-red-600 mt-1 truncate" title={image.error}>
                      {image.error}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeImage(image.id)}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Drag Handle */}
                {allowReorder && (
                  <div className="absolute top-2 left-2 p-1 bg-gray-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-move">
                    <RotateCw className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
