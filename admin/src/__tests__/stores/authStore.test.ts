import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import {
  loginWithGoogle,
  logout as firebaseLogout,
  getCurrentUser,
  onAuthChange,
} from '../../services/authService';
import type { User } from '../../types';

// Get mocked functions
const mockLoginWithGoogle = vi.mocked(loginWithGoogle);
const mockFirebaseLogout = vi.mocked(firebaseLogout);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockOnAuthChange = vi.mocked(onAuthChange);

const mockUser: User = {
  id: 'test-user-001',
  email: 'test@example.com',
  googleId: 'google-test-123',
  displayName: 'Test User',
  profileImage: undefined,
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-01'),
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should set loading state when login starts', async () => {
      mockLoginWithGoogle.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 100);
          })
      );

      const loginPromise = useAuthStore.getState().login();

      // Check loading state immediately after login call
      expect(useAuthStore.getState().isLoading).toBe(true);
      expect(useAuthStore.getState().error).toBeNull();

      await loginPromise;
    });

    it('should set user and authenticated state on successful login', async () => {
      mockLoginWithGoogle.mockResolvedValue(mockUser);

      await useAuthStore.getState().login();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error state on failed login', async () => {
      const errorMessage = 'Login failed';
      mockLoginWithGoogle.mockRejectedValue(new Error(errorMessage));

      await expect(useAuthStore.getState().login()).rejects.toThrow(errorMessage);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle non-Error thrown objects', async () => {
      mockLoginWithGoogle.mockRejectedValue('Unknown error');

      await expect(useAuthStore.getState().login()).rejects.toBe('Unknown error');

      const state = useAuthStore.getState();
      expect(state.error).toBe('로그인 실패');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state before logout tests
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    });

    it('should set loading state when logout starts', async () => {
      mockFirebaseLogout.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      const logoutPromise = useAuthStore.getState().logout();

      expect(useAuthStore.getState().isLoading).toBe(true);

      await logoutPromise;
    });

    it('should clear user and authenticated state on successful logout', async () => {
      mockFirebaseLogout.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set error state on failed logout', async () => {
      const errorMessage = 'Logout failed';
      mockFirebaseLogout.mockRejectedValue(new Error(errorMessage));

      await expect(useAuthStore.getState().logout()).rejects.toThrow(errorMessage);

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('initializeAuth', () => {
    it('should set user from getCurrentUser on initialization', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockOnAuthChange.mockImplementation(() => () => {});

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set not authenticated when no user exists', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockOnAuthChange.mockImplementation(() => () => {});

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should set up auth change listener', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockOnAuthChange.mockImplementation(() => () => {});

      await useAuthStore.getState().initializeAuth();

      expect(mockOnAuthChange).toHaveBeenCalledTimes(1);
      expect(mockOnAuthChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update state when auth change callback is triggered', async () => {
      let authChangeCallback: ((user: User | null) => void) | undefined;

      mockGetCurrentUser.mockResolvedValue(null);
      mockOnAuthChange.mockImplementation((callback) => {
        authChangeCallback = callback;
        return () => {};
      });

      await useAuthStore.getState().initializeAuth();

      // Initially not authenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      // Simulate auth change
      authChangeCallback?.(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set error state on initialization failure', async () => {
      const errorMessage = 'Init failed';
      mockGetCurrentUser.mockRejectedValue(new Error(errorMessage));

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });
});
