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

  // Track if any work is hovered (for thumbnail display in detail page)
  const [anyWorkHovered, setAnyWorkHovered] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Left indicator - Text level (...) - Fixed next to text */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '-40px', // Gap from list
            top: '12px', // Text level fixed position
            background: 'var(--color-white)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 20,
            fontSize: '12px',
            color: '#B3B3B3',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
            letterSpacing: '2px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          aria-label="Scroll left"
        >
          ...
        </button>
      )}

      {/* Left indicator - Thumbnail level (<<) - Fixed next to thumbnail */}
      {showLeftArrow && (showThumbnail || anyWorkHovered) && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '-40px', // Gap from list
            bottom: '24px', // Thumbnail bottom fixed position
            background: 'var(--color-white)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 20,
            fontSize: '14px',
            color: '#B3B3B3',
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

      {/* Left fading edge - Extends to indicator */}
      {showLeftArrow && (
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
          // Show thumbnails when mouse enters container
          if (!showThumbnail) {
            setAnyWorkHovered(true);
          }
        }}
        onMouseLeave={() => {
          // Hide thumbnails when mouse leaves container
          if (!showThumbnail) {
            setAnyWorkHovered(false);
          }
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
          paddingLeft: showLeftArrow ? '8px' : '0',
          paddingRight: showRightArrow ? '8px' : '0',
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

      {/* Right fading edge - Extends to indicator */}
      {showRightArrow && (
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

      {/* Right indicator - Text level (...) - Fixed next to text */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: '-40px', // Gap from list
            top: '12px', // Text level fixed position
            background: 'var(--color-white)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 20,
            fontSize: '12px',
            color: '#B3B3B3',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
            letterSpacing: '2px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          aria-label="Scroll right"
        >
          ...
        </button>
      )}

      {/* Right indicator - Thumbnail level (>>) - Fixed next to thumbnail */}
      {showRightArrow && (showThumbnail || anyWorkHovered) && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: '-40px', // Gap from list
            bottom: '24px', // Thumbnail bottom fixed position
            background: 'var(--color-white)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 20,
            fontSize: '14px',
            color: '#B3B3B3',
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
    </div>
  );
}
