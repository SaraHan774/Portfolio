import { useEffect, useCallback } from 'react';
import { useUIState, type ZoomedImageData } from '@/state/contexts/UIStateContext';
import { useScrollLock } from './useScrollLock';

/**
 * Hook for managing image zoom functionality
 *
 * Combines UIState zoom actions with scroll lock behavior
 * and handles Escape key to close the zoom overlay.
 *
 * @returns Zoom state and control functions
 */
export function useImageZoom() {
  const { zoomedImage, isZoomOpen, openZoom, closeZoom } = useUIState();
  const { lockScroll, unlockScroll } = useScrollLock();

  // Handle scroll lock when zoom is open
  useEffect(() => {
    if (isZoomOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    return () => {
      unlockScroll();
    };
  }, [isZoomOpen, lockScroll, unlockScroll]);

  // Handle Escape key to close zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomOpen) {
        closeZoom();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomOpen, closeZoom]);

  // Open zoom with image data
  const handleOpenZoom = useCallback(
    (imageData: ZoomedImageData) => {
      openZoom(imageData);
    },
    [openZoom]
  );

  // Close zoom
  const handleCloseZoom = useCallback(() => {
    closeZoom();
  }, [closeZoom]);

  return {
    zoomedImage,
    isZoomOpen,
    openZoom: handleOpenZoom,
    closeZoom: handleCloseZoom,
  };
}
