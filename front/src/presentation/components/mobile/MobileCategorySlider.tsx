import React from 'react';

export interface MobileCategorySliderProps {
  activeIndex: 0 | 1;
  progress?: number; // For smooth animation during swipe (-1 to 1)
}

/**
 * Horizontal slider indicator for mobile category views
 * Design based on MediaTimeline component (rotated 90°)
 * - Red dot shows active view position
 * - Gray dotted line is the track
 */
export const MobileCategorySlider: React.FC<MobileCategorySliderProps> = ({
  activeIndex,
  progress = 0,
}) => {
  // Calculate dot position
  // Base position from activeIndex (0% or 100%)
  // Adjust with progress during swipe (-1 to 1 becomes -50% to 50% offset)
  const basePosition = (activeIndex / 1) * 100; // 0% or 100%
  const progressOffset = progress * 50; // -50% to 50%
  const dotPosition = Math.max(0, Math.min(100, basePosition + progressOffset));

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingBottom: 'var(--space-3)', // 24px spacing below slider
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '30%', // 화면의 약 30% 차지
          height: '20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Solid line track (horizontal) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            transform: 'translateY(-50%)',
            backgroundColor: 'var(--color-gray-300)', // 실선
          }}
        />

        {/* Active dot (red) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${dotPosition}%`,
            width: '10px',
            height: '10px',
            backgroundColor: '#D32F2F', // 빨간색
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            transition:
              progress !== 0
                ? 'none' // No transition during swipe
                : 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth transition on snap
          }}
        />
      </div>
    </div>
  );
};
