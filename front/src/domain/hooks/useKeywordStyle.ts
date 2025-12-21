// Custom hook for keyword styling logic

import { useMemo } from 'react';
import type { CategoryState } from '../../core/types';

/**
 * Get CSS styles for keyword based on its current state
 *
 * Styling rules:
 * - basic: Gray, non-interactive
 * - clickable: Black, pointer cursor, normal weight
 * - hover: Transparent fill with stroke outline, pointer cursor
 * - active: Same as hover (transparent with stroke)
 * - disabled: Light gray, non-interactive
 *
 * @param state - Current category state
 * @returns CSS style object
 */
export const useKeywordStyle = (state: CategoryState): React.CSSProperties => {
  return useMemo(() => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
    };

    switch (state) {
      case 'basic':
        return {
          ...baseStyle,
          color: 'var(--color-category-basic)',
          cursor: 'default',
        };

      case 'clickable':
        return {
          ...baseStyle,
          color: 'var(--color-category-clickable)', // Full black - clickable
          cursor: 'pointer',
        };

      case 'hover':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
          cursor: 'pointer',
        };

      case 'active':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
          cursor: 'pointer',
        };

      case 'disabled':
        return {
          ...baseStyle,
          color: 'var(--color-category-disabled)',
          cursor: 'default',
        };

      default:
        return baseStyle;
    }
  }, [state]);
};
