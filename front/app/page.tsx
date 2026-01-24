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
    <main style={{
      backgroundColor: 'rgba(255, 255, 0, 0.05)', // 노란색 반투명
      border: '1px dashed yellow',
      minHeight: '50vh',
      position: 'relative',
    }}>
      {/* 디버그 라벨 */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 4,
        fontSize: '9px',
        color: '#B8860B',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: 1003,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '2px 4px',
        width: 'fit-content',
      }}>
        HomePage - main (empty)
      </div>
    </main>
  );
}
