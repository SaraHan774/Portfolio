'use client';

import { Suspense, ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingContainer } from '@/presentation/ui';
import { useCategories } from '@/state';
import WorkDetailPage from './works/WorkDetailPage';

// [ISR] 세그먼트 설정(revalidate)은 server인 layout.tsx에서 관리(이 파일은 'use client').
// force-dynamic 제거로 엣지 캐시 가능. useSearchParams는 아래 <Suspense> 안이라 정적 셸로
// 프리렌더되고, workId 기반 상세/모달은 클라이언트에서 처리된다.

/**
 * 홈페이지 (Single Page Application)
 *
 * URL 구조:
 * - 카테고리만: /?keywordId=xxx 또는 /?exhibitionId=xxx
 * - 작품 상세: /?keywordId=xxx&workId=123
 *
 * workId가 있으면 WorkDetailPage를 조건부 렌더링
 */
function HomePageContent(): ReactElement {
  const { isLoading } = useCategories();
  const searchParams = useSearchParams();
  const workId = searchParams.get('workId');

  // workId가 있으면 카테고리 로딩을 기다리지 않고 즉시 상세를 렌더한다.
  // 카테고리는 레이아웃 네비용일 뿐 상세 본문/LCP 이미지와 독립적이므로,
  // 이 게이트를 두면 상세 LCP 이미지 로딩이 카테고리 왕복 뒤로 직렬화된다.
  // workId가 없을 때(홈)만 카테고리 로딩 스피너를 표시한다.
  if (!workId && isLoading) {
    return <LoadingContainer size={24} />;
  }

  // workId가 있으면 작품 상세 페이지 표시 (부드러운 전환)
  return (
    <AnimatePresence mode="wait">
      {workId && (
        <motion.div
          key={workId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <WorkDetailPage workId={workId} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingContainer size={24} />}>
      <HomePageContent />
    </Suspense>
  );
}
