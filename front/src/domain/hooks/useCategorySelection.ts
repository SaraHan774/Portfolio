// Custom hook for category selection state management

import { useState, useCallback } from 'react';

export type CategoryType = 'sentence' | 'exhibition';

export interface CategorySelection {
  type: CategoryType;
  id: string;
}

export interface UseCategorySelectionReturn {
  selectedCategory: CategorySelection | null;
  selectCategory: (type: CategoryType, id: string) => void;
  clearSelection: () => void;
  isCategorySelected: (type: CategoryType, id: string) => boolean;
}

/**
 * Hook for managing category selection state
 * Supports both sentence and exhibition categories
 */
export const useCategorySelection = (): UseCategorySelectionReturn => {
  const [selectedCategory, setSelectedCategory] =
    useState<CategorySelection | null>(null);

  const selectCategory = useCallback((type: CategoryType, id: string) => {
    setSelectedCategory({ type, id });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const isCategorySelected = useCallback(
    (type: CategoryType, id: string): boolean => {
      return (
        selectedCategory !== null &&
        selectedCategory.type === type &&
        selectedCategory.id === id
      );
    },
    [selectedCategory]
  );

  return {
    selectedCategory,
    selectCategory,
    clearSelection,
    isCategorySelected,
  };
};
