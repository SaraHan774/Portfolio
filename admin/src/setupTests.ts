import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock Firebase
vi.mock('./lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
}));

// Mock Firebase Auth Service
vi.mock('./services/authService', () => ({
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthChange: vi.fn(),
}));

// Mock Firebase Works Service with default implementations
vi.mock('./services/worksService', () => ({
  getWorks: vi.fn().mockResolvedValue([]),
  getWork: vi.fn().mockResolvedValue(null),
  createWork: vi.fn().mockResolvedValue({}),
  updateWork: vi.fn().mockResolvedValue({}),
  deleteWork: vi.fn().mockResolvedValue(undefined),
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});