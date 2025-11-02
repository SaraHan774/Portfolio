// 데이터 구조 타입 정의 (admin과 동일한 구조 사용)
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

export interface KeywordCategory {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  workOrders: WorkOrder[];
}

export interface SentenceCategory {
  id: string;
  sentence: string;
  keywords: KeywordCategory[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextCategory {
  id: string;
  name: string;
  displayOrder: number;
  workOrders: WorkOrder[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  workId: string;
  order: number;
}

export interface WorkImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  listThumbnailUrl?: string;
  mediumUrl?: string;
  webpUrl?: string;
  order: number;
  caption?: string;
  width: number;
  height: number;
  fileSize?: number;
  uploadedFrom?: 'desktop' | 'mobile' | 'camera';
}

export interface Work {
  id: string;
  title: string;
  shortDescription?: string;
  fullDescription: string;
  thumbnailImageId: string;
  images: WorkImage[];
  sentenceCategoryIds: string[];
  textCategoryIds: string[];
  isPublished: boolean;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

