import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { mapFirebaseUserToUser } from '../../../data/mappers/userMapper';

// Mock Firebase User type
interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: Array<{ uid?: string }>;
}

describe('userMapper', () => {
  describe('mapFirebaseUserToUser', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-01-15T10:30:00Z'),
    } as Timestamp;

    const createMockFirebaseUser = (overrides: Partial<MockFirebaseUser> = {}): MockFirebaseUser => ({
      uid: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'http://example.com/photo.jpg',
      providerData: [{ uid: 'google-123' }],
      ...overrides,
    });

    it('should map Firebase user with Firestore data', () => {
      const firebaseUser = createMockFirebaseUser();
      const firestoreData = {
        role: 'admin',
        createdAt: mockTimestamp,
        lastLoginAt: mockTimestamp,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, firestoreData);

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.googleId).toBe('google-123');
      expect(result.displayName).toBe('Test User');
      expect(result.profileImage).toBe('http://example.com/photo.jpg');
      expect(result.role).toBe('admin');
      expect(result.createdAt).toEqual(new Date('2024-01-15T10:30:00Z'));
      // lastLoginAt is always set to current time by the mapper
      expect(result.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should handle missing Firestore data with defaults', () => {
      const firebaseUser = createMockFirebaseUser();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, undefined);

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('viewer'); // Default role
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should handle null email', () => {
      const firebaseUser = createMockFirebaseUser({ email: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, undefined);

      expect(result.email).toBe('');
    });

    it('should handle null displayName', () => {
      const firebaseUser = createMockFirebaseUser({ displayName: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, undefined);

      expect(result.displayName).toBe('');
    });

    it('should handle null photoURL', () => {
      const firebaseUser = createMockFirebaseUser({ photoURL: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, undefined);

      expect(result.profileImage).toBeUndefined();
    });

    it('should handle empty providerData', () => {
      const firebaseUser = createMockFirebaseUser({ providerData: [] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, undefined);

      expect(result.googleId).toBe('');
    });

    it('should use viewer role when Firestore role is undefined', () => {
      const firebaseUser = createMockFirebaseUser();
      const firestoreData = {
        createdAt: mockTimestamp,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, firestoreData);

      expect(result.role).toBe('viewer');
    });

    it('should correctly map admin role', () => {
      const firebaseUser = createMockFirebaseUser();
      const firestoreData = {
        role: 'admin',
        createdAt: mockTimestamp,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, firestoreData);

      expect(result.role).toBe('admin');
    });

    it('should correctly map viewer role', () => {
      const firebaseUser = createMockFirebaseUser();
      const firestoreData = {
        role: 'viewer',
        createdAt: mockTimestamp,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapFirebaseUserToUser(firebaseUser as any, firestoreData);

      expect(result.role).toBe('viewer');
    });
  });
});
