import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentUploaderProps {
    label: string;
    description?: string;
    documentType: 'aadhaar' | 'pan' | 'addressProof';
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
    required?: boolean;
}

export default function DocumentUploader({
    label,
    description,
    documentType,
    onUploadComplete,
    currentUrl,
    required = true
}: DocumentUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState(currentUrl || '');
    const [preview, setPreview] = useState(currentUrl || '');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (JPG, PNG, WEBP) or PDF file');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('File size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                // For PDFs, show a placeholder
                setPreview('pdf');
            }

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'lineup_unsigned');
            formData.append('folder', `lineup-kyc/${documentType}`);
            formData.append('tags', `kyc,${documentType}`);

            // Use XMLHttpRequest for progress tracking
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        setUploadProgress(Math.round(percentComplete));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve({ secure_url: result.secure_url });
                        } catch (e) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed: Network error'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload failed: Request timeout'));
                });

                xhr.open('POST', `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`);
                xhr.timeout = 60000; // 60 second timeout for documents
                xhr.send(formData);
            });

            setUploadedUrl(result.secure_url);
            onUploadComplete(result.secure_url);

            toast.success('Document uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload document. Please try again.');
            setPreview('');
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleRemove = () => {
        setUploadedUrl('');
        setPreview('');
        onUploadComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const isImage = preview && preview !== 'pdf' && !preview.endsWith('.pdf');

    return (
        <div>
            {/* Label */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {description && (
                <p className="text-xs text-gray-500 mb-3">{description}</p>
            )}

            {/* Upload Area */}
            {!uploadedUrl ? (
                <div
                    onClick={handleClick}
                    className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-400 transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />

                    <div className="text-center">
                        {uploading ? (
                            <>
                                <Loader className="w-12 h-12 text-orange-600 mx-auto mb-3 animate-spin" />
                                <p className="text-sm font-medium text-gray-700">Uploading...</p>
                                <div className="w-full max-w-xs mx-auto mt-3">
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">Click to upload {label}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    JPG, PNG, WEBP or PDF (max. 5MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="relative border-2 border-green-300 rounded-lg p-4 bg-green-50">
                    {/* Preview */}
                    <div className="flex items-start gap-4">
                        {isImage ? (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200">
                                <img
                                    src={preview}
                                    alt={label}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200 flex items-center justify-center">
                                <FileText className="w-10 h-10 text-red-600" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {label} uploaded
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Document ready for verification
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                onClick={handleClick}
                                className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-2"
                            >
                                Change file
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Helper Text */}
            <div className="mt-2 text-xs text-gray-500">
                {documentType === 'aadhaar' && (
                    <p>• Upload a clear photo of your Aadhaar card (front side)</p>
                )}
                {documentType === 'pan' && (
                    <p>• Upload a clear photo of your PAN card</p>
                )}
                {documentType === 'addressProof' && (
                    <p>• Upload utility bill, bank statement, or any government-issued address proof</p>
                )}
            </div>
        </div>
    );
}
