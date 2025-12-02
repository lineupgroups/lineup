import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader, User, X } from 'lucide-react';
import { ImageEditor } from '../common/ImageEditor';
import { uploadImage } from '../../lib/cloudinary';
import toast from 'react-hot-toast';

interface ProfileImageUploadProps {
    currentImage?: string;
    onImageChange: (url: string) => void;
    className?: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
    currentImage,
    onImageChange,
    className = ''
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Sync preview with currentImage prop changes
    useEffect(() => {
        if (currentImage && !previewUrl) {
            setPreviewUrl(currentImage);
        }
    }, [currentImage, previewUrl]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Open image editor
        setSelectedFile(file);
        setIsEditorOpen(true);
    };

    const handleEditorSave = async (croppedImageUrl: string) => {
        setIsEditorOpen(false);

        try {
            setIsUploading(true);

            // Convert the cropped image URL to a blob
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();

            // Create a File object from the blob
            const croppedFile = new File([blob], selectedFile?.name || 'profile.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            // Set preview immediately
            setPreviewUrl(croppedImageUrl);

            // Upload to Cloudinary
            const result = await uploadImage(croppedFile, {
                folder: 'profile-images',
                tags: ['profile', 'avatar'],
                public_id: `profile-${Date.now()}`
            });

            // Update parent component with new image URL
            onImageChange(result.secure_url);

            // Clear local preview so component uses currentImage from parent
            setPreviewUrl(null);

            toast.success('Profile image updated successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            setPreviewUrl(null); // Revert preview on error
            toast.error('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
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

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onImageChange(''); // Clear image
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Profile image removed');
    };

    const displayImage = previewUrl || currentImage;

    return (
        <>
            <div className={`relative inline-block ${className}`}>
                <div
                    className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 cursor-pointer group"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-16 h-16" />
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200" />
                    </div>

                    {/* Loading Overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                            <Loader className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Remove Button */}
                {displayImage && !isUploading && (
                    <button
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors transform translate-x-1/4 -translate-y-1/4"
                        title="Remove photo"
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
                    disabled={isUploading}
                />
            </div>

            {/* Image Editor Modal */}
            {selectedFile && (
                <ImageEditor
                    isOpen={isEditorOpen}
                    onClose={handleEditorClose}
                    onSave={handleEditorSave}
                    imageFile={selectedFile}
                    title="Edit Profile Picture"
                    aspectRatio={1} // Square for profile pictures
                />
            )}
        </>
    );
};

export default ProfileImageUpload;
