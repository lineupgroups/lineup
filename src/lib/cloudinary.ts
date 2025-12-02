// Simple Cloudinary client-side implementation without heavy dependencies

// Environment variables validation
const requiredEnvVars = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
};

// Validate environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(`Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
}

// Simple Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: requiredEnvVars.cloudName,
  apiKey: requiredEnvVars.apiKey,
  apiSecret: requiredEnvVars.apiSecret,
};

// Upload configurations
export const UPLOAD_CONFIGS = {
  project: {
    folder: 'lineup-projects',
    transformation: [
      { width: 1200, height: 800, crop: 'fill', quality: 'auto:good' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5000000, // 5MB
  },
  profile: {
    folder: 'lineup-users',
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto:good', gravity: 'face' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 2000000, // 2MB
  },
} as const;

// Image upload function
export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  version: number;
  url: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: any[];
  public_id?: string;
  tags?: string[];
  context?: Record<string, string>;
  upload_preset?: string;
}

// Client-side upload using upload preset (recommended for frontend)
export const uploadImage = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (5MB limit)
    if (file.size > 5000000) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please use JPG, PNG, or WebP');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cloud_name', requiredEnvVars.cloudName!);
    
    // Use upload preset for unsigned uploads (we'll create this)
    formData.append('upload_preset', 'lineup_unsigned');
    
    // Add optional parameters
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${requiredEnvVars.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`);
    }

    const result: UploadResult = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete image function using Admin API (requires API secret)
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Attempting to delete Cloudinary image:', publicId);
    
    if (!publicId) {
      console.warn('❌ No public_id provided for deletion');
      return false;
    }
    
    if (!requiredEnvVars.apiSecret) {
      console.warn('⚠️ Cloudinary API secret not found. Image deletion skipped.');
      console.warn('To enable deletion, add VITE_CLOUDINARY_API_SECRET to your .env.local file');
      return false;
    }

    if (!requiredEnvVars.cloudName || !requiredEnvVars.apiKey) {
      console.error('❌ Missing Cloudinary configuration');
      return false;
    }

    // Generate timestamp and signature for authenticated request
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create signature string (public_id + timestamp + api_secret)
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${requiredEnvVars.apiSecret}`;
    
    console.log('🔐 Generated signature string for:', publicId);
    
    // Generate SHA-1 signature
    const signature = await generateSHA1(signatureString);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', requiredEnvVars.apiKey!);
    formData.append('signature', signature);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${requiredEnvVars.cloudName}/image/destroy`;
    console.log('🌐 Making delete request to:', deleteUrl);

    const response = await fetch(deleteUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudinary deletion failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return false;
    }

    const result = await response.json();
    console.log('✅ Cloudinary deletion result:', result);
    
    const success = result.result === 'ok';
    if (success) {
      console.log('🎉 Successfully deleted image from Cloudinary:', publicId);
    } else {
      console.warn('⚠️ Cloudinary returned non-ok result:', result);
    }
    
    return success;
  } catch (error) {
    console.error('💥 Cloudinary delete error:', error);
    return false;
  }
};

// Helper function to generate SHA-1 signature
async function generateSHA1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate optimized URL for existing images
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string => {
  try {
    const baseUrl = `https://res.cloudinary.com/${requiredEnvVars.cloudName}/image/upload`;
    let transformations: string[] = [];
    
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }
    
    if (options.width || options.height) {
      const crop = options.crop || 'fill';
      const width = options.width ? `w_${options.width}` : '';
      const height = options.height ? `h_${options.height}` : '';
      transformations.push(`c_${crop}`, width, height);
    }
    
    const transformationString = transformations.filter(Boolean).join(',');
    
    if (transformationString) {
      return `${baseUrl}/${transformationString}/${publicId}`;
    } else {
      return `${baseUrl}/${publicId}`;
    }
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return '';
  }
};

// Utility to extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return '';
    
    // Get everything after version number (if present) or after 'upload'
    let pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove version if present (starts with 'v' followed by numbers)
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    
    // Remove file extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex > 0) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }
    
    return pathAfterUpload;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return '';
  }
};

// Check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// Export the cloudinary configuration as default
export default cloudinaryConfig;
