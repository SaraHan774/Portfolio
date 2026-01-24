// API 관련 상수

/**
 * Firestore 컬렉션 이름
 */
export const collections = {
  works: 'works',
  users: 'users',
  sentenceCategories: 'sentenceCategories',
  exhibitionCategories: 'exhibitionCategories',
  settings: 'settings',
} as const;

/**
 * Firebase Storage 경로
 */
export const storagePaths = {
  worksImages: 'works/images',
  worksThumbnails: 'works/thumbnails',
  favicon: 'settings/favicon',
  homeIcon: 'settings/homeIcon',
} as const;

/**
 * API 타임아웃 설정 (ms)
 */
export const timeouts = {
  default: 30000,
  upload: 120000,
  longOperation: 60000,
} as const;

/**
 * 캐시 설정 (ms)
 */
export const cacheConfig = {
  staleTime: 5 * 60 * 1000, // 5분
  gcTime: 30 * 60 * 1000,   // 30분
  refetchOnWindowFocus: true,
} as const;
