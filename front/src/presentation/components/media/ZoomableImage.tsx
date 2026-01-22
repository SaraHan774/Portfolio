'use client';

import { ReactNode, memo } from 'react';
import { useImageZoom } from '@/domain';
import type { ZoomedImageData } from '@/state/contexts/UIStateContext';

interface ZoomableImageProps {
  children: ReactNode;
  imageData: ZoomedImageData;
}

/**
 * Wrapper component that adds zoom functionality to images
 *
 * Features:
 * - Cursor changes to zoom-in on hover
 * - Clicking opens the zoom overlay with the expanded image
 * - Keyboard accessible (Enter/Space to zoom)
 * - Memoized to prevent unnecessary re-renders
 */
const ZoomableImage = memo(function ZoomableImage({ children, imageData }: ZoomableImageProps) {
  const { openZoom } = useImageZoom();

  const handleClick = () => {
    openZoom(imageData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openZoom(imageData);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Zoom image: ${imageData.alt}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        cursor: 'zoom-in',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
});

export default ZoomableImage;
