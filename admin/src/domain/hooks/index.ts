/**
 * Domain Hooks - 비즈니스 로직 레이어
 * 모든 도메인 훅 re-export
 */

// Auth Hooks
export {
  useAuth,
  useCurrentUser,
  useIsAdmin,
  useRequireAuth,
  useRequireAdmin,
  useSetUserRole,
} from './useAuth';

// Works Hooks
export {
  useWorks,
  useWork,
  usePublishedWorks,
  useCreateWork,
  useUpdateWork,
  useDeleteWork,
  useToggleWorkPublish,
} from './useWorks';

// Categories Hooks
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
} from './useCategories';

// Settings Hooks
export {
  useSiteSettings,
  useUpdateSiteSettings,
  useUploadFavicon,
  useDeleteFavicon,
  useUpdateBrowserTitle,
  useUpdateFooterText,
} from './useSettings';

// Storage Hooks
export {
  useUploadImage,
  useUploadImages,
  useDeleteImage,
  useDeleteWorkImages,
  useImageManager,
} from './useStorage';

// Backup Hooks
export {
  useCreateBackup,
  useReadBackupFile,
  useRestoreBackup,
} from './useBackup';

// Analytics Hooks
export {
  useDailyVisitors,
  usePageStats,
  useRealtimeUsers,
} from './useAnalytics';
