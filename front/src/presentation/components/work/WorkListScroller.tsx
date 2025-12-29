'use client';

import { useState } from 'react';
import { useWorkListScroll } from '@/domain';
import type { Work } from '@/types';
import WorkTitleButton from './WorkTitleButton';

interface WorkListScrollerProps {
  works: Work[];
  selectedWorkId: string | null;
  onWorkSelect: (workId: string) => void;
  showThumbnail: boolean;
  direction?: 'ltr' | 'rtl';
}

/**
 * Horizontal scrollable work list with scroll indicators
 *
 * Features:
 * - Left/right scroll indicators at two levels (text and thumbnail)
 * - Fading edges on overflow
 * - Supports both LTR and RTL directions
 * - Thumbnail visibility control on hover
 */
export default function WorkListScroller({
  works,
  selectedWorkId,
  onWorkSelect,
  showThumbnail,
  direction = 'ltr',
}: WorkListScrollerProps) {
  const { scrollContainerRef, showLeftArrow, showRightArrow, scroll } = useWorkListScroll({
    direction,
    itemCount: works.length,
  });

  // Track if mouse is in the container (for thumbnail display)
  // 마우스가 컨테이너 안에 있으면 썸네일 표시
  const [isMouseInContainer, setIsMouseInContainer] = useState(false);
  
  // 썸네일 표시 여부: showThumbnail이 true이거나 마우스가 컨테이너 안에 있으면 표시
  const anyWorkHovered = showThumbnail || isMouseInContainer;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* RTL (우측 배치): 왼쪽에 오버플로우 인디케이터 << ... */}
      {direction === 'rtl' && showLeftArrow && (
        <>
          {/* Non-clickable ... - 항상 타이틀 레벨에 표시 */}
          <div
            style={{
              position: 'absolute',
              left: '-40px',
              top: '12px',
              background: 'var(--color-white)',
              padding: '4px',
              zIndex: 20,
              fontSize: '12px',
              color: '#B3B3B3',
              opacity: 0.7,
              letterSpacing: '2px',
              pointerEvents: 'none',
            }}
          >
            ...
          </div>

          {/* Clickable << - 썸네일이 안 보일 때는 타이틀 레벨에 */}
          {!anyWorkHovered && (
            <button
              onClick={() => scroll('left')}
              style={{
                position: 'absolute',
                left: '-70px',
                top: '12px',
                background: 'var(--color-white)',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                zIndex: 20,
                fontSize: '14px',
                color: '#000000',
                opacity: 0.7,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              aria-label="Scroll left"
            >
              {'<<'}
            </button>
          )}

          {/* Clickable << - 썸네일이 보일 때는 썸네일 레벨에 */}
          {anyWorkHovered && (
            <button
              onClick={() => scroll('left')}
              style={{
                position: 'absolute',
                left: '-40px',
                bottom: '24px',
                background: 'var(--color-white)',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                zIndex: 20,
                fontSize: '14px',
                color: '#000000',
                opacity: 0.7,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              aria-label="Scroll left"
            >
              {'<<'}
            </button>
          )}
        </>
      )}

      {/* Left fading edge - RTL only */}
      {direction === 'rtl' && showLeftArrow && (
        <div
          style={{
            position: 'absolute',
            left: '-40px', // Extends to indicator position
            top: 0,
            bottom: 0,
            width: '80px', // 40px (base) + 40px (to indicator)
            background:
              'linear-gradient(to right, var(--color-white) 0%, var(--color-white) 30%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        onMouseEnter={() => {
          // 마우스가 컨테이너에 들어오면 썸네일 표시
          setIsMouseInContainer(true);
        }}
        onMouseLeave={() => {
          // 마우스가 컨테이너에서 나가면 썸네일 숨김 (showThumbnail이 false인 경우)
          setIsMouseInContainer(false);
        }}
        style={{
          display: 'flex',
          flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
          gap: '32px', // Always reserve thumbnail space
          alignItems: 'flex-start',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '4px',
          paddingLeft: direction === 'rtl' && showLeftArrow ? '8px' : '0',
          paddingRight: direction === 'ltr' && showRightArrow ? '8px' : '0',
        }}
      >
        {works.map((w) => (
          <WorkTitleButton
            key={w.id}
            work={w}
            isSelected={selectedWorkId === w.id}
            onClick={() => onWorkSelect(w.id)}
            showThumbnail={showThumbnail}
            anyWorkHovered={anyWorkHovered}
          />
        ))}
      </div>

      {/* Right fading edge - LTR only */}
      {direction === 'ltr' && showRightArrow && (
        <div
          style={{
            position: 'absolute',
            right: '-40px', // Extends to indicator position
            top: 0,
            bottom: 0,
            width: '80px', // 40px (base) + 40px (to indicator)
            background:
              'linear-gradient(to left, var(--color-white) 0%, var(--color-white) 30%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}

      {/* LTR (좌측 배치): 오른쪽에 오버플로우 인디케이터 ... >> */}
      {direction === 'ltr' && showRightArrow && (
        <>
          {/* Non-clickable ... - 항상 타이틀 레벨에 표시 */}
          <div
            style={{
              position: 'absolute',
              right: '-40px',
              top: '12px',
              background: 'var(--color-white)',
              padding: '4px',
              zIndex: 20,
              fontSize: '12px',
              color: '#B3B3B3',
              opacity: 0.7,
              letterSpacing: '2px',
              pointerEvents: 'none',
            }}
          >
            ...
          </div>

          {/* Clickable >> - 썸네일이 안 보일 때는 타이틀 레벨에 */}
          {!anyWorkHovered && (
            <button
              onClick={() => scroll('right')}
              style={{
                position: 'absolute',
                right: '-70px',
                top: '12px',
                background: 'var(--color-white)',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                zIndex: 20,
                fontSize: '14px',
                color: '#000000',
                opacity: 0.7,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              aria-label="Scroll right"
            >
              {'>>'}
            </button>
          )}

          {/* Clickable >> - 썸네일이 보일 때는 썸네일 레벨에 */}
          {anyWorkHovered && (
            <button
              onClick={() => scroll('right')}
              style={{
                position: 'absolute',
                right: '-40px',
                bottom: '24px',
                background: 'var(--color-white)',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                zIndex: 20,
                fontSize: '14px',
                color: '#000000',
                opacity: 0.7,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              aria-label="Scroll right"
            >
              {'>>'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
