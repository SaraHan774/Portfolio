// Custom hooks for site settings data fetching with React Query

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../data/cache/queryKeys';
import { SettingsRepository } from '../../data/repository/SettingsRepository';
import type { SiteSettings } from '../../core/types';

/**
 * Fetch site settings
 * Cached for 30 minutes (settings change very infrequently)
 */
export const useSiteSettings = (): UseQueryResult<SiteSettings, Error> => {
  return useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => SettingsRepository.getSiteSettings(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};
