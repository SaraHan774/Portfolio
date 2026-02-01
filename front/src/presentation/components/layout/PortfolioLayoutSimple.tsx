'use client';

import { useState, useCallback, useMemo, ReactNode, useEffect, CSSProperties } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { IS_DEBUG_LAYOUT_ENABLED } from '@/core/constants';
import StaticCategorySidebar from './StaticCategorySidebar';
import { MobileSwipeableCategories } from '../mobile';
import WorkListScrollerFlex from '../work/WorkListScrollerFlex';
import Footer from './Footer';
import { DebugGrid } from './DebugGrid';
import HomeIcon from './HomeIcon';
import { useCategories, useCategorySelection } from '@/state';
import { useFilteredWorks, useMobileDetection, useSiteSettings } from '@/domain';
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
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory, clearSelection } = useCategorySelection();
  const { sentenceCategories, exhibitionCategories } = useCategories();

  // Site settings for home icon
  const { data: siteSettings } = useSiteSettings();

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

  // URL과 카테고리 선택 상태 동기화
  useEffect(() => {
    const urlKeywordId = searchParams.get('keywordId');
    const urlExhibitionId = searchParams.get('exhibitionId');

    // URL → State 동기화: URL에 파라미터가 있으면 상태 복원
    if (urlKeywordId && !selectedKeywordId) {
      selectKeyword(urlKeywordId);
    } else if (urlExhibitionId && !selectedExhibitionCategoryId) {
      selectExhibitionCategory(urlExhibitionId);
    }
    // URL이 비어있으면 상태도 초기화
    else if (!urlKeywordId && !urlExhibitionId && (selectedKeywordId || selectedExhibitionCategoryId)) {
      clearSelection();
    }
  }, [searchParams, selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory, clearSelection]);

  // 선택된 카테고리의 작업 ID 목록
  const selectedWorkIds = useMemo(() => works.map(work => work.id), [works]);

  // 현재 선택된 작품 ID (URL에서 가져옴)
  const selectedWorkId = useMemo(() => {
    return searchParams.get('workId');
  }, [searchParams]);

  // 카테고리 선택 핸들러 (쿼리 파라미터만 변경)
  const handleKeywordSelect = useCallback((keywordId: string) => {
    // 모바일에서 scroll to top
    if (mounted && isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    selectKeyword(keywordId);

    // URL 업데이트 (workId 제거)
    const params = new URLSearchParams();
    params.set('keywordId', keywordId);
    router.push(`/?${params.toString()}`);
  }, [selectKeyword, router, mounted, isMobile]);

  const handleExhibitionCategorySelect = useCallback((categoryId: string) => {
    // 모바일에서 scroll to top
    if (mounted && isMobile) {
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

  // Memoize container style to prevent re-creation on every render
  const containerStyle = useMemo<CSSProperties>(() => ({
    height: mounted && isMobile ? '100vh' : 'auto',
    minHeight: mounted && isMobile ? 'auto' : '100vh',
    overflowY: mounted && isMobile ? 'auto' : 'visible',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
  }), [mounted, isMobile]);

  return (
    <div style={containerStyle}>
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
            style={{
              position: 'relative',
              width: '100%',
            }}
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
          style={{
            marginTop: shouldShowWorkList ? 'var(--space-3)' : '0',
            flex: 1,
            ...(isDebugMode ? {
              backgroundColor: 'rgba(255, 165, 0, 0.05)',
              border: '1px dashed orange',
            } : {}),
          }}
        >
          <LayoutStabilityProvider
            isLayoutStable={true}
            contentPaddingTop="0px"
          >
            {children}
          </LayoutStabilityProvider>
        </div>

      <Footer />

      {/* 홈 아이콘 (웹/태블릿 화면에서만 표시, 화면 중앙 상단 고정) */}
      {siteSettings?.homeIconUrl && siteSettings?.homeIconHoverUrl && (
        <HomeIcon
          defaultIconUrl={siteSettings.homeIconUrl}
          hoverIconUrl={siteSettings.homeIconHoverUrl}
          size={siteSettings.homeIconSize}
          onReset={clearSelection}
        />
      )}

      {/* 디버그 그리드 오버레이 */}
      <DebugGrid />
    </div>
  );
}
