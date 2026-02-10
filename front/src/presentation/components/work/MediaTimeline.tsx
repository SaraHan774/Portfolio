'use client';

/**
 * 미디어 타임라인 컴포넌트
 *
 * - Page: 전체 페이지 스크롤에 비례하여 Thumb이 점선을 따라 이동
 *         점선은 viewport 내에서 미디어가 보이는 영역만 표시
 * - Modal: 전체 미디어 영역에 점선, viewport 중앙에 검은 점
 */

import { RefObject, useEffect, useState, useRef } from 'react';
import { IS_DEBUG_LAYOUT_ENABLED } from '@/core/constants';
import { logLayout, getViewportInfo, getElementInfo } from '@/core/utils/layoutDebugLogger';

interface MediaItem {
  data: {
    id: string;
    width?: number;
    height?: number;
  };
}

interface MediaTimelineProps {
  mediaItems: MediaItem[];
  currentMediaId: string | null;
  positionStyle?: React.CSSProperties;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  containerRef?: RefObject<HTMLElement | null>;  // Page 모드에서 main 컨테이너
}

interface MediaBounds {
  firstTop: number;
  lastBottom: number;
}

export default function MediaTimeline({
  mediaItems,
  positionStyle,
  scrollContainerRef,
  containerRef,
}: MediaTimelineProps) {
  const [mediaBounds, setMediaBounds] = useState<MediaBounds | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Debug mode (development only)
  const isDebugMode = IS_DEBUG_LAYOUT_ENABLED;

  // 미디어 위치 계산 (이미지 로드 시에만)
  useEffect(() => {
    const isModal = !!scrollContainerRef;
    // Promise cleanup을 위한 abort 플래그
    let isActive = true;

    logLayout('MediaTimeline', 'mount', {
      ...getViewportInfo(),
      mode: isModal ? 'modal' : 'page',
      mediaItemsCount: mediaItems.length,
    });

    const calculateBounds = () => {
      // 컴포넌트가 언마운트되었으면 계산하지 않음
      if (!isActive) return;

      const container = scrollContainerRef?.current;

      if (container) {
        const firstElement = container.querySelector(
          `[data-image-id="${mediaItems[0]?.data.id}"]`
        ) as HTMLElement;

        const lastElement = container.querySelector(
          `[data-image-id="${mediaItems[mediaItems.length - 1]?.data.id}"]`
        ) as HTMLElement;

        if (firstElement && lastElement) {
          const bounds = {
            firstTop: firstElement.offsetTop,
            lastBottom: lastElement.offsetTop + lastElement.offsetHeight,
          };
          setMediaBounds(bounds);

          logLayout('MediaTimeline', 'calculateBounds (modal)', {
            ...getViewportInfo(),
            ...getElementInfo(firstElement, 'firstMedia'),
            ...getElementInfo(lastElement, 'lastMedia'),
            bounds,
          });
        }
      } else {
        const firstElement = document.querySelector(
          `[data-image-id="${mediaItems[0]?.data.id}"]`
        ) as HTMLElement;

        const lastElement = document.querySelector(
          `[data-image-id="${mediaItems[mediaItems.length - 1]?.data.id}"]`
        ) as HTMLElement;

        if (firstElement && lastElement) {
          const firstTop = getElementOffset(firstElement);
          const lastTop = getElementOffset(lastElement);

          const bounds = {
            firstTop,
            lastBottom: lastTop + lastElement.offsetHeight,
          };
          setMediaBounds(bounds);

          logLayout('MediaTimeline', 'calculateBounds (page)', {
            ...getViewportInfo(),
            ...getElementInfo(firstElement, 'firstMedia'),
            ...getElementInfo(lastElement, 'lastMedia'),
            bounds,
            firstTopOffset: firstTop,
            lastTopOffset: lastTop,
          });
        }
      }
    };

    // 즉시 초기 계산 시도 (이미지가 aspect-ratio로 공간을 확보한 경우 작동)
    const tryCalculate = () => {
      if (!isActive) return false;

      const container = scrollContainerRef?.current;
      const firstElement = container
        ? container.querySelector(`[data-image-id="${mediaItems[0]?.data.id}"]`) as HTMLElement
        : document.querySelector(`[data-image-id="${mediaItems[0]?.data.id}"]`) as HTMLElement;

      const lastElement = container
        ? container.querySelector(`[data-image-id="${mediaItems[mediaItems.length - 1]?.data.id}"]`) as HTMLElement
        : document.querySelector(`[data-image-id="${mediaItems[mediaItems.length - 1]?.data.id}"]`) as HTMLElement;

      // 요소가 존재하고 높이가 있으면 계산 가능
      if (firstElement && lastElement && lastElement.offsetHeight > 0) {
        calculateBounds();
        return true;
      }
      return false;
    };

    // 즉시 계산 시도
    const immediateSuccess = tryCalculate();

    if (!immediateSuccess) {
      // 실패하면 이미지 로드 대기
      const container = scrollContainerRef?.current || document;
      const images = Array.from(container.querySelectorAll('img'));

      Promise.all(
        images.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              })
        )
      ).then(() => {
        if (isActive) {
          calculateBounds();
          logLayout('MediaTimeline', 'all-images-loaded', {
            ...getViewportInfo(),
            mode: isModal ? 'modal' : 'page',
            imageCount: images.length,
          });
        }
      });
    } else {
      logLayout('MediaTimeline', 'immediate-calculate-success', {
        ...getViewportInfo(),
        mode: isModal ? 'modal' : 'page',
      });
    }

    let resizeTimer: NodeJS.Timeout | null = null;
    let resizeRafId: number | null = null;

    // Page 모드: window resize 이벤트 감지 (RAF + debounced)
    const handleResize = () => {
      // 컴포넌트가 언마운트되었으면 처리하지 않음
      if (!isActive) return;

      // Cleanup 이전 타이머/프레임
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }

      // 200ms debounce 후 RAF로 실행 (category height 측정 완료 대기)
      resizeTimer = setTimeout(() => {
        if (!isActive) return;

        resizeRafId = requestAnimationFrame(() => {
          if (isActive) {
            calculateBounds();
            logLayout('MediaTimeline', 'resize-recalculate', {
              ...getViewportInfo(),
              mode: 'page',
              optimized: 'RAF+debounce',
            });
          }
          resizeRafId = null;
        });
        resizeTimer = null;
      }, 200);
    };

    // Page 모드에만 window resize 리스너 추가
    if (!scrollContainerRef?.current) {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      // Promise cleanup - 더 이상 계산하지 않도록 플래그 설정
      isActive = false;

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      if (!scrollContainerRef?.current) {
        window.removeEventListener('resize', handleResize);
      }
      logLayout('MediaTimeline', 'unmount', {
        mode: isModal ? 'modal' : 'page',
      });
    };
  }, [scrollContainerRef, containerRef, mediaItems]);

  // 스크롤 위치 추적 (직접 DOM 업데이트)
  useEffect(() => {
    if (!mediaBounds) return;

    const isModal = !!scrollContainerRef?.current;
    let rafId: number | null = null;

    const updateScroll = () => {
      const container = scrollContainerRef?.current;

      if (container) {
        // Modal 모드: setState 없이 직접 DOM만 업데이트
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const viewportCenter = scrollTop + clientHeight / 2;
        const thumbPos = viewportCenter - mediaBounds.firstTop;

        // 직접 DOM 업데이트 (React state 우회, 리렌더링 방지)
        if (thumbRef.current) {
          thumbRef.current.style.transform = `translate(-50%, ${thumbPos}px)`;
        }
      } else {
        // Page 모드: RAF + setState (throttled)
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const clientHeight = window.innerHeight;

          setScrollPosition(scrollTop);
          setViewportHeight(clientHeight);
          rafId = null;
        });
      }
    };

    updateScroll();

    if (scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      container.addEventListener('scroll', updateScroll, { passive: true });

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        container.removeEventListener('scroll', updateScroll);
      };
    } else {
      window.addEventListener('scroll', updateScroll, { passive: true });
      window.addEventListener('resize', updateScroll);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        window.removeEventListener('scroll', updateScroll);
        window.removeEventListener('resize', updateScroll);
      };
    }
  }, [scrollContainerRef, containerRef, mediaBounds]);

  if (mediaItems.length <= 1 || !mediaBounds) {
    return null;
  }

  const isModal = !!scrollContainerRef;

  if (isModal) {
    // Modal 렌더링 - thumb 위치는 직접 DOM 업데이트로만 제어
    const timelineHeight = mediaBounds.lastBottom - mediaBounds.firstTop;

    return (
      <div
        style={{
          position: 'absolute',
          left: 'var(--space-4)',
          top: `${mediaBounds.firstTop}px`,
          ...positionStyle,
          height: `${timelineHeight}px`,
          width: '20px',
          pointerEvents: 'none',
          ...(isDebugMode ? {
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            border: '1px dashed orange',
          } : {}),
        }}
      >
        {/* Debug label */}
        {isDebugMode && (
          <div style={{
            position: 'absolute',
            top: 2,
            left: 2,
            fontSize: '8px',
            color: 'orange',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            Timeline(Modal)
          </div>
        )}

        {/* Track (점선) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 0,
            height: '100%',
            width: '1px',
            backgroundImage: 'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
            backgroundSize: '1px 6px',
            backgroundRepeat: 'repeat-y',
          }}
        />

        {/* Thumb */}
        <div
          ref={thumbRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translate(-50%, 0)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-600)',
            zIndex: 2,
            willChange: 'transform',
          }}
        />
      </div>
    );
  } else {
    // Page 렌더링 - 미디어 범위만 그리기
    const timelineHeight = mediaBounds.lastBottom - mediaBounds.firstTop;

    // containerRef의 offsetTop을 빼서 상대 위치로 변환
    const containerOffsetTop = containerRef?.current ? getElementOffset(containerRef.current) : 0;
    const relativeTop = mediaBounds.firstTop - containerOffsetTop;

    // 전체 페이지 스크롤 비율 계산
    const documentHeight = typeof document !== 'undefined'
      ? document.documentElement.scrollHeight
      : 0;
    const scrollableHeight = documentHeight - viewportHeight;
    const pageScrollRatio = scrollableHeight > 0
      ? Math.max(0, Math.min(1, scrollPosition / scrollableHeight))
      : 0;

    // Thumb 위치: 미디어 범위 내에서 페이지 스크롤 비율에 따라 배치
    const thumbPos = timelineHeight * pageScrollRatio;

    return (
      <div
        style={{
          position: 'absolute',
          left: 'var(--space-4)',
          top: `${relativeTop}px`,
          ...positionStyle,
          height: `${timelineHeight}px`,
          width: '20px',
          pointerEvents: 'none',
          ...(isDebugMode ? {
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            border: '1px dashed cyan',
          } : {}),
        }}
      >
        {/* Debug label */}
        {isDebugMode && (
          <div style={{
            position: 'absolute',
            top: 2,
            left: 2,
            fontSize: '8px',
            color: 'cyan',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            Timeline(Page)
          </div>
        )}

        {/* Track (점선) - 미디어 전체 범위 표시 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 0,
            height: '100%',
            width: '1px',
            backgroundImage: 'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
            backgroundSize: '1px 6px',
            backgroundRepeat: 'repeat-y',
          }}
        />

        {/* Thumb (검은 점) - 전체 페이지 스크롤 비율에 따라 이동 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: `translate(-50%, ${thumbPos}px)`,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-300)',
            zIndex: 2,
          }}
        />
      </div>
    );
  }
}

function getElementOffset(element: HTMLElement): number {
  let offset = 0;
  let current: HTMLElement | null = element;

  while (current) {
    offset += current.offsetTop;
    current = current.offsetParent as HTMLElement;
  }

  return offset;
}
