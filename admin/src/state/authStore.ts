/**
 * Auth State Store - 인증 상태 관리 (Zustand)
 * State Layer: 전역 상태 관리
 */
import { create } from 'zustand';
import type { User } from '../core/types';
import {
  loginWithGoogle,
  logout as firebaseLogout,
  getCurrentUser,
  onAuthChange,
} from '../data/repository';

// ============ Types ============

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// ============ Store ============

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Google 로그인
  login: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginWithGoogle();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인 실패';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 로그아웃
  logout: async () => {
    set({ isLoading: true });
    try {
      await firebaseLogout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃 실패';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 인증 상태 초기화 (앱 시작 시 호출)
  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });

      // 인증 상태 변경 리스너 설정
      onAuthChange((updatedUser) => {
        set({
          user: updatedUser,
          isAuthenticated: !!updatedUser,
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '인증 초기화 실패';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // 에러 클리어
  clearError: () => {
    set({ error: null });
  },
}));

// ============ Selectors ============

/**
 * 사용자 정보만 선택
 */
export const selectUser = (state: AuthStore) => state.user;

/**
 * 인증 여부만 선택
 */
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;

/**
 * 로딩 상태만 선택
 */
export const selectIsLoading = (state: AuthStore) => state.isLoading;

/**
 * 에러 상태만 선택
 */
export const selectError = (state: AuthStore) => state.error;

/**
 * 관리자 여부 선택
 */
export const selectIsAdmin = (state: AuthStore) => state.user?.role === 'admin';

// ============ Dev Utils ============

/**
 * 개발용 목 로그인 함수 (Firebase 연결 전 테스트용)
 * @deprecated 개발/테스트 용도로만 사용
 */
export const mockLogin = async (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'mock-user-001',
        email: 'admin@example.com',
        googleId: 'google-mock-123',
        displayName: '테스트 관리자',
        profileImage: undefined,
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    }, 500);
  });
};
