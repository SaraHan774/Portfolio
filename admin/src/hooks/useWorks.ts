// Works React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorks,
  getWork,
  createWork,
  updateWork,
  deleteWork,
} from '../services/worksService';
import type { Work } from '../types';

// 쿼리 키
export const worksKeys = {
  all: ['works'] as const,
  lists: () => [...worksKeys.all, 'list'] as const,
  list: (filters: string) => [...worksKeys.lists(), filters] as const,
  details: () => [...worksKeys.all, 'detail'] as const,
  detail: (id: string) => [...worksKeys.details(), id] as const,
};

// 모든 작업 조회
export const useWorks = () => {
  return useQuery({
    queryKey: worksKeys.lists(),
    queryFn: getWorks,
  });
};

// 단일 작업 조회
export const useWork = (id: string | undefined) => {
  return useQuery({
    queryKey: worksKeys.detail(id || ''),
    queryFn: () => (id ? getWork(id) : null),
    enabled: !!id,
  });
};

// 작업 생성
export const useCreateWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>) =>
      createWork(work),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worksKeys.lists() });
    },
  });
};

// 작업 수정
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
      queryClient.invalidateQueries({ queryKey: worksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: worksKeys.detail(data.id) });
    },
  });
};

// 작업 삭제
export const useDeleteWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worksKeys.lists() });
    },
  });
};
