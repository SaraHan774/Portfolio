// Analytics hooks using React Query

import { useQuery } from '@tanstack/react-query';
import { getDailyVisitors, getPageStats, getRealtimeUsers } from '../../data/api/analyticsApi';

/**
 * 일일 방문자 통계 조회 Hook
 */
export const useDailyVisitors = (days: number = 7) => {
  return useQuery({
    queryKey: ['analytics', 'dailyVisitors', days],
    queryFn: () => getDailyVisitors(days),
    staleTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

/**
 * 페이지별 통계 조회 Hook
 */
export const usePageStats = (days: number = 7, limit: number = 10) => {
  return useQuery({
    queryKey: ['analytics', 'pageStats', days, limit],
    queryFn: () => getPageStats(days, limit),
    staleTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
};

/**
 * 실시간 활성 사용자 조회 Hook
 */
export const useRealtimeUsers = () => {
  return useQuery({
    queryKey: ['analytics', 'realtimeUsers'],
    queryFn: getRealtimeUsers,
    refetchInterval: 30 * 1000, // 30초마다 갱신
    staleTime: 0, // 항상 최신 데이터
    retry: 2,
  });
};
