'use client';

/**
 * 캡션 컴포넌트 - 마지막 이미지 하단을 넘지 않도록 위치 조정
 * 스크롤 위치에 따라 캡션이 미디어 영역을 벗어나지 않도록 동적으로 위치 조정
 */

import { useState, useEffect, useRef } from 'react';
import { IS_DEBUG_LAYOUT_ENABLED } from '@/core/constants';
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
const DEFAULT_BOTTOM_PX = 75;

export default function CaptionWithBoundary({
  caption,
  captionId,
  renderCaption,
  mediaContainerRef,
}: CaptionWithBoundaryProps) {
  const [captionBottom, setCaptionBottom] = useState(DEFAULT_BOTTOM_PX);
  const captionRef = useRef<HTMLDivElement>(null);
  const { isLayoutStable, contentPaddingTop } = useLayoutStability();

  // Client-side mount state (for hydration-safe debug labels)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug mode (development only)
  const isDebugMode = IS_DEBUG_LAYOUT_ENABLED;

  useEffect(() => {
    // Promise cleanup을 위한 abort 플래그
    let isActive = true;

    const updateCaptionPosition = () => {
      if (!isActive || !mediaContainerRef.current || !captionRef.current) {
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
    };

    // Layout이 안정화되지 않았으면 위치 계산 지연
    if (!isLayoutStable) {
      return;
    }

    // 이미지 로드 완료 후 위치 계산
    const container = mediaContainerRef.current;
    if (container) {
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
          updateCaptionPosition();
        }
      });
    } else {
      // 이미지가 없거나 즉시 계산 가능한 경우
      updateCaptionPosition();
    }

    // 스크롤 이벤트로 위치 업데이트
    window.addEventListener('scroll', updateCaptionPosition, { passive: true });
    window.addEventListener('resize', updateCaptionPosition, { passive: true });

    return () => {
      // Promise cleanup
      isActive = false;
      window.removeEventListener('scroll', updateCaptionPosition);
      window.removeEventListener('resize', updateCaptionPosition);
    };
  }, [mediaContainerRef, captionId, isLayoutStable, contentPaddingTop]);

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
        ...(isDebugMode ? {
          backgroundColor: 'rgba(255, 228, 196, 0.15)', // 비스크색 반투명
          border: '2px dashed bisque',
          position: 'fixed' as const,
        } : {}),
      }}
    >
      {/* 디버그 라벨 */}
      {mounted && isDebugMode && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 4,
            fontSize: '9px',
            color: 'burlywood',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 4px',
            borderRadius: '2px',
          }}
        >
          CaptionWithBoundary (bottom: {captionBottom}px)
        </div>
      )}
      {renderCaption(caption, captionId)}
    </div>
  );
}

