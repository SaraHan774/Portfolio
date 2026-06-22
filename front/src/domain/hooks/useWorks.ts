// Custom hooks for works data fetching with React Query

import { useCallback } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/src/data';
import { WorkRepository } from '@/src/data';
import type { Work } from '@/core/types';

/** useWork 상세 쿼리와 동일한 캐시 정책 (prefetch ↔ 실제 조회 키/staleTime 일치 필수) */
const WORK_DETAIL_STALE_TIME = 10 * 60 * 1000;

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
    staleTime: WORK_DETAIL_STALE_TIME, // 10 minutes (detail pages change less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * 작품 상세 데이터를 미리 가져오는 prefetch 함수를 반환한다.
 * 호버 등 "곧 모달을 열 가능성이 높은" 시점에 호출하면, 모달 진입 시
 * Firestore 왕복(스피너) 없이 즉시 렌더되어 LCP 이미지 로딩이 조기 시작된다.
 * 캐시 키/staleTime이 useWork와 동일하므로 중복 조회나 동작 변경은 없다.
 */
export const usePrefetchWork = (): ((id: string | undefined) => void) => {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string | undefined) => {
      if (!id) return;
      queryClient.prefetchQuery({
        queryKey: queryKeys.works.detail(id),
        queryFn: () => WorkRepository.getWorkById(id),
        staleTime: WORK_DETAIL_STALE_TIME,
      });
    },
    [queryClient]
  );
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
