// Mapper for transforming Firestore data to Settings domain types

import { Timestamp } from 'firebase/firestore';
import type { SiteSettings } from '@/core/types';
import { SETTINGS_DOC_ID as FIRESTORE_SETTINGS_DOC_ID } from '../../core/constants/firebase.constants';

// Re-export for convenience
export { FIRESTORE_SETTINGS_DOC_ID as SETTINGS_DOC_ID };

/**
 * Default site settings
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: FIRESTORE_SETTINGS_DOC_ID,
  browserTitle: 'Portfolio | 작품 갤러리',
  browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
  footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
  faviconUrl: undefined,
  homeIconUrl: undefined,
  homeIconHoverUrl: undefined,
  homeIconSize: 48,
  updatedAt: new Date(),
};

/**
 * Map Firestore document data to SiteSettings type
 */
export const mapFirestoreToSiteSettings = (
  id: string,
  data: Record<string, unknown>
): SiteSettings => ({
  id,
  browserTitle: (data.browserTitle as string) || DEFAULT_SITE_SETTINGS.browserTitle,
  browserDescription:
    (data.browserDescription as string) || DEFAULT_SITE_SETTINGS.browserDescription,
  footerText: (data.footerText as string) || DEFAULT_SITE_SETTINGS.footerText,
  faviconUrl: data.faviconUrl as string | undefined,
  homeIconUrl: data.homeIconUrl as string | undefined,
  homeIconHoverUrl: data.homeIconHoverUrl as string | undefined,
  homeIconSize: (data.homeIconSize as number) ?? DEFAULT_SITE_SETTINGS.homeIconSize,
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * Get default settings (fallback when Firestore doc doesn't exist)
 */
export const getDefaultSettings = (): SiteSettings => {
  return { ...DEFAULT_SITE_SETTINGS };
};
