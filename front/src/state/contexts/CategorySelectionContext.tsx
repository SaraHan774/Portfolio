'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CategorySelectionContextType {
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  selectKeyword: (keywordId: string) => void;
  selectExhibitionCategory: (categoryId: string) => void;
  clearSelection: () => void;
}

const CategorySelectionContext = createContext<CategorySelectionContextType | undefined>(undefined);

export function CategorySelectionProvider({ children }: { children: ReactNode }) {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedExhibitionCategoryId, setSelectedExhibitionCategoryId] = useState<string | null>(null);

  const selectKeyword = useCallback((keywordId: string) => {
    setSelectedKeywordId(keywordId);
    setSelectedExhibitionCategoryId(null); // Clear exhibition selection
  }, []);

  const selectExhibitionCategory = useCallback((categoryId: string) => {
    setSelectedExhibitionCategoryId(categoryId);
    setSelectedKeywordId(null); // Clear keyword selection
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeywordId(null);
    setSelectedExhibitionCategoryId(null);
  }, []);

  return (
    <CategorySelectionContext.Provider
      value={{
        selectedKeywordId,
        selectedExhibitionCategoryId,
        selectKeyword,
        selectExhibitionCategory,
        clearSelection,
      }}
    >
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