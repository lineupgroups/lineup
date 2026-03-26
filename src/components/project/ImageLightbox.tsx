import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageLightboxProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageLightbox({
    images,
    initialIndex = 0,
    isOpen,
    onClose
}: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Reset states when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setIsZoomed(false);
            setIsLoading(true);
        }
    }, [isOpen, initialIndex]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'Escape':
                onClose();
                break;
            case 'ArrowLeft':
                goToPrevious();
                break;
            case 'ArrowRight':
                goToNext();
                break;
            case 'z':
            case 'Z':
                setIsZoomed(prev => !prev);
                break;
        }
    }, [isOpen, currentIndex, images.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const goToPrevious = () => {
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
        setIsLoading(true);
        setIsZoomed(false);
    };

    const goToNext = () => {
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
        setIsLoading(true);
        setIsZoomed(false);
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(images[currentIndex]);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-image-${currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download image:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110"
                aria-label="Close lightbox"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Top toolbar */}
            <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                <span className="text-white/80 text-sm font-medium px-3 py-1 bg-black/50 rounded-full">
                    {currentIndex + 1} / {images.length}
                </span>
                <button
                    onClick={() => setIsZoomed(prev => !prev)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110"
                    aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                >
                    {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                </button>
                <button
                    onClick={handleDownload}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110"
                    aria-label="Download image"
                >
                    <Download className="w-5 h-5" />
                </button>
            </div>

            {/* Previous button */}
            {images.length > 1 && (
                <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {/* Next button */}
            {images.length > 1 && (
                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110"
                    aria-label="Next image"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

            {/* Main image container */}
            <div
                className={`relative max-w-[90vw] max-h-[85vh] transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setIsZoomed(prev => !prev)}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
                <img
                    src={images[currentIndex]}
                    alt={`Gallery image ${currentIndex + 1}`}
                    className={`max-w-full max-h-[85vh] object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                    draggable={false}
                />
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentIndex(index);
                                setIsLoading(true);
                                setIsZoomed(false);
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === currentIndex
                                    ? 'border-orange-500 scale-105'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={img}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Keyboard hints */}
            <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block">
                <span className="px-2 py-1 bg-black/30 rounded mr-2">←→</span> Navigate
                <span className="px-2 py-1 bg-black/30 rounded ml-2 mr-2">Z</span> Zoom
                <span className="px-2 py-1 bg-black/30 rounded ml-2">ESC</span> Close
            </div>
        </div>
    );
}
