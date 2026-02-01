'use client';

import { Suspense, ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingContainer } from '@/presentation/ui';
import { useCategories } from '@/state';
import WorkDetailPage from './works/WorkDetailPage';

// Disable static generation for this page (uses useSearchParams)
export const dynamic = 'force-dynamic';

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

  if (isLoading) {
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
