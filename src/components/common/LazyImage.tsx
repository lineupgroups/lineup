import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

// P-OPT-03: Lazy load images using IntersectionObserver
export default function LazyImage({
    src,
    alt,
    className = '',
    placeholderClassName = '',
    onError
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '100px', // Start loading 100px before entering viewport
                threshold: 0.01
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setIsLoaded(true);
        if (onError) {
            onError(e);
        } else {
            // Default fallback
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
        }
    };

    return (
        <div ref={imgRef} className={`relative ${className}`}>
            {/* Placeholder skeleton while loading */}
            {!isLoaded && (
                <div
                    className={`absolute inset-0 bg-gray-200 animate-pulse ${placeholderClassName}`}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm16.5 11.5l-3.75-5-2.5 3.5-1.5-2-3.25 4.5H19.5zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Actual image - only loads when in viewport */}
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </div>
    );
}
