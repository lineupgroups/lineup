import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, Crop, Check, Undo2 } from 'lucide-react';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageUrl: string) => void;
  imageFile: File;
  title?: string;
  aspectRatio?: number; // 1 for square, 4/3 for landscape, etc.
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  imageFile,
  title = "Edit Image",
  aspectRatio = 1 // Default to square
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [history, setHistory] = useState<{ scale: number; rotation: number; cropArea: CropArea }[]>([]);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const img = new Image();
      img.onload = () => {
        setImage(img);

        // Calculate proper initial scale to fit image in container
        const containerWidth = 800; // Approximate container width
        const containerHeight = 400; // Container height
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const initialScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original

        // Initialize crop area to center of image (in image coordinates)
        // Calculate initial crop size based on aspect ratio
        let cropWidth: number;
        let cropHeight: number;

        if (aspectRatio >= 1) {
          // Landscape or square - base on width
          cropWidth = Math.min(img.width * 0.9, img.width);
          cropHeight = cropWidth / aspectRatio;

          // If height is too large, scale down
          if (cropHeight > img.height) {
            cropHeight = img.height * 0.9;
            cropWidth = cropHeight * aspectRatio;
          }
        } else {
          // Portrait - base on height
          cropHeight = Math.min(img.height * 0.9, img.height);
          cropWidth = cropHeight * aspectRatio;

          // If width is too large, scale down
          if (cropWidth > img.width) {
            cropWidth = img.width * 0.9;
            cropHeight = cropWidth / aspectRatio;
          }
        }

        const cropX = (img.width - cropWidth) / 2;
        const cropY = (img.height - cropHeight) / 2;

        setCropArea({
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight
        });

        setScale(initialScale);
        setRotation(0);
        setHistory([{
          scale: initialScale,
          rotation: 0,
          cropArea: {
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
          }
        }]);
      };
      img.src = URL.createObjectURL(imageFile);
    }
  }, [imageFile]);

  // Save state to history
  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-9), { scale, rotation, cropArea }]);
  }, [scale, rotation, cropArea]);

  // Undo function
  const undo = useCallback(() => {
    if (history.length > 1) {
      const previousState = history[history.length - 2];
      setScale(previousState.scale);
      setRotation(previousState.rotation);
      setCropArea(previousState.cropArea);
      setHistory(prev => prev.slice(0, -1));
    }
  }, [history]);

  // Rotate image
  const rotateImage = useCallback(() => {
    saveToHistory();
    setRotation(prev => (prev + 90) % 360);
  }, [saveToHistory]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    saveToHistory();
    setScale(prev => Math.min(prev * 1.2, 3));
  }, [saveToHistory]);

  const zoomOut = useCallback(() => {
    saveToHistory();
    setScale(prev => Math.max(prev / 1.2, 0.5));
  }, [saveToHistory]);

  // Mouse event handlers for crop area
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !image) return;

    // Convert screen coordinates to image coordinates
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const imageDisplayWidth = image.width * scale;
    const imageDisplayHeight = image.height * scale;

    const x = (e.clientX - rect.left - containerCenterX + imageDisplayWidth / 2) / scale;
    const y = (e.clientY - rect.top - containerCenterY + imageDisplayHeight / 2) / scale;

    // Check if clicking on resize handles
    const handleSize = 15;
    const { x: cropX, y: cropY, width, height } = cropArea;

    if (x >= cropX + width - handleSize && x <= cropX + width + handleSize &&
      y >= cropY + height - handleSize && y <= cropY + height + handleSize) {
      setIsResizing(true);
      setResizeHandle('se'); // Southeast corner
    } else if (x >= cropX - handleSize && x <= cropX + handleSize &&
      y >= cropY - handleSize && y <= cropY + handleSize) {
      setIsResizing(true);
      setResizeHandle('nw'); // Northwest corner
    } else if (x >= cropX && x <= cropX + width && y >= cropY && y <= cropY + height) {
      setIsDragging(true);
      setDragStart({ x: x - cropX, y: y - cropY });
    }
  }, [cropArea, scale, image]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !image) return;

    // Convert screen coordinates to image coordinates
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const imageDisplayWidth = image.width * scale;
    const imageDisplayHeight = image.height * scale;

    const x = (e.clientX - rect.left - containerCenterX + imageDisplayWidth / 2) / scale;
    const y = (e.clientY - rect.top - containerCenterY + imageDisplayHeight / 2) / scale;

    if (isDragging) {
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(x - dragStart.x, image.width - prev.width)),
        y: Math.max(0, Math.min(y - dragStart.y, image.height - prev.height))
      }));
    } else if (isResizing && resizeHandle) {
      if (resizeHandle === 'se') {
        const newWidth = Math.max(50, Math.min(x - cropArea.x, image.width - cropArea.x));
        const newHeight = newWidth / aspectRatio; // Use aspect ratio

        // Check if new height exceeds image bounds
        const maxHeight = image.height - cropArea.y;
        const finalHeight = Math.min(newHeight, maxHeight);
        const finalWidth = finalHeight * aspectRatio;

        setCropArea(prev => ({
          ...prev,
          width: finalWidth,
          height: finalHeight
        }));
      } else if (resizeHandle === 'nw') {
        const newWidth = Math.max(50, Math.min(cropArea.x + cropArea.width - x, cropArea.x + cropArea.width));
        const newHeight = newWidth / aspectRatio; // Use aspect ratio

        setCropArea(prev => ({
          ...prev,
          x: Math.max(0, prev.x + prev.width - newWidth),
          y: Math.max(0, prev.y + prev.height - newHeight),
          width: newWidth,
          height: newHeight
        }));
      }
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, cropArea, scale, image, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !image) return;

    // Convert touch coordinates to image coordinates
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const imageDisplayWidth = image.width * scale;
    const imageDisplayHeight = image.height * scale;

    const x = (touch.clientX - rect.left - containerCenterX + imageDisplayWidth / 2) / scale;
    const y = (touch.clientY - rect.top - containerCenterY + imageDisplayHeight / 2) / scale;

    // Check if touching resize handles (larger touch targets for mobile)
    const handleSize = 20; // Larger for touch
    const { x: cropX, y: cropY, width, height } = cropArea;

    if (x >= cropX + width - handleSize && x <= cropX + width + handleSize &&
      y >= cropY + height - handleSize && y <= cropY + height + handleSize) {
      setIsResizing(true);
      setResizeHandle('se');
    } else if (x >= cropX - handleSize && x <= cropX + handleSize &&
      y >= cropY - handleSize && y <= cropY + handleSize) {
      setIsResizing(true);
      setResizeHandle('nw');
    } else if (x >= cropX && x <= cropX + width && y >= cropY && y <= cropY + height) {
      setIsDragging(true);
      setDragStart({ x: x - cropX, y: y - cropY });
    }
  }, [cropArea, scale, image]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !image) return;

    // Convert touch coordinates to image coordinates
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const imageDisplayWidth = image.width * scale;
    const imageDisplayHeight = image.height * scale;

    const x = (touch.clientX - rect.left - containerCenterX + imageDisplayWidth / 2) / scale;
    const y = (touch.clientY - rect.top - containerCenterY + imageDisplayHeight / 2) / scale;

    if (isDragging) {
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(x - dragStart.x, image.width - prev.width)),
        y: Math.max(0, Math.min(y - dragStart.y, image.height - prev.height))
      }));
    } else if (isResizing && resizeHandle) {
      if (resizeHandle === 'se') {
        const newWidth = Math.max(50, Math.min(x - cropArea.x, image.width - cropArea.x));
        const newHeight = newWidth / aspectRatio; // Use aspect ratio

        // Check if new height exceeds image bounds
        const maxHeight = image.height - cropArea.y;
        const finalHeight = Math.min(newHeight, maxHeight);
        const finalWidth = finalHeight * aspectRatio;

        setCropArea(prev => ({
          ...prev,
          width: finalWidth,
          height: finalHeight
        }));
      } else if (resizeHandle === 'nw') {
        const newWidth = Math.max(50, Math.min(cropArea.x + cropArea.width - x, cropArea.x + cropArea.width));
        const newHeight = newWidth / aspectRatio; // Use aspect ratio

        setCropArea(prev => ({
          ...prev,
          x: Math.max(0, prev.x + prev.width - newWidth),
          y: Math.max(0, prev.y + prev.height - newHeight),
          width: newWidth,
          height: newHeight
        }));
      }
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, cropArea, scale, image]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Crop and save image
  const handleSave = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to crop area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply rotation and draw image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
    );
    ctx.restore();

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onSave(url);
      }
    }, 'image/jpeg', 0.9);
  }, [image, cropArea, rotation, onSave]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={undo}
              disabled={history.length <= 1}
              className="p-2 sm:p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="w-px h-4 sm:h-6 bg-gray-300" />
            <button
              type="button"
              onClick={rotateImage}
              className="p-2 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="p-2 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <span className="text-xs sm:text-sm text-gray-600 px-1 sm:px-2">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              className="p-2 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>

        {/* Image Editor */}
        <div className="p-2 sm:p-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-gray-100 rounded-lg touch-none"
            style={{ height: 'min(400px, 60vh)' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Image */}
            <img
              ref={imageRef}
              src={image.src}
              alt="Edit"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                maxWidth: 'none',
                maxHeight: 'none'
              }}
              draggable={false}
            />

            {/* Crop Overlay */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
              style={{
                left: `calc(50% - ${(image.width * scale) / 2}px + ${cropArea.x * scale}px)`,
                top: `calc(50% - ${(image.height * scale) / 2}px + ${cropArea.y * scale}px)`,
                width: cropArea.width * scale,
                height: cropArea.height * scale
              }}
            >
              {/* Resize Handles */}
              <div
                className="absolute w-6 h-6 sm:w-4 sm:h-4 bg-blue-500 border-2 border-white cursor-nw-resize rounded-full"
                style={{
                  top: -12,
                  left: -12
                }}
              />
              <div
                className="absolute w-6 h-6 sm:w-4 sm:h-4 bg-blue-500 border-2 border-white cursor-se-resize rounded-full"
                style={{
                  bottom: -12,
                  right: -12
                }}
              />
            </div>

            {/* Dark Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top overlay */}
              <div
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `calc(50% - ${(image.height * scale) / 2}px + ${cropArea.y * scale}px)`
                }}
              />
              {/* Left overlay */}
              <div
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: `calc(50% - ${(image.height * scale) / 2}px + ${cropArea.y * scale}px)`,
                  left: 0,
                  width: `calc(50% - ${(image.width * scale) / 2}px + ${cropArea.x * scale}px)`,
                  height: cropArea.height * scale
                }}
              />
              {/* Right overlay */}
              <div
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: `calc(50% - ${(image.height * scale) / 2}px + ${cropArea.y * scale}px)`,
                  left: `calc(50% - ${(image.width * scale) / 2}px + ${(cropArea.x + cropArea.width) * scale}px)`,
                  right: 0,
                  height: cropArea.height * scale
                }}
              />
              {/* Bottom overlay */}
              <div
                className="absolute bg-black bg-opacity-50"
                style={{
                  top: `calc(50% - ${(image.height * scale) / 2}px + ${(cropArea.y + cropArea.height) * scale}px)`,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-2 sm:mt-4 text-center text-xs sm:text-sm text-gray-600 px-2">
            <p className="hidden sm:block">Drag to move the crop area • Use corner handles to resize</p>
            <p className="sm:hidden">Drag to move • Use corners to resize</p>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImageEditor;
