// Custom hook for work list horizontal scroll logic

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

export interface UseWorkListScrollOptions {
  /** Scroll direction */
  direction?: 'ltr' | 'rtl';
  /** Number of items in the list (to detect changes) */
  itemCount: number;
}

export interface UseWorkListScrollResult {
  /** Ref to attach to scroll container */
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /** Whether to show left scroll arrow */
  showLeftArrow: boolean;
  /** Whether to show right scroll arrow */
  showRightArrow: boolean;
  /** Function to scroll left or right */
  scroll: (direction: 'left' | 'right') => void;
}

/**
 * Manage horizontal scroll state and indicators for work list
 *
 * Features:
 * - Detects scroll overflow and shows/hides arrow indicators
 * - Handles both LTR and RTL scroll directions
 * - Recalculates on window resize
 * - Smooth scrolling
 *
 * @param options - Scroll configuration options
 * @returns Scroll container ref and arrow visibility state
 */
export const useWorkListScroll = ({
  direction = 'ltr',
  itemCount,
}: UseWorkListScrollOptions): UseWorkListScrollResult => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Memoize checkScrollButtons to prevent stale closure issues
  const checkScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const hasOverflow = scrollWidth > clientWidth;

    if (!hasOverflow) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    // RTL direction has inverted scroll behavior
    if (direction === 'rtl') {
      // RTL: scrollLeft starts at 0 and decreases to negative values
      setShowRightArrow(scrollLeft < 0);
      setShowLeftArrow(scrollLeft > -(scrollWidth - clientWidth) + 1);
    } else {
      // LTR: scrollLeft starts at 0 and increases
      setShowLeftArrow(scrollLeft > 1);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, [direction]);

  useEffect(() => {
    checkScrollButtons();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [itemCount, checkScrollButtons]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 200;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll =
      dir === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  return {
    scrollContainerRef,
    showLeftArrow,
    showRightArrow,
    scroll,
  };
};
