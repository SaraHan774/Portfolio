'use client';

/**
 * 미디어 타임라인 컴포넌트
 *
 * - Page: viewport 기준, 미디어 영역만 점선 표시
 * - Modal: 전체 미디어 영역에 점선, viewport 중앙에 검은 점
 */

import { RefObject, useEffect, useState, useRef } from 'react';

interface MediaItem {
  data: {
    id: string;
  };
}

interface MediaTimelineProps {
  mediaItems: MediaItem[];
  currentMediaId: string | null;
  positionStyle?: React.CSSProperties;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

interface MediaBounds {
  firstTop: number;
  lastBottom: number;
}

export default function MediaTimeline({
  mediaItems,
  positionStyle,
  scrollContainerRef,
}: MediaTimelineProps) {
  const [mediaBounds, setMediaBounds] = useState<MediaBounds | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const thumbRef = useRef<HTMLDivElement>(null);

  // 미디어 위치 계산 (이미지 로드 시에만)
  useEffect(() => {
    const calculateBounds = () => {
      const container = scrollContainerRef?.current;

      if (container) {
        const firstElement = container.querySelector(
          `[data-image-id="${mediaItems[0]?.data.id}"]`
        ) as HTMLElement;

        const lastElement = container.querySelector(
          `[data-image-id="${mediaItems[mediaItems.length - 1]?.data.id}"]`
        ) as HTMLElement;

        if (firstElement && lastElement) {
          setMediaBounds({
            firstTop: firstElement.offsetTop,
            lastBottom: lastElement.offsetTop + lastElement.offsetHeight,
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

          setMediaBounds({
            firstTop,
            lastBottom: lastTop + lastElement.offsetHeight,
          });
        }
      }
    };

    const timer = setTimeout(calculateBounds, 100);

    const container = scrollContainerRef?.current || document;
    const images = container.querySelectorAll('img');

    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', calculateBounds);
      }
    });

    const resizeObserver = new ResizeObserver(calculateBounds);
    if (scrollContainerRef?.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      images.forEach((img) => {
        img.removeEventListener('load', calculateBounds);
      });
      resizeObserver.disconnect();
    };
  }, [scrollContainerRef, mediaItems]);

  // 스크롤 위치 추적 (직접 DOM 업데이트)
  useEffect(() => {
    if (!mediaBounds) return;

    const updateScroll = () => {
      const container = scrollContainerRef?.current;

      if (container) {
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const viewportCenter = scrollTop + clientHeight / 2;
        const thumbPos = viewportCenter - mediaBounds.firstTop;

        // 직접 DOM 업데이트 (React state 우회)
        if (thumbRef.current) {
          thumbRef.current.style.transform = `translate(-50%, ${thumbPos}px)`;
        }

        setScrollPosition(scrollTop);
        setViewportHeight(clientHeight);
      } else {
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;

        setScrollPosition(scrollTop);
        setViewportHeight(clientHeight);
      }
    };

    updateScroll();

    if (scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      container.addEventListener('scroll', updateScroll, { passive: true });

      return () => {
        container.removeEventListener('scroll', updateScroll);
      };
    } else {
      window.addEventListener('scroll', updateScroll, { passive: true });
      window.addEventListener('resize', updateScroll);

      return () => {
        window.removeEventListener('scroll', updateScroll);
        window.removeEventListener('resize', updateScroll);
      };
    }
  }, [scrollContainerRef, mediaBounds]);

  if (mediaItems.length <= 1 || !mediaBounds) {
    return null;
  }

  const isModal = !!scrollContainerRef;

  if (isModal) {
    // Modal 렌더링
    const timelineHeight = mediaBounds.lastBottom - mediaBounds.firstTop;
    const viewportCenter = scrollPosition + viewportHeight / 2;
    const thumbPos = viewportCenter - mediaBounds.firstTop;
    const isVisible = thumbPos >= 0 && thumbPos <= timelineHeight;

    if (!isVisible) return null;

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
        }}
      >
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
            transform: `translate(-50%, ${thumbPos}px)`,
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-600)',
            zIndex: 2,
          }}
        />
      </div>
    );
  } else {
    // Page 렌더링
    // 미디어 전체 범위
    const totalMediaHeight = mediaBounds.lastBottom - mediaBounds.firstTop;

    // viewport 내에서 보이는 미디어 영역 계산 (점선 표시 범위)
    const trackStart = Math.max(0, mediaBounds.firstTop - scrollPosition);
    const trackEnd = Math.min(viewportHeight, mediaBounds.lastBottom - scrollPosition);
    const trackHeight = trackEnd - trackStart;

    // 스크롤 가능한 전체 범위 (미디어 시작부터 끝까지, viewport 높이 고려)
    const scrollableRange = totalMediaHeight - viewportHeight;

    // 현재 스크롤 위치가 미디어 시작점부터 얼마나 진행되었는지 계산
    const scrollProgress = scrollPosition - mediaBounds.firstTop;

    // 스크롤 비율 (0: 최상단, 1: 최하단)
    const scrollRatio = scrollableRange > 0
      ? Math.max(0, Math.min(1, scrollProgress / scrollableRange))
      : 0;

    // 점(thumb)의 위치: 점선 내에서 스크롤 비율에 따라 배치
    const thumbPosition = trackStart + trackHeight * scrollRatio;

    // 점선이 viewport 내에 보이는지 확인
    const isVisible = trackHeight > 0;

    if (!isVisible) return null;

    return (
      <div
        style={{
          position: 'fixed',
          left: 'var(--space-4)',
          top: 0,
          ...positionStyle,
          height: `${viewportHeight}px`,
          width: '20px',
          pointerEvents: 'none',
        }}
      >
        {/* Track (점선) - 미디어가 보이는 영역만 표시 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: `${trackStart}px`,
            height: `${trackHeight}px`,
            width: '1px',
            backgroundImage: 'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
            backgroundSize: '1px 6px',
            backgroundRepeat: 'repeat-y',
          }}
        />

        {/* Thumb (검은 점) - 스크롤 비율에 따라 점선을 따라 이동 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${thumbPosition}px`,
            transform: 'translateX(-50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-600)',
            zIndex: 2,
            transition: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
