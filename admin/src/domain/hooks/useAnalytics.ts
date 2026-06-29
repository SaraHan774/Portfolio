/**
 * Analytics Domain Hook - GA4 통계 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useQuery } from '@tanstack/react-query';
import {
  getDailyVisitors,
  getPageStats,
  getRealtimeUsers,
  analyticsCacheKeys,
  analyticsCacheConfig,
  realtimeCacheConfig,
} from '../../data/repository';

/**
 * 일일 방문자 통계 조회 Hook
 */
export const useDailyVisitors = (days: number = 7) => {
  return useQuery({
    queryKey: analyticsCacheKeys.dailyVisitors(days),
    queryFn: () => getDailyVisitors(days),
    ...analyticsCacheConfig,
    retry: 2,
  });
};

/**
 * 페이지별 통계 조회 Hook
 */
export const usePageStats = (days: number = 7, limit: number = 10) => {
  return useQuery({
    queryKey: analyticsCacheKeys.pageStats(days, limit),
    queryFn: () => getPageStats(days, limit),
    ...analyticsCacheConfig,
    retry: 2,
  });
};

/**
 * 실시간 활성 사용자 조회 Hook
 */
export const useRealtimeUsers = () => {
  return useQuery({
    queryKey: analyticsCacheKeys.realtimeUsers(),
    queryFn: getRealtimeUsers,
    ...realtimeCacheConfig,
    refetchInterval: 30 * 1000, // 30초마다 갱신
    retry: 2,
  });
};
