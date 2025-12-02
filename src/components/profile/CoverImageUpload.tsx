import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader, X, Monitor, Smartphone, Check } from 'lucide-react';
import { ImageEditor } from '../common/ImageEditor';
import { uploadImage } from '../../lib/cloudinary';
import toast from 'react-hot-toast';

interface CoverImageUploadProps {
    currentCover?: string;
    onCoverChange: (url: string) => void;
    isEditable?: boolean;
    className?: string;
}

const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
    currentCover,
    onCoverChange,
    isEditable = true,
    className = ''
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Sync preview with currentCover prop changes
    useEffect(() => {
        if (currentCover && !previewUrl) {
            setPreviewUrl(currentCover);
        }
    }, [currentCover, previewUrl]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        // Validate file size (3MB for covers)
        if (file.size > 3 * 1024 * 1024) {
            toast.error('Image size must be less than 3MB');
            return;
        }

        // Open image editor
        setSelectedFile(file);
        setIsEditorOpen(true);
    };

    const handleEditorSave = (croppedUrl: string) => {
        setIsEditorOpen(false);
        setCroppedImageUrl(croppedUrl);
        setIsPreviewOpen(true); // Open preview modal
    };

    const handlePreviewConfirm = async () => {
        if (!croppedImageUrl) return;

        setIsPreviewOpen(false);

        try {
            setIsUploading(true);

            // Convert the cropped image URL to a blob
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();

            // Create a File object from the blob
            const croppedFile = new File([blob], selectedFile?.name || 'cover.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            // Set preview immediately
            setPreviewUrl(croppedImageUrl);

            // Upload to Cloudinary
            const result = await uploadImage(croppedFile, {
                folder: 'cover-images',
                tags: ['cover', 'banner', 'profile'],
                public_id: `cover-${Date.now()}`
            });

            // Update parent component with new image URL
            onCoverChange(result.secure_url);

            // Clear local preview so component uses currentCover from parent
            setPreviewUrl(null);
            setCroppedImageUrl(null);

            toast.success('Cover image updated successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            setPreviewUrl(null); // Revert preview on error
            toast.error('Failed to upload cover image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePreviewCancel = () => {
        setIsPreviewOpen(false);
        setCroppedImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleEditorClose = () => {
        setIsEditorOpen(false);
        setSelectedFile(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveCover = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onCoverChange(''); // Clear cover
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Cover image removed');
    };

    const displayCover = previewUrl || currentCover;

    return (
        <>
            <div className={`relative w-full ${className}`}>
                <div
                    className="relative w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 group cursor-pointer"
                    onClick={() => isEditable && !isUploading && fileInputRef.current?.click()}
                    style={{
                        aspectRatio: '16 / 5'
                    }}
                >
                    {displayCover ? (
                        <img
                            src={displayCover}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-white">
                                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm opacity-75">Click to add cover photo</p>
                            </div>
                        </div>
                    )}

                    {/* Hover Overlay */}
                    {isEditable && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 text-white text-center">
                                <Camera className="w-10 h-10 mx-auto mb-2" />
                                <p className="text-sm font-medium">
                                    {displayCover ? 'Change Cover Photo' : 'Add Cover Photo'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
                            <div className="text-center text-white">
                                <Loader className="w-10 h-10 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">Uploading cover...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                {displayCover && isEditable && !isUploading && (
                    <button
                        onClick={handleRemoveCover}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        title="Remove cover photo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading || !isEditable}
                />
            </div>

            {/* Image Editor Modal */}
            {selectedFile && (
                <ImageEditor
                    isOpen={isEditorOpen}
                    onClose={handleEditorClose}
                    onSave={handleEditorSave}
                    imageFile={selectedFile}
                    title="Edit Cover Photo"
                    aspectRatio={16 / 5} // 16:5 aspect ratio for covers
                />
            )}

            {/* Preview Modal */}
            {isPreviewOpen && croppedImageUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Preview Your Cover</h2>
                            <button
                                type="button"
                                onClick={handlePreviewCancel}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="p-4 sm:p-6 space-y-6">
                            {/* Desktop Preview */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Monitor className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-medium text-gray-900">Desktop View</h3>
                                </div>
                                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                    <img
                                        src={croppedImageUrl}
                                        alt="Desktop preview"
                                        className="w-full object-cover"
                                        style={{ aspectRatio: '16 / 5' }}
                                    />
                                </div>
                            </div>

                            {/* Mobile Preview */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Smartphone className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-medium text-gray-900">Mobile View</h3>
                                </div>
                                <div className="max-w-sm mx-auto border-2 border-gray-200 rounded-lg overflow-hidden">
                                    <img
                                        src={croppedImageUrl}
                                        alt="Mobile preview"
                                        className="w-full object-cover"
                                        style={{ aspectRatio: '16 / 5' }}
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Your cover image will automatically adjust to different screen sizes while maintaining its aspect ratio.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                type="button"
                                onClick={handlePreviewCancel}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePreviewConfirm}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Use This Cover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CoverImageUpload;
