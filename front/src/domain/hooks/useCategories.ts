// Custom hooks for categories data fetching with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../data/cache/queryKeys';
import { categoryRepository } from '../../data/repository/CategoryRepository';
import type {
  SentenceCategory,
  ExhibitionCategory,
  SentenceCategoryKeyword,
} from '../../core/types';

/**
 * Fetch all active sentence categories with their keywords
 * Cached for 10 minutes (categories change infrequently)
 */
export const useSentenceCategories = (): UseQueryResult<
  SentenceCategory[],
  Error
> => {
  return useQuery({
    queryKey: queryKeys.categories.sentence.all(),
    queryFn: () => categoryRepository.getSentenceCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Fetch all active exhibition categories
 * Cached for 10 minutes
 */
export const useExhibitionCategories = (): UseQueryResult<
  ExhibitionCategory[],
  Error
> => {
  return useQuery({
    queryKey: queryKeys.categories.exhibition.all(),
    queryFn: () => categoryRepository.getExhibitionCategories(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Fetch single keyword by ID from sentence categories
 * Derived from sentence categories query
 */
export const useKeyword = (
  keywordId: string | undefined
): UseQueryResult<SentenceCategoryKeyword | undefined, Error> => {
  return useQuery({
    queryKey: queryKeys.categories.sentence.keyword(keywordId || ''),
    queryFn: () => categoryRepository.getKeywordById(keywordId!),
    enabled: !!keywordId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
