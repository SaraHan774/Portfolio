// Custom hooks for categories data fetching with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../data/cache/queryKeys';
import { CategoryRepository } from '../../data/repository/CategoryRepository';
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
    queryFn: () => CategoryRepository.getSentenceCategories(),
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
    queryFn: () => CategoryRepository.getExhibitionCategories(),
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
    queryKey: keywordId
      ? queryKeys.categories.sentence.keyword(keywordId)
      : ['categories', 'sentence', 'keyword', 'disabled'],
    queryFn: keywordId
      ? () => CategoryRepository.getKeywordById(keywordId)
      : async () => undefined,
    enabled: !!keywordId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
