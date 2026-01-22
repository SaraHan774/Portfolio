'use client';

import { ReactNode } from 'react';
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
 */
export default function ZoomableImage({ children, imageData }: ZoomableImageProps) {
  const { openZoom } = useImageZoom();

  const handleClick = () => {
    openZoom(imageData);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        cursor: 'zoom-in',
      }}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
