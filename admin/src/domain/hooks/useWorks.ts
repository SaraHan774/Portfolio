/**
 * Works Domain Hook - 작품 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorks,
  getWork,
  createWork,
  updateWork,
  deleteWork,
  worksCacheKeys,
  worksCacheConfig,
} from '../../data/repository';
import type { Work } from '../../core/types';

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
