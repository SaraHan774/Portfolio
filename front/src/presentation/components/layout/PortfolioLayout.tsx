'use client';

import { useState, useCallback, useMemo, ReactNode, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import CategorySidebar from './CategorySidebar';
import WorkListScroller from '../work/WorkListScroller';
import MobileCategoryMenu from './MobileCategoryMenu';
import Footer from './Footer';
import { useCategories, useCategorySelection, useUIState } from '@/state';
import { useFilteredWorks, useScrollLock, useSelectedWorkId } from '@/domain';

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
  /** 카테고리 예상 높이 (측정 전 사용, Layout Shift 방지) */
  ESTIMATED_CATEGORY_HEIGHT: 100,
  /** WorkListScroller 예상 높이 (측정 전 사용, Layout Shift 방지) */
  ESTIMATED_WORKLIST_HEIGHT: 80,
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

  // Global state
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIState();
  const { sentenceCategories, exhibitionCategories } = useCategories();

  // Scroll lock hook
  const { lockScroll, unlockScroll } = useScrollLock();

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

  // 페이드 아웃 상태 (카테고리 변경 시 부드러운 전환)
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  // 페이드 아웃 시작 시점의 paddingTop 고정값
  const [frozenPaddingTop, setFrozenPaddingTop] = useState<string | null>(null);
  // 새 페이지 fade in 상태
  const [shouldFadeIn, setShouldFadeIn] = useState<boolean>(false);
  // Race condition 방지를 위한 fade sequence ID
  const fadeSequenceIdRef = useRef<number>(0);

  // pathname 변경 감지 (fade out 중 라우팅 발생 시 새 페이지 fade in 처리)
  useEffect(() => {
    if (isFadingOut && pathname === '/') {
      // 새 페이지로 전환되었음 - fade in 준비
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldFadeIn(true);
    } else if (!pathname.startsWith('/works/')) {
      // 일반적인 홈 페이지 진입
      setShouldFadeIn(false);
    }
  }, [pathname, isFadingOut]);

  // Cleanup: unmount 시 scroll lock 해제
  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, [unlockScroll]);

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
  const selectedWorkId = useSelectedWorkId();

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

  // 카테고리 선택 핸들러 (라우팅 후 페이드 아웃)
  const handleKeywordSelect = useCallback((keywordId: string) => {
    // 작품 상세 페이지에서 카테고리 선택 시 홈으로 이동
    if (pathname.startsWith('/works/')) {
      // Race condition 방지: 새로운 sequence ID 생성
      const currentSequenceId = ++fadeSequenceIdRef.current;

      // 현재 paddingTop 고정
      setFrozenPaddingTop(contentPaddingTop);
      // 페이드 아웃 시작
      setIsFadingOut(true);
      // 스크롤 잠금
      lockScroll();

      // 즉시 라우팅 시작 (새 페이지가 뒤에서 준비됨)
      selectKeyword(keywordId);
      router.push(`/?keywordId=${keywordId}`);

      // 450ms 후 fade in 시작 (현재 sequence인 경우만 실행)
      setTimeout(() => {
        if (currentSequenceId === fadeSequenceIdRef.current) {
          setIsFadingOut(false);
          setFrozenPaddingTop(null);
          setShouldFadeIn(false);
          unlockScroll();
        }
      }, 450);
    }
    // 홈 페이지에서도 URL 업데이트 (다른 카테고리에서 전환 시)
    else if (pathname === '/') {
      selectKeyword(keywordId);
      // exhibitionId가 있으면 제거하고 keywordId로 교체
      router.push(`/?keywordId=${keywordId}`);
    }
  }, [selectKeyword, pathname, router, contentPaddingTop, lockScroll, unlockScroll]);

  const handleExhibitionCategorySelect = useCallback((categoryId: string) => {
    // 작품 상세 페이지에서 카테고리 선택 시 홈으로 이동
    if (pathname.startsWith('/works/')) {
      // Race condition 방지: 새로운 sequence ID 생성
      const currentSequenceId = ++fadeSequenceIdRef.current;

      // 현재 paddingTop 고정
      setFrozenPaddingTop(contentPaddingTop);
      // 페이드 아웃 시작
      setIsFadingOut(true);
      // 스크롤 잠금
      lockScroll();

      // 즉시 라우팅 시작 (새 페이지가 뒤에서 준비됨)
      selectExhibitionCategory(categoryId);
      router.push(`/?exhibitionId=${categoryId}`);

      // 450ms 후 fade in 시작 (현재 sequence인 경우만 실행)
      setTimeout(() => {
        if (currentSequenceId === fadeSequenceIdRef.current) {
          setIsFadingOut(false);
          setFrozenPaddingTop(null);
          setShouldFadeIn(false);
          unlockScroll();
        }
      }, 450);
    }
    // 홈 페이지에서도 URL 업데이트 (다른 카테고리에서 전환 시)
    else if (pathname === '/') {
      selectExhibitionCategory(categoryId);
      // keywordId가 있으면 제거하고 exhibitionId로 교체
      router.push(`/?exhibitionId=${categoryId}`);
    }
  }, [selectExhibitionCategory, pathname, router, contentPaddingTop, lockScroll, unlockScroll]);

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
      };
    }

    if (selectedExhibitionCategoryId && exhibitionCategoryHeight > 0) {
      return {
        position: 'right' as const,
        top: LAYOUT_CONSTANTS.BASE_TOP_OFFSET + exhibitionCategoryHeight + LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP,
      };
    }

    return null;
  }, [selectedKeywordId, selectedExhibitionCategoryId, sentenceCategoryHeight, exhibitionCategoryHeight, hasData]);

  // WorkListScroller ref 선택
  const currentWorkListRef = selectedKeywordId ? leftWorkListRef : rightWorkListRef;

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
            ref={currentWorkListRef}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
            paddingTop: frozenPaddingTop || contentPaddingTop,
            opacity: (isFadingOut || shouldFadeIn) ? 0 : 1,
            transition: (isFadingOut || shouldFadeIn)
              ? 'opacity 0.4s ease-out'
              : `padding-top ${LAYOUT_CONSTANTS.ANIMATION_DURATION}s ${LAYOUT_CONSTANTS.TRANSITION_EASE}`,
            pointerEvents: (isFadingOut || shouldFadeIn) ? 'none' : 'auto',
            position: 'relative',
            zIndex: isFadingOut ? 1000 : 'auto',
          }}
        >
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}

