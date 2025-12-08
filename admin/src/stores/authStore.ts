// 인증 상태 관리 (Zustand + Firebase)
import { create } from 'zustand';
import type { User } from '../types';
import {
  loginWithGoogle,
  logout as firebaseLogout,
  getCurrentUser,
  onAuthChange,
} from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // 초기 로딩 상태
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
}));

// 개발용 목 로그인 함수 (Firebase 연결 전 테스트용)
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
