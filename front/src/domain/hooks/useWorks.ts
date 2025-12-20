// Custom hooks for works data fetching with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../data/cache/queryKeys';
import { workRepository } from '../../data/repository/WorkRepository';
import type { Work } from '../../core/types';

/**
 * Fetch all published works
 * Cached for 5 minutes
 */
export const usePublishedWorks = (): UseQueryResult<Work[], Error> => {
  return useQuery({
    queryKey: queryKeys.works.published(),
    queryFn: () => workRepository.getPublishedWorks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch single work by ID
 * Only enabled when ID is provided
 */
export const useWork = (id: string | undefined): UseQueryResult<Work, Error> => {
  return useQuery({
    queryKey: queryKeys.works.detail(id || ''),
    queryFn: () => workRepository.getWorkById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes (detail pages change less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Fetch works filtered by keyword (sentence category) ID
 */
export const useWorksByKeyword = (
  keywordId: string | undefined
): UseQueryResult<Work[], Error> => {
  return useQuery({
    queryKey: queryKeys.works.byKeyword(keywordId || ''),
    queryFn: () => workRepository.getWorksByKeywordId(keywordId!),
    enabled: !!keywordId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Fetch works filtered by exhibition category ID
 */
export const useWorksByExhibitionCategory = (
  categoryId: string | undefined
): UseQueryResult<Work[], Error> => {
  return useQuery({
    queryKey: queryKeys.works.byExhibitionCategory(categoryId || ''),
    queryFn: () => workRepository.getWorksByExhibitionCategoryId(categoryId!),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Fetch multiple works by IDs
 * Maintains original order
 */
export const useWorksByIds = (
  workIds: string[] | undefined
): UseQueryResult<Work[], Error> => {
  return useQuery({
    queryKey: queryKeys.works.byIds(workIds || []),
    queryFn: () => workRepository.getWorksByIds(workIds!),
    enabled: !!workIds && workIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
