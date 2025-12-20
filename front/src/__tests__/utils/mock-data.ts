// Mock data generators for testing

import type {
  Work,
  WorkImage,
  WorkVideo,
  SentenceCategory,
  ExhibitionCategory,
  KeywordCategory,
  SiteSettings,
  User,
} from '@/types';

export const mockWorkImage = (overrides?: Partial<WorkImage>): WorkImage => ({
  id: 'img-1',
  url: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  order: 0,
  width: 800,
  height: 600,
  ...overrides,
});

export const mockWorkVideo = (overrides?: Partial<WorkVideo>): WorkVideo => ({
  id: 'video-1',
  youtubeUrl: 'https://youtube.com/watch?v=abc123',
  youtubeVideoId: 'abc123',
  embedUrl: 'https://youtube.com/embed/abc123',
  order: 0,
  ...overrides,
});

export const mockWork = (overrides?: Partial<Work>): Work => ({
  id: 'work-1',
  title: 'Test Work',
  year: 2024,
  shortDescription: 'Short description',
  fullDescription: 'Full description of the work',
  thumbnailImageId: 'img-1',
  images: [mockWorkImage()],
  videos: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockKeywordCategory = (
  overrides?: Partial<KeywordCategory>
): KeywordCategory => ({
  id: 'keyword-1',
  name: 'test',
  startIndex: 0,
  endIndex: 4,
  workOrders: [],
  ...overrides,
});

export const mockSentenceCategory = (
  overrides?: Partial<SentenceCategory>
): SentenceCategory => ({
  id: 'sentence-1',
  sentence: 'This is a test sentence with keywords',
  keywords: [mockKeywordCategory()],
  displayOrder: 0,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockExhibitionCategory = (
  overrides?: Partial<ExhibitionCategory>
): ExhibitionCategory => ({
  id: 'exhibition-1',
  title: 'Test Exhibition',
  description: {
    exhibitionType: '개인전',
    venue: 'Test Venue',
    year: 2024,
  },
  displayOrder: 0,
  workOrders: [],
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockSiteSettings = (
  overrides?: Partial<SiteSettings>
): SiteSettings => ({
  id: 'site',
  browserTitle: 'Test Portfolio',
  browserDescription: 'Test Description',
  footerText: 'Test Footer',
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  googleId: 'google-123',
  displayName: 'Test User',
  role: 'viewer',
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-01'),
  ...overrides,
});