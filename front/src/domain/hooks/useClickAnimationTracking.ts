// Custom hook for click animation tracking logic

import { useState, useEffect, useCallback } from 'react';
import { categoryAnimationStore } from '@/core/utils';

export interface UseClickAnimationTrackingOptions {
  /** Unique identifier for the item (category or work) */
  itemId: string;
  /** Whether this item is currently selected */
  isSelected: boolean;
  /** Callback to invoke when item is clicked */
  onSelect: () => void;
  /** Whether the item is clickable in its current state */
  isClickable: boolean;
}

export interface UseClickAnimationTrackingReturn {
  /** Whether this item has been clicked before (persisted across sessions) */
  hasBeenClickedBefore: boolean;
  /** Whether this item was just clicked (used for dot fade-in animation) */
  justClicked: boolean;
  /** Memoized click handler that manages animation state */
  handleClick: () => void;
}

/**
 * Manages click tracking and animation state for interactive elements
 *
 * This hook centralizes the logic for tracking whether an item has been clicked before
 * (persisted via categoryAnimationStore) and whether it was just clicked (for animation timing).
 *
 * Used by TextCategory, SentenceCategory (AnimatedKeyword), and WorkTitleButton to:
 * - Track first-time clicks for dot fade-in animations
 * - Mark items as clicked before triggering selection
 * - Provide consistent click handling across components
 *
 * @example
 * ```tsx
 * const { hasBeenClickedBefore, justClicked, handleClick } = useClickAnimationTracking({
 *   itemId: category.id,
 *   isSelected,
 *   onSelect: () => selectCategory(category.id),
 *   isClickable: state === 'clickable' || state === 'active',
 * });
 *
 * // Use in JSX
 * <button onClick={handleClick}>
 *   <DotIndicator isVisible={isSelected} justAppeared={justClicked} />
 * </button>
 * ```
 *
 * @param options - Configuration options for click tracking
 * @returns Object containing click state and handler
 */
export const useClickAnimationTracking = ({
  itemId,
  isSelected,
  onSelect,
  isClickable,
}: UseClickAnimationTrackingOptions): UseClickAnimationTrackingReturn => {
  // Check if this item has been clicked before (persisted across sessions)
  const hasBeenClickedBefore = categoryAnimationStore.hasBeenClicked(itemId);

  // Track whether the item was just clicked (for animation timing)
  // Using useState instead of useRef because this value is needed for rendering
  const [justClicked, setJustClicked] = useState(false);

  // Reset justClicked flag after it's been used for initial animation
  useEffect(() => {
    if (justClicked && isSelected) {
      // Reset justClicked on next render cycle
      // React's batching ensures the animation starts before this resets
      setJustClicked(false);
    }
  }, [isSelected, justClicked]);

  // Memoized click handler
  const handleClick = useCallback(() => {
    if (isClickable) {
      // Mark as clicked BEFORE calling onSelect
      // This ensures hasBeenClickedBefore is true when the component re-renders with selected=true
      if (!hasBeenClickedBefore) {
        categoryAnimationStore.markAsClicked(itemId);
        setJustClicked(true);
      }

      // Trigger the selection callback
      onSelect();
    }
  }, [isClickable, hasBeenClickedBefore, itemId, onSelect]);

  return {
    hasBeenClickedBefore,
    justClicked,
    handleClick,
  };
};
