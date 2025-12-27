'use client';

/**
 * 미디어 타임라인 컴포넌트
 * 여러 미디어(이미지/영상) 간 스크롤 네비게이션을 위한 타임라인 UI
 */

import { RefObject } from 'react';

interface MediaItem {
  data: {
    id: string;
  };
}

interface MediaTimelineProps {
  /** 미디어 아이템 목록 */
  mediaItems: MediaItem[];
  /** 현재 활성화된 미디어 ID */
  currentMediaId: string | null;
  /** 타임라인 위치 스타일 */
  positionStyle?: React.CSSProperties;
  /** 스크롤 컨테이너 ref (모달 등 내부 스크롤용) */
  scrollContainerRef?: RefObject<HTMLElement>;
}

export default function MediaTimeline({
  mediaItems,
  currentMediaId,
  positionStyle,
  scrollContainerRef,
}: MediaTimelineProps) {
  // 미디어가 2개 이상일 때만 표시
  if (mediaItems.length <= 1) {
    return null;
  }

  // 기본 position 스타일 (page.tsx용)
  const defaultPositionStyle: React.CSSProperties = {
    position: 'fixed',
    left: 'var(--category-margin-left)',
    top: '70%',
    transform: 'translateY(-50%)',
    zIndex: 50,
  };

  return (
    <div
      style={{
        ...defaultPositionStyle,
        ...positionStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {mediaItems.map((item, index) => {
        const isActive = currentMediaId === item.data.id;
        const isLast = index === mediaItems.length - 1;

        return (
          <div
            key={item.data.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => {
                // 스크롤 컨테이너가 지정된 경우 (모달 등)
                if (scrollContainerRef?.current) {
                  const element = scrollContainerRef.current.querySelector(
                    `[data-image-id="${item.data.id}"]`
                  );
                  if (element) {
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }
                } else {
                  // 기본 document.querySelector 사용 (page.tsx)
                  const element = document.querySelector(
                    `[data-image-id="${item.data.id}"]`
                  );
                  if (element) {
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }
                }
              }}
              style={{
                width: isActive ? '10px' : '6px',
                height: isActive ? '10px' : '6px',
                borderRadius: '50%',
                backgroundColor: isActive
                  ? 'var(--color-text-primary)'
                  : 'var(--color-gray-400)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                padding: 0,
              }}
              aria-label={`미디어 ${index + 1}로 이동`}
            />
            {!isLast && (
              <div
                style={{
                  width: '1px',
                  height: '50px',
                  backgroundImage:
                    'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
                  backgroundSize: '1px 6px',
                  backgroundRepeat: 'repeat-y',
                  margin: '6px 0',
                  transition: 'height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
