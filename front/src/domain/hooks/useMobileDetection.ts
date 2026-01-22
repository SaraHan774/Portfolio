import { useState, useEffect } from 'react';

/**
 * Detects if the current viewport is mobile size
 * @returns boolean indicating if viewport width is <= 767px (md breakpoint)
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
