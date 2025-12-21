'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getSentenceCategories, getExhibitionCategories } from '@/lib/services/categoriesService';
import type { SentenceCategory, ExhibitionCategory } from '@/types';

/**
 * Categories state (server data)
 */
export interface CategoriesState {
  sentenceCategories: SentenceCategory[];
  exhibitionCategories: ExhibitionCategory[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Categories actions
 */
export interface CategoriesActions {
  refetch: () => Promise<void>;
}

/**
 * Derived state selectors
 */
export interface CategoriesSelectors {
  hasSentenceCategories: boolean;
  hasExhibitionCategories: boolean;
  hasCategories: boolean;
  sentenceCategoriesCount: number;
  exhibitionCategoriesCount: number;
}

/**
 * Combined context type
 */
interface CategoriesContextType extends CategoriesState, CategoriesActions, CategoriesSelectors {}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [sentenceCategories, setSentenceCategories] = useState<SentenceCategory[]>([]);
  const [exhibitionCategories, setExhibitionCategories] = useState<ExhibitionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load categories function
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [sentences, exhibitions] = await Promise.all([
        getSentenceCategories(),
        getExhibitionCategories(),
      ]);
      setSentenceCategories(sentences);
      setExhibitionCategories(exhibitions);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load categories');
      setError(error);
      console.error('[CategoriesContext] Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load categories once on mount
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selectors (derived state)
  const selectors = useMemo<CategoriesSelectors>(
    () => ({
      hasSentenceCategories: sentenceCategories.length > 0,
      hasExhibitionCategories: exhibitionCategories.length > 0,
      hasCategories: sentenceCategories.length > 0 || exhibitionCategories.length > 0,
      sentenceCategoriesCount: sentenceCategories.length,
      exhibitionCategoriesCount: exhibitionCategories.length,
    }),
    [sentenceCategories, exhibitionCategories]
  );

  const value = useMemo<CategoriesContextType>(
    () => ({
      // State
      sentenceCategories,
      exhibitionCategories,
      isLoading,
      error,
      // Actions
      refetch: loadCategories,
      // Selectors
      ...selectors,
    }),
    [sentenceCategories, exhibitionCategories, isLoading, error, selectors]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}

/**
 * Individual selector hooks for fine-grained updates
 */
export function useSentenceCategories() {
  return useCategories().sentenceCategories;
}

export function useExhibitionCategories() {
  return useCategories().exhibitionCategories;
}

export function useIsCategoriesLoading() {
  return useCategories().isLoading;
}

export function useCategoriesError() {
  return useCategories().error;
}

export function useHasSentenceCategories() {
  return useCategories().hasSentenceCategories;
}

export function useHasExhibitionCategories() {
  return useCategories().hasExhibitionCategories;
}