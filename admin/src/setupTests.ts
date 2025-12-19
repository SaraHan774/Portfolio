import '@testing-library/jest-dom';
import { vi } from 'vitest';

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

// Mock Firebase Works Service
vi.mock('./services/worksService', () => ({
  getWorks: vi.fn(),
  getWork: vi.fn(),
  createWork: vi.fn(),
  updateWork: vi.fn(),
  deleteWork: vi.fn(),
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});