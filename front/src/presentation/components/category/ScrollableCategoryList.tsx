'use client';

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';

// 뷰포트 높이 대비 스크롤 가능 영역의 최대 높이 비율 (기본값: 20%)
const DEFAULT_VIEWPORT_HEIGHT_RATIO = 0.20;
// fade 영역의 높이 (px)
const DEFAULT_FADE_HEIGHT = 24;
// 상단 패딩 - 카테고리 선택 시 나타나는 점(˙)이 잘리지 않도록 여유 공간 확보 (px)
const TOP_PADDING_FOR_SELECTION_INDICATOR = 20;

interface ScrollableCategoryListProps {
  children: ReactNode;
  /** 뷰포트 높이 대비 최대 높이 비율 (기본값: 0.25 = 25%) */
  viewportHeightRatio?: number;
  /** fade 영역의 높이 (기본값: 24px) */
  fadeHeight?: number;
}

/**
 * 스크롤 가능한 카테고리 리스트 컴포넌트
 * - 컨텐츠 높이가 뷰포트 높이의 지정 비율(기본 25%)을 초과하면 스크롤 모드 활성화
 * - 스크롤 위치에 따라 상단/하단 fade 효과 동적 적용
 * - 맨 위: 하단만 fade / 중간: 상하 모두 fade / 맨 아래: 상단만 fade
 */
export default function ScrollableCategoryList({
  children,
  viewportHeightRatio = DEFAULT_VIEWPORT_HEIGHT_RATIO,
  fadeHeight = DEFAULT_FADE_HEIGHT,
}: ScrollableCategoryListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 스크롤 위치 상태: 'top' | 'middle' | 'bottom'
  const [scrollPosition, setScrollPosition] = useState<'top' | 'middle' | 'bottom'>('top');
  // 스크롤 모드 활성화 여부
  const [isScrollable, setIsScrollable] = useState(false);
  // 동적으로 계산된 최대 높이
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  
  // 뷰포트 높이와 컨텐츠 높이를 비교하여 스크롤 모드 결정
  const checkScrollability = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    
    const viewportHeight = window.innerHeight;
    const thresholdHeight = viewportHeight * viewportHeightRatio;
    const contentHeight = content.scrollHeight;
    
    // 컨텐츠 높이가 임계값을 초과하면 스크롤 모드 활성화
    if (contentHeight > thresholdHeight) {
      setIsScrollable(true);
      setMaxHeight(thresholdHeight);
    } else {
      setIsScrollable(false);
      setMaxHeight(null);
    }
  }, [viewportHeightRatio]);
  
  // 스크롤 위치 업데이트 함수
  const updateScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !isScrollable) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollableDistance = scrollHeight - clientHeight;
    
    // 스크롤 가능 거리가 거의 없으면 스크롤 불필요
    if (scrollableDistance <= 5) {
      setScrollPosition('top');
      return;
    }
    
    // 스크롤 위치 판단 (5px 여유)
    if (scrollTop <= 5) {
      setScrollPosition('top');
    } else if (scrollTop >= scrollableDistance - 5) {
      setScrollPosition('bottom');
    } else {
      setScrollPosition('middle');
    }
  }, [isScrollable]);
  
  // 뷰포트 리사이즈 및 컨텐츠 변경 감지
  useEffect(() => {
    // 초기 체크
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkScrollability();

    // 뷰포트 리사이즈 시 재계산
    const handleResize = () => {
      checkScrollability();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 컨텐츠 변경 시 재계산
    const content = contentRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (content) {
      resizeObserver = new ResizeObserver(() => {
        checkScrollability();
      });
      resizeObserver.observe(content);
    }

    // 항상 window event listener와 ResizeObserver를 정리
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [checkScrollability]);
  
  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isScrollable) return;

    // 초기 상태 설정
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateScrollPosition();

    container.addEventListener('scroll', updateScrollPosition, { passive: true });

    return () => {
      container.removeEventListener('scroll', updateScrollPosition);
    };
  }, [isScrollable, updateScrollPosition]);
  
  // mask-image 생성 - 스크롤 위치에 따라 다른 마스크 적용
  const getMaskImage = () => {
    if (!isScrollable) return 'none';
    
    switch (scrollPosition) {
      case 'top':
        // 맨 위: 하단만 fade
        return `linear-gradient(
          to bottom,
          black 0%,
          black calc(100% - ${fadeHeight}px),
          transparent 100%
        )`;
      case 'bottom':
        // 맨 아래: 상단만 fade
        return `linear-gradient(
          to bottom,
          transparent 0%,
          black ${fadeHeight}px,
          black 100%
        )`;
      case 'middle':
      default:
        // 중간: 상하 모두 fade
        return `linear-gradient(
          to bottom,
          transparent 0%,
          black ${fadeHeight}px,
          black calc(100% - ${fadeHeight}px),
          transparent 100%
        )`;
    }
  };
  
  // 스크롤 가능하지 않으면 컨텐츠만 렌더링 (높이 측정용 div는 유지)
  if (!isScrollable) {
    return (
      <div ref={contentRef}>
        {children}
      </div>
    );
  }
  
  return (
    <div
      ref={scrollContainerRef}
      style={{
        // 상단 패딩을 포함한 최대 높이 계산
        maxHeight: maxHeight ? `${maxHeight + TOP_PADDING_FOR_SELECTION_INDICATOR}px` : undefined,
        overflowY: 'auto',
        overflowX: 'hidden',
        // 스크롤바 완전히 숨김 - fading edge로 스크롤 가능함을 나타냄
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        // mask로 fade 효과 적용 - 스크롤 가능함을 시각적으로 표시
        maskImage: getMaskImage(),
        WebkitMaskImage: getMaskImage(),
      }}
      className="scrollable-category-list"
    >
      {/* 상단 패딩 영역 - 카테고리 선택 시 점(˙)이 잘리지 않도록 여유 공간 */}
      <div ref={contentRef} style={{ paddingTop: `${TOP_PADDING_FOR_SELECTION_INDICATOR}px` }}>
        {children}
      </div>
    </div>
  );
}
