'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useImageZoom, useOptimizedResize } from '@/domain';
import {
  IMAGE_ZOOM_OVERLAY_ANIMATION,
  ZOOMED_IMAGE_ANIMATION,
} from '@/core/constants/animation.constants';
import { Z_INDEX } from '@/core/constants/ui.constants';

const HORIZONTAL_PADDING = 40;

/**
 * Hook to track viewport dimensions with optimized resize handling
 * Uses throttling to prevent excessive re-renders during window resize
 */
function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  // Initialize size on mount
  useEffect(() => {
    updateSize();
  }, [updateSize]);

  // Use optimized resize hook with debouncing
  useOptimizedResize(updateSize, { delay: 100 });

  return size;
}

/**
 * Full screen overlay that displays a zoomed image
 *
 * Features:
 * - Image fills viewport height while maintaining aspect ratio
 * - Dark dim background (rgba(0, 0, 0, 0.9))
 * - Close via: background click, X button, Escape key
 * - Smooth enter/exit animations
 */
export default function ImageZoomOverlay() {
  const { zoomedImage, closeZoom } = useImageZoom();
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const [imageLoading, setImageLoading] = useState(true);

  // Reset loading state when zoomed image changes
  useEffect(() => {
    if (zoomedImage) {
      setImageLoading(true);
    }
  }, [zoomedImage]);

  // Calculate image dimensions to fill full height while maintaining aspect ratio
  const imageDimensions = useMemo(() => {
    if (!zoomedImage || !viewportWidth || !viewportHeight) {
      return { width: 0, height: 0 };
    }

    const aspectRatio = zoomedImage.width / zoomedImage.height;
    const maxHeight = viewportHeight; // Full height, no padding
    const maxWidth = viewportWidth - HORIZONTAL_PADDING * 2;

    let imageHeight = maxHeight;
    let imageWidth = imageHeight * aspectRatio;

    // If width exceeds viewport, scale down based on width
    if (imageWidth > maxWidth) {
      imageWidth = maxWidth;
      imageHeight = imageWidth / aspectRatio;
    }

    return { width: imageWidth, height: imageHeight };
  }, [zoomedImage, viewportWidth, viewportHeight]);

  if (!zoomedImage) return null;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeZoom();
    }
  };

  return (
    <motion.div
      {...IMAGE_ZOOM_OVERLAY_ANIMATION}
      onClick={handleBackgroundClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.IMAGE_ZOOM_OVERLAY,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      {/* Close button */}
      <button
        onClick={closeZoom}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease',
          zIndex: Z_INDEX.IMAGE_ZOOM_OVERLAY + 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        aria-label="Close zoom"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Zoomed image */}
      <motion.div
        {...ZOOMED_IMAGE_ANIMATION}
        style={{
          position: 'relative',
          width: imageDimensions.width,
          height: imageDimensions.height,
          cursor: 'zoom-out',
        }}
        onClick={closeZoom}
      >
        {/* Loading spinner */}
        {imageLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                borderTop: '3px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        )}
        <Image
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          fill
          style={{
            objectFit: 'contain',
            opacity: imageLoading ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
          sizes={`${Math.round(imageDimensions.width)}px`}
          onLoad={() => setImageLoading(false)}
          priority
        />
      </motion.div>
    </motion.div>
  );
}
