// 공통 유틸리티 타입 정의

/**
 * 페이지네이션 정보
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 정렬 옵션
 */
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 필터 옵션
 */
export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: unknown;
}

/**
 * 쿼리 옵션
 */
export interface QueryOptions {
  pagination?: Partial<Pagination>;
  sort?: SortOption;
  filters?: FilterOption[];
}

/**
 * 이미지 리사이즈 옵션
 */
export interface ImageResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

/**
 * 이미지 크기 정보
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 업로드 진행률
 */
export interface UploadProgress {
  fileIndex: number;
  progress: number;
  fileName?: string;
}
