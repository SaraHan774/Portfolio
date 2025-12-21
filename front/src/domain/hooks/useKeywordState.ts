// Custom hook for keyword state calculation logic

import { useMemo } from 'react';
import type { KeywordCategory, CategoryState } from '../../core/types';

export interface UseKeywordStateOptions {
  /** The keyword to calculate state for */
  keyword: KeywordCategory;
  /** Whether this keyword is currently selected */
  isSelected: boolean;
  /** Whether this keyword is currently hovered */
  isHovered: boolean;
  /** IDs of works in the currently selected category (for disabled state) */
  selectedWorkIds?: string[];
}

/**
 * Calculate the display state of a keyword based on selection and work associations
 *
 * State priority:
 * 1. active: Keyword is selected
 * 2. hover: Mouse is over keyword
 * 3. disabled: Category is selected but keyword has no common works
 * 4. clickable: Keyword is interactive and available
 * 5. basic: Keyword is non-interactive
 *
 * @param options - State calculation options
 * @returns Current category state
 */
export const useKeywordState = ({
  keyword,
  isSelected,
  isHovered,
  selectedWorkIds = [],
}: UseKeywordStateOptions): CategoryState => {
  return useMemo(() => {
    // Active state: Currently selected
    if (isSelected) {
      return 'active';
    }

    // Hover state: Mouse over
    if (isHovered) {
      return 'hover';
    }

    // Disabled state: Selected category exists, but this keyword has no common works
    // Note: Even with empty workOrders, works may be linked via Work.sentenceCategoryIds
    if (selectedWorkIds.length > 0 && keyword.workOrders && keyword.workOrders.length > 0) {
      const keywordWorkIds = keyword.workOrders.map((order) => order.workId);
      const hasCommonWork = keywordWorkIds.some((workId) => selectedWorkIds.includes(workId));

      if (!hasCommonWork) {
        return 'disabled';
      }
    }

    // Clickable state: All keywords are clickable by default
    // (even with empty workOrders, works can be queried via Work.sentenceCategoryIds)
    return 'clickable';
  }, [keyword, isSelected, isHovered, selectedWorkIds]);
};
