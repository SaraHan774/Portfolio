import { useState, useEffect } from 'react';

/**
 * Detects if the current viewport is mobile size
 * @returns boolean indicating if viewport width is <= 767px (md breakpoint)
 */
export function useMobileDetection(): boolean {
  // SSR-safe 초기값: window가 있으면 즉시 체크, 없으면 false
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 767;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    // Initial check (보험용, 초기값이 있어도 재확인)
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
