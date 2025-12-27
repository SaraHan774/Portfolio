import { useWorksByKeyword, useWorksByExhibitionCategory } from './useWorks';
import type { Work } from '@/core/types';

interface FilteredWorksResult {
  works: Work[];
  isLoading: boolean;
  error: Error | null;
  hasData: boolean; // True if data has been successfully fetched
}

/**
 * Unified hook for filtering works by keyword or exhibition category
 * Eliminates code duplication between keyword and exhibition filtering
 */
export const useFilteredWorks = (
  keywordId: string | null,
  exhibitionCategoryId: string | null
): FilteredWorksResult => {
  const {
    data: keywordWorks,
    isLoading: isLoadingKeyword,
    isSuccess: isSuccessKeyword,
    error: keywordError,
  } = useWorksByKeyword(keywordId || undefined);

  const {
    data: exhibitionWorks,
    isLoading: isLoadingExhibition,
    isSuccess: isSuccessExhibition,
    error: exhibitionError,
  } = useWorksByExhibitionCategory(exhibitionCategoryId || undefined);

  if (keywordId) {
    return {
      works: keywordWorks ?? [],
      isLoading: isLoadingKeyword,
      error: keywordError,
      hasData: isSuccessKeyword,
    };
  }

  if (exhibitionCategoryId) {
    return {
      works: exhibitionWorks ?? [],
      isLoading: isLoadingExhibition,
      error: exhibitionError,
      hasData: isSuccessExhibition,
    };
  }

  return {
    works: [],
    isLoading: false,
    error: null,
    hasData: false,
  };
};
