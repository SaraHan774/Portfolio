import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
    })),
  },
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
