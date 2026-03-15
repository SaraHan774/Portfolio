import { useState, useRef, useCallback } from 'react';
import { PINCH_ZOOM } from '@/core/constants/ui.constants';

export interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  resetOnDoubleTap?: boolean;
}

export interface UsePinchZoomReturn {
  /** Callback ref — attach to the element that receives touch gestures */
  containerRef: (el: HTMLDivElement | null) => void;
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
  panStart: { x: number; y: number } | null;
  lastPanPosition: { x: number; y: number };
}

function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Pinch zoom hook using native DOM event listeners (non-passive)
 *
 * Uses a callback ref so listeners are (re-)attached whenever the
 * target element mounts, even if that happens after the first render
 * (e.g. when isTouchDevice flips from false → true after hydration).
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
    panStart: null,
    lastPanPosition: { x: 0, y: 0 },
  });

  // Keep latest values in refs for use inside native event listeners
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  scaleRef.current = scale;
  positionRef.current = position;

  // Track the currently-bound element so we can clean up
  const elRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const resetZoom = useCallback(() => {
    setScale(minScale);
    setPosition({ x: 0, y: 0 });
    setIsPinching(false);
    const state = touchStateRef.current;
    state.initialDistance = null;
    state.isPinching = false;
    state.panStart = null;
  }, [minScale]);

  /**
   * Callback ref: called every time React attaches/detaches the DOM node.
   * Handles listener setup/teardown without useEffect timing issues.
   */
  const containerRef = useCallback(
    (el: HTMLDivElement | null) => {
      // Cleanup previous listeners
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      elRef.current = el;
      if (!el) return;

      const handleTouchStart = (e: TouchEvent) => {
        const touches = e.touches;
        const state = touchStateRef.current;

        // Double-tap detection
        if (resetOnDoubleTap && touches.length === 1) {
          const now = Date.now();
          const timeSinceLastTouch = now - state.lastTouchTime;

          if (
            timeSinceLastTouch < PINCH_ZOOM.DOUBLE_TAP_DELAY &&
            timeSinceLastTouch > 0
          ) {
            e.preventDefault();
            resetZoom();
            state.lastTouchTime = 0;
            return;
          }
          state.lastTouchTime = now;
        }

        // Two-finger pinch start
        if (touches.length === 2) {
          e.preventDefault();
          const distance = getTouchDistance(touches[0], touches[1]);

          if (distance >= PINCH_ZOOM.MIN_PINCH_DISTANCE) {
            state.initialDistance = distance;
            state.initialScale = scaleRef.current;
            state.isPinching = true;
            setIsPinching(true);
          }
        }

        // Single-finger pan when zoomed
        if (touches.length === 1 && scaleRef.current > minScale) {
          state.panStart = {
            x: touches[0].clientX,
            y: touches[0].clientY,
          };
          state.lastPanPosition = { ...positionRef.current };
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const touches = e.touches;
        const state = touchStateRef.current;

        // Two-finger pinch
        if (
          touches.length === 2 &&
          state.isPinching &&
          state.initialDistance
        ) {
          e.preventDefault();

          const currentDistance = getTouchDistance(touches[0], touches[1]);
          const scaleRatio = currentDistance / state.initialDistance;
          const newScale = Math.max(
            minScale,
            Math.min(maxScale, state.initialScale * scaleRatio)
          );

          setScale(newScale);

          if (newScale === minScale) {
            setPosition({ x: 0, y: 0 });
          }
        }

        // Single-finger pan when zoomed
        if (
          touches.length === 1 &&
          state.panStart &&
          scaleRef.current > minScale
        ) {
          e.preventDefault();

          const touch = touches[0];
          const deltaX = touch.clientX - state.panStart.x;
          const deltaY = touch.clientY - state.panStart.y;

          const newX = state.lastPanPosition.x + deltaX;
          const newY = state.lastPanPosition.y + deltaY;

          const currentScale = scaleRef.current;
          const containerWidth = el.offsetWidth;
          const containerHeight = el.offsetHeight;
          const maxPanX = (containerWidth * (currentScale - 1)) / 2;
          const maxPanY = (containerHeight * (currentScale - 1)) / 2;

          setPosition({
            x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
            y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
          });
        }
      };

      const handleTouchEnd = () => {
        const state = touchStateRef.current;
        if (state.isPinching) {
          state.isPinching = false;
          state.initialDistance = null;
          setIsPinching(false);
        }
        state.panStart = null;
      };

      // Attach with { passive: false } so preventDefault() works
      el.addEventListener('touchstart', handleTouchStart, { passive: false });
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
      el.addEventListener('touchend', handleTouchEnd);

      cleanupRef.current = () => {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('touchend', handleTouchEnd);
      };
    },
    [minScale, maxScale, resetOnDoubleTap, resetZoom]
  );

  return {
    containerRef,
    scale,
    position,
    isPinching,
    isZoomed: scale > minScale,
    resetZoom,
  };
}
