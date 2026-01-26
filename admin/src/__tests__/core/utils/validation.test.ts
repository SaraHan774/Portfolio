import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidUrl,
  isValidYouTubeUrl,
  isRequired,
  hasMinLength,
  hasMaxLength,
  hasLengthInRange,
  isInRange,
  isPositive,
  isInteger,
  isValidYear,
  hasDuplicates,
  hasRequiredKeys,
} from '../../../core/utils/validation';

describe('validation utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.kr')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@domain')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  describe('isValidYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://youtube.com/shorts/YFF4FGmw_6E')).toBe(true);
      expect(isValidYouTubeUrl('https://youtube.com/shorts/YFF4FGmw_6E?feature=share')).toBe(true);
    });

    it('should return false for invalid YouTube URLs', () => {
      expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false);
      expect(isValidYouTubeUrl('https://example.com')).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('should return false for null and undefined', () => {
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(isRequired([])).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isRequired({})).toBe(false);
    });

    it('should return true for valid values', () => {
      expect(isRequired('hello')).toBe(true);
      expect(isRequired([1, 2, 3])).toBe(true);
      expect(isRequired({ key: 'value' })).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
    });
  });

  describe('hasMinLength', () => {
    it('should return true if length is at least minLength', () => {
      expect(hasMinLength('hello', 5)).toBe(true);
      expect(hasMinLength('hello world', 5)).toBe(true);
    });

    it('should return false if length is less than minLength', () => {
      expect(hasMinLength('hi', 5)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    it('should return true if length is at most maxLength', () => {
      expect(hasMaxLength('hello', 5)).toBe(true);
      expect(hasMaxLength('hi', 5)).toBe(true);
    });

    it('should return false if length exceeds maxLength', () => {
      expect(hasMaxLength('hello world', 5)).toBe(false);
    });
  });

  describe('hasLengthInRange', () => {
    it('should return true if length is within range', () => {
      expect(hasLengthInRange('hello', 3, 10)).toBe(true);
    });

    it('should return true for boundary values', () => {
      expect(hasLengthInRange('abc', 3, 5)).toBe(true);
      expect(hasLengthInRange('abcde', 3, 5)).toBe(true);
    });

    it('should return false if length is outside range', () => {
      expect(hasLengthInRange('hi', 3, 5)).toBe(false);
      expect(hasLengthInRange('hello world', 3, 5)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true if value is within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
    });

    it('should return true for boundary values', () => {
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('should return false if value is outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive numbers', () => {
      expect(isPositive(1)).toBe(true);
      expect(isPositive(0.1)).toBe(true);
    });

    it('should return false for zero and negative numbers', () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-1)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should return true for integers', () => {
      expect(isInteger(5)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-10)).toBe(true);
    });

    it('should return false for non-integers', () => {
      expect(isInteger(5.5)).toBe(false);
      expect(isInteger(0.1)).toBe(false);
    });
  });

  describe('isValidYear', () => {
    it('should return true for valid years', () => {
      expect(isValidYear(2024)).toBe(true);
      expect(isValidYear(1900)).toBe(true);
    });

    it('should return false for invalid years', () => {
      expect(isValidYear(1899)).toBe(false);
      expect(isValidYear(2024.5)).toBe(false);
    });
  });

  describe('hasDuplicates', () => {
    it('should return true if array has duplicates', () => {
      expect(hasDuplicates([1, 2, 3, 1])).toBe(true);
      expect(hasDuplicates(['a', 'b', 'a'])).toBe(true);
    });

    it('should return false if array has no duplicates', () => {
      expect(hasDuplicates([1, 2, 3])).toBe(false);
      expect(hasDuplicates(['a', 'b', 'c'])).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasDuplicates([])).toBe(false);
    });
  });

  describe('hasRequiredKeys', () => {
    it('should return true if object has all required keys', () => {
      const obj = { name: 'John', age: 30, email: 'john@example.com' };
      expect(hasRequiredKeys(obj, ['name', 'age'])).toBe(true);
    });

    it('should return false if object is missing required keys', () => {
      const obj: Record<string, unknown> = { name: 'John' };
      expect(hasRequiredKeys(obj, ['name', 'age'])).toBe(false);
    });

    it('should return false if required key has empty value', () => {
      const obj = { name: '', age: 30 };
      expect(hasRequiredKeys(obj, ['name', 'age'])).toBe(false);
    });
  });
});
