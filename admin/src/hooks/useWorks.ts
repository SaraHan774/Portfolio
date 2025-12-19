/**
 * @deprecated Use imports from '../domain' instead
 * This file is kept for backward compatibility
 */
export {
  useWorks,
  useWork,
  useCreateWork,
  useUpdateWork,
  useDeleteWork,
  usePublishedWorks,
  useToggleWorkPublish,
} from '../domain/hooks/useWorks';

// Legacy query keys (deprecated - use worksCacheKeys from repository)
export { worksCacheKeys as worksKeys } from '../data/repository';
