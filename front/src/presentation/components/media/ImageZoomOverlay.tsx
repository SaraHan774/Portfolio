'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useImageZoom, useOptimizedResize, usePinchZoom } from '@/domain';
import {
  IMAGE_ZOOM_OVERLAY_ANIMATION,
} from '@/core/constants/animation.constants';
import { Z_INDEX } from '@/core/constants/ui.constants';

const HORIZONTAL_PADDING = 40;

function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateSize();
  }, [updateSize]);

  useOptimizedResize(updateSize, { delay: 100 });

  return size;
}

export default function ImageZoomOverlay() {
  const { zoomedImage, closeZoom } = useImageZoom();
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const pinchZoom = usePinchZoom({
    minScale: 1,
    maxScale: 4,
    resetOnDoubleTap: true,
  });

  // Reset zoom when image changes
  useEffect(() => {
    if (zoomedImage) {
      pinchZoom.resetZoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomedImage]);

  const imageDimensions = useMemo(() => {
    if (!zoomedImage || !viewportWidth || !viewportHeight) {
      return { width: 0, height: 0 };
    }

    const aspectRatio = zoomedImage.width / zoomedImage.height;
    const maxHeight = viewportHeight;
    const maxWidth = viewportWidth - HORIZONTAL_PADDING * 2;

    let imageHeight = maxHeight;
    let imageWidth = imageHeight * aspectRatio;

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
        touchAction: 'none',
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

      {/* Touch target — plain div, callback ref attaches listeners on mount */}
      <div
        ref={pinchZoom.setContainerRef}
        style={{
          position: 'relative',
          width: imageDimensions.width,
          height: imageDimensions.height,
          touchAction: 'none',
          userSelect: 'none',
        }}
        onClick={() => {
          if (!pinchZoom.isZoomed) {
            closeZoom();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: pinchZoom.scale,
            x: pinchZoom.position.x,
            y: pinchZoom.position.y,
            transition: pinchZoom.isPinching
              ? { duration: 0 }
              : { duration: 0.3 },
          }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          style={{
            width: '100%',
            height: '100%',
            transformOrigin: 'center center',
            cursor: pinchZoom.isZoomed ? 'grab' : 'zoom-out',
          }}
        >
          {/* Subtle shimmer placeholder */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '2px',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedImage.src}
            alt={zoomedImage.alt}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1';
              const shimmer = e.currentTarget.previousElementSibling as HTMLElement;
              if (shimmer) shimmer.style.display = 'none';
            }}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0,
              transition: 'opacity 0.15s ease',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
