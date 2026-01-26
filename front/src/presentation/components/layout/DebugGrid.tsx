'use client';

import { IS_DEBUG_GRID_ENABLED } from '@/core/constants';
import { useEffect, useState } from 'react';

/**
 * 디버그 그리드 오버레이 컴포넌트
 *
 * 10px 정방형 그리드를 화면 전체에 표시하고,
 * 100px 단위로 x축, y축 좌표를 표시합니다.
 */
export function DebugGrid() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!IS_DEBUG_GRID_ENABLED) {
    return null;
  }

  // 100px 단위로 좌표 생성
  const xLabels = [];
  const yLabels = [];

  for (let x = 0; x <= dimensions.width; x += 100) {
    xLabels.push(x);
  }

  for (let y = 0; y <= dimensions.height; y += 100) {
    yLabels.push(y);
  }

  return (
    <>
      {/* 그리드 배경 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              rgba(255, 0, 0, 0.1) 0px,
              rgba(255, 0, 0, 0.1) 1px,
              transparent 1px,
              transparent 10px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(255, 0, 0, 0.1) 0px,
              rgba(255, 0, 0, 0.1) 1px,
              transparent 1px,
              transparent 10px
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* X축 좌표 (상단) */}
      {xLabels.map((x) => (
        <div
          key={`x-${x}`}
          style={{
            position: 'fixed',
            left: `${x}px`,
            top: '2px',
            fontSize: '10px',
            color: 'rgba(255, 0, 0, 0.6)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 4px',
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: 10000,
            fontFamily: 'monospace',
          }}
        >
          {x}
        </div>
      ))}

      {/* Y축 좌표 (왼쪽) */}
      {yLabels.map((y) => (
        <div
          key={`y-${y}`}
          style={{
            position: 'fixed',
            left: '2px',
            top: `${y}px`,
            fontSize: '10px',
            color: 'rgba(255, 0, 0, 0.6)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 4px',
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: 10000,
            fontFamily: 'monospace',
          }}
        >
          {y}
        </div>
      ))}
    </>
  );
}