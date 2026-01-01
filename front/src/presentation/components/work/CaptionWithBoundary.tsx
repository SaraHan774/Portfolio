'use client';

/**
 * 캡션 컴포넌트 - 마지막 이미지 하단을 넘지 않도록 위치 조정
 * 스크롤 위치에 따라 캡션이 미디어 영역을 벗어나지 않도록 동적으로 위치 조정
 */

import { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    const updateCaptionPosition = () => {
      if (!mediaContainerRef.current || !captionRef.current) return;

      const mediaRect = mediaContainerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 미디어 컨테이너의 하단이 뷰포트 내에 있을 때
      // 캡션이 미디어 하단 아래로 내려가지 않도록 조정
      const mediaBottomFromViewportBottom = viewportHeight - mediaRect.bottom;

      // 캡션의 하단이 미디어 하단보다 아래로 가면 조정
      if (mediaBottomFromViewportBottom > DEFAULT_BOTTOM_PX) {
        // 미디어가 위로 스크롤되어 하단이 뷰포트 위쪽에 있을 때
        // 캡션 bottom을 미디어 하단에 맞춤
        setCaptionBottom(Math.max(mediaBottomFromViewportBottom, DEFAULT_BOTTOM_PX));
      } else {
        setCaptionBottom(DEFAULT_BOTTOM_PX);
      }
    };

    // 초기 위치 설정
    updateCaptionPosition();

    // 스크롤 이벤트로 위치 업데이트
    window.addEventListener('scroll', updateCaptionPosition, { passive: true });
    window.addEventListener('resize', updateCaptionPosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateCaptionPosition);
      window.removeEventListener('resize', updateCaptionPosition);
    };
  }, [mediaContainerRef]);

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

