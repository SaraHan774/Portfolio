// GA4 Analytics API 클라이언트

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  'https://asia-northeast3-portfolio-nhb.cloudfunctions.net';

export interface DailyStats {
  date: string;
  activeUsers: number;
  pageViews: number;
}

export interface DailyVisitorsResponse {
  dailyStats: DailyStats[];
  summary: {
    totalUsers: number;
    totalPageViews: number;
    averageUsersPerDay: number;
  };
}

export interface PageStat {
  path: string;
  title: string;
  pageViews: number;
  activeUsers: number;
}

export interface PageStatsResponse {
  pageStats: PageStat[];
}

export interface RealtimeUsersResponse {
  activeUsers: number;
}

/**
 * 일일 방문자 통계 조회
 */
export const getDailyVisitors = async (days: number = 7): Promise<DailyVisitorsResponse> => {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/getDailyVisitors?days=${days}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch daily visitors: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 페이지별 통계 조회
 */
export const getPageStats = async (days: number = 7, limit: number = 10): Promise<PageStatsResponse> => {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/getPageStats?days=${days}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch page stats: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 실시간 활성 사용자 조회
 */
export const getRealtimeUsers = async (): Promise<RealtimeUsersResponse> => {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/getRealtimeUsers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch realtime users: ${response.statusText}`);
  }

  return response.json();
};
