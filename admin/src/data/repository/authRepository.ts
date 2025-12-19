/**
 * Auth Repository - 인증 레포지토리
 * API 레이어를 래핑하고 인증 관련 로직 제공
 */
import * as authApi from '../api/authApi';
import { cacheKeys, cacheConfig } from './cacheKeys';
import type { User } from '../../core/types';

/**
 * 캐시 키 및 설정 export (React Query에서 사용)
 */
export const authCacheKeys = cacheKeys.auth;
export const authCacheConfig = cacheConfig.realtime;

/**
 * Google 로그인
 */
export const loginWithGoogle = async (): Promise<User> => {
  return authApi.loginWithGoogle();
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  return authApi.logout();
};

/**
 * 현재 로그인된 사용자 가져오기
 */
export const getCurrentUser = async (): Promise<User | null> => {
  return authApi.getCurrentUser();
};

/**
 * 인증 상태 변경 리스너
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return authApi.onAuthChange(callback);
};

/**
 * 사용자 역할 변경
 */
export const setUserRole = async (
  userId: string,
  role: 'admin' | 'viewer'
): Promise<void> => {
  return authApi.setUserRole(userId, role);
};

/**
 * 관리자 여부 확인
 */
export const isAdmin = (user: User | null): boolean => {
  return authApi.isAdmin(user);
};
