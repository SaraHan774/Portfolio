import { useState, useRef, useCallback } from 'react';
import { PINCH_ZOOM } from '@/core/constants/ui.constants';

export interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  resetOnDoubleTap?: boolean;
}

export interface UsePinchZoomReturn {
  /** Callback ref — attach to a plain DOM element (not motion.div) */
  setContainerRef: (el: HTMLDivElement | null) => void;
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
 * Pinch zoom hook — uses a callback ref so listeners attach the
 * moment the target element enters the DOM, even if that happens
 * long after the hook is first called (e.g. conditional rendering).
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

  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  scaleRef.current = scale;
  positionRef.current = position;

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

  const setContainerRef = useCallback(
    (el: HTMLDivElement | null) => {
      // Tear down previous listeners
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      if (!el) return;

      const handleTouchStart = (e: TouchEvent) => {
        const touches = e.touches;
        const state = touchStateRef.current;

        // Double-tap detection
        if (resetOnDoubleTap && touches.length === 1) {
          const now = Date.now();
          const elapsed = now - state.lastTouchTime;
          if (elapsed < PINCH_ZOOM.DOUBLE_TAP_DELAY && elapsed > 0) {
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
          const dist = getTouchDistance(touches[0], touches[1]);
          if (dist >= PINCH_ZOOM.MIN_PINCH_DISTANCE) {
            state.initialDistance = dist;
            state.initialScale = scaleRef.current;
            state.isPinching = true;
            setIsPinching(true);
          }
        }

        // Single-finger pan when zoomed
        if (touches.length === 1 && scaleRef.current > minScale) {
          state.panStart = { x: touches[0].clientX, y: touches[0].clientY };
          state.lastPanPosition = { ...positionRef.current };
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        const touches = e.touches;
        const state = touchStateRef.current;

        // Pinch
        if (touches.length === 2 && state.isPinching && state.initialDistance) {
          e.preventDefault();
          const dist = getTouchDistance(touches[0], touches[1]);
          const newScale = Math.max(
            minScale,
            Math.min(maxScale, state.initialScale * (dist / state.initialDistance))
          );
          setScale(newScale);
          if (newScale === minScale) setPosition({ x: 0, y: 0 });
        }

        // Pan
        if (touches.length === 1 && state.panStart && scaleRef.current > minScale) {
          e.preventDefault();
          const dx = touches[0].clientX - state.panStart.x;
          const dy = touches[0].clientY - state.panStart.y;
          const s = scaleRef.current;
          const maxPanX = (el.offsetWidth * (s - 1)) / 2;
          const maxPanY = (el.offsetHeight * (s - 1)) / 2;
          setPosition({
            x: Math.max(-maxPanX, Math.min(maxPanX, state.lastPanPosition.x + dx)),
            y: Math.max(-maxPanY, Math.min(maxPanY, state.lastPanPosition.y + dy)),
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
    setContainerRef,
    scale,
    position,
    isPinching,
    isZoomed: scale > minScale,
    resetZoom,
  };
}
