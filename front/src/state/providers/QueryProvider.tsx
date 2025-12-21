'use client';

/**
 * React Query Provider
 * 클라이언트 사이드에서 React Query 기능을 제공하는 래퍼 컴포넌트
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // QueryClient를 상태로 관리하여 SSR에서 클라이언트 간 데이터 공유 방지
  const [queryClient] = useState(
    () =>
      new QueryClient({
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

