/**
 * Auth Domain Hook - 인증 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  loginWithGoogle,
  logout,
  getCurrentUser,
  onAuthChange,
  setUserRole,
  isAdmin,
  authCacheKeys,
} from '../../data/repository';
import type { User } from '../../core/types';

/**
 * 현재 사용자 조회 (React Query 사용)
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authCacheKeys.user(),
    queryFn: getCurrentUser,
    staleTime: 0, // 항상 최신 상태 유지
  });
};

/**
 * 인증 상태 관리 Hook
 * Zustand 대신 React Query + 로컬 상태로 관리
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 변경 리스너
  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : '인증 초기화 실패');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initialize();

    // 인증 상태 변경 구독
    const unsubscribe = onAuthChange((updatedUser) => {
      setUser(updatedUser);
      // React Query 캐시도 갱신
      queryClient.setQueryData(authCacheKeys.user(), updatedUser);
    });

    return unsubscribe;
  }, [queryClient]);

  // 로그인
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
      queryClient.setQueryData(authCacheKeys.user(), loggedInUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인 실패';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  // 로그아웃
  const logoutUser = useCallback(async () => {
    setIsLoading(true);
    try {
      await logout();
      setUser(null);
      queryClient.setQueryData(authCacheKeys.user(), null);
      queryClient.clear(); // 모든 캐시 클리어
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그아웃 실패';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: isAdmin(user),
    isLoading,
    isInitialized,
    error,
    login,
    logout: logoutUser,
  };
};

/**
 * 관리자 전용 역할 변경 Mutation
 */
export const useSetUserRole = () => {
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'viewer' }) =>
      setUserRole(userId, role, currentUser),
  });
};

/**
 * 관리자 권한 확인 Hook
 */
export const useIsAdmin = () => {
  const { user } = useAuth();
  return isAdmin(user);
};

/**
 * 인증 필요 체크 Hook (Protected Route에서 사용)
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isInitialized,
    shouldRedirect: isInitialized && !isLoading && !isAuthenticated,
  };
};

/**
 * 관리자 권한 필요 체크 Hook
 */
export const useRequireAdmin = () => {
  const { isAuthenticated, isAdmin: hasAdminRole, isLoading, isInitialized } = useAuth();

  return {
    isAuthenticated,
    isAdmin: hasAdminRole,
    isLoading,
    isInitialized,
    shouldRedirect: isInitialized && !isLoading && (!isAuthenticated || !hasAdminRole),
  };
};
