// Mapper for transforming Firestore data to Work domain types

import { Timestamp } from 'firebase/firestore';
import type { Work, WorkImage, WorkVideo } from '@/core/types';

/**
 * Map Firestore document data to Work type
 */
export const mapFirestoreToWork = (id: string, data: Record<string, unknown>): Work => ({
  id,
  title: (data.title as string) || '',
  year: data.year as number | undefined,
  shortDescription: data.shortDescription as string | undefined,
  fullDescription: (data.fullDescription as string) || '',
  thumbnailImageId: (data.thumbnailImageId as string) || '',
  // 이미지는 통째로 pass-through한다 — WorkImage의 모든 필드(blurDataURL(LQIP), webpUrl,
  // caption 등)가 그대로 실려와야 한다. 개별 필드로 풀어 매핑하도록 바꾸면 blurDataURL이
  // 조용히 누락돼 LQIP 블러가 전역적으로 사라질 수 있으니 주의(컴파일 에러로 잡히지 않음).
  images: (data.images as WorkImage[]) || [],
  videos: (data.videos as WorkVideo[]) || [],
  caption: data.caption as string | undefined,
  sentenceCategoryIds: (data.sentenceCategoryIds as string[]) || [],
  exhibitionCategoryIds: (data.exhibitionCategoryIds as string[]) || [],
  isPublished: (data.isPublished as boolean) || false,
  viewCount: data.viewCount as number | undefined,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  publishedAt: (data.publishedAt as Timestamp)?.toDate() || undefined,
});

/**
 * Filter published works from a list
 */
export const filterPublishedWorks = (works: Work[]): Work[] => {
  return works.filter((work) => work.isPublished);
};

/**
 * Sort works by published date (descending)
 */
export const sortByPublishedDate = (works: Work[]): Work[] => {
  return [...works].sort((a, b) => {
    const dateA = a.publishedAt?.getTime() || 0;
    const dateB = b.publishedAt?.getTime() || 0;
    return dateB - dateA;
  });
};