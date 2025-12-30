import { describe, it, expect } from 'vitest';
import {
  truncate,
  slugify,
  capitalize,
  stripHtml,
  countCharacters,
  extractYouTubeVideoId,
  createYouTubeEmbedUrl,
  generateSimpleId,
  isBlank,
  normalizeWhitespace,
} from '../../../core/utils/string';

describe('string utils', () => {
  describe('truncate', () => {
    it('should return original string if shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate string and add suffix', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should use custom suffix', () => {
      expect(truncate('hello world', 8, '…')).toBe('hello w…');
    });

    it('should handle edge case with exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase and replace spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(slugify(' Hello World ')).toBe('hello-world');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalize('h')).toBe('H');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    });

    it('should handle nested tags', () => {
      expect(stripHtml('<div><p>Hello <strong>World</strong></p></div>')).toBe('Hello World');
    });

    it('should handle plain text', () => {
      expect(stripHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('countCharacters', () => {
    it('should count characters excluding HTML tags', () => {
      expect(countCharacters('<p>Hello</p>')).toBe(5);
    });

    it('should count all text content', () => {
      expect(countCharacters('<p>Hello <strong>World</strong></p>')).toBe(11);
    });
  });

  describe('extractYouTubeVideoId', () => {
    it('should extract ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from /v/ URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from URL with query parameters', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from URL without protocol', () => {
      expect(extractYouTubeVideoId('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from URL without www', () => {
      expect(extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(extractYouTubeVideoId('https://example.com/video')).toBeNull();
    });

    it('should return null for too short video ID', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=abc')).toBeNull();
    });

    it('should return null for too long video ID', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ123')).toBeNull();
    });

    it('should return null for Vimeo URL', () => {
      expect(extractYouTubeVideoId('https://vimeo.com/123456789')).toBeNull();
    });

    it('should return null for YouTube channel URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/channel/UCxxx')).toBeNull();
    });

    it('should return null for YouTube playlist URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/playlist?list=PLxxx')).toBeNull();
    });
  });

  describe('createYouTubeEmbedUrl', () => {
    it('should create embed URL from video ID', () => {
      expect(createYouTubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  describe('generateSimpleId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateSimpleId();
      const id2 = generateSimpleId();
      expect(id1).not.toBe(id2);
    });

    it('should contain hyphen', () => {
      const id = generateSimpleId();
      expect(id).toContain('-');
    });
  });

  describe('isBlank', () => {
    it('should return true for null', () => {
      expect(isBlank(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isBlank(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isBlank('')).toBe(true);
    });

    it('should return true for whitespace only', () => {
      expect(isBlank('   ')).toBe(true);
    });

    it('should return false for non-blank string', () => {
      expect(isBlank('hello')).toBe(false);
    });
  });

  describe('normalizeWhitespace', () => {
    it('should collapse multiple spaces', () => {
      expect(normalizeWhitespace('hello   world')).toBe('hello world');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(normalizeWhitespace('  hello world  ')).toBe('hello world');
    });

    it('should handle tabs and newlines', () => {
      expect(normalizeWhitespace('hello\t\nworld')).toBe('hello world');
    });
  });
});
