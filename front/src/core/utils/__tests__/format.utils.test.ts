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

    it('should handle empty title', () => {
      expect(formatWorkTitle('')).toBe('「\'\'」');
    });

    it('should handle year 0 as falsy', () => {
      expect(formatWorkTitle('Ancient Work', 0)).toBe('「\'Ancient Work\'」');
    });

    it('should handle special characters in title', () => {
      expect(formatWorkTitle('Work "Title" & More', 2024)).toBe('「\'Work "Title" & More\'」, 2024');
    });

    it('should handle Korean title', () => {
      expect(formatWorkTitle('작품 제목', 2023)).toBe('「\'작품 제목\'」, 2023');
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

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should handle maxLength 0', () => {
      expect(truncateText('Some text', 0)).toBe('...');
    });

    it('should handle Unicode characters (Korean)', () => {
      const text = '한글로 작성된 매우 긴 텍스트입니다';
      const result = truncateText(text, 10);
      expect(result).toBe('한글로 작성된 매우...');
      expect(result.length).toBe(13); // 10 chars + '...' (3)
    });

    it('should handle maxLength 1', () => {
      expect(truncateText('Hello', 1)).toBe('H...');
    });
  });

  describe('formatDate', () => {
    it('should format date in Korean locale (default)', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('1');
      expect(formatted).toContain('15');
    });

    it('should format date in English locale', () => {
      const date = new Date('2024-12-25');
      const formatted = formatDate(date, 'en-US');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('December');
      expect(formatted).toContain('25');
    });

    it('should format date in Japanese locale', () => {
      const date = new Date('2024-03-20');
      const formatted = formatDate(date, 'ja-JP');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('3');
      expect(formatted).toContain('20');
    });

    it('should handle leap year date', () => {
      const date = new Date('2024-02-29');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('2');
      expect(formatted).toContain('29');
    });

    it('should handle year boundaries', () => {
      const date = new Date('2023-12-31');
      const formatted = formatDate(date);
      expect(formatted).toContain('2023');
      expect(formatted).toContain('12');
      expect(formatted).toContain('31');
    });
  });

  describe('formatExhibitionDescription', () => {
    it('should format complete exhibition description', () => {
      const description = {
        exhibitionType: '개인전',
        venue: 'Test Gallery',
        year: 2024,
      };
      expect(formatExhibitionDescription(description)).toBe('개인전, Test Gallery, 2024');
    });

    it('should handle 2-person exhibition', () => {
      const description = {
        exhibitionType: '2인전',
        venue: 'YPCSpace',
        year: 2023,
      };
      expect(formatExhibitionDescription(description)).toBe('2인전, YPCSpace, 2023');
    });

    it('should handle group exhibition', () => {
      const description = {
        exhibitionType: '그룹전',
        venue: 'Art Center',
        year: 2022,
      };
      expect(formatExhibitionDescription(description)).toBe('그룹전, Art Center, 2022');
    });

    it('should handle venue with spaces', () => {
      const description = {
        exhibitionType: '특별전',
        venue: 'Seoul Arts Center',
        year: 2025,
      };
      expect(formatExhibitionDescription(description)).toBe('특별전, Seoul Arts Center, 2025');
    });

    it('should handle English exhibition types', () => {
      const description = {
        exhibitionType: 'Solo Exhibition',
        venue: 'MoMA',
        year: 2023,
      };
      expect(formatExhibitionDescription(description)).toBe('Solo Exhibition, MoMA, 2023');
    });

    it('should handle historical years', () => {
      const description = {
        exhibitionType: '회고전',
        venue: 'National Museum',
        year: 1999,
      };
      expect(formatExhibitionDescription(description)).toBe('회고전, National Museum, 1999');
    });
  });
});
