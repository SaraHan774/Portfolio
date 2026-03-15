'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useImageZoom, useOptimizedResize, useIsTouchDevice, usePinchZoom } from '@/domain';
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const isTouchDevice = useIsTouchDevice();
  const pinchZoom = usePinchZoom({
    minScale: 1,
    maxScale: 4,
    resetOnDoubleTap: true,
  });

  // Reset zoom when zoomed image changes
  useEffect(() => {
    if (zoomedImage) {
      pinchZoom.resetZoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (pinchZoom.isZoomed) {
        pinchZoom.resetZoom();
      } else {
        closeZoom();
      }
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: isTouchDevice ? pinchZoom.scale : 1,
          x: isTouchDevice ? pinchZoom.position.x : 0,
          y: isTouchDevice ? pinchZoom.position.y : 0,
          transition: pinchZoom.isPinching
            ? { duration: 0 }
            : { duration: 0.3 },
        }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        ref={isTouchDevice ? pinchZoom.containerRef : undefined}
        style={{
          position: 'relative',
          width: imageDimensions.width,
          height: imageDimensions.height,
          transformOrigin: 'center center',
          cursor: pinchZoom.isZoomed ? 'grab' : 'zoom-out',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onClick={() => {
          if (!pinchZoom.isZoomed) {
            closeZoom();
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
