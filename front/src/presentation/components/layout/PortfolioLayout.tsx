'use client';

import { useState, useCallback, useMemo, ReactNode, useRef, useEffect, useLayoutEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import CategorySidebar from './CategorySidebar';
import { MobileSwipeableCategories } from '../mobile';
import WorkListScrollerFlex from '../work/WorkListScrollerFlex';
import Footer from './Footer';
import { useCategories, useCategorySelection } from '@/state';
import { useFilteredWorks, useScrollLock, useOptimizedResize, useMobileDetection } from '@/domain';
import { logLayout, getViewportInfo, getBreakpoint, detectBreakpointChange } from '@/core/utils/layoutDebugLogger';
import { LayoutStabilityProvider } from '@/presentation/contexts/LayoutStabilityContext';

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
  ESTIMATED_CATEGORY_HEIGHT: 120,
  /** WorkListScroller 예상 높이 (측정 전 사용, Layout Shift 방지) */
  ESTIMATED_WORKLIST_HEIGHT: 80,
  /** 전체 추정 paddingTop (초기 렌더링 시 사용) */
  ESTIMATED_TOTAL_PADDING: 64 + 120 + 24 + 80 + 24, // BASE + CATEGORY + GAP + WORKLIST + GAP = 312px
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
  const searchParams = useSearchParams();

  // Global state
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();
  const { sentenceCategories, exhibitionCategories } = useCategories();

  // Mobile detection
  const isMobile = useMobileDetection();

  // Client-side mount state (for hydration-safe debug labels)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Debug mode (development only)
  const isDebugMode = process.env.NODE_ENV === 'development';

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
  const heightMeasurementAttemptsRef = useRef<number>(0);
  const measurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Content padding (추정값으로 초기화하여 Layout Shift 방지)
  const [contentPaddingTop, setContentPaddingTop] = useState<string>(
    hasData ? `${LAYOUT_CONSTANTS.ESTIMATED_TOTAL_PADDING}px` : '0px'
  );

  // Layout 안정화 상태 (Caption 렌더링 타이밍 제어)
  const [isLayoutStable, setIsLayoutStable] = useState(false);
  const layoutStableTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 페이드 아웃 상태 (카테고리 변경 시 부드러운 전환)
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  // 페이드 아웃 시작 시점의 paddingTop 고정값
  const [frozenPaddingTop, setFrozenPaddingTop] = useState<string | null>(null);
  // 새 페이지 fade in 상태
  const [shouldFadeIn, setShouldFadeIn] = useState<boolean>(false);
  // Race condition 방지를 위한 fade sequence ID
  const fadeSequenceIdRef = useRef<number>(0);
  // Breakpoint 변경 추적용
  const previousWidthRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth : 0);

  // URL에서 초기 카테고리 복원 (홈페이지 새로고침 시)
  const hasInitialized = useRef(false);
  useEffect(() => {
    // 한 번만 실행 (새로고침 시에만)
    if (hasInitialized.current) return;

    const urlKeywordId = searchParams.get('keywordId');
    const urlExhibitionId = searchParams.get('exhibitionId');

    if (urlKeywordId && !selectedKeywordId) {
      selectKeyword(urlKeywordId);
      hasInitialized.current = true;
      logLayout('PortfolioLayout', 'urlRestore', {
        ...getViewportInfo(),
        urlKeywordId,
        action: 'selectKeyword',
      });
    } else if (urlExhibitionId && !selectedExhibitionCategoryId) {
      selectExhibitionCategory(urlExhibitionId);
      hasInitialized.current = true;
      logLayout('PortfolioLayout', 'urlRestore', {
        ...getViewportInfo(),
        urlExhibitionId,
        action: 'selectExhibitionCategory',
      });
    }
  }, [searchParams, selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory]);

  // Mount 로그
  useEffect(() => {
    logLayout('PortfolioLayout', 'mount', {
      ...getViewportInfo(),
      breakpoint: getBreakpoint(),
      pathname,
      selectedKeywordId,
      selectedExhibitionCategoryId,
    });
  }, [pathname, selectedKeywordId, selectedExhibitionCategoryId]);

  // Window resize 이벤트 리스너 (optimized with RAF + debounce)
  // 콜백은 클로저를 통해 항상 최신 state 값을 참조하므로 의존성 배열 불필요
  useOptimizedResize(() => {
    const currentWidth = window.innerWidth;
    const previousWidth = previousWidthRef.current;
    const breakpointChange = detectBreakpointChange(previousWidth, currentWidth);
    const currentBreakpoint = getBreakpoint(currentWidth);

    // Breakpoint 변경 시 특별 로깅
    if (breakpointChange.changed) {
      logLayout('PortfolioLayout', 'breakpointChange', {
        ...getViewportInfo(),
        breakpoint_from: breakpointChange.from,
        breakpoint_to: breakpointChange.to,
        previousWidth,
        currentWidth,
        widthDelta: currentWidth - previousWidth,
        pathname,
        sentenceCategoryHeight,
        exhibitionCategoryHeight,
        workListScrollerHeight,
        contentPaddingTop,
      });
    }

    // 일반 resize 로깅
    logLayout('PortfolioLayout', 'windowResize', {
      ...getViewportInfo(),
      breakpoint: currentBreakpoint,
      pathname,
      selectedKeywordId,
      selectedExhibitionCategoryId,
      sentenceCategoryHeight,
      exhibitionCategoryHeight,
      workListScrollerHeight,
      contentPaddingTop,
      optimized: 'RAF+debounce',
    });

    // 현재 width 저장
    previousWidthRef.current = currentWidth;
  }, { delay: 150 });

  // Cleanup: unmount 시 scroll lock 해제 및 timer 클리어
  useEffect(() => {
    return () => {
      unlockScroll();
      if (layoutStableTimerRef.current) {
        clearTimeout(layoutStableTimerRef.current);
        layoutStableTimerRef.current = null;
      }
      if (measurementTimeoutRef.current) {
        clearTimeout(measurementTimeoutRef.current);
        measurementTimeoutRef.current = null;
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
    };
  }, [unlockScroll]);

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

  // pathname 또는 카테고리 변경 시 layout stability 리셋
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLayoutStable(false);
    logLayout('PortfolioLayout', 'layoutStabilityReset', {
      ...getViewportInfo(),
      reason: 'pathname or category changed',
      pathname,
      selectedKeywordId,
      selectedExhibitionCategoryId,
    });
  }, [pathname, selectedKeywordId, selectedExhibitionCategoryId]);

  // 높이 변경 콜백
  const handleSentenceCategoryHeightChange = useCallback((height: number) => {
    console.log('[CategoryHeight] Sentence category height changed:', height);
    setSentenceCategoryHeight(height);
    logLayout('PortfolioLayout', 'sentenceCategoryHeightChange', {
      ...getViewportInfo(),
      newHeight: height,
      pathname,
    });
  }, [pathname]);

  const handleExhibitionCategoryHeightChange = useCallback((height: number) => {
    console.log('[CategoryHeight] Exhibition category height changed:', height);
    setExhibitionCategoryHeight(height);
    logLayout('PortfolioLayout', 'exhibitionCategoryHeightChange', {
      ...getViewportInfo(),
      newHeight: height,
      pathname,
    });
  }, [pathname]);

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
      console.log('[WorkListScroller left] Not measuring:', { hasElement: !!element, selectedKeywordId });
      heightMeasurementAttemptsRef.current = 0;
      return;
    }

    heightMeasurementAttemptsRef.current = 0;

    const updateHeight = () => {
      const rect = element.getBoundingClientRect();
      const height = rect.height;
      console.log('[WorkListScroller left] Measured height:', height, 'attempt:', heightMeasurementAttemptsRef.current);

      if (height > 0) {
        setWorkListScrollerHeight(height);
        heightMeasurementAttemptsRef.current = 0;

        logLayout('PortfolioLayout', 'workListScrollerHeightUpdate (left)', {
          ...getViewportInfo(),
          position: 'left',
          selectedKeywordId,
          workListHeight: height,
          workListTop: rect.top,
          workListLeft: rect.left,
          workListWidth: rect.width,
          worksCount: works.length,
          pathname,
        });
      } else {
        // 높이가 0이면 재측정 시도
        heightMeasurementAttemptsRef.current += 1;
        console.log('[WorkListScroller left] Height is 0, retrying...', heightMeasurementAttemptsRef.current);

        if (heightMeasurementAttemptsRef.current < 10) {
          // 50ms 후 재측정
          if (measurementTimeoutRef.current) {
            clearTimeout(measurementTimeoutRef.current);
          }
          measurementTimeoutRef.current = setTimeout(() => {
            updateHeight();
          }, 50);
        } else {
          // 10번 재시도 후에도 0이면 추정값 사용하고 강제 stable
          console.warn('[WorkListScroller left] Height still 0 after 10 attempts, using estimated height');
          setWorkListScrollerHeight(LAYOUT_CONSTANTS.ESTIMATED_WORKLIST_HEIGHT);
        }
      }
    };

    console.log('[WorkListScroller left] Starting measurement');
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => {
      console.log('[WorkListScroller left] Cleanup');
      resizeObserver.disconnect();
      if (measurementTimeoutRef.current) {
        clearTimeout(measurementTimeoutRef.current);
        measurementTimeoutRef.current = null;
      }
    };
  }, [selectedKeywordId, works, pathname]);

  // WorkListScroller 높이 측정 (우측)
  useEffect(() => {
    const element = rightWorkListRef.current;
    if (!element || !selectedExhibitionCategoryId) {
      console.log('[WorkListScroller right] Not measuring:', { hasElement: !!element, selectedExhibitionCategoryId });
      heightMeasurementAttemptsRef.current = 0;
      return;
    }

    heightMeasurementAttemptsRef.current = 0;

    const updateHeight = () => {
      const rect = element.getBoundingClientRect();
      const height = rect.height;
      console.log('[WorkListScroller right] Measured height:', height, 'attempt:', heightMeasurementAttemptsRef.current);

      if (height > 0) {
        setWorkListScrollerHeight(height);
        heightMeasurementAttemptsRef.current = 0;

        logLayout('PortfolioLayout', 'workListScrollerHeightUpdate (right)', {
          ...getViewportInfo(),
          position: 'right',
          selectedExhibitionCategoryId,
          workListHeight: height,
          workListTop: rect.top,
          workListRight: rect.right,
          workListWidth: rect.width,
          worksCount: works.length,
          pathname,
        });
      } else {
        // 높이가 0이면 재측정 시도
        heightMeasurementAttemptsRef.current += 1;
        console.log('[WorkListScroller right] Height is 0, retrying...', heightMeasurementAttemptsRef.current);

        if (heightMeasurementAttemptsRef.current < 10) {
          // 50ms 후 재측정
          if (measurementTimeoutRef.current) {
            clearTimeout(measurementTimeoutRef.current);
          }
          measurementTimeoutRef.current = setTimeout(() => {
            updateHeight();
          }, 50);
        } else {
          // 10번 재시도 후에도 0이면 추정값 사용하고 강제 stable
          console.warn('[WorkListScroller right] Height still 0 after 10 attempts, using estimated height');
          setWorkListScrollerHeight(LAYOUT_CONSTANTS.ESTIMATED_WORKLIST_HEIGHT);
        }
      }
    };

    console.log('[WorkListScroller right] Starting measurement');
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => {
      console.log('[WorkListScroller right] Cleanup');
      resizeObserver.disconnect();
      if (measurementTimeoutRef.current) {
        clearTimeout(measurementTimeoutRef.current);
        measurementTimeoutRef.current = null;
      }
    };
  }, [selectedExhibitionCategoryId, works, pathname]);

  // useLayoutEffect로 실제 높이 측정 (paint 전 동기 실행, Layout Shift 방지)
  useLayoutEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // 모바일에서는 paddingTop 계산 불필요 (자연스러운 flow 사용)
    if (isMobile) {
      if (contentPaddingTop !== '0px') {
        setContentPaddingTop('0px');
      }
      if (!isLayoutStable) {
        setIsLayoutStable(true);
      }
      logLayout('PortfolioLayout', 'contentPaddingTopUpdate', {
        ...getViewportInfo(),
        result: '0px',
        reason: 'mobile - natural flow, no padding needed',
        isMobile: true,
      });
      return;
    }

    // Desktop: 기존 로직
    // 데이터가 없으면 패딩 0px
    if (!hasData) {
      if (contentPaddingTop !== '0px') {
        setContentPaddingTop('0px');
        logLayout('PortfolioLayout', 'contentPaddingTopUpdate', {
          ...getViewportInfo(),
          result: '0px',
          reason: 'no data',
          hasData,
        });
      }
      // 데이터 없으면 즉시 stable
      setIsLayoutStable(true);
      return;
    }

    // Desktop: 기존 로직 유지
    // 현재 활성화된 카테고리의 높이 가져오기
    const categoryHeight = selectedKeywordId
      ? sentenceCategoryHeight
      : selectedExhibitionCategoryId
        ? exhibitionCategoryHeight
        : 0;

    // 카테고리 높이가 측정되지 않았으면 추정값 사용
    if (categoryHeight === 0) {
      const estimated = `${LAYOUT_CONSTANTS.ESTIMATED_TOTAL_PADDING}px`;
      if (contentPaddingTop !== estimated) {
        setContentPaddingTop(estimated);
        logLayout('PortfolioLayout', 'contentPaddingTopUpdate', {
          ...getViewportInfo(),
          result: estimated,
          reason: 'using estimated value',
          selectedKeywordId,
          selectedExhibitionCategoryId,
        });
      }
      // 측정 중이므로 not stable
      setIsLayoutStable(false);
      return;
    }

    // WorkListScroller 높이가 측정되지 않았으면 추정값 사용
    if (workListScrollerHeight === 0) {
      const estimated = `${LAYOUT_CONSTANTS.ESTIMATED_TOTAL_PADDING}px`;
      if (contentPaddingTop !== estimated) {
        setContentPaddingTop(estimated);
        logLayout('PortfolioLayout', 'contentPaddingTopUpdate', {
          ...getViewportInfo(),
          result: estimated,
          reason: 'workListScrollerHeight not measured yet',
          workListScrollerHeight: 0,
        });
      }
      // 측정 중이므로 not stable
      console.log('[PortfolioLayout] Setting isLayoutStable = false (workListScrollerHeight = 0)');
      setIsLayoutStable(false);
      return;
    }

    // 전체 패딩 계산: 기본 오프셋 + 카테고리 높이 + 간격 + 작업 목록 높이 + 간격
    const totalHeight =
      LAYOUT_CONSTANTS.BASE_TOP_OFFSET +
      categoryHeight +
      LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP +
      workListScrollerHeight +
      LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP;

    const newPadding = `${totalHeight}px`;

    // 실제 값과 추정값의 차이가 5px 이상일 때만 업데이트 (미세한 변경 무시)
    const currentPaddingValue = parseInt(contentPaddingTop);
    const diff = Math.abs(totalHeight - currentPaddingValue);

    if (diff >= 5) {
      setContentPaddingTop(newPadding);
      logLayout('PortfolioLayout', 'contentPaddingTopUpdate', {
        ...getViewportInfo(),
        result: newPadding,
        previousValue: contentPaddingTop,
        difference: diff,
        BASE_TOP_OFFSET: LAYOUT_CONSTANTS.BASE_TOP_OFFSET,
        categoryHeight,
        CATEGORY_TO_WORKLIST_GAP: LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP,
        workListScrollerHeight,
        totalHeight,
        selectedKeywordId,
        selectedExhibitionCategoryId,
        sentenceCategoryHeight,
        exhibitionCategoryHeight,
        pathname,
        optimizedUpdate: true,
      });

      // 패딩 변경 시 layout not stable
      setIsLayoutStable(false);

      // 기존 타이머 클리어
      if (layoutStableTimerRef.current) {
        clearTimeout(layoutStableTimerRef.current);
      }

      // 150ms 후 layout stable로 전환 (측정이 안정화되었다고 판단)
      layoutStableTimerRef.current = setTimeout(() => {
        console.log('[PortfolioLayout] Setting isLayoutStable = true after 150ms');
        setIsLayoutStable(true);
        logLayout('PortfolioLayout', 'layoutStabilized', {
          ...getViewportInfo(),
          contentPaddingTop: newPadding,
          stabilizationDelay: 150,
          pathname,
        });
        layoutStableTimerRef.current = null;
      }, 150);
    } else {
      // 변경이 미미하면 즉시 stable
      if (!isLayoutStable) {
        console.log('[PortfolioLayout] Setting isLayoutStable = true immediately (diff < 5px)', {
          diff,
          contentPaddingTop,
          totalHeight,
        });
        setIsLayoutStable(true);
        logLayout('PortfolioLayout', 'layoutStableImmediately', {
          ...getViewportInfo(),
          reason: 'diff < 5px',
          diff,
          contentPaddingTop,
        });
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedKeywordId, selectedExhibitionCategoryId, sentenceCategoryHeight, exhibitionCategoryHeight, workListScrollerHeight, hasData, pathname, contentPaddingTop, isLayoutStable, isMobile]);

  // 카테고리 선택 핸들러 (라우팅 후 페이드 아웃)
  const handleKeywordSelect = useCallback((keywordId: string) => {
    // 모바일에서 scroll to top
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
  }, [selectKeyword, pathname, router, contentPaddingTop, lockScroll, unlockScroll, isMobile]);

  const handleExhibitionCategorySelect = useCallback((categoryId: string) => {
    // 모바일에서 scroll to top
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
  }, [selectExhibitionCategory, pathname, router, contentPaddingTop, lockScroll, unlockScroll, isMobile]);

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
    if (!hasData) {
      logLayout('PortfolioLayout', 'workListConfigCalculate', {
        ...getViewportInfo(),
        result: null,
        reason: 'no data',
      });
      return null;
    }

    // 모바일에서는 자연스러운 flow, top 값 불필요
    if (isMobile) {
      if (selectedKeywordId) {
        logLayout('PortfolioLayout', 'workListConfigCalculate', {
          ...getViewportInfo(),
          position: 'left',
          isMobile: true,
          reason: 'mobile - natural flow (no top)',
        });
        return {
          position: 'left' as const,
          top: 0, // 사용되지 않음
        };
      }

      if (selectedExhibitionCategoryId) {
        logLayout('PortfolioLayout', 'workListConfigCalculate', {
          ...getViewportInfo(),
          position: 'right',
          isMobile: true,
          reason: 'mobile - natural flow (no top)',
        });
        return {
          position: 'right' as const,
          top: 0, // 사용되지 않음
        };
      }

      logLayout('PortfolioLayout', 'workListConfigCalculate', {
        ...getViewportInfo(),
        result: null,
        reason: 'mobile - no category selected',
        isMobile: true,
      });
      return null;
    }

    // Desktop: 기존 로직 유지 (측정된 높이 사용)
    if (selectedKeywordId && sentenceCategoryHeight > 0) {
      const top = LAYOUT_CONSTANTS.BASE_TOP_OFFSET + sentenceCategoryHeight + LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP;
      console.log('[workListConfig] Desktop left config calculated:', { top, sentenceCategoryHeight });
      logLayout('PortfolioLayout', 'workListConfigCalculate', {
        ...getViewportInfo(),
        position: 'left',
        top,
        BASE_TOP_OFFSET: LAYOUT_CONSTANTS.BASE_TOP_OFFSET,
        sentenceCategoryHeight,
        CATEGORY_TO_WORKLIST_GAP: LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP,
      });
      return {
        position: 'left' as const,
        top,
      };
    }

    if (selectedExhibitionCategoryId && exhibitionCategoryHeight > 0) {
      const top = LAYOUT_CONSTANTS.BASE_TOP_OFFSET + exhibitionCategoryHeight + LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP;
      console.log('[workListConfig] Desktop right config calculated:', { top, exhibitionCategoryHeight });
      logLayout('PortfolioLayout', 'workListConfigCalculate', {
        ...getViewportInfo(),
        position: 'right',
        top,
        BASE_TOP_OFFSET: LAYOUT_CONSTANTS.BASE_TOP_OFFSET,
        exhibitionCategoryHeight,
        CATEGORY_TO_WORKLIST_GAP: LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP,
      });
      return {
        position: 'right' as const,
        top,
      };
    }

    console.log('[workListConfig] Desktop returning null:', {
      selectedKeywordId,
      selectedExhibitionCategoryId,
      sentenceCategoryHeight,
      exhibitionCategoryHeight,
      reason: 'category height not measured or no category selected',
    });
    logLayout('PortfolioLayout', 'workListConfigCalculate', {
      ...getViewportInfo(),
      result: null,
      reason: 'category height not measured',
      selectedKeywordId,
      selectedExhibitionCategoryId,
      sentenceCategoryHeight,
      exhibitionCategoryHeight,
    });
    return null;
  }, [selectedKeywordId, selectedExhibitionCategoryId, sentenceCategoryHeight, exhibitionCategoryHeight, hasData, isMobile]);

  // Safety timeout: Desktop에서 일정 시간 후에도 layout이 stable되지 않으면 강제로 stable로 전환
  useEffect(() => {
    // 모바일이거나 데이터가 없으면 타임아웃 불필요
    if (isMobile || !hasData || !workListConfig) {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      return;
    }

    // Desktop에서 hasData && workListConfig가 있으면 1.5초 후 강제 stable
    console.log('[PortfolioLayout] Starting safety timeout (1.5s) for layout stabilization');
    safetyTimeoutRef.current = setTimeout(() => {
      if (!isLayoutStable) {
        console.warn('[PortfolioLayout] Safety timeout triggered - forcing isLayoutStable = true');
        setIsLayoutStable(true);

        // WorkListScroller 높이가 0이면 추정값 사용
        if (workListScrollerHeight === 0) {
          console.warn('[PortfolioLayout] WorkListScroller height still 0, using estimated height');
          setWorkListScrollerHeight(LAYOUT_CONSTANTS.ESTIMATED_WORKLIST_HEIGHT);
        }

        logLayout('PortfolioLayout', 'layoutStabilizedBySafetyTimeout', {
          ...getViewportInfo(),
          contentPaddingTop,
          workListScrollerHeight,
          pathname,
          selectedKeywordId,
          selectedExhibitionCategoryId,
        });
      }
      safetyTimeoutRef.current = null;
    }, 1500);

    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
    };
  }, [isMobile, hasData, workListConfig, isLayoutStable, workListScrollerHeight, contentPaddingTop, pathname, selectedKeywordId, selectedExhibitionCategoryId]);

  // WorkListScroller ref 선택
  const currentWorkListRef = selectedKeywordId ? leftWorkListRef : rightWorkListRef;

  return (
    <div className="flex flex-col" style={{
      minHeight: isMobile ? '100vh' : 'calc(100vh - 40px)',
      position: 'relative',
      width: '100%',
    }}>
      <div className={isMobile ? "" : "flex-1 relative"} style={isMobile ? {
        // 모바일: sticky를 위해 단순한 구조
        width: '100%',
        overflow: 'visible', // sticky 작동을 위해 overflow 없애기
      } : {
        // Desktop: 기존 구조
        paddingTop: '0',
        width: '100%',
      }}>
        {/* 카테고리 영역 - 모든 페이지에서 공유 */}
        {isMobile ? (
          <MobileSwipeableCategories
            sentenceCategories={sentenceCategories}
            exhibitionCategories={exhibitionCategories}
            selectedKeywordId={selectedKeywordId}
            selectedExhibitionCategoryId={selectedExhibitionCategoryId}
            onKeywordSelect={handleKeywordSelect}
            onExhibitionCategorySelect={handleExhibitionCategorySelect}
            selectedWorkIds={pathname.startsWith('/works/') ? [] : selectedWorkIds}
          />
        ) : (
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
        )}

        {/* 작업 목록 영역 - 전체 너비 */}
        {workListConfig && (
          <div
            ref={currentWorkListRef}
            className="work-list-scroller-container"
            style={isMobile ? {
              // 모바일: 자연스러운 flow, absolute 없음
              width: '100%',
              ...(isDebugMode && {
                backgroundColor: 'rgba(0, 255, 0, 0.05)', // 초록색 반투명
                border: '1px dashed green',
              }),
              position: 'relative',
              marginTop: 'var(--space-3)', // 카테고리와 간격
            } : {
              // Desktop: 기존 absolute positioning
              left: 0,
              right: 0,
              top: `${workListConfig.top}px`,
              width: '100%',
              zIndex: 100,
              ...(isDebugMode && {
                backgroundColor: 'rgba(0, 255, 0, 0.05)',
                border: '1px dashed green',
              }),
            }}
          >
            {/* 디버그 라벨 */}
            {mounted && isDebugMode && (
              <div style={{
                position: 'absolute',
                top: 2,
                right: 4,
                fontSize: '9px',
                color: 'green',
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: 1001,
              }}>
                {isMobile ? 'WorkListScroller (flow)' : `WorkListScroller (abs, top: ${workListConfig.top}px)`}
              </div>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: LAYOUT_CONSTANTS.ANIMATION_DURATION,
                ease: LAYOUT_CONSTANTS.TRANSITION_EASE
              }}
            >
              <WorkListScrollerFlex
                works={works}
                selectedWorkId={selectedWorkId}
                onWorkSelect={handleWorkSelect}
                showThumbnail={selectedWorkId === null}
                direction={workListConfig.position === 'left' ? 'ltr' : 'rtl'}
                hideOverflowIndicators={isMobile}
                fullWidth={isMobile}
              />
            </motion.div>
          </div>
        )}

        {/* 레이아웃 준비 중 표시 */}
        {hasData && !workListConfig && (
          <div style={{
            marginTop: isMobile ? 'var(--space-3)' : '0',
            paddingTop: isMobile ? '0' : '200px',
            padding: 'var(--space-4)',
            textAlign: 'center',
            color: 'var(--color-gray-500)',
            fontSize: 'var(--font-size-sm)',
          }}>
            {/* 레이아웃 준비 중... */}
          </div>
        )}

        {/* Desktop: 레이아웃 안정화 대기 중 */}
        {!isMobile && hasData && workListConfig && !isLayoutStable && (
          <div style={{
            paddingTop: '200px',
            padding: 'var(--space-4)',
            textAlign: 'center',
            color: 'var(--color-gray-500)',
            fontSize: 'var(--font-size-sm)',
          }}>
            {/* 레이아웃 안정화 중... */}
          </div>
        )}

        {/* 페이지별 컨텐츠 - WorkListScroller 준비 후 표시 */}
        {(() => {
          // 데이터 없으면 항상 표시 (빈 홈페이지, 404 등)
          if (!hasData) {
            console.log('[PageContent] Showing: no data');
            return true;
          }

          // WorkListScroller 없으면 숨김 (겹침 방지)
          if (!workListConfig) {
            console.log('[PageContent] Hiding: no workListConfig', {
              selectedKeywordId,
              selectedExhibitionCategoryId,
              sentenceCategoryHeight,
              exhibitionCategoryHeight,
            });
            return false;
          }

          // 모바일: workListConfig만 있으면 표시
          if (isMobile) {
            console.log('[PageContent] Showing: mobile with workListConfig');
            return true;
          }

          // Desktop: 레이아웃 안정화까지 대기
          console.log('[PageContent] Desktop check:', {
            isLayoutStable,
            workListScrollerHeight,
            contentPaddingTop,
            workListConfig,
          });
          return isLayoutStable;
        })() && (
          <div
            className="page-content-container"
            style={isMobile ? {
              // 모바일: paddingTop 없음, 자연스러운 flow
              marginTop: 'var(--space-3)', // WorkListScroller와 간격
              opacity: (isFadingOut || shouldFadeIn) ? 0 : 1,
              transition: (isFadingOut || shouldFadeIn)
                ? 'opacity 0.4s ease-out'
                : 'opacity 0.2s ease-in',
              pointerEvents: (isFadingOut || shouldFadeIn) ? 'none' : 'auto',
              position: 'relative',
              zIndex: isFadingOut ? 1000 : 'auto',
              ...(isDebugMode && {
                backgroundColor: 'rgba(255, 165, 0, 0.05)', // 오렌지색 반투명
                border: '1px dashed orange',
              }),
            } : {
              // Desktop: 기존 paddingTop 로직
              paddingTop: frozenPaddingTop || contentPaddingTop,
              opacity: (isFadingOut || shouldFadeIn || !isLayoutStable) ? 0 : 1,
              transition: (isFadingOut || shouldFadeIn)
                ? 'opacity 0.4s ease-out'
                : isLayoutStable
                  ? `opacity 0.2s ease-in, padding-top ${LAYOUT_CONSTANTS.ANIMATION_DURATION}s ${LAYOUT_CONSTANTS.TRANSITION_EASE}`
                  : `padding-top ${LAYOUT_CONSTANTS.ANIMATION_DURATION}s ${LAYOUT_CONSTANTS.TRANSITION_EASE}`,
              pointerEvents: (isFadingOut || shouldFadeIn || !isLayoutStable) ? 'none' : 'auto',
              position: 'relative',
              zIndex: isFadingOut ? 1000 : 'auto',
              ...(isDebugMode && {
                backgroundColor: 'rgba(255, 165, 0, 0.05)', // 오렌지색 반투명
                border: '1px dashed orange',
              }),
            }}
          >
            {/* 디버그 라벨 */}
            {mounted && isDebugMode && (
              <div style={{
                position: 'sticky',
                top: 0,
                left: 4,
                fontSize: '9px',
                color: 'orange',
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: 1002,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '2px 4px',
                width: 'fit-content',
              }}>
                {isMobile
                  ? `Page Content (ready: ${hasData && workListConfig ? 'yes' : 'no'})`
                  : `Page Content (paddingTop: ${frozenPaddingTop || contentPaddingTop})`
                }
              </div>
            )}
            <LayoutStabilityProvider
              isLayoutStable={isLayoutStable}
              contentPaddingTop={contentPaddingTop}
            >
              {children}
            </LayoutStabilityProvider>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

