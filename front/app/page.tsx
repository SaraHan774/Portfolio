'use client';

import { useSearchParams } from 'next/navigation';
import { LoadingContainer } from '@/presentation/ui';
import { useCategories } from '@/state';
import WorkDetailPage from './works/WorkDetailPage';

/**
 * 홈페이지 (Single Page Application)
 *
 * URL 구조:
 * - 카테고리만: /?keywordId=xxx 또는 /?exhibitionId=xxx
 * - 작품 상세: /?keywordId=xxx&workId=123
 *
 * workId가 있으면 WorkDetailPage를 조건부 렌더링
 */
export default function HomePage() {
  const { isLoading } = useCategories();
  const searchParams = useSearchParams();
  const workId = searchParams.get('workId');

  if (isLoading) {
    return <LoadingContainer size={24} />;
  }

  // workId가 있으면 작품 상세 페이지 표시
  if (workId) {
    return <WorkDetailPage workId={workId} />;
  }

  // workId가 없으면 빈 홈페이지
  return null;
}
