'use client';

/**
 * React Query Provider
 * 클라이언트 사이드에서 React Query 기능을 제공하는 래퍼 컴포넌트
 */

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { useToast } from '@/presentation/contexts/ToastContext';
import { NotFoundError } from '@/core/errors';

interface QueryProviderProps {
  children: ReactNode;
}

function QueryProviderInner({ children }: QueryProviderProps) {
  const { showError } = useToast();

  // QueryClient를 상태로 관리하여 SSR에서 클라이언트 간 데이터 공유 방지
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // NotFoundError - 사용자에게 명확한 메시지 표시
            if (error instanceof NotFoundError) {
              showError('요청하신 작품을 찾을 수 없습니다. 삭제되었거나 더 이상 공개되지 않습니다.');
              return;
            }

            // 다른 모든 에러는 Toast로 알림
            const errorMessage = error instanceof Error
              ? error.message
              : '데이터를 불러오는 중 오류가 발생했습니다.';

            showError(errorMessage);
          },
        }),
        defaultOptions: {
          queries: {
            // 기본 stale time: 5분 (자주 변경되지 않는 데이터)
            staleTime: 5 * 60 * 1000,
            // 가비지 컬렉션 time: 10분
            gcTime: 10 * 60 * 1000,
            // 백그라운드에서 자동 refetch 비활성화
            refetchOnWindowFocus: false,
            // 재시도 1회
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryProviderInner>{children}</QueryProviderInner>;
}

