'use client';

import { LoadingContainer } from '@/presentation/ui';
import { useCategories } from '@/state';

/**
 * 홈페이지
 * PortfolioLayout은 app/layout.tsx에서 공유됨
 */
export default function HomePage() {
  const { isLoading } = useCategories();

  if (isLoading) {
    return <LoadingContainer size={24} />;
  }

  return (
    // 중앙 컨텐츠 영역 - 홈페이지에서는 비어있음
    <main
      style={{
        // 뷰포트 높이에서 120px를 제외한 높이를 최소높이로 한다.
        // 모바일에서 vh는 깨질 수 있어서 dvh 사용함
        // minHeight: 'calc(100vh - 120px)',
        // paddingTop: 'var(--space-6)',
      }}
    />
  );
}
