// Image processing and utility functions

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Get image dimensions from file
export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Create image preview URL
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

// Revoke image preview URL
export const revokeImagePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Crop image
export const cropImage = (
  file: File,
  cropArea: CropArea,
  outputWidth?: number,
  outputHeight?: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { x, y, width, height } = cropArea;
      
      // Set canvas size
      canvas.width = outputWidth || width;
      canvas.height = outputHeight || height;

      // Draw cropped image
      ctx?.drawImage(
        img,
        x, y, width, height,
        0, 0, canvas.width, canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to crop image'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Rotate image
export const rotateImage = (file: File, degrees: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;
      
      // Calculate new canvas size after rotation
      const radians = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      const newWidth = width * cos + height * sin;
      const newHeight = width * sin + height * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Rotate and draw
      ctx?.translate(newWidth / 2, newHeight / 2);
      ctx?.rotate(radians);
      ctx?.drawImage(img, -width / 2, -height / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to rotate image'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Apply image filter
export const applyImageFilter = (
  file: File,
  filter: 'brightness' | 'contrast' | 'grayscale' | 'sepia' | 'blur',
  value: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply filter
      let filterString = '';
      switch (filter) {
        case 'brightness':
          filterString = `brightness(${value}%)`;
          break;
        case 'contrast':
          filterString = `contrast(${value}%)`;
          break;
        case 'grayscale':
          filterString = `grayscale(${value}%)`;
          break;
        case 'sepia':
          filterString = `sepia(${value}%)`;
          break;
        case 'blur':
          filterString = `blur(${value}px)`;
          break;
      }

      if (ctx) {
        ctx.filter = filterString;
        ctx.drawImage(img, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to apply filter'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Get optimal crop suggestions for different aspect ratios
export const getOptimalCropSuggestions = (
  imageDimensions: ImageDimensions
): Record<string, CropArea> => {
  const { width, height } = imageDimensions;
  const suggestions: Record<string, CropArea> = {};

  // 16:9 (widescreen)
  const ratio16_9 = 16 / 9;
  if (width / height > ratio16_9) {
    // Image is wider than 16:9
    const cropWidth = height * ratio16_9;
    suggestions['16:9'] = {
      x: (width - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: height
    };
  } else {
    // Image is taller than 16:9
    const cropHeight = width / ratio16_9;
    suggestions['16:9'] = {
      x: 0,
      y: (height - cropHeight) / 2,
      width: width,
      height: cropHeight
    };
  }

  // 4:3 (traditional)
  const ratio4_3 = 4 / 3;
  if (width / height > ratio4_3) {
    const cropWidth = height * ratio4_3;
    suggestions['4:3'] = {
      x: (width - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: height
    };
  } else {
    const cropHeight = width / ratio4_3;
    suggestions['4:3'] = {
      x: 0,
      y: (height - cropHeight) / 2,
      width: width,
      height: cropHeight
    };
  }

  // 1:1 (square)
  const minDimension = Math.min(width, height);
  suggestions['1:1'] = {
    x: (width - minDimension) / 2,
    y: (height - minDimension) / 2,
    width: minDimension,
    height: minDimension
  };

  return suggestions;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if image needs optimization
export const needsOptimization = (file: File, maxSize: number = 2 * 1024 * 1024): boolean => {
  return file.size > maxSize;
};

// Generate image variants info
export const generateImageVariantsInfo = (originalFile: File) => {
  return {
    original: {
      name: originalFile.name,
      size: originalFile.size,
      type: originalFile.type
    },
    thumbnail: {
      name: `thumb_${originalFile.name}`,
      estimatedSize: Math.round(originalFile.size * 0.1), // Rough estimate
      type: originalFile.type
    },
    medium: {
      name: `medium_${originalFile.name}`,
      estimatedSize: Math.round(originalFile.size * 0.3), // Rough estimate
      type: originalFile.type
    }
  };
};
