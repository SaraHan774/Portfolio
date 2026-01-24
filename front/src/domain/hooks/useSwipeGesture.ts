import { useState, useRef, useCallback } from 'react';

export interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe (default: 50)
  velocityThreshold?: number; // Minimum velocity in px/ms to trigger swipe (default: 0.3)
}

export interface UseSwipeGestureReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  swipeProgress: number; // -1 to 1 representing swipe progress
  isSwiping: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isHorizontalSwipe: boolean | null; // null = not determined yet
}

/**
 * Generic swipe gesture detection hook
 * Features:
 * - Direction locking (horizontal vs vertical)
 * - Distance and velocity thresholds
 * - Smooth progress tracking
 */
export function useSwipeGesture(
  options: UseSwipeGestureOptions = {}
): UseSwipeGestureReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3,
  } = options;

  const [swipeProgress, setSwipeProgress] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const touchStateRef = useRef<TouchState | null>(null);
  const containerWidthRef = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    // Store container width for progress calculation
    const target = e.currentTarget as HTMLElement;
    containerWidthRef.current = target.offsetWidth;

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      isHorizontalSwipe: null,
    };

    setIsSwiping(false);
    setSwipeProgress(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !touchStateRef.current) return;

    const state = touchStateRef.current;
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;

    // Direction locking: Determine if this is a horizontal or vertical swipe
    // based on the first 10px of movement
    if (state.isHorizontalSwipe === null) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > 10 || absDeltaY > 10) {
        state.isHorizontalSwipe = absDeltaX > absDeltaY;
      }
    }

    // If horizontal swipe, prevent default scrolling and track progress
    if (state.isHorizontalSwipe) {
      e.preventDefault();
      setIsSwiping(true);

      // Calculate progress: normalize deltaX to -1 to 1 range
      // Use half the container width as the reference distance
      const referenceDistance = containerWidthRef.current * 0.5;
      const progress = Math.max(-1, Math.min(1, deltaX / referenceDistance));
      setSwipeProgress(progress);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStateRef.current) return;

    const state = touchStateRef.current;

    // Only process if this was a horizontal swipe
    if (state.isHorizontalSwipe) {
      const deltaX = state.currentX - state.startX;
      const deltaTime = Date.now() - state.startTime;
      const velocity = Math.abs(deltaX) / deltaTime; // px/ms

      // Check if swipe meets threshold (distance OR velocity)
      const meetsThreshold =
        Math.abs(deltaX) >= threshold || velocity >= velocityThreshold;

      if (meetsThreshold) {
        // Determine swipe direction and trigger callback
        if (deltaX < 0 && onSwipeLeft) {
          // Swiped left (negative deltaX)
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          // Swiped right (positive deltaX)
          onSwipeRight();
        }
      }
    }

    // Reset state
    touchStateRef.current = null;
    setIsSwiping(false);
    setSwipeProgress(0);
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold]);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeProgress,
    isSwiping,
  };
}
