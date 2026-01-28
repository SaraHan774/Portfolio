'use client';

import { useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { IS_DEBUG_LAYOUT_ENABLED } from '@/core/constants';
import StaticCategorySidebar from './StaticCategorySidebar';
import { MobileSwipeableCategories } from '../mobile';
import WorkListScrollerFlex from '../work/WorkListScrollerFlex';
import Footer from './Footer';
import { DebugGrid } from './DebugGrid';
import { useCategories, useCategorySelection } from '@/state';
import { useFilteredWorks, useMobileDetection } from '@/domain';
import { LayoutStabilityProvider } from '@/presentation/contexts/LayoutStabilityContext';

interface PortfolioLayoutSimpleProps {
  children: ReactNode;
}

/**
 * 간소화된 포트폴리오 레이아웃 (Single Page Application)
 *
 * 자연스러운 vertical flow:
 * - CategorySidebar (sticky)
 * - WorkListScroller (sticky)
 * - Page Content (WorkDetailPage 조건부 렌더링)
 *
 * URL 구조:
 * - /?keywordId=xxx
 * - /?exhibitionId=xxx
 * - /?keywordId=xxx&workId=123
 */
export default function PortfolioLayoutSimple({ children }: PortfolioLayoutSimpleProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Global state
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();
  const { sentenceCategories, exhibitionCategories } = useCategories();

  // Mobile detection
  const isMobile = useMobileDetection();

  // Client-side mount state (for hydration safety)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch works (선택된 카테고리에 해당하는 작품 목록)
  const { works, hasData } = useFilteredWorks(
    selectedKeywordId,
    selectedExhibitionCategoryId
  );

  // Debug mode (development only)
  const isDebugMode = IS_DEBUG_LAYOUT_ENABLED;

  // URL에서 초기 카테고리 복원 (홈페이지 새로고침 시)
  useEffect(() => {
    const urlKeywordId = searchParams.get('keywordId');
    const urlExhibitionId = searchParams.get('exhibitionId');

    if (urlKeywordId && !selectedKeywordId) {
      selectKeyword(urlKeywordId);
    } else if (urlExhibitionId && !selectedExhibitionCategoryId) {
      selectExhibitionCategory(urlExhibitionId);
    }
  }, [searchParams, selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory]);

  // 선택된 카테고리의 작업 ID 목록
  const selectedWorkIds = useMemo(() => works.map(work => work.id), [works]);

  // 현재 선택된 작품 ID (URL에서 가져옴)
  const selectedWorkId = useMemo(() => {
    return searchParams.get('workId');
  }, [searchParams]);

  // 카테고리 선택 핸들러 (쿼리 파라미터만 변경)
  const handleKeywordSelect = useCallback((keywordId: string) => {
    // 모바일에서 scroll to top (only if scrolled down significantly to avoid interrupting UX)
    if (mounted && isMobile && window.scrollY > window.innerHeight * 0.5) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    selectKeyword(keywordId);

    // URL 업데이트 (workId 제거)
    const params = new URLSearchParams();
    params.set('keywordId', keywordId);
    router.push(`/?${params.toString()}`);
  }, [selectKeyword, router, mounted, isMobile]);

  const handleExhibitionCategorySelect = useCallback((categoryId: string) => {
    // 모바일에서 scroll to top (only if scrolled down significantly to avoid interrupting UX)
    if (mounted && isMobile && window.scrollY > window.innerHeight * 0.5) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    selectExhibitionCategory(categoryId);

    // URL 업데이트 (workId 제거)
    const params = new URLSearchParams();
    params.set('exhibitionId', categoryId);
    router.push(`/?${params.toString()}`);
  }, [selectExhibitionCategory, router, mounted, isMobile]);

  // 작품 선택 핸들러
  const handleWorkSelect = useCallback((workId: string) => {
    const params = new URLSearchParams();

    // 현재 선택된 카테고리를 쿼리 파라미터로 추가
    if (selectedKeywordId) {
      params.set('keywordId', selectedKeywordId);
    } else if (selectedExhibitionCategoryId) {
      params.set('exhibitionId', selectedExhibitionCategoryId);
    }

    params.set('workId', workId);
    router.push(`/?${params.toString()}`);
  }, [selectedKeywordId, selectedExhibitionCategoryId, router]);

  // WorkListScroller 렌더링 여부 및 위치
  const shouldShowWorkList = hasData && (selectedKeywordId || selectedExhibitionCategoryId);
  const workListPosition = selectedKeywordId ? 'left' : 'right';

  // Memoize style objects to prevent unnecessary re-creation
  const rootContainerStyle = useMemo(() => ({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
  } as const), []);

  const workListContainerStyle = useMemo(() => ({
    position: 'relative',
    marginTop: 'var(--space-6)',
    width: '100%',
  } as const), []);

  const contentContainerStyle = useMemo(() => ({
    marginTop: shouldShowWorkList ? 'var(--space-3)' : '0',
    flex: 1,
    ...(isDebugMode ? {
      backgroundColor: 'rgba(255, 165, 0, 0.05)',
      border: '1px dashed orange',
    } : {}),
  } as const), [shouldShowWorkList, isDebugMode]);

  return (
    <div style={rootContainerStyle}>
        {/* 카테고리 영역 - Mobile만 sticky */}
        {mounted && isMobile ? (
          <MobileSwipeableCategories
            sentenceCategories={sentenceCategories}
            exhibitionCategories={exhibitionCategories}
            selectedKeywordId={selectedKeywordId}
            selectedExhibitionCategoryId={selectedExhibitionCategoryId}
            onKeywordSelect={handleKeywordSelect}
            onExhibitionCategorySelect={handleExhibitionCategorySelect}
            selectedWorkIds={selectedWorkIds}
          />
        ) : (
          <StaticCategorySidebar
            sentenceCategories={sentenceCategories}
            exhibitionCategories={exhibitionCategories}
            selectedKeywordId={selectedKeywordId}
            selectedExhibitionCategoryId={selectedExhibitionCategoryId}
            onKeywordSelect={handleKeywordSelect}
            onExhibitionCategorySelect={handleExhibitionCategorySelect}
            selectedWorkIds={selectedWorkIds}
          />
        )}

        {/* 작업 목록 영역 */}
        {shouldShowWorkList && (
          <div
            style={workListContainerStyle}
          >
            <WorkListScrollerFlex
              works={works}
              selectedWorkId={selectedWorkId}
              onWorkSelect={handleWorkSelect}
              showThumbnail={selectedWorkId === null}
              direction={workListPosition === 'left' ? 'ltr' : 'rtl'}
              hideOverflowIndicators={mounted && isMobile}
              fullWidth={mounted && isMobile}
            />
          </div>
        )}

        {/* 페이지별 컨텐츠 */}
        <div
          style={contentContainerStyle}
        >
          <LayoutStabilityProvider
            isLayoutStable={true}
            contentPaddingTop="0px"
          >
            {children}
          </LayoutStabilityProvider>
        </div>

      <Footer />

      {/* 디버그 그리드 오버레이 */}
      <DebugGrid />
    </div>
  );
}
