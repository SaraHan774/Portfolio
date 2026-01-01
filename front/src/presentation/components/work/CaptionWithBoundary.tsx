'use client';

/**
 * 캡션 컴포넌트 - 마지막 이미지 하단을 넘지 않도록 위치 조정
 * 스크롤 위치에 따라 캡션이 미디어 영역을 벗어나지 않도록 동적으로 위치 조정
 */

import { useState, useEffect, useRef } from 'react';
import { logLayout, getViewportInfo, getElementInfo } from '@/core/utils/layoutDebugLogger';
import { useLayoutStability } from '@/presentation/contexts/LayoutStabilityContext';

interface CaptionWithBoundaryProps {
  /** 캡션 HTML 문자열 */
  caption: string;
  /** 캡션 고유 ID */
  captionId: string;
  /** 캡션 렌더링 함수 */
  renderCaption: (
    caption: string | undefined,
    captionId: string,
    isModal?: boolean
  ) => React.ReactNode;
  /** 미디어 컨테이너 참조 */
  mediaContainerRef: React.RefObject<HTMLDivElement | null>;
}

/** 기본 bottom 값 (px) */
const DEFAULT_BOTTOM_PX = 120;

export default function CaptionWithBoundary({
  caption,
  captionId,
  renderCaption,
  mediaContainerRef,
}: CaptionWithBoundaryProps) {
  const [captionBottom, setCaptionBottom] = useState(DEFAULT_BOTTOM_PX);
  const captionRef = useRef<HTMLDivElement>(null);
  const { isLayoutStable, contentPaddingTop } = useLayoutStability();

  useEffect(() => {
    logLayout('CaptionWithBoundary', 'mount', {
      ...getViewportInfo(),
      captionId,
      DEFAULT_BOTTOM_PX,
      isLayoutStable,
      contentPaddingTop,
    });

    const updateCaptionPosition = () => {
      if (!mediaContainerRef.current || !captionRef.current) {
        logLayout('CaptionWithBoundary', 'updatePosition - ref null', {
          ...getViewportInfo(),
          hasMediaContainer: !!mediaContainerRef.current,
          hasCaption: !!captionRef.current,
        });
        return;
      }

      const mediaRect = mediaContainerRef.current.getBoundingClientRect();
      const captionRect = captionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 미디어 컨테이너의 하단이 뷰포트 내에 있을 때
      // 캡션이 미디어 하단 아래로 내려가지 않도록 조정
      const mediaBottomFromViewportBottom = viewportHeight - mediaRect.bottom;

      let newBottom: number;
      // 캡션의 하단이 미디어 하단보다 아래로 가면 조정
      if (mediaBottomFromViewportBottom > DEFAULT_BOTTOM_PX) {
        // 미디어가 위로 스크롤되어 하단이 뷰포트 위쪽에 있을 때
        // 캡션 bottom을 미디어 하단에 맞춤
        newBottom = Math.max(mediaBottomFromViewportBottom, DEFAULT_BOTTOM_PX);
      } else {
        newBottom = DEFAULT_BOTTOM_PX;
      }

      setCaptionBottom(newBottom);

      logLayout('CaptionWithBoundary', 'updatePosition', {
        ...getViewportInfo(),
        ...getElementInfo(mediaContainerRef.current, 'mediaContainer'),
        ...getElementInfo(captionRef.current, 'caption'),
        mediaBottomFromViewportBottom,
        previousBottom: captionBottom,
        newBottom,
        DEFAULT_BOTTOM_PX,
        isLayoutStable,
        contentPaddingTop,
        adjustment: newBottom !== DEFAULT_BOTTOM_PX ? 'adjusted' : 'default',
      });
    };

    // Layout이 안정화되지 않았으면 위치 계산 지연
    if (!isLayoutStable) {
      logLayout('CaptionWithBoundary', 'skip-update', {
        ...getViewportInfo(),
        reason: 'layout not stable',
        captionId,
        contentPaddingTop,
      });
      return;
    }

    // 초기 위치 설정
    updateCaptionPosition();

    // 스크롤 이벤트로 위치 업데이트
    window.addEventListener('scroll', updateCaptionPosition, { passive: true });
    window.addEventListener('resize', updateCaptionPosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateCaptionPosition);
      window.removeEventListener('resize', updateCaptionPosition);
      logLayout('CaptionWithBoundary', 'unmount', {
        captionId,
      });
    };
  }, [mediaContainerRef, captionId, captionBottom, isLayoutStable, contentPaddingTop]);

  return (
    <div
      ref={captionRef}
      className="work-caption-responsive"
      style={{
        position: 'fixed',
        left: 'var(--caption-left)',
        bottom: `${captionBottom}px`,
        maxWidth: 'var(--caption-max-width)',
        maxHeight: 'calc(100vh - 200px)',
        paddingRight: 'var(--category-margin-right)',
        zIndex: 40,
        transition: 'bottom 0.15s ease-out, left 0.15s ease-out',
      }}
    >
      {renderCaption(caption, captionId)}
    </div>
  );
}

