// Work-related types

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

// 영상 (YouTube Embed)
export interface WorkVideo {
  id: string;
  youtubeUrl: string;          // YouTube 원본 URL
  youtubeVideoId: string;      // YouTube 영상 ID
  embedUrl: string;            // Embed URL
  title?: string;              // 영상 제목 (선택)
  order: number;               // 미디어 순서 (이미지와 함께 정렬)
  width?: number;              // 영상 원본 너비 (비율 계산용)
  height?: number;             // 영상 원본 높이 (비율 계산용)
}

// 미디어 아이템 (이미지 또는 영상)
export type MediaItem =
  | { type: 'image'; data: WorkImage }
  | { type: 'video'; data: WorkVideo };

export interface Work {
  id: string;
  title: string;
  year?: number;  // 작품 제작 년도
  shortDescription?: string;
  fullDescription: string;
  thumbnailImageId: string;
  images: WorkImage[];
  videos?: WorkVideo[];  // YouTube 영상 목록
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
