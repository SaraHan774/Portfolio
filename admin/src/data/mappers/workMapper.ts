/**
 * Work Mapper - Firestore 데이터 <-> Domain Model 변환
 */
import { Timestamp } from 'firebase/firestore';
import type { Work, WorkImage, WorkVideo } from '../../core/types';

/**
 * Firestore 문서 데이터를 Work 도메인 모델로 변환
 */
export const mapFirestoreToWork = (
  id: string,
  data: Record<string, unknown>
): Work => ({
  id,
  title: (data.title as string) || '',
  year: data.year as number | undefined,
  shortDescription: data.shortDescription as string | undefined,
  fullDescription: data.fullDescription as string | undefined,
  thumbnailImageId: (data.thumbnailImageId as string) || '',
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
 * Work 도메인 모델을 Firestore 저장용 데이터로 변환
 * (timestamps는 serverTimestamp()로 별도 처리)
 */
export const mapWorkToFirestore = (
  work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>
): Record<string, unknown> => ({
  title: work.title,
  year: work.year,
  shortDescription: work.shortDescription,
  fullDescription: work.fullDescription,
  thumbnailImageId: work.thumbnailImageId,
  images: work.images,
  videos: work.videos,
  caption: work.caption,
  sentenceCategoryIds: work.sentenceCategoryIds,
  exhibitionCategoryIds: work.exhibitionCategoryIds,
  isPublished: work.isPublished,
  viewCount: work.viewCount,
  publishedAt: work.isPublished ? work.publishedAt : null,
});
