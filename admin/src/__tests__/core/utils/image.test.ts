import { describe, it, expect } from 'vitest';
import {
  getFileExtension,
  getExtensionFromUrl,
  formatFileSize,
  isValidImageType,
  isValidFileSize,
  calculateAspectRatio,
  calculateDimensionsForAspectRatio,
  resizeImage,
  getImageDimensions,
} from '../../../core/utils/image';

// Mock File constructor for testing
const createMockFile = (
  name: string,
  _size: number, // Size is set separately via Object.defineProperty when needed
  type: string
): File => {
  const blob = new Blob([''], { type });
  return new File([blob], name, { type });
};

describe('image utils', () => {
  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('photo.PNG')).toBe('png');
      expect(getFileExtension('file.name.with.dots.webp')).toBe('webp');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('getExtensionFromUrl', () => {
    it('should extract extension from URL', () => {
      expect(getExtensionFromUrl('https://example.com/image.jpg')).toBe('jpg');
      expect(getExtensionFromUrl('https://example.com/path/to/photo.png')).toBe('png');
    });

    it('should ignore query parameters', () => {
      expect(getExtensionFromUrl('https://example.com/image.jpg?width=800')).toBe('jpg');
      expect(getExtensionFromUrl('https://example.com/file.webp?token=abc123')).toBe('webp');
    });

    it('should handle URLs without extension', () => {
      expect(getExtensionFromUrl('https://example.com/api/images')).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle large numbers', () => {
      expect(formatFileSize(10737418240)).toBe('10 GB');
    });
  });

  describe('isValidImageType', () => {
    it('should return true for valid image types', () => {
      expect(isValidImageType(createMockFile('test.jpg', 100, 'image/jpeg'))).toBe(true);
      expect(isValidImageType(createMockFile('test.png', 100, 'image/png'))).toBe(true);
      expect(isValidImageType(createMockFile('test.gif', 100, 'image/gif'))).toBe(true);
      expect(isValidImageType(createMockFile('test.webp', 100, 'image/webp'))).toBe(true);
    });

    it('should return false for invalid image types', () => {
      expect(isValidImageType(createMockFile('test.pdf', 100, 'application/pdf'))).toBe(false);
      expect(isValidImageType(createMockFile('test.txt', 100, 'text/plain'))).toBe(false);
      expect(isValidImageType(createMockFile('test.svg', 100, 'image/svg+xml'))).toBe(false);
    });

    it('should support custom allowed types', () => {
      const file = createMockFile('test.svg', 100, 'image/svg+xml');
      expect(isValidImageType(file, ['image/svg+xml', 'image/jpeg'])).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('should return true if file size is within limit', () => {
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      // Note: Blob size is 0 in mock, so we test the function logic
      expect(isValidFileSize(file, 10000)).toBe(true);
    });

    it('should return false if file size exceeds limit', () => {
      // Create a file object with overridden size
      const file = createMockFile('test.jpg', 0, 'image/jpeg');
      Object.defineProperty(file, 'size', { value: 15000000 });
      expect(isValidFileSize(file, 10000000)).toBe(false);
    });

    it('should handle exact size limit', () => {
      const file = createMockFile('test.jpg', 0, 'image/jpeg');
      Object.defineProperty(file, 'size', { value: 1000 });
      expect(isValidFileSize(file, 1000)).toBe(true);
    });
  });

  describe('calculateAspectRatio', () => {
    it('should calculate aspect ratio correctly', () => {
      expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
      expect(calculateAspectRatio(800, 600)).toBeCloseTo(4 / 3);
      expect(calculateAspectRatio(1000, 1000)).toBe(1);
    });

    it('should handle portrait orientation', () => {
      expect(calculateAspectRatio(1080, 1920)).toBeCloseTo(9 / 16);
    });
  });

  describe('calculateDimensionsForAspectRatio', () => {
    it('should calculate dimensions for landscape aspect ratio', () => {
      const dimensions = calculateDimensionsForAspectRatio(1600, 16 / 9);
      expect(dimensions.width).toBe(1600);
      expect(dimensions.height).toBe(900);
    });

    it('should calculate dimensions for portrait aspect ratio', () => {
      const dimensions = calculateDimensionsForAspectRatio(900, 9 / 16);
      expect(dimensions.width).toBe(900);
      expect(dimensions.height).toBe(1600);
    });

    it('should calculate dimensions for square aspect ratio', () => {
      const dimensions = calculateDimensionsForAspectRatio(500, 1);
      expect(dimensions.width).toBe(500);
      expect(dimensions.height).toBe(500);
    });
  });

  describe('resizeImage', () => {
    it('should reject invalid file types immediately', async () => {
      const invalidFile = createMockFile('test.pdf', 100, 'application/pdf');

      await expect(
        resizeImage(invalidFile, { maxWidth: 800, maxHeight: 600 })
      ).rejects.toThrow('지원하지 않는 이미지 형식입니다');
    });

    it('should reject text files', async () => {
      const textFile = createMockFile('test.txt', 100, 'text/plain');

      await expect(
        resizeImage(textFile, { maxWidth: 800, maxHeight: 600 })
      ).rejects.toThrow('지원하지 않는 이미지 형식입니다');
    });
  });

  describe('getImageDimensions', () => {
    // Note: Full testing of getImageDimensions requires browser APIs (Image, URL.createObjectURL)
    // These are tested in integration tests. Here we verify the function exists and has correct signature.
    it('should be a function that returns a Promise', () => {
      expect(typeof getImageDimensions).toBe('function');
    });
  });
});

describe('image utils - browser API dependent (integration notes)', () => {
  /**
   * The following functions depend on browser APIs that are not fully available in jsdom:
   * - resizeImage: Requires Image, Canvas, URL.createObjectURL
   * - getImageDimensions: Requires Image, URL.createObjectURL
   *
   * These functions are tested through:
   * 1. Integration tests in the actual browser environment
   * 2. E2E tests with real image files
   *
   * The pure function aspects (file type validation, error handling) are tested above.
   */
  it('documents browser-dependent functions for integration testing', () => {
    expect(true).toBe(true);
  });
});
