// Work Repository - Data access layer for works with caching

import { queryKeys } from '../cache';
import * as worksApi from '../api/worksApi';
import type { Work } from '@/core/types';

/**
 * Work Repository
 * Provides methods for fetching works with React Query integration
 */
export class WorkRepository {
  /**
   * Get query key for published works
   */
  static getPublishedWorksKey() {
    return queryKeys.works.published();
  }

  /**
   * Get query key for a specific work
   */
  static getWorkByIdKey(id: string) {
    return queryKeys.works.detail(id);
  }

  /**
   * Get query key for works by keyword
   */
  static getWorksByKeywordKey(keywordId: string) {
    return queryKeys.works.byKeyword(keywordId);
  }

  /**
   * Get query key for works by exhibition category
   */
  static getWorksByExhibitionKey(categoryId: string) {
    return queryKeys.works.byExhibition(categoryId);
  }

  /**
   * Get query key for works by IDs
   */
  static getWorksByIdsKey(ids: string[]) {
    return queryKeys.works.byIds(ids);
  }

  /**
   * Fetch all published works
   */
  static async getPublishedWorks(): Promise<Work[]> {
    return worksApi.fetchPublishedWorks();
  }

  /**
   * Fetch a work by ID
   */
  static async getWorkById(id: string): Promise<Work> {
    return worksApi.fetchWorkById(id);
  }

  /**
   * Fetch works by keyword ID
   */
  static async getWorksByKeywordId(keywordId: string): Promise<Work[]> {
    return worksApi.fetchWorksByKeywordId(keywordId);
  }

  /**
   * Fetch works by exhibition category ID
   */
  static async getWorksByExhibitionCategoryId(categoryId: string): Promise<Work[]> {
    return worksApi.fetchWorksByExhibitionCategoryId(categoryId);
  }

  /**
   * Fetch works by IDs (maintaining order)
   */
  static async getWorksByIds(workIds: string[]): Promise<Work[]> {
    return worksApi.fetchWorksByIds(workIds);
  }
}
