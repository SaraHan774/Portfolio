'use client';

import { useState, useCallback, useMemo, ReactNode, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import CategorySidebar from './CategorySidebar';
import WorkListScroller from '../work/WorkListScroller';
import MobileCategoryMenu from './MobileCategoryMenu';
import Footer from './Footer';
import { useCategories, useCategorySelection, useUIState } from '@/state';
import { useFilteredWorks } from '@/domain';

/**
 * 레이아웃 상수
 */
const LAYOUT_CONSTANTS = {
  /** 카테고리 영역과 작업 목록 사이의 간격 (px) */
  CATEGORY_TO_WORKLIST_GAP: 24,
  /** 헤더 아래 기본 여백 (var(--space-8)의 px 값) */
  BASE_TOP_OFFSET: 64,
  /** 애니메이션 지속 시간 (초) */
  ANIMATION_DURATION: 0.3,
  /** 전환 애니메이션 타이밍 */
  TRANSITION_EASE: 'easeOut',
} as const;

interface PortfolioLayoutProps {
  children: ReactNode;
}

/**
 * 포트폴리오 공통 레이아웃
 * 
 * CategorySidebar와 WorkListScroller를 페이지 간에 공유하여 Layout Shift 방지
 * - 카테고리 선택 상태를 글로벌로 관리
 * - WorkListScroller의 높이를 측정하여 children에게 적절한 paddingTop 제공
 * - 좌측/우측 카테고리에 따라 WorkListScroller 위치 결정
 */
export default function PortfolioLayout({ children }: PortfolioLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Global state
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIState();
  const { sentenceCategories, exhibitionCategories } = useCategories();

  // Fetch works (선택된 카테고리에 해당하는 작품 목록)
  const { works, hasData } = useFilteredWorks(
    selectedKeywordId,
    selectedExhibitionCategoryId
  );

  // 카테고리 영역의 높이를 저장하는 상태
  const [sentenceCategoryHeight, setSentenceCategoryHeight] = useState<number>(0);
  const [exhibitionCategoryHeight, setExhibitionCategoryHeight] = useState<number>(0);
  
  // WorkListScroller 높이를 저장하는 상태
  const [workListScrollerHeight, setWorkListScrollerHeight] = useState<number>(0);
  const leftWorkListRef = useRef<HTMLDivElement>(null);
  const rightWorkListRef = useRef<HTMLDivElement>(null);

  // 높이 변경 콜백
  const handleSentenceCategoryHeightChange = useCallback((height: number) => {
    setSentenceCategoryHeight(height);
  }, []);

  const handleExhibitionCategoryHeightChange = useCallback((height: number) => {
    setExhibitionCategoryHeight(height);
  }, []);

  // 선택된 카테고리의 작업 ID 목록
  const selectedWorkIds = useMemo(() => works.map(work => work.id), [works]);

  // 현재 선택된 작품 ID (URL에서 가져옴)
  const selectedWorkId = useMemo(() => {
    const match = pathname.match(/\/works\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // WorkListScroller 높이 측정 (좌측)
  useEffect(() => {
    const element = leftWorkListRef.current;
    if (!element || !selectedKeywordId) {
      return;
    }

    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      setWorkListScrollerHeight(height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedKeywordId, works]);

  // WorkListScroller 높이 측정 (우측)
  useEffect(() => {
    const element = rightWorkListRef.current;
    if (!element || !selectedExhibitionCategoryId) {
      return;
    }

    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      setWorkListScrollerHeight(height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedExhibitionCategoryId, works]);

  // children에게 전달할 paddingTop 계산
  const contentPaddingTop = useMemo(() => {
    // 데이터가 없으면 패딩 없음
    if (!hasData) return '0px';
    
    // 현재 활성화된 카테고리의 높이 가져오기
    const categoryHeight = selectedKeywordId 
      ? sentenceCategoryHeight 
      : selectedExhibitionCategoryId 
        ? exhibitionCategoryHeight 
        : 0;
    
    // 카테고리 높이가 측정되지 않았으면 패딩 없음
    if (categoryHeight === 0) return '0px';
    
    // 전체 패딩 계산: 기본 오프셋 + 카테고리 높이 + 간격 + 작업 목록 높이 + 간격
    const totalHeight = 
      LAYOUT_CONSTANTS.BASE_TOP_OFFSET + 
      categoryHeight + 
      LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP + 
      workListScrollerHeight + 
      LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP;
    
    return `${totalHeight}px`;
  }, [selectedKeywordId, selectedExhibitionCategoryId, sentenceCategoryHeight, exhibitionCategoryHeight, workListScrollerHeight, hasData]);

  // 카테고리 선택 핸들러
  const handleKeywordSelect = useCallback((keywordId: string) => {
    selectKeyword(keywordId);
    
    // 작품 상세 페이지에서 카테고리 선택 시 홈으로 이동
    if (pathname.startsWith('/works/')) {
      router.push(`/?keywordId=${keywordId}`);
    }
    // 홈 페이지에서도 URL 업데이트 (다른 카테고리에서 전환 시)
    else if (pathname === '/') {
      // exhibitionId가 있으면 제거하고 keywordId로 교체
      router.push(`/?keywordId=${keywordId}`);
    }
  }, [selectKeyword, pathname, router]);

  const handleExhibitionCategorySelect = useCallback((categoryId: string) => {
    selectExhibitionCategory(categoryId);
    
    // 작품 상세 페이지에서 카테고리 선택 시 홈으로 이동
    if (pathname.startsWith('/works/')) {
      router.push(`/?exhibitionId=${categoryId}`);
    }
    // 홈 페이지에서도 URL 업데이트 (다른 카테고리에서 전환 시)
    else if (pathname === '/') {
      // keywordId가 있으면 제거하고 exhibitionId로 교체
      router.push(`/?exhibitionId=${categoryId}`);
    }
  }, [selectExhibitionCategory, pathname, router]);

  // 작품 선택 핸들러
  const handleWorkSelect = useCallback((workId: string) => {
    const params = new URLSearchParams();
    
    // 현재 선택된 카테고리를 쿼리 파라미터로 추가
    if (selectedKeywordId) {
      params.set('keywordId', selectedKeywordId);
    } else if (selectedExhibitionCategoryId) {
      params.set('exhibitionId', selectedExhibitionCategoryId);
    }
    
    const queryString = params.toString();
    router.push(`/works/${workId}${queryString ? `?${queryString}` : ''}`);
  }, [selectedKeywordId, selectedExhibitionCategoryId, router]);

  // WorkListScroller 렌더링 여부 및 위치 계산
  const workListConfig = useMemo(() => {
    if (!hasData) return null;

    if (selectedKeywordId && sentenceCategoryHeight > 0) {
      return {
        position: 'left' as const,
        top: LAYOUT_CONSTANTS.BASE_TOP_OFFSET + sentenceCategoryHeight + LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP,
        ref: leftWorkListRef,
      };
    }

    if (selectedExhibitionCategoryId && exhibitionCategoryHeight > 0) {
      return {
        position: 'right' as const,
        top: LAYOUT_CONSTANTS.BASE_TOP_OFFSET + exhibitionCategoryHeight + LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP,
        ref: rightWorkListRef,
      };
    }

    return null;
  }, [selectedKeywordId, selectedExhibitionCategoryId, sentenceCategoryHeight, exhibitionCategoryHeight, hasData]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 모바일 카테고리 메뉴 */}
      <MobileCategoryMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sentenceCategories={sentenceCategories}
        exhibitionCategories={exhibitionCategories}
        selectedKeywordId={selectedKeywordId}
        selectedExhibitionCategoryId={selectedExhibitionCategoryId}
        onKeywordSelect={handleKeywordSelect}
        onExhibitionCategorySelect={handleExhibitionCategorySelect}
        selectedWorkIds={pathname.startsWith('/works/') ? [] : selectedWorkIds}
      />

      <div className="flex-1 relative" style={{ paddingTop: '0' }}>
        {/* 카테고리 영역 - 모든 페이지에서 공유 */}
        <CategorySidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={pathname.startsWith('/works/') ? [] : selectedWorkIds}
          onSentenceCategoryHeightChange={handleSentenceCategoryHeightChange}
          onExhibitionCategoryHeightChange={handleExhibitionCategoryHeightChange}
        />

        {/* 작업 목록 영역 - 좌측 또는 우측 */}
        {workListConfig && (
          <div
            ref={workListConfig.ref}
            className="hidden lg:block absolute"
            style={{
              ...(workListConfig.position === 'left' && { left: 'var(--category-margin-left)' }),
              ...(workListConfig.position === 'right' && {
                right: 'var(--category-margin-right)',
                textAlign: 'right',
              }),
              top: `${workListConfig.top}px`,
              maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: LAYOUT_CONSTANTS.ANIMATION_DURATION, 
                ease: LAYOUT_CONSTANTS.TRANSITION_EASE 
              }}
            >
              <WorkListScroller
                works={works}
                selectedWorkId={selectedWorkId}
                onWorkSelect={handleWorkSelect}
                showThumbnail={selectedWorkId === null}
                direction={workListConfig.position === 'left' ? 'ltr' : 'rtl'}
              />
            </motion.div>
          </div>
        )}

        {/* 페이지별 컨텐츠 - paddingTop으로 WorkListScroller와 겹치지 않도록 */}
        <div 
          style={{ 
            paddingTop: contentPaddingTop,
            transition: `padding-top ${LAYOUT_CONSTANTS.ANIMATION_DURATION}s ${LAYOUT_CONSTANTS.TRANSITION_EASE}`,
          }}
        >
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}

