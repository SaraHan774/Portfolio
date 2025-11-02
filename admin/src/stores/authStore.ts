// 인증 상태 관리 (Zustand)
import { create } from 'zustand';
import type { User } from '../types';
import { mockUser } from '../services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// 로컬 스토리지에서 인증 상태 복원
const loadAuthFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const user = JSON.parse(stored);
      // 날짜 객체 복원
      user.createdAt = new Date(user.createdAt);
      user.lastLoginAt = new Date(user.lastLoginAt);
      return user;
    }
  } catch (error) {
    console.error('인증 상태 복원 실패:', error);
  }
  return null;
};

// 로컬 스토리지에 인증 상태 저장
const saveAuthToStorage = (user: User | null) => {
  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth_user');
  }
};

export const useAuthStore = create<AuthState>((set) => {
  // 초기 상태: 로컬 스토리지에서 복원 또는 null
  const initialUser = loadAuthFromStorage();

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    login: (user: User) => {
      // 로그인 시 로컬 스토리지에 저장
      saveAuthToStorage(user);
      set({ user, isAuthenticated: true });
    },
    logout: () => {
      saveAuthToStorage(null);
      set({ user: null, isAuthenticated: false });
    },
  };
});

// 하드코딩된 로그인 함수 (실제 OAuth 대신 사용)
export const mockLogin = (): Promise<User> => {
  return new Promise((resolve) => {
    // 시뮬레이션: 500ms 후 로그인 완료
    setTimeout(() => {
      const user = { ...mockUser, lastLoginAt: new Date() };
      resolve(user);
    }, 500);
  });
};

