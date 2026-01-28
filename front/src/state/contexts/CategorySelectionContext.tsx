'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo, startTransition } from 'react';

/**
 * Category selection state
 */
export interface CategorySelectionState {
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
}

/**
 * Category selection actions
 */
export interface CategorySelectionActions {
  selectKeyword: (keywordId: string) => void;
  selectExhibitionCategory: (categoryId: string) => void;
  clearSelection: () => void;
}

/**
 * Derived state selectors
 */
export interface CategorySelectionSelectors {
  isKeywordSelected: boolean;
  isExhibitionCategorySelected: boolean;
  hasAnySelection: boolean;
}

/**
 * Combined context type
 */
interface CategorySelectionContextType
  extends CategorySelectionState,
    CategorySelectionActions,
    CategorySelectionSelectors {}

const CategorySelectionContext = createContext<CategorySelectionContextType | undefined>(undefined);

export function CategorySelectionProvider({ children }: { children: ReactNode }) {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedExhibitionCategoryId, setSelectedExhibitionCategoryId] = useState<string | null>(null);

  // Actions - startTransition으로 감싸서 배칭 보장
  const selectKeyword = useCallback((keywordId: string) => {
    startTransition(() => {
      setSelectedKeywordId(keywordId);
      setSelectedExhibitionCategoryId(null); // Clear exhibition selection
    });
  }, []);

  const selectExhibitionCategory = useCallback((categoryId: string) => {
    startTransition(() => {
      setSelectedExhibitionCategoryId(categoryId);
      setSelectedKeywordId(null); // Clear keyword selection
    });
  }, []);

  const clearSelection = useCallback(() => {
    startTransition(() => {
      setSelectedKeywordId(null);
      setSelectedExhibitionCategoryId(null);
    });
  }, []);

  // Selectors (derived state)
  const selectors = useMemo<CategorySelectionSelectors>(
    () => ({
      isKeywordSelected: selectedKeywordId !== null,
      isExhibitionCategorySelected: selectedExhibitionCategoryId !== null,
      hasAnySelection: selectedKeywordId !== null || selectedExhibitionCategoryId !== null,
    }),
    [selectedKeywordId, selectedExhibitionCategoryId]
  );

  const value = useMemo<CategorySelectionContextType>(
    () => ({
      // State
      selectedKeywordId,
      selectedExhibitionCategoryId,
      // Actions
      selectKeyword,
      selectExhibitionCategory,
      clearSelection,
      // Selectors
      ...selectors,
    }),
    [
      selectedKeywordId,
      selectedExhibitionCategoryId,
      selectKeyword,
      selectExhibitionCategory,
      clearSelection,
      selectors,
    ]
  );

  return (
    <CategorySelectionContext.Provider value={value}>
      {children}
    </CategorySelectionContext.Provider>
  );
}

export function useCategorySelection() {
  const context = useContext(CategorySelectionContext);
  if (context === undefined) {
    throw new Error('useCategorySelection must be used within a CategorySelectionProvider');
  }
  return context;
}

/**
 * Individual selector hooks for fine-grained updates
 */
export function useSelectedKeywordId() {
  return useCategorySelection().selectedKeywordId;
}

export function useSelectedExhibitionCategoryId() {
  return useCategorySelection().selectedExhibitionCategoryId;
}

export function useIsKeywordSelected() {
  return useCategorySelection().isKeywordSelected;
}

export function useIsExhibitionCategorySelected() {
  return useCategorySelection().isExhibitionCategorySelected;
}

export function useHasAnySelection() {
  return useCategorySelection().hasAnySelection;
}