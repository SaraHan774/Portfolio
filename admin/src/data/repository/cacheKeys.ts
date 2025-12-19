/**
 * Cache Keys - React Query 캐시 키 정의
 * 모든 캐시 키를 중앙에서 관리하여 일관성 유지
 */

export const cacheKeys = {
  // Works
  works: {
    all: ['works'] as const,
    lists: () => [...cacheKeys.works.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...cacheKeys.works.lists(), filters] as const,
    details: () => [...cacheKeys.works.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.works.details(), id] as const,
    published: () => [...cacheKeys.works.all, 'published'] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    sentence: {
      all: () => [...cacheKeys.categories.all, 'sentence'] as const,
      lists: () => [...cacheKeys.categories.sentence.all(), 'list'] as const,
      detail: (id: string) =>
        [...cacheKeys.categories.sentence.all(), 'detail', id] as const,
    },
    exhibition: {
      all: () => [...cacheKeys.categories.all, 'exhibition'] as const,
      lists: () => [...cacheKeys.categories.exhibition.all(), 'list'] as const,
      detail: (id: string) =>
        [...cacheKeys.categories.exhibition.all(), 'detail', id] as const,
    },
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    site: () => [...cacheKeys.settings.all, 'site'] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...cacheKeys.auth.all, 'user'] as const,
  },
} as const;

/**
 * 캐시 설정 - staleTime, gcTime 등
 */
export const cacheConfig = {
  // 자주 변경되지 않는 데이터 (카테고리, 설정)
  static: {
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
  },

  // 자주 변경될 수 있는 데이터 (작품)
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 10 * 60 * 1000, // 10분
  },

  // 실시간 데이터 (인증 상태)
  realtime: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5분
  },
} as const;
