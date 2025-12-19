import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock Firebase client
vi.mock('./data/api/client', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
}));

// Mock Data Repository with default implementations
vi.mock('./data/repository', () => ({
  // Auth
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthChange: vi.fn(),
  setUserRole: vi.fn(),
  isAdmin: vi.fn().mockReturnValue(false),
  authCacheKeys: {
    all: () => ['auth'],
    user: () => ['auth', 'user'],
  },
  authCacheConfig: { staleTime: 0 },

  // Works
  getWorks: vi.fn().mockResolvedValue([]),
  getWork: vi.fn().mockResolvedValue(null),
  getPublishedWorks: vi.fn().mockResolvedValue([]),
  createWork: vi.fn().mockResolvedValue({}),
  updateWork: vi.fn().mockResolvedValue({}),
  deleteWork: vi.fn().mockResolvedValue(undefined),
  incrementViewCount: vi.fn().mockResolvedValue(undefined),
  uploadImage: vi.fn().mockResolvedValue({}),
  uploadImages: vi.fn().mockResolvedValue([]),
  deleteImage: vi.fn().mockResolvedValue(undefined),
  deleteWorkImages: vi.fn().mockResolvedValue(undefined),
  worksCacheKeys: {
    all: ['works'],
    lists: () => ['works', 'list'],
    list: (filters?: Record<string, unknown>) => ['works', 'list', filters],
    details: () => ['works', 'detail'],
    detail: (id: string) => ['works', 'detail', id],
    published: () => ['works', 'published'],
  },
  worksCacheConfig: { staleTime: 60000 },

  // Categories
  getSentenceCategories: vi.fn().mockResolvedValue([]),
  getSentenceCategory: vi.fn().mockResolvedValue(null),
  createSentenceCategory: vi.fn().mockResolvedValue({}),
  updateSentenceCategory: vi.fn().mockResolvedValue({}),
  deleteSentenceCategory: vi.fn().mockResolvedValue(undefined),
  getExhibitionCategories: vi.fn().mockResolvedValue([]),
  getExhibitionCategory: vi.fn().mockResolvedValue(null),
  createExhibitionCategory: vi.fn().mockResolvedValue({}),
  updateExhibitionCategory: vi.fn().mockResolvedValue({}),
  deleteExhibitionCategory: vi.fn().mockResolvedValue(undefined),
  updateCategoryOrders: vi.fn().mockResolvedValue(undefined),
  categoriesCacheKeys: {
    sentence: {
      all: () => ['categories', 'sentence'],
      detail: (id: string) => ['categories', 'sentence', 'detail', id],
    },
    exhibition: {
      all: () => ['categories', 'exhibition'],
      detail: (id: string) => ['categories', 'exhibition', 'detail', id],
    },
  },
  categoriesCacheConfig: { staleTime: 300000 },

  // Settings
  getSiteSettings: vi.fn().mockResolvedValue({}),
  updateSiteSettings: vi.fn().mockResolvedValue({}),
  uploadFavicon: vi.fn().mockResolvedValue(''),
  deleteFavicon: vi.fn().mockResolvedValue(undefined),
  settingsCacheKeys: {
    site: () => ['settings', 'site'],
  },
  settingsCacheConfig: { staleTime: 300000 },

  // Cache config
  cacheKeys: {
    works: { all: () => ['works'], detail: (id: string) => ['works', 'detail', id] },
    categories: {
      sentence: { all: () => ['categories', 'sentence'], detail: (id: string) => ['categories', 'sentence', 'detail', id] },
      exhibition: { all: () => ['categories', 'exhibition'], detail: (id: string) => ['categories', 'exhibition', 'detail', id] },
    },
    settings: { site: () => ['settings', 'site'] },
    auth: { all: () => ['auth'], user: () => ['auth', 'user'] },
  },
  cacheConfig: {
    static: { staleTime: 300000, gcTime: 1800000 },
    dynamic: { staleTime: 60000, gcTime: 600000 },
    realtime: { staleTime: 0, gcTime: 300000 },
  },
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});