// Tests for thumbnail utility functions

import { describe, it, expect } from 'vitest';
import { getThumbnailUrl, getYouTubeThumbnailUrl } from '../thumbnail.utils';
import { mockWork, mockWorkVideo } from '../../../__tests__/utils/mock-data';

describe('thumbnail.utils', () => {
  describe('getThumbnailUrl', () => {
    it('should return thumbnail URL from image', () => {
      const work = mockWork({
        images: [
          {
            id: 'img-1',
            url: 'https://example.com/image.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            width: 800,
            height: 600,
          },
        ],
      });

      expect(getThumbnailUrl(work)).toBe('https://example.com/thumb.jpg');
    });

    it('should fallback to image URL when no thumbnail', () => {
      const work = mockWork({
        images: [
          {
            id: 'img-1',
            url: 'https://example.com/image.jpg',
            thumbnailUrl: '',
            order: 0,
            width: 800,
            height: 600,
          },
        ],
      });

      expect(getThumbnailUrl(work)).toBe('https://example.com/image.jpg');
    });

    it('should return YouTube thumbnail when no images', () => {
      const work = mockWork({
        images: [],
        videos: [mockWorkVideo({ youtubeVideoId: 'abc123' })],
      });

      expect(getThumbnailUrl(work)).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
    });

    it('should return null when no thumbnail available', () => {
      const work = mockWork({ images: [], videos: [] });
      expect(getThumbnailUrl(work)).toBeNull();
    });
  });

  describe('getYouTubeThumbnailUrl', () => {
    it('should extract video ID and generate thumbnail URL', () => {
      const video = mockWorkVideo({ youtubeVideoId: 'abc123' });
      expect(getYouTubeThumbnailUrl(video)).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
    });

    it('should handle video ID with query params', () => {
      const video = mockWorkVideo({ youtubeVideoId: 'abc123?t=10' });
      expect(getYouTubeThumbnailUrl(video)).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
    });

    it('should return null for empty video ID', () => {
      const video = mockWorkVideo({ youtubeVideoId: '' });
      expect(getYouTubeThumbnailUrl(video)).toBeNull();
    });
  });
});
