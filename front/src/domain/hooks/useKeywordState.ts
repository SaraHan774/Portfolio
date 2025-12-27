// Custom hook for keyword state calculation logic

import { useMemo } from 'react';
import type { KeywordCategory, CategoryState, WorkOrder } from '../../core/types';

export interface UseKeywordStateOptions<T extends { workOrders?: WorkOrder[] }> {
  /** The keyword or category to calculate state for */
  keyword: T;
  /** Whether this item is currently selected */
  isSelected: boolean;
  /** Whether this item is currently hovered */
  isHovered: boolean;
  /** IDs of works in the currently selected category (for disabled state) */
  selectedWorkIds?: string[];
}

/**
 * Calculate the display state of a keyword or category based on selection and work associations
 *
 * This hook is generic and works with any type that has a workOrders property,
 * including KeywordCategory and ExhibitionCategory.
 *
 * State priority:
 * 1. active: Item is selected
 * 2. hover: Mouse is over item
 * 3. disabled: Category is selected but item has no common works
 * 4. clickable: Item is interactive and available
 * 5. basic: Item is non-interactive
 *
 * @param options - State calculation options
 * @returns Current category state
 */
export const useKeywordState = <T extends { workOrders?: WorkOrder[] }>({
  keyword,
  isSelected,
  isHovered,
  selectedWorkIds = [],
}: UseKeywordStateOptions<T>): CategoryState => {
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
