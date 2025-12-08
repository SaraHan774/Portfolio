// 데이터 구조 타입 정의
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

// 전시명 카테고리: 통으로 클릭 (작업명 + 간단 설명)
export interface ExhibitionCategory {
  id: string;
  title: string;              // 작업명 (예: "Cushioning Attack")
  description: {              // 간단 설명 (구조화된 형태)
    exhibitionType: string;   // 전시 유형 (예: "2인전", "개인전", "그룹전")
    venue: string;            // 공간 (예: "YPCSpace")
    year: number;             // 년도 (예: 2023)
  };
  displayOrder: number;
  workOrders: WorkOrder[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 하위 호환성을 위한 별칭 (deprecated)
export type TextCategory = ExhibitionCategory;

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

