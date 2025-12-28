'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useSentenceCategories as useSentenceCategoriesQuery, useExhibitionCategories as useExhibitionCategoriesQuery } from '@/domain';
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
  // Use domain hooks for data fetching with React Query
  const {
    data: sentenceCategories = [],
    isLoading: isSentenceLoading,
    error: sentenceError,
    refetch: refetchSentence,
  } = useSentenceCategoriesQuery();

  const {
    data: exhibitionCategories = [],
    isLoading: isExhibitionLoading,
    error: exhibitionError,
    refetch: refetchExhibition,
  } = useExhibitionCategoriesQuery();

  // Combined loading and error states
  const isLoading = isSentenceLoading || isExhibitionLoading;
  const error = sentenceError || exhibitionError;

  // Combined refetch function
  const refetch = useCallback(async () => {
    await Promise.all([refetchSentence(), refetchExhibition()]);
  }, [refetchSentence, refetchExhibition]);

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
      refetch,
      // Selectors
      ...selectors,
    }),
    [sentenceCategories, exhibitionCategories, isLoading, error, selectors, refetch]
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