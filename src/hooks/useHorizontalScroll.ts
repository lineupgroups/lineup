import { useRef, useEffect } from 'react';

/**
 * Custom hook to enable high-performance smooth horizontal scrolling 
 * with a vertical mouse wheel using Linear Interpolation (lerp).
 */
export function useHorizontalScroll() {
  const elRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const requestRef = useRef<number>();

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Initialize positions
    targetX.current = el.scrollLeft;
    currentX.current = el.scrollLeft;

    const animate = () => {
      // Linear Interpolation: current = current + (target - current) * factor
      // A factor of 0.1 provides a very smooth, premium feel
      const diff = targetX.current - currentX.current;
      currentX.current += diff * 0.15;

      if (el) {
        el.scrollLeft = currentX.current;
      }

      // Continue animation if we haven't reached the target
      if (Math.abs(diff) > 0.5) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        requestRef.current = undefined;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;

      // Update target based on wheel delta
      // Sensitivity factor of 1.5 to 2.0 feels good for 'luxury' UI
      const speed = 1.5;
      const maxScroll = el.scrollWidth - el.clientWidth;
      
      targetX.current = Math.max(0, Math.min(maxScroll, targetX.current + e.deltaY * speed));

      // Start animation loop if not already running
          if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(animate);
      }

      // Prevent vertical page scroll
      e.preventDefault();
    };

    // Update target when user manually scrolls (e.g. via trackpad)
    const onScroll = () => {
      // If we are not currently animating, sync the target with the actual scroll position
      if (!requestRef.current) {
        targetX.current = el.scrollLeft;
        currentX.current = el.scrollLeft;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScroll);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return elRef;
}
