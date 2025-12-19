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

  // 인증 상태 변경 리스너 - 마운트 시 한 번만 실행
  // Note: queryClient는 QueryClientProvider 컨텍스트에서 제공되는 stable reference
  // Provider가 리마운트되면 전체 앱이 리마운트되므로 안전함
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
    // queryClient는 stable reference (QueryClientProvider 컨텍스트)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
 *
 * @remarks
 * 캐시된 사용자 정보로 권한 검사를 수행합니다.
 * 캐시가 stale할 수 있으므로, 중요한 권한 변경 전에는
 * useCurrentUser().refetch()로 최신 데이터를 확보하세요.
 *
 * 서버측에서도 권한 검사가 이루어지므로 보안상 안전합니다.
 */
export const useSetUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'viewer' }) => {
      // 캐시에서 사용자 정보 가져오기 (stale closure 방지)
      // 참고: 서버측 authApi.setUserRole에서도 권한 검사 수행
      const currentUser = queryClient.getQueryData<User | null>(authCacheKeys.user()) ?? null;
      return setUserRole(userId, role, currentUser);
    },
  });
};

/**
 * 관리자 권한 확인 Hook
 * useAuth().isAdmin을 직접 사용해도 되지만, 편의성을 위해 제공
 */
export const useIsAdmin = () => {
  const { isAdmin: hasAdminRole } = useAuth();
  return hasAdminRole;
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
