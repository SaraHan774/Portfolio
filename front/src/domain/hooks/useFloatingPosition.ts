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
 * Strategy:
 * - Default: Center-aligned below the target position
 * - If overflow right: Align to right edge
 * - If overflow bottom: Position above the target
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

      // Start with center-aligned position below the target
      let x = position.x - dimensions.width / 2; // Center align
      let y = position.y + offsetY; // Below target with offset

      // Right boundary check: If overflows right edge, align to right
      if (x + dimensions.width > windowWidth - edgePadding) {
        x = windowWidth - dimensions.width - edgePadding;
      }

      // Bottom boundary check: If overflows bottom, position above target
      if (y + dimensions.height > windowHeight - edgePadding) {
        y = position.y - dimensions.height - offsetY; // Above target
      }

      // Left boundary check
      if (x < edgePadding) {
        x = edgePadding;
      }

      // Top boundary check
      if (y < edgePadding) {
        y = edgePadding;
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
