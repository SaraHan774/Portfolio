// React Query cache keys for data layer

/**
 * Query keys for React Query caching
 * Following React Query best practices for key structure
 */
export const queryKeys = {
  // Works
  works: {
    all: ['works'] as const,
    published: () => [...queryKeys.works.all, 'published'] as const,
    detail: (id: string) => [...queryKeys.works.all, 'detail', id] as const,
    byKeyword: (keywordId: string) =>
      [...queryKeys.works.all, 'byKeyword', keywordId] as const,
    byExhibition: (categoryId: string) =>
      [...queryKeys.works.all, 'byExhibition', categoryId] as const,
    byIds: (ids: string[]) => [...queryKeys.works.all, 'byIds', ...ids] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    sentence: {
      all: () => [...queryKeys.categories.all, 'sentence'] as const,
      detail: (id: string) =>
        [...queryKeys.categories.all, 'sentence', 'detail', id] as const,
      byKeyword: (keywordId: string) =>
        [...queryKeys.categories.all, 'sentence', 'byKeyword', keywordId] as const,
    },
    exhibition: {
      all: () => [...queryKeys.categories.all, 'exhibition'] as const,
      detail: (id: string) =>
        [...queryKeys.categories.all, 'exhibition', 'detail', id] as const,
    },
    keyword: {
      detail: (keywordId: string) =>
        [...queryKeys.categories.all, 'keyword', 'detail', keywordId] as const,
    },
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    site: () => [...queryKeys.settings.all, 'site'] as const,
  },
} as const;
