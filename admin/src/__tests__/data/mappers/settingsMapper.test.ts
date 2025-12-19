import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  mapFirestoreToSiteSettings,
  DEFAULT_SITE_SETTINGS,
} from '../../../data/mappers/settingsMapper';

describe('settingsMapper', () => {
  const mockTimestamp = {
    toDate: () => new Date('2024-01-15T10:30:00Z'),
  } as Timestamp;

  describe('DEFAULT_SITE_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SITE_SETTINGS).toEqual({
        browserTitle: 'Portfolio | 작품 갤러리',
        browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
        footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
        faviconUrl: undefined,
      });
    });
  });

  describe('mapFirestoreToSiteSettings', () => {
    it('should map complete Firestore data to SiteSettings', () => {
      const firestoreData = {
        browserTitle: 'Custom Title',
        browserDescription: 'Custom Description',
        footerText: 'Custom Footer',
        faviconUrl: 'http://example.com/favicon.ico',
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSiteSettings('site', firestoreData);

      expect(result).toEqual({
        id: 'site',
        browserTitle: 'Custom Title',
        browserDescription: 'Custom Description',
        footerText: 'Custom Footer',
        faviconUrl: 'http://example.com/favicon.ico',
        updatedAt: new Date('2024-01-15T10:30:00Z'),
      });
    });

    it('should use default values for missing fields', () => {
      const minimalData = {
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSiteSettings('site', minimalData);

      expect(result.id).toBe('site');
      expect(result.browserTitle).toBe(DEFAULT_SITE_SETTINGS.browserTitle);
      expect(result.browserDescription).toBe(DEFAULT_SITE_SETTINGS.browserDescription);
      expect(result.footerText).toBe(DEFAULT_SITE_SETTINGS.footerText);
      expect(result.faviconUrl).toBeUndefined();
    });

    it('should handle null updatedAt with current date', () => {
      const dataWithNullTimestamp = {
        browserTitle: 'Test',
        updatedAt: null,
      };

      const result = mapFirestoreToSiteSettings('site', dataWithNullTimestamp);

      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle undefined faviconUrl', () => {
      const dataWithoutFavicon = {
        browserTitle: 'Test Title',
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSiteSettings('site', dataWithoutFavicon);

      expect(result.faviconUrl).toBeUndefined();
    });

    it('should handle empty browserTitle with default', () => {
      const dataWithEmptyTitle = {
        browserTitle: '',
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSiteSettings('site', dataWithEmptyTitle);

      // Empty string should use default
      expect(result.browserTitle).toBe(DEFAULT_SITE_SETTINGS.browserTitle);
    });

    it('should preserve valid faviconUrl', () => {
      const dataWithFavicon = {
        faviconUrl: 'https://cdn.example.com/favicon.png',
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSiteSettings('site', dataWithFavicon);

      expect(result.faviconUrl).toBe('https://cdn.example.com/favicon.png');
    });

    it('should handle completely empty data', () => {
      const emptyData = {};

      const result = mapFirestoreToSiteSettings('site', emptyData);

      expect(result.id).toBe('site');
      expect(result.browserTitle).toBe(DEFAULT_SITE_SETTINGS.browserTitle);
      expect(result.browserDescription).toBe(DEFAULT_SITE_SETTINGS.browserDescription);
      expect(result.footerText).toBe(DEFAULT_SITE_SETTINGS.footerText);
      expect(result.faviconUrl).toBeUndefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should preserve custom footer text', () => {
      const dataWithCustomFooter = {
        footerText: 'Custom contact info',
        updatedAt: mockTimestamp,
      };

      const result = mapFirestoreToSiteSettings('site', dataWithCustomFooter);

      expect(result.footerText).toBe('Custom contact info');
    });
  });
});
