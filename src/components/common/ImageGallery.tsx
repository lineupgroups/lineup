import React, { useState } from 'react';
import { X, ZoomIn, Download, Edit3, Trash2, MoreVertical } from 'lucide-react';

interface ImageItem {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  size?: number;
  uploadedAt?: Date;
}

interface ImageGalleryProps {
  images: ImageItem[];
  onImageSelect?: (image: ImageItem) => void;
  onImageDelete?: (id: string) => void;
  onImageEdit?: (id: string) => void;
  className?: string;
  showActions?: boolean;
  maxHeight?: string;
}

export default function ImageGallery({
  images,
  onImageSelect,
  onImageDelete,
  onImageEdit,
  className = '',
  showActions = true,
  maxHeight = '400px'
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image);
    setShowLightbox(true);
    onImageSelect?.(image);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setSelectedImage(null);
  };

  const handleDownload = (image: ImageItem) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.title || `image-${image.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDropdown = (imageId: string) => {
    setActiveDropdown(activeDropdown === imageId ? null : imageId);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">🖼️</div>
          <p className="text-gray-500">No images to display</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`} style={{ maxHeight, overflowY: 'auto' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Image */}
              <div 
                className="aspect-square cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.thumbnail || image.url}
                  alt={image.title || `Image ${image.id}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.title || `Image ${image.id}`}
                    </p>
                    {image.size && (
                      <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                    )}
                  </div>

                  {/* Actions Dropdown */}
                  {showActions && (
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(image.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeDropdown === image.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                handleDownload(image);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                            
                            {onImageEdit && (
                              <button
                                onClick={() => {
                                  onImageEdit(image.id);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                            )}

                            {onImageDelete && (
                              <button
                                onClick={() => {
                                  onImageDelete(image.id);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {image.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {image.description}
                  </p>
                )}

                {image.uploadedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {image.uploadedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={selectedImage.url}
              alt={selectedImage.title || 'Image'}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedImage.title || `Image ${selectedImage.id}`}
                  </h3>
                  {selectedImage.description && (
                    <p className="text-sm text-gray-300 mt-1">
                      {selectedImage.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {onImageEdit && (
                    <button
                      onClick={() => {
                        onImageEdit(selectedImage.id);
                        closeLightbox();
                      }}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  )}

                  {onImageDelete && (
                    <button
                      onClick={() => {
                        onImageDelete(selectedImage.id);
                        closeLightbox();
                      }}
                      className="p-2 bg-red-500 bg-opacity-70 hover:bg-opacity-90 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />
        </div>
      )}

      {/* Click outside dropdown to close */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </>
  );
}
