// Mapper for transforming Firestore data to Settings domain types

import { Timestamp } from 'firebase/firestore';
import type { SiteSettings } from '@/core/types';
import { SETTINGS_DOC_ID } from '@/core/constants';

/**
 * Default site settings
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: SETTINGS_DOC_ID,
  browserTitle: 'Portfolio | 작품 갤러리',
  browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
  footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
  faviconUrl: undefined,
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
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * Get default settings (fallback when Firestore doc doesn't exist)
 */
export const getDefaultSettings = (): SiteSettings => {
  return { ...DEFAULT_SITE_SETTINGS };
};
