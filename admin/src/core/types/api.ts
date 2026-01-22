// API 및 도메인 모델 타입 정의

/**
 * 사용자 정보
 */
export interface User {
  id: string;
  email: string;
  googleId: string;
  displayName: string;
  profileImage?: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
  lastLoginAt: Date;
}

/**
 * 작업 이미지
 */
export interface WorkImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  listThumbnailUrl?: string;
  mediumUrl?: string;
  webpUrl?: string;
  order: number;
  width: number;
  height: number;
  fileSize?: number;
  uploadedFrom?: 'desktop' | 'mobile' | 'camera';
}

/**
 * 작업 영상 (YouTube Embed)
 */
export interface WorkVideo {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  embedUrl: string;
  title?: string;
  order: number;
}

/**
 * 미디어 아이템 (이미지 또는 영상)
 */
export type MediaItem =
  | { type: 'image'; data: WorkImage }
  | { type: 'video'; data: WorkVideo };

/**
 * 작업 순서
 */
export interface WorkOrder {
  workId: string;
  order: number;
}

/**
 * 키워드 카테고리
 */
export interface KeywordCategory {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  workOrders: WorkOrder[];
}

/**
 * 문장 카테고리
 */
export interface SentenceCategory {
  id: string;
  sentence: string;
  keywords: KeywordCategory[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 전시명 카테고리
 */
export interface ExhibitionCategory {
  id: string;
  title: string;
  description: {
    exhibitionType: string;
    venue: string;
    year: number;
  };
  displayOrder: number;
  workOrders: WorkOrder[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated Use ExhibitionCategory instead
 */
export type TextCategory = ExhibitionCategory;

/**
 * 작업 (Work)
 */
export interface Work {
  id: string;
  title: string;
  year?: number;
  /** @deprecated 사용하지 않음 - 캡션으로 대체 */
  shortDescription?: string;
  /** @deprecated 사용하지 않음 - 캡션으로 대체 */
  fullDescription?: string;
  thumbnailImageId: string;
  images: WorkImage[];
  videos?: WorkVideo[];
  caption?: string;
  sentenceCategoryIds: string[];
  exhibitionCategoryIds: string[];
  /** @deprecated Use exhibitionCategoryIds instead */
  textCategoryIds?: string[];
  isPublished: boolean;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

/**
 * 사이트 설정
 */
export interface SiteSettings {
  id: string;
  browserTitle: string;
  browserDescription: string;
  faviconUrl?: string;
  homeIconUrl?: string;
  homeIconHoverUrl?: string;
  footerText: string;
  updatedAt: Date;
}

/**
 * 백업 데이터 구조
 */
export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    works: Work[];
    sentenceCategories: SentenceCategory[];
    exhibitionCategories: ExhibitionCategory[];
    settings: SiteSettings;
  };
  metadata: {
    workCount: number;
    sentenceCategoryCount: number;
    exhibitionCategoryCount: number;
    totalSize: number;
  };
}

/**
 * 복원 옵션
 */
export interface RestoreOptions {
  restoreWorks: boolean;
  restoreSentenceCategories: boolean;
  restoreExhibitionCategories: boolean;
  restoreSettings: boolean;
  conflictStrategy: 'overwrite' | 'skip' | 'merge';
}
