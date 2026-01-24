/**
 * Settings Repository - 사이트 설정 레포지토리
 * API 레이어를 래핑하고 캐싱 로직 제공
 */
import * as settingsApi from '../api/settingsApi';
import * as storageApi from '../api/storageApi';
import { cacheKeys, cacheConfig } from './cacheKeys';
import type { SiteSettings } from '../../core/types';

/**
 * 캐시 키 및 설정 export (React Query에서 사용)
 */
export const settingsCacheKeys = cacheKeys.settings;
export const settingsCacheConfig = cacheConfig.static;

/**
 * 사이트 설정 조회
 */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  return settingsApi.fetchSiteSettings();
};

/**
 * 사이트 설정 업데이트
 */
export const updateSiteSettings = async (
  updates: Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>
): Promise<SiteSettings> => {
  return settingsApi.updateSiteSettings(updates);
};

/**
 * 파비콘 업로드 및 URL 업데이트
 */
export const uploadFavicon = async (file: File): Promise<string> => {
  const faviconUrl = await storageApi.uploadFavicon(file);
  await settingsApi.updateFaviconUrl(faviconUrl);
  return faviconUrl;
};

/**
 * 파비콘 삭제
 */
export const deleteFavicon = async (): Promise<void> => {
  await storageApi.deleteFavicon();
  await settingsApi.removeFaviconUrl();
};

/**
 * 홈 아이콘 업로드 및 URL 업데이트 (기본 상태)
 */
export const uploadHomeIcon = async (file: File): Promise<string> => {
  const homeIconUrl = await storageApi.uploadHomeIcon(file);
  await settingsApi.updateHomeIconUrl(homeIconUrl);
  return homeIconUrl;
};

/**
 * 홈 아이콘 업로드 및 URL 업데이트 (호버 상태)
 */
export const uploadHomeIconHover = async (file: File): Promise<string> => {
  const homeIconHoverUrl = await storageApi.uploadHomeIconHover(file);
  await settingsApi.updateHomeIconHoverUrl(homeIconHoverUrl);
  return homeIconHoverUrl;
};

/**
 * 홈 아이콘 삭제 (기본 상태)
 */
export const deleteHomeIcon = async (): Promise<void> => {
  await storageApi.deleteHomeIcon();
  await settingsApi.removeHomeIconUrl();
};

/**
 * 홈 아이콘 삭제 (호버 상태)
 */
export const deleteHomeIconHover = async (): Promise<void> => {
  await storageApi.deleteHomeIconHover();
  await settingsApi.removeHomeIconHoverUrl();
};

/**
 * 홈 아이콘 크기 업데이트
 */
export const updateHomeIconSize = async (size: number): Promise<void> => {
  await settingsApi.updateHomeIconSize(size);
};
