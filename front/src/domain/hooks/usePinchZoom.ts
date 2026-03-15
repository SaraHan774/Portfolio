import { useState, useRef, useCallback } from 'react';
import { PINCH_ZOOM } from '@/core/constants/ui.constants';

export interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  resetOnDoubleTap?: boolean;
}

export interface UsePinchZoomReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  scale: number;
  position: { x: number; y: number };
  isPinching: boolean;
  isZoomed: boolean;
  resetZoom: () => void;
}

interface TouchState {
  initialDistance: number | null;
  initialScale: number;
  isPinching: boolean;
  lastTouchTime: number;
  touchCount: number;
  panStart: { x: number; y: number } | null;
  lastPanPosition: { x: number; y: number };
}

/**
 * Calculate distance between two touch points
 */
function getTouchDistance(touch1: React.Touch, touch2: React.Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Pinch zoom gesture detection hook
 *
 * Features:
 * - Two-finger pinch to zoom (1x to 4x)
 * - Pan when zoomed in
 * - Double-tap to reset zoom
 * - Boundary constraints for panning
 *
 * @param options Configuration options
 * @returns Zoom state and gesture handlers
 */
export function usePinchZoom(
  options: UsePinchZoomOptions = {}
): UsePinchZoomReturn {
  const {
    minScale = PINCH_ZOOM.MIN_SCALE,
    maxScale = PINCH_ZOOM.MAX_SCALE,
    resetOnDoubleTap = true,
  } = options;

  const [scale, setScale] = useState(minScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);

  const touchStateRef = useRef<TouchState>({
    initialDistance: null,
    initialScale: minScale,
    isPinching: false,
    lastTouchTime: 0,
    touchCount: 0,
    panStart: null,
    lastPanPosition: { x: 0, y: 0 },
  });

  const containerRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const resetZoom = useCallback(() => {
    setScale(minScale);
    setPosition({ x: 0, y: 0 });
    setIsPinching(false);
    touchStateRef.current.initialDistance = null;
    touchStateRef.current.isPinching = false;
    touchStateRef.current.panStart = null;
  }, [minScale]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;
      const state = touchStateRef.current;

      // Store container dimensions
      const target = e.currentTarget as HTMLElement;
      containerRef.current = {
        width: target.offsetWidth,
        height: target.offsetHeight,
      };

      // Double-tap detection
      if (resetOnDoubleTap && touches.length === 1) {
        const now = Date.now();
        const timeSinceLastTouch = now - state.lastTouchTime;

        if (
          timeSinceLastTouch < PINCH_ZOOM.DOUBLE_TAP_DELAY &&
          timeSinceLastTouch > 0
        ) {
          // Double-tap detected
          resetZoom();
          state.lastTouchTime = 0; // Reset to prevent triple-tap issues
          return;
        }

        state.lastTouchTime = now;
      }

      // Two-finger pinch detection
      if (touches.length === 2) {
        const distance = getTouchDistance(touches[0], touches[1]);

        // Only start pinching if fingers are far enough apart
        if (distance >= PINCH_ZOOM.MIN_PINCH_DISTANCE) {
          state.initialDistance = distance;
          state.initialScale = scale;
          state.isPinching = true;
          setIsPinching(true);
        }
      }

      // Single-finger pan when zoomed
      if (touches.length === 1 && scale > minScale) {
        state.panStart = {
          x: touches[0].clientX,
          y: touches[0].clientY,
        };
        state.lastPanPosition = { ...position };
      }
    },
    [scale, position, minScale, resetOnDoubleTap, resetZoom]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;
      const state = touchStateRef.current;

      // Two-finger pinch
      if (touches.length === 2 && state.isPinching && state.initialDistance) {
        e.preventDefault(); // Prevent page zoom

        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const scaleRatio = currentDistance / state.initialDistance;
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, state.initialScale * scaleRatio)
        );

        setScale(newScale);

        // Reset position if zooming out to minScale
        if (newScale === minScale) {
          setPosition({ x: 0, y: 0 });
        }
      }

      // Single-finger pan when zoomed
      if (touches.length === 1 && state.panStart && scale > minScale) {
        e.preventDefault(); // Prevent page scrolling

        const touch = touches[0];
        const deltaX = touch.clientX - state.panStart.x;
        const deltaY = touch.clientY - state.panStart.y;

        // Calculate new position
        const newX = state.lastPanPosition.x + deltaX;
        const newY = state.lastPanPosition.y + deltaY;

        // Apply boundary constraints
        // Maximum pan distance is based on how much the image extends beyond viewport
        const maxPanX =
          (containerRef.current.width * (scale - 1)) / 2;
        const maxPanY =
          (containerRef.current.height * (scale - 1)) / 2;

        const constrainedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
        const constrainedY = Math.max(-maxPanY, Math.min(maxPanY, newY));

        setPosition({ x: constrainedX, y: constrainedY });
      }
    },
    [scale, minScale, maxScale]
  );

  const onTouchEnd = useCallback(() => {
    const state = touchStateRef.current;

    // Reset pinching state
    if (state.isPinching) {
      state.isPinching = false;
      state.initialDistance = null;
      setIsPinching(false);
    }

    // Reset pan state
    state.panStart = null;
  }, []);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    scale,
    position,
    isPinching,
    isZoomed: scale > minScale,
    resetZoom,
  };
}
