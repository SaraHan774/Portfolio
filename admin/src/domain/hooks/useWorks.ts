/**
 * Works Domain Hook - 작품 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorks,
  getWork,
  getWorksPaginated,
  createWork,
  updateWork,
  deleteWork,
  worksCacheKeys,
  worksCacheConfig,
} from '../../data/repository';
import type { Work, PaginatedResult } from '../../core/types';

/**
 * 모든 작품 조회
 */
export const useWorks = () => {
  return useQuery({
    queryKey: worksCacheKeys.lists(),
    queryFn: getWorks,
    ...worksCacheConfig,
  });
};

/**
 * 공개된 작품만 조회
 */
export const usePublishedWorks = () => {
  return useQuery({
    queryKey: worksCacheKeys.published(),
    queryFn: async () => {
      const works = await getWorks();
      return works.filter((work) => work.isPublished);
    },
    ...worksCacheConfig,
  });
};

/**
 * 페이지네이션으로 작품 조회
 */
export const usePaginatedWorks = (pageSize: number) => {
  const [cursors, setCursors] = useState<unknown[]>([undefined]);
  const [currentPage, setCurrentPage] = useState(1);

  const cursor = cursors[currentPage - 1];

  const query = useQuery<PaginatedResult<Work>>({
    queryKey: worksCacheKeys.list({ page: currentPage, pageSize }),
    queryFn: () => getWorksPaginated(pageSize, cursor as undefined),
    ...worksCacheConfig,
  });

  const goToNextPage = useCallback(() => {
    if (query.data?.hasMore && query.data.lastCursor) {
      const nextPage = currentPage + 1;
      setCursors((prev) => {
        const next = [...prev];
        next[nextPage - 1] = query.data!.lastCursor;
        return next;
      });
      setCurrentPage(nextPage);
    }
  }, [query.data, currentPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= cursors.length) {
      setCurrentPage(page);
    }
  }, [cursors.length]);

  const resetPagination = useCallback(() => {
    setCursors([undefined]);
    setCurrentPage(1);
  }, []);

  return {
    ...query,
    currentPage,
    goToNextPage,
    goToPrevPage,
    goToPage,
    resetPagination,
    hasNextPage: query.data?.hasMore ?? false,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * 단일 작품 조회
 */
export const useWork = (id: string | undefined) => {
  return useQuery({
    queryKey: worksCacheKeys.detail(id || ''),
    queryFn: () => (id ? getWork(id) : null),
    enabled: !!id,
    ...worksCacheConfig,
  });
};

/**
 * 작품 생성 Mutation
 * Note: worksCacheKeys.all은 ['works'] 배열로, 모든 works 관련 쿼리를 무효화
 */
export const useCreateWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>) => createWork(work),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worksCacheKeys.all });
    },
  });
};

/**
 * 작품 수정 Mutation
 */
export const useUpdateWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Work, 'id' | 'createdAt'>>;
    }) => updateWork(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: worksCacheKeys.all });
      queryClient.invalidateQueries({ queryKey: worksCacheKeys.detail(data.id) });
    },
  });
};

/**
 * 작품 삭제 Mutation
 */
export const useDeleteWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worksCacheKeys.all });
    },
  });
};

/**
 * 작품 공개/비공개 토글
 */
export const useToggleWorkPublish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return updateWork(id, { isPublished });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: worksCacheKeys.all });
      queryClient.invalidateQueries({ queryKey: worksCacheKeys.detail(data.id) });
    },
  });
};
