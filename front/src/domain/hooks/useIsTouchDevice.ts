import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is a touch device
 *
 * Uses CSS media query (hover: none) to determine if the device
 * has touch capability without hover support.
 *
 * @returns true if the device is a touch device, false otherwise
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if the device doesn't support hover (touch devices)
    const mediaQuery = window.matchMedia('(hover: none)');

    setIsTouchDevice(mediaQuery.matches);

    // Listen for changes (e.g., when switching between desktop/mobile modes)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isTouchDevice;
}
