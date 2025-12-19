/**
 * Category Mapper - Firestore 데이터 <-> Domain Model 변환
 */
import { Timestamp } from 'firebase/firestore';
import type { SentenceCategory, ExhibitionCategory, WorkOrder } from '../../core/types';

/**
 * Firestore 데이터를 SentenceCategory 도메인 모델로 변환
 */
export const mapFirestoreToSentenceCategory = (
  id: string,
  data: Record<string, unknown>
): SentenceCategory => ({
  id,
  sentence: (data.sentence as string) || '',
  keywords: (data.keywords as SentenceCategory['keywords']) || [],
  displayOrder: (data.displayOrder as number) || 0,
  isActive: (data.isActive as boolean) ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * Firestore 데이터를 ExhibitionCategory 도메인 모델로 변환
 */
export const mapFirestoreToExhibitionCategory = (
  id: string,
  data: Record<string, unknown>
): ExhibitionCategory => ({
  id,
  title: (data.title as string) || '',
  description: (data.description as ExhibitionCategory['description']) || {
    exhibitionType: '',
    venue: '',
    year: new Date().getFullYear(),
  },
  displayOrder: (data.displayOrder as number) || 0,
  workOrders: (data.workOrders as WorkOrder[]) || [],
  isActive: (data.isActive as boolean) ?? true,
  createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

/**
 * SentenceCategory를 Firestore 저장용 데이터로 변환
 */
export const mapSentenceCategoryToFirestore = (
  category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>
): Record<string, unknown> => ({
  sentence: category.sentence,
  keywords: category.keywords,
  displayOrder: category.displayOrder,
  isActive: category.isActive,
});

/**
 * ExhibitionCategory를 Firestore 저장용 데이터로 변환
 */
export const mapExhibitionCategoryToFirestore = (
  category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>
): Record<string, unknown> => ({
  title: category.title,
  description: category.description,
  displayOrder: category.displayOrder,
  workOrders: category.workOrders,
  isActive: category.isActive,
});
