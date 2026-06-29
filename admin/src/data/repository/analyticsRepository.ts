/**
 * Analytics Repository - GA4 통계 데이터 레포지토리
 * API 레이어를 래핑하고 캐시 키/설정 제공
 */
import * as analyticsApi from '../api/analyticsApi';
import { cacheKeys, cacheConfig } from './cacheKeys';
import type {
  DailyVisitorsResponse,
  PageStatsResponse,
  RealtimeUsersResponse,
} from '../api/analyticsApi';

/**
 * 캐시 키 및 설정 export (React Query에서 사용)
 */
export const analyticsCacheKeys = cacheKeys.analytics;
export const analyticsCacheConfig = cacheConfig.static;
export const realtimeCacheConfig = cacheConfig.realtime;

/**
 * 일일 방문자 통계 조회
 */
export const getDailyVisitors = async (days?: number): Promise<DailyVisitorsResponse> => {
  return analyticsApi.getDailyVisitors(days);
};

/**
 * 페이지별 통계 조회
 */
export const getPageStats = async (
  days?: number,
  limit?: number
): Promise<PageStatsResponse> => {
  return analyticsApi.getPageStats(days, limit);
};

/**
 * 실시간 활성 사용자 조회
 */
export const getRealtimeUsers = async (): Promise<RealtimeUsersResponse> => {
  return analyticsApi.getRealtimeUsers();
};
