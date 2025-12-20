// Custom hook for work filtering by category

import { useMemo } from 'react';
import type { Work } from '../../core/types';

export interface UseWorkFilteringOptions {
  works: Work[] | undefined;
  keywordId?: string;
  exhibitionCategoryId?: string;
}

export interface UseWorkFilteringReturn {
  filteredWorks: Work[];
  isFiltering: boolean;
  filterCount: number;
}

/**
 * Hook for filtering works by category
 * Supports filtering by keyword or exhibition category
 * Returns memoized filtered results
 */
export const useWorkFiltering = ({
  works,
  keywordId,
  exhibitionCategoryId,
}: UseWorkFilteringOptions): UseWorkFilteringReturn => {
  const filteredWorks = useMemo(() => {
    if (!works || works.length === 0) {
      return [];
    }

    // No filters applied
    if (!keywordId && !exhibitionCategoryId) {
      return works;
    }

    // Filter by keyword
    if (keywordId) {
      return works.filter((work) =>
        work.sentenceCategoryIds.includes(keywordId)
      );
    }

    // Filter by exhibition category
    if (exhibitionCategoryId) {
      return works.filter((work) =>
        work.exhibitionCategoryIds.includes(exhibitionCategoryId)
      );
    }

    return works;
  }, [works, keywordId, exhibitionCategoryId]);

  const isFiltering = !!keywordId || !!exhibitionCategoryId;
  const filterCount = filteredWorks.length;

  return {
    filteredWorks,
    isFiltering,
    filterCount,
  };
};
