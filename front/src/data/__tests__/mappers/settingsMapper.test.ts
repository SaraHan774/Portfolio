// Tests for settings mapper

import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  mapFirestoreToSiteSettings,
  getDefaultSettings,
  DEFAULT_SITE_SETTINGS,
} from '../../mappers/settingsMapper';
import { SETTINGS_DOC_ID } from '../../mappers/settingsMapper';

describe('settingsMapper', () => {
  describe('mapFirestoreToSiteSettings', () => {
    it('should map complete Firestore data to SiteSettings type', () => {
      const id = SETTINGS_DOC_ID;
      const firestoreData = {
        browserTitle: 'Custom Portfolio',
        browserDescription: 'Custom Description',
        footerText: 'Custom Footer',
        faviconUrl: 'https://example.com/favicon.ico',
        updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
      };

      const result = mapFirestoreToSiteSettings(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.browserTitle).toBe('Custom Portfolio');
      expect(result.browserDescription).toBe('Custom Description');
      expect(result.footerText).toBe('Custom Footer');
      expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should use default values for missing fields', () => {
      const id = SETTINGS_DOC_ID;
      const firestoreData = {};

      const result = mapFirestoreToSiteSettings(id, firestoreData);

      expect(result.id).toBe(id);
      expect(result.browserTitle).toBe(DEFAULT_SITE_SETTINGS.browserTitle);
      expect(result.browserDescription).toBe(DEFAULT_SITE_SETTINGS.browserDescription);
      expect(result.footerText).toBe(DEFAULT_SITE_SETTINGS.footerText);
      expect(result.faviconUrl).toBeUndefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle partial data', () => {
      const id = SETTINGS_DOC_ID;
      const firestoreData = {
        browserTitle: 'Custom Title Only',
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = mapFirestoreToSiteSettings(id, firestoreData);

      expect(result.browserTitle).toBe('Custom Title Only');
      expect(result.browserDescription).toBe(DEFAULT_SITE_SETTINGS.browserDescription);
      expect(result.footerText).toBe(DEFAULT_SITE_SETTINGS.footerText);
    });

    it('should handle faviconUrl as undefined', () => {
      const id = SETTINGS_DOC_ID;
      const firestoreData = {
        browserTitle: 'Test',
        faviconUrl: undefined,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = mapFirestoreToSiteSettings(id, firestoreData);

      expect(result.faviconUrl).toBeUndefined();
    });

    it('should preserve faviconUrl when provided', () => {
      const id = SETTINGS_DOC_ID;
      const faviconUrl = 'https://example.com/icon.png';
      const firestoreData = {
        browserTitle: 'Test',
        faviconUrl,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = mapFirestoreToSiteSettings(id, firestoreData);

      expect(result.faviconUrl).toBe(faviconUrl);
    });

    it('should handle missing updatedAt with current date', () => {
      const id = SETTINGS_DOC_ID;
      const firestoreData = {
        browserTitle: 'Test',
      };

      const result = mapFirestoreToSiteSettings(id, firestoreData);

      expect(result.updatedAt).toBeInstanceOf(Date);
      // Should be recent (within last second)
      const now = new Date();
      const diff = now.getTime() - result.updatedAt.getTime();
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const result = getDefaultSettings();

      expect(result.id).toBe(SETTINGS_DOC_ID);
      expect(result.browserTitle).toBe(DEFAULT_SITE_SETTINGS.browserTitle);
      expect(result.browserDescription).toBe(DEFAULT_SITE_SETTINGS.browserDescription);
      expect(result.footerText).toBe(DEFAULT_SITE_SETTINGS.footerText);
      expect(result.faviconUrl).toBeUndefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should return a new object each time (not mutate original)', () => {
      const result1 = getDefaultSettings();
      const result2 = getDefaultSettings();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);

      // Mutate result1
      result1.browserTitle = 'Modified';

      // result2 should be unchanged
      expect(result2.browserTitle).toBe(DEFAULT_SITE_SETTINGS.browserTitle);
    });
  });

  describe('DEFAULT_SITE_SETTINGS', () => {
    it('should have correct structure', () => {
      expect(DEFAULT_SITE_SETTINGS).toHaveProperty('id');
      expect(DEFAULT_SITE_SETTINGS).toHaveProperty('browserTitle');
      expect(DEFAULT_SITE_SETTINGS).toHaveProperty('browserDescription');
      expect(DEFAULT_SITE_SETTINGS).toHaveProperty('footerText');
      expect(DEFAULT_SITE_SETTINGS).toHaveProperty('faviconUrl');
      expect(DEFAULT_SITE_SETTINGS).toHaveProperty('updatedAt');
    });

    it('should have Korean default values', () => {
      expect(DEFAULT_SITE_SETTINGS.browserTitle).toContain('Portfolio');
      expect(DEFAULT_SITE_SETTINGS.footerText).toContain('나혜빈');
    });
  });
});
