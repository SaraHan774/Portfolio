/**
 * @deprecated Use imports from '../domain' instead
 * This file is kept for backward compatibility
 */
export {
  // Sentence Categories
  useSentenceCategories,
  useSentenceCategory,
  useActiveSentenceCategories,
  useCreateSentenceCategory,
  useUpdateSentenceCategory,
  useDeleteSentenceCategory,
  // Exhibition Categories
  useExhibitionCategories,
  useExhibitionCategory,
  useActiveExhibitionCategories,
  useCreateExhibitionCategory,
  useUpdateExhibitionCategory,
  useDeleteExhibitionCategory,
  // Shared
  useUpdateCategoryOrders,
  useToggleCategoryActive,
} from '../domain/hooks/useCategories';

// Legacy query keys (deprecated - use categoriesCacheKeys from repository)
export { categoriesCacheKeys as categoriesKeys } from '../data/repository';
