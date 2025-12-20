'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useFloatingPosition, useThumbnailUrl } from '@/domain';
import { FLOATING_WINDOW_ANIMATION } from '@/core/constants';
import type { Work } from '@/types';

interface FloatingWorkWindowProps {
  work: Work;
  position: { x: number; y: number };
  onClick?: (workId: string) => void;
}

const WINDOW_DIMENSIONS = {
  width: 320,
  height: 180,
};

export default function FloatingWorkWindow({ work, position, onClick }: FloatingWorkWindowProps) {
  // Use custom hooks for positioning and thumbnail
  const adjustedPosition = useFloatingPosition({
    position,
    dimensions: WINDOW_DIMENSIONS,
    offset: { x: 0, y: 8 },
    edgePadding: 10,
  });

  const thumbnailUrl = useThumbnailUrl(work);
  const hasThumbnail = !!thumbnailUrl;

  const description = work.shortDescription ||
    (work.fullDescription?.length > 100
      ? work.fullDescription.substring(0, 100) + '...'
      : work.fullDescription || '');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        {...FLOATING_WINDOW_ANIMATION}
        className="floating-work-window"
        data-floating-window="true"
        style={{
          position: 'fixed',
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
      >
        {/* 회색 배경 + fade out 테두리 */}
        <div
          style={{
            position: 'relative',
            background: 'var(--color-gray-200)',
            borderRadius: '4px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            maxWidth: '200px',
          }}
          onClick={() => onClick?.(work.id)}
        >
          {/* 작품명 + 년도 */}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--color-text-primary)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {`「'${work.title}'」, ${work.year || ''}`}
          </span>

          {/* 썸네일 */}
          {hasThumbnail && (
            <div
              style={{
                width: '120px',
                height: '120px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '4px',
              }}
            >
              <Image
                src={thumbnailUrl}
                alt={work.title}
                fill
                sizes="120px"
                style={{
                  objectFit: 'cover',
                }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

