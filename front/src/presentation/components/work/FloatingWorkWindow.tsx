'use client';

import { motion } from 'framer-motion';
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
  width: 360,
  height: 180,
};

export default function FloatingWorkWindow({ work, position, onClick }: FloatingWorkWindowProps) {
  // Use custom hooks for positioning and thumbnail
  const adjustedPosition = useFloatingPosition({
    position,
    dimensions: WINDOW_DIMENSIONS,
    offset: { x: -200, y: 10 },
    edgePadding: 20,
  });

  const thumbnailUrl = useThumbnailUrl(work);
  const hasThumbnail = !!thumbnailUrl;

  return (
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
        filter: 'drop-shadow(0 8px 40px rgba(0, 0, 0, 0.08))',
        minWidth:'300px'
      }}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      {/* Soft edge gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgb(220,220,220,0.97)', // FIXME : 모달 내부에서는 220, 외부에서는 240
          filter: 'blur(10px)',
        }}
      />

      {/* 메인 컨텐츠 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          cursor: 'pointer',
          padding: '30px',
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
          {`「‘${work.title}’」${work.year ? `,\u00A0${work.year}` : ''}`}
        </span>

        {/* 썸네일 */}
        {hasThumbnail && (
          <div
            style={{
              width: '80px',
              height: '80px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Image
              src={thumbnailUrl}
              alt={work.title}
              fill
              sizes="80px"
              style={{
                objectFit: 'cover',
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
