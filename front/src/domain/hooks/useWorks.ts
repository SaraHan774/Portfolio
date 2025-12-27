// Custom hooks for works data fetching with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/src/data';
import { WorkRepository } from '@/src/data';
import type { Work } from '@/core/types';

/**
 * Fetch all published works
 * Cached for 5 minutes
 */
export const usePublishedWorks = (): UseQueryResult<Work[], Error> => {
  return useQuery({
    queryKey: queryKeys.works.published(),
    queryFn: () => WorkRepository.getPublishedWorks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch single work by ID
 * Only enabled when ID is provided
 */
export const useWork = (
  id: string | undefined
): UseQueryResult<Work | undefined, Error> => {
  return useQuery({
    queryKey: id ? queryKeys.works.detail(id) : ['works', 'detail', 'disabled'],
    queryFn: id ? () => WorkRepository.getWorkById(id) : async () => undefined,
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
    queryKey: keywordId
      ? queryKeys.works.byKeyword(keywordId)
      : ['works', 'byKeyword', 'disabled'],
    queryFn: keywordId
      ? () => WorkRepository.getWorksByKeywordId(keywordId)
      : async () => [],
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
    queryKey: categoryId
      ? queryKeys.works.byExhibitionCategory(categoryId)
      : ['works', 'byExhibitionCategory', 'disabled'],
    queryFn: categoryId
      ? () => WorkRepository.getWorksByExhibitionCategoryId(categoryId)
      : async () => [],
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
    queryKey:
      workIds && workIds.length > 0
        ? queryKeys.works.byIds(workIds)
        : ['works', 'byIds', 'disabled'],
    queryFn:
      workIds && workIds.length > 0
        ? () => WorkRepository.getWorksByIds(workIds)
        : async () => [],
    enabled: !!workIds && workIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
