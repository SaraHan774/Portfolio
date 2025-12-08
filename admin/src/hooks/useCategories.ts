// Categories React Query 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSentenceCategories,
  getSentenceCategory,
  createSentenceCategory,
  updateSentenceCategory,
  deleteSentenceCategory,
  getExhibitionCategories,
  getExhibitionCategory,
  createExhibitionCategory,
  updateExhibitionCategory,
  deleteExhibitionCategory,
  updateCategoryOrders,
} from '../services/categoriesService';
import type { SentenceCategory, ExhibitionCategory } from '../types';

// 쿼리 키
export const categoriesKeys = {
  all: ['categories'] as const,
  sentence: {
    all: () => [...categoriesKeys.all, 'sentence'] as const,
    lists: () => [...categoriesKeys.sentence.all(), 'list'] as const,
    details: () => [...categoriesKeys.sentence.all(), 'detail'] as const,
    detail: (id: string) => [...categoriesKeys.sentence.details(), id] as const,
  },
  exhibition: {
    all: () => [...categoriesKeys.all, 'exhibition'] as const,
    lists: () => [...categoriesKeys.exhibition.all(), 'list'] as const,
    details: () => [...categoriesKeys.exhibition.all(), 'detail'] as const,
    detail: (id: string) => [...categoriesKeys.exhibition.details(), id] as const,
  },
};

// Sentence Categories Hooks
export const useSentenceCategories = () => {
  return useQuery({
    queryKey: categoriesKeys.sentence.lists(),
    queryFn: getSentenceCategories,
  });
};

export const useSentenceCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: categoriesKeys.sentence.detail(id || ''),
    queryFn: () => (id ? getSentenceCategory(id) : null),
    enabled: !!id,
  });
};

export const useCreateSentenceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>
    ) => createSentenceCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.sentence.lists(),
      });
    },
  });
};

export const useUpdateSentenceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<SentenceCategory, 'id' | 'createdAt'>>;
    }) => updateSentenceCategory(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.sentence.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.sentence.detail(data.id),
      });
    },
  });
};

export const useDeleteSentenceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSentenceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.sentence.lists(),
      });
    },
  });
};

// Exhibition Categories Hooks
export const useExhibitionCategories = () => {
  return useQuery({
    queryKey: categoriesKeys.exhibition.lists(),
    queryFn: getExhibitionCategories,
  });
};

export const useExhibitionCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: categoriesKeys.exhibition.detail(id || ''),
    queryFn: () => (id ? getExhibitionCategory(id) : null),
    enabled: !!id,
  });
};

export const useCreateExhibitionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>
    ) => createExhibitionCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.exhibition.lists(),
      });
    },
  });
};

export const useUpdateExhibitionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<ExhibitionCategory, 'id' | 'createdAt'>>;
    }) => updateExhibitionCategory(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.exhibition.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.exhibition.detail(data.id),
      });
    },
  });
};

export const useDeleteExhibitionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExhibitionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.exhibition.lists(),
      });
    },
  });
};

// 순서 일괄 업데이트
export const useUpdateCategoryOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      orders,
    }: {
      type: 'sentence' | 'exhibition';
      orders: { id: string; displayOrder: number }[];
    }) => updateCategoryOrders(type, orders),
    onSuccess: (_, variables) => {
      if (variables.type === 'sentence') {
        queryClient.invalidateQueries({
          queryKey: categoriesKeys.sentence.lists(),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: categoriesKeys.exhibition.lists(),
        });
      }
    },
  });
};
