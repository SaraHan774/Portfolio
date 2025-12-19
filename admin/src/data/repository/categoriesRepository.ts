/**
 * Categories Repository - 카테고리 데이터 레포지토리
 * API 레이어를 래핑하고 캐싱 로직 제공
 */
import * as categoriesApi from '../api/categoriesApi';
import { cacheKeys, cacheConfig } from './cacheKeys';
import type { SentenceCategory, ExhibitionCategory } from '../../core/types';

/**
 * 캐시 키 및 설정 export (React Query에서 사용)
 */
export const categoriesCacheKeys = cacheKeys.categories;
export const categoriesCacheConfig = cacheConfig.static;

// ============ Sentence Categories ============

/**
 * 모든 문장형 카테고리 조회
 */
export const getSentenceCategories = async (): Promise<SentenceCategory[]> => {
  return categoriesApi.fetchAllSentenceCategories();
};

/**
 * 단일 문장형 카테고리 조회
 */
export const getSentenceCategory = async (
  id: string
): Promise<SentenceCategory | null> => {
  return categoriesApi.fetchSentenceCategoryById(id);
};

/**
 * 문장형 카테고리 생성
 */
export const createSentenceCategory = async (
  category: Omit<SentenceCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SentenceCategory> => {
  return categoriesApi.createSentenceCategory(category);
};

/**
 * 문장형 카테고리 수정
 */
export const updateSentenceCategory = async (
  id: string,
  updates: Partial<Omit<SentenceCategory, 'id' | 'createdAt'>>
): Promise<SentenceCategory> => {
  return categoriesApi.updateSentenceCategory(id, updates);
};

/**
 * 문장형 카테고리 삭제
 */
export const deleteSentenceCategory = async (id: string): Promise<void> => {
  return categoriesApi.deleteSentenceCategory(id);
};

// ============ Exhibition Categories ============

/**
 * 모든 전시명 카테고리 조회
 */
export const getExhibitionCategories = async (): Promise<ExhibitionCategory[]> => {
  return categoriesApi.fetchAllExhibitionCategories();
};

/**
 * 단일 전시명 카테고리 조회
 */
export const getExhibitionCategory = async (
  id: string
): Promise<ExhibitionCategory | null> => {
  return categoriesApi.fetchExhibitionCategoryById(id);
};

/**
 * 전시명 카테고리 생성
 */
export const createExhibitionCategory = async (
  category: Omit<ExhibitionCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExhibitionCategory> => {
  return categoriesApi.createExhibitionCategory(category);
};

/**
 * 전시명 카테고리 수정
 */
export const updateExhibitionCategory = async (
  id: string,
  updates: Partial<Omit<ExhibitionCategory, 'id' | 'createdAt'>>
): Promise<ExhibitionCategory> => {
  return categoriesApi.updateExhibitionCategory(id, updates);
};

/**
 * 전시명 카테고리 삭제
 */
export const deleteExhibitionCategory = async (id: string): Promise<void> => {
  return categoriesApi.deleteExhibitionCategory(id);
};

// ============ Shared Operations ============

/**
 * 카테고리 순서 일괄 업데이트
 */
export const updateCategoryOrders = async (
  type: 'sentence' | 'exhibition',
  orders: { id: string; displayOrder: number }[]
): Promise<void> => {
  return categoriesApi.updateCategoryOrders(type, orders);
};
