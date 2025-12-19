import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  isToday,
  isWithinRange,
  compareDates,
  getYear,
  isValidDate,
} from '../../../core/utils/date';

describe('date utils', () => {
  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T14:30:00');

    it('should format date in short format', () => {
      expect(formatDate(testDate, 'short')).toBe('2024.03.15');
    });

    it('should format date in long format', () => {
      expect(formatDate(testDate, 'long')).toBe('2024년 3월 15일');
    });

    it('should format date in full format', () => {
      expect(formatDate(testDate, 'full')).toBe('2024년 3월 15일 14:30');
    });

    it('should default to short format', () => {
      expect(formatDate(testDate)).toBe('2024.03.15');
    });

    it('should handle string date input', () => {
      expect(formatDate('2024-03-15', 'short')).toBe('2024.03.15');
    });

    it('should handle timestamp input', () => {
      expect(formatDate(testDate.getTime(), 'short')).toBe('2024.03.15');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show "방금 전" for recent times', () => {
      const recent = new Date('2024-03-15T11:59:30');
      expect(formatRelativeTime(recent)).toBe('방금 전');
    });

    it('should show minutes ago', () => {
      const fiveMinAgo = new Date('2024-03-15T11:55:00');
      expect(formatRelativeTime(fiveMinAgo)).toBe('5분 전');
    });

    it('should show hours ago', () => {
      const threeHoursAgo = new Date('2024-03-15T09:00:00');
      expect(formatRelativeTime(threeHoursAgo)).toBe('3시간 전');
    });

    it('should show days ago', () => {
      const twoDaysAgo = new Date('2024-03-13T12:00:00');
      expect(formatRelativeTime(twoDaysAgo)).toBe('2일 전');
    });

    it('should show months ago', () => {
      const twoMonthsAgo = new Date('2024-01-15T12:00:00');
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2개월 전');
    });

    it('should show years ago', () => {
      const twoYearsAgo = new Date('2022-03-15T12:00:00');
      expect(formatRelativeTime(twoYearsAgo)).toBe('2년 전');
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for today', () => {
      expect(isToday(new Date('2024-03-15T00:00:00'))).toBe(true);
      expect(isToday(new Date('2024-03-15T23:59:59'))).toBe(true);
    });

    it('should return false for yesterday', () => {
      expect(isToday(new Date('2024-03-14T12:00:00'))).toBe(false);
    });

    it('should return false for tomorrow', () => {
      expect(isToday(new Date('2024-03-16T12:00:00'))).toBe(false);
    });
  });

  describe('isWithinRange', () => {
    it('should return true if date is within range', () => {
      const date = new Date('2024-03-15');
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      expect(isWithinRange(date, start, end)).toBe(true);
    });

    it('should return true for boundary dates', () => {
      const date = new Date('2024-03-01');
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      expect(isWithinRange(date, start, end)).toBe(true);
    });

    it('should return false if date is outside range', () => {
      const date = new Date('2024-04-01');
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      expect(isWithinRange(date, start, end)).toBe(false);
    });
  });

  describe('compareDates', () => {
    const earlier = new Date('2024-03-01');
    const later = new Date('2024-03-15');

    it('should sort descending by default', () => {
      expect(compareDates(earlier, later)).toBeGreaterThan(0);
      expect(compareDates(later, earlier)).toBeLessThan(0);
    });

    it('should sort ascending when specified', () => {
      expect(compareDates(earlier, later, 'asc')).toBeLessThan(0);
      expect(compareDates(later, earlier, 'asc')).toBeGreaterThan(0);
    });

    it('should return 0 for equal dates', () => {
      expect(compareDates(earlier, earlier)).toBe(0);
    });
  });

  describe('getYear', () => {
    it('should extract year from date', () => {
      expect(getYear(new Date('2024-03-15'))).toBe(2024);
    });

    it('should handle string input', () => {
      expect(getYear('2024-03-15')).toBe(2024);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      expect(isValidDate(new Date('2024-03-15'))).toBe(true);
    });

    it('should return false for invalid Date', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date objects', () => {
      expect(isValidDate('2024-03-15')).toBe(false);
      expect(isValidDate(1234567890)).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });
});
