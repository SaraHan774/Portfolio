// Custom hook for floating window position calculation logic

import { useState, useEffect } from 'react';

export interface FloatingPosition {
  x: number;
  y: number;
}

export interface FloatingDimensions {
  width: number;
  height: number;
}

export interface UseFloatingPositionOptions {
  /** Original cursor/link position */
  position: FloatingPosition;
  /** Dimensions of the floating element */
  dimensions: FloatingDimensions;
  /** Offset from the target position (default: { x: 0, y: 8 }) */
  offset?: FloatingPosition;
  /** Padding from viewport edges (default: 10) */
  edgePadding?: number;
}

/**
 * Calculate and adjust floating window position to stay within viewport bounds
 *
 * Strategy (Dropdown Menu Style):
 * - Default: Top-left aligned above the target position
 * - If not enough space above: Position below the target
 * - If overflow right: Shift left to fit within viewport
 * - If overflow left: Align to left edge with padding
 * - Always maintain edge padding from viewport boundaries
 *
 * Performance Note:
 * - Position recalculates when dependencies change (position, dimensions, offset, edgePadding)
 * - To avoid unnecessary recalculations, memoize position/dimensions/offset objects in parent component
 * - Use useMemo or stable object references to prevent recalculation on every render
 *
 * @param options - Position calculation options
 * @returns Adjusted position that stays within viewport
 */
export const useFloatingPosition = ({
  position,
  dimensions,
  offset = { x: 0, y: 8 },
  edgePadding = 10,
}: UseFloatingPositionOptions): FloatingPosition => {
  const [adjustedPosition, setAdjustedPosition] = useState<FloatingPosition>({
    x: position.x,
    y: position.y,
  });

  // Destructure offset to avoid object identity issues
  const { x: offsetX, y: offsetY } = offset;

  useEffect(() => {
    const calculatePosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Start with left-aligned position
      let x = position.x + offsetX;

      // Vertical positioning: Default above, fallback below
      let y: number;
      const spaceAbove = position.y;
      const spaceBelow = windowHeight - position.y;

      // Check if there's enough space above (prefer above like dropdown menu)
      if (spaceAbove >= dimensions.height + offsetY + edgePadding) {
        // Position above the target
        y = position.y - dimensions.height - offsetY;
      } else if (spaceBelow >= dimensions.height + offsetY + edgePadding) {
        // Not enough space above, position below
        y = position.y + offsetY;
      } else {
        // Not enough space either way, position where there's more space
        if (spaceAbove > spaceBelow) {
          y = edgePadding; // Top of viewport
        } else {
          y = position.y + offsetY; // Below target
        }
      }

      // Right boundary check: If overflows right edge, shift left
      if (x + dimensions.width > windowWidth - edgePadding) {
        x = windowWidth - dimensions.width - edgePadding;
      }

      // Left boundary check: Ensure minimum padding from left edge
      if (x < edgePadding) {
        x = edgePadding;
      }

      // Top boundary check: Ensure minimum padding from top edge
      if (y < edgePadding) {
        y = edgePadding;
      }

      // Bottom boundary check: Ensure minimum padding from bottom edge
      if (y + dimensions.height > windowHeight - edgePadding) {
        y = windowHeight - dimensions.height - edgePadding;
      }

      setAdjustedPosition({ x, y });
    };

    calculatePosition();

    // Recalculate on window resize (to handle viewport boundary changes)
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [position.x, position.y, dimensions.width, dimensions.height, offsetX, offsetY, edgePadding]);

  return adjustedPosition;
};
