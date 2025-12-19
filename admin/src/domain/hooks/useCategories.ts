/**
 * Categories Domain Hook - 카테고리 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
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
  categoriesCacheKeys,
  categoriesCacheConfig,
} from '../../data/repository';
import type { SentenceCategory, ExhibitionCategory } from '../../core/types';

// ============ Shared Utilities ============

/**
 * 활성화된 카테고리만 필터링하고 displayOrder로 정렬
 * 문장형/전시명 카테고리 모두에서 재사용
 */
const filterActiveAndSort = <T extends { isActive: boolean; displayOrder: number }>(
  categories: T[]
): T[] =>
  categories
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

// ============ Sentence Categories Hooks ============

/**
 * 모든 문장형 카테고리 조회
 */
export const useSentenceCategories = () => {
  return useQuery({
    queryKey: categoriesCacheKeys.sentence.all(),
    queryFn: getSentenceCategories,
    ...categoriesCacheConfig,
  });
};

/**
 * 활성화된 문장형 카테고리만 조회
 * select 옵션을 사용하여 동일한 캐시에서 파생 데이터 생성 (효율적)
 */
export const useActiveSentenceCategories = () => {
  return useQuery({
    queryKey: categoriesCacheKeys.sentence.all(),
    queryFn: getSentenceCategories,
    select: filterActiveAndSort,
    ...categoriesCacheConfig,
  });
};

/**
 * 단일 문장형 카테고리 조회
 */
export const useSentenceCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: categoriesCacheKeys.sentence.detail(id || ''),
    queryFn: () => (id ? getSentenceCategory(id) : null),
    enabled: !!id,
    ...categoriesCacheConfig,
  });
};

/**
 * 문장형 카테고리 생성
 */
export const useCreateSentenceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>) =>
      createSentenceCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesCacheKeys.sentence.all(),
      });
    },
  });
};

/**
 * 문장형 카테고리 수정
 */
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
        queryKey: categoriesCacheKeys.sentence.all(),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesCacheKeys.sentence.detail(data.id),
      });
    },
  });
};

/**
 * 문장형 카테고리 삭제
 */
export const useDeleteSentenceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSentenceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesCacheKeys.sentence.all(),
      });
    },
  });
};

// ============ Exhibition Categories Hooks ============

/**
 * 모든 전시명 카테고리 조회
 */
export const useExhibitionCategories = () => {
  return useQuery({
    queryKey: categoriesCacheKeys.exhibition.all(),
    queryFn: getExhibitionCategories,
    ...categoriesCacheConfig,
  });
};

/**
 * 활성화된 전시명 카테고리만 조회
 * select 옵션을 사용하여 동일한 캐시에서 파생 데이터 생성 (효율적)
 */
export const useActiveExhibitionCategories = () => {
  return useQuery({
    queryKey: categoriesCacheKeys.exhibition.all(),
    queryFn: getExhibitionCategories,
    select: filterActiveAndSort,
    ...categoriesCacheConfig,
  });
};

/**
 * 단일 전시명 카테고리 조회
 */
export const useExhibitionCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: categoriesCacheKeys.exhibition.detail(id || ''),
    queryFn: () => (id ? getExhibitionCategory(id) : null),
    enabled: !!id,
    ...categoriesCacheConfig,
  });
};

/**
 * 전시명 카테고리 생성
 */
export const useCreateExhibitionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>) =>
      createExhibitionCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesCacheKeys.exhibition.all(),
      });
    },
  });
};

/**
 * 전시명 카테고리 수정
 */
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
        queryKey: categoriesCacheKeys.exhibition.all(),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesCacheKeys.exhibition.detail(data.id),
      });
    },
  });
};

/**
 * 전시명 카테고리 삭제
 */
export const useDeleteExhibitionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExhibitionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesCacheKeys.exhibition.all(),
      });
    },
  });
};

// ============ Shared Hooks ============

/**
 * 카테고리 순서 일괄 업데이트
 */
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
          queryKey: categoriesCacheKeys.sentence.all(),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: categoriesCacheKeys.exhibition.all(),
        });
      }
    },
  });
};

/**
 * 카테고리 활성/비활성 토글
 */
export const useToggleCategoryActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      id,
      isActive,
    }: {
      type: 'sentence' | 'exhibition';
      id: string;
      isActive: boolean;
    }) => {
      if (type === 'sentence') {
        return updateSentenceCategory(id, { isActive });
      } else {
        return updateExhibitionCategory(id, { isActive });
      }
    },
    onSuccess: (_, variables) => {
      if (variables.type === 'sentence') {
        queryClient.invalidateQueries({
          queryKey: categoriesCacheKeys.sentence.all(),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: categoriesCacheKeys.exhibition.all(),
        });
      }
    },
  });
};
