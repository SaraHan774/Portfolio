import { useCallback } from 'react';

/**
 * Scroll lock hook for managing document body overflow
 *
 * Provides functions to lock and unlock page scrolling,
 * typically used during modal displays or page transitions.
 */
export function useScrollLock() {
  const lockScroll = useCallback(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  const unlockScroll = useCallback(() => {
    document.body.style.overflow = '';
  }, []);

  return { lockScroll, unlockScroll };
}
