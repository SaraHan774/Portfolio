// Tests for formatting utility functions

import { describe, it, expect } from 'vitest';
import { formatWorkTitle, truncateText, formatDate, formatExhibitionDescription } from '../format.utils';

describe('format.utils', () => {
  describe('formatWorkTitle', () => {
    it('should format title with year', () => {
      expect(formatWorkTitle('Test Work', 2024)).toBe('「\'Test Work\'」, 2024');
    });

    it('should format title without year', () => {
      expect(formatWorkTitle('Test Work')).toBe('「\'Test Work\'」');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = 'Exactly 20 chars txt';
      expect(truncateText(text, 20)).toBe('Exactly 20 chars txt');
    });
  });

  describe('formatDate', () => {
    it('should format date in Korean locale', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'ko-KR');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('1');
      expect(formatted).toContain('15');
    });
  });

  describe('formatExhibitionDescription', () => {
    it('should format exhibition description', () => {
      const description = {
        exhibitionType: '개인전',
        venue: 'Test Gallery',
        year: 2024,
      };
      expect(formatExhibitionDescription(description)).toBe('개인전, Test Gallery, 2024');
    });
  });
});
