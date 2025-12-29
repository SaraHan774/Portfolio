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
    <main/>
  );
}
