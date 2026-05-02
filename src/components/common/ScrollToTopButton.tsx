import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  className?: string;
  showAfter?: number; // Pixels scrolled before showing button
  smooth?: boolean;
}

export default function ScrollToTopButton({ 
  className = '', 
  showAfter = 300,
  smooth = true 
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const toggleVisibility = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce scroll events for better performance
      timeoutId = setTimeout(() => {
        if (window.pageYOffset > showAfter) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }, 10);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    // Check initial scroll position
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showAfter]);

  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      onKeyDown={handleKeyDown}
      className={`fixed bottom-8 right-8 z-[60] p-3 bg-brand-orange text-brand-black rounded-full shadow-[0_0_30px_rgba(255,91,0,0.3)] hover:shadow-[0_0_50px_rgba(255,91,0,0.5)] transition-all duration-500 transform hover:scale-110 active:scale-90 focus:outline-none focus:ring-4 focus:ring-brand-orange/20 group border-2 border-brand-orange/20 ${className}`}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
    </button>
  );
}

