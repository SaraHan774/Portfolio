// Category Repository - Data access layer for categories with caching

import { queryKeys } from '../cache';
import * as categoriesApi from '../api/categoriesApi';
import type { SentenceCategory, ExhibitionCategory, KeywordCategory } from '@/core/types';

/**
 * Category Repository
 * Provides methods for fetching categories with React Query integration
 */
export class CategoryRepository {
  /**
   * Get query key for sentence categories
   */
  static getSentenceCategoriesKey() {
    return queryKeys.categories.sentence.all();
  }

  /**
   * Get query key for a specific sentence category
   */
  static getSentenceCategoryByIdKey(id: string) {
    return queryKeys.categories.sentence.detail(id);
  }

  /**
   * Get query key for sentence category by keyword ID
   */
  static getSentenceCategoryByKeywordIdKey(keywordId: string) {
    return queryKeys.categories.sentence.byKeyword(keywordId);
  }

  /**
   * Get query key for exhibition categories
   */
  static getExhibitionCategoriesKey() {
    return queryKeys.categories.exhibition.all();
  }

  /**
   * Get query key for a specific exhibition category
   */
  static getExhibitionCategoryByIdKey(id: string) {
    return queryKeys.categories.exhibition.detail(id);
  }

  /**
   * Get query key for keyword by ID
   */
  static getKeywordByIdKey(keywordId: string) {
    return queryKeys.categories.keyword.detail(keywordId);
  }

  /**
   * Fetch all active sentence categories
   */
  static async getSentenceCategories(): Promise<SentenceCategory[]> {
    return categoriesApi.fetchSentenceCategories();
  }

  /**
   * Fetch a sentence category by ID
   */
  static async getSentenceCategoryById(id: string): Promise<SentenceCategory> {
    return categoriesApi.fetchSentenceCategoryById(id);
  }

  /**
   * Fetch keyword by ID
   */
  static async getKeywordById(keywordId: string): Promise<KeywordCategory> {
    return categoriesApi.fetchKeywordById(keywordId);
  }

  /**
   * Fetch sentence category containing a specific keyword
   */
  static async getSentenceCategoryByKeywordId(
    keywordId: string
  ): Promise<SentenceCategory> {
    return categoriesApi.fetchSentenceCategoryByKeywordId(keywordId);
  }

  /**
   * Fetch all active exhibition categories
   */
  static async getExhibitionCategories(): Promise<ExhibitionCategory[]> {
    return categoriesApi.fetchExhibitionCategories();
  }

  /**
   * Fetch an exhibition category by ID
   */
  static async getExhibitionCategoryById(id: string): Promise<ExhibitionCategory> {
    return categoriesApi.fetchExhibitionCategoryById(id);
  }
}
