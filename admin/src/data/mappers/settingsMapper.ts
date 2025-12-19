/**
 * Settings Mapper - Firestore 데이터 <-> Domain Model 변환
 */
import { Timestamp } from 'firebase/firestore';
import type { SiteSettings } from '../../core/types';

/** 기본 설정값 */
export const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, 'id' | 'updatedAt'> = {
  browserTitle: 'Portfolio | 작품 갤러리',
  browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
  footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
  faviconUrl: undefined,
};

/**
 * Firestore 데이터를 SiteSettings 도메인 모델로 변환
 */
export const mapFirestoreToSiteSettings = (
  id: string,
  data: Record<string, unknown>
): SiteSettings => ({
  id,
  browserTitle: (data.browserTitle as string) || DEFAULT_SITE_SETTINGS.browserTitle,
  browserDescription: (data.browserDescription as string) || DEFAULT_SITE_SETTINGS.browserDescription,
  footerText: (data.footerText as string) || DEFAULT_SITE_SETTINGS.footerText,
  faviconUrl: data.faviconUrl as string | undefined,
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * SiteSettings를 Firestore 저장용 데이터로 변환
 */
export const mapSiteSettingsToFirestore = (
  settings: Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>
): Record<string, unknown> => {
  const data: Record<string, unknown> = {};

  if (settings.browserTitle !== undefined) {
    data.browserTitle = settings.browserTitle;
  }
  if (settings.browserDescription !== undefined) {
    data.browserDescription = settings.browserDescription;
  }
  if (settings.footerText !== undefined) {
    data.footerText = settings.footerText;
  }
  if (settings.faviconUrl !== undefined) {
    data.faviconUrl = settings.faviconUrl;
  }

  return data;
};
