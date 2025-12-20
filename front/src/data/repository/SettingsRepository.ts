// Settings Repository - Data access layer for site settings with caching

import { queryKeys } from '../cache';
import * as settingsApi from '../api/settingsApi';
import type { SiteSettings } from '@/core/types';

/**
 * Settings Repository
 * Provides methods for fetching site settings with React Query integration
 */
export class SettingsRepository {
  /**
   * Get query key for site settings
   */
  static getSiteSettingsKey() {
    return queryKeys.settings.site();
  }

  /**
   * Fetch site settings
   */
  static async getSiteSettings(): Promise<SiteSettings> {
    return settingsApi.fetchSiteSettings();
  }
}
