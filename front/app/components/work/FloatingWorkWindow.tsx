'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getWorkById } from '@/lib/services/worksService';
import type { Work } from '@/types';

interface FloatingWorkWindowProps {
  workId: string;
  position: { x: number; y: number };
  onClick?: (workId: string) => void;
}

export default function FloatingWorkWindow({ workId, position, onClick }: FloatingWorkWindowProps) {
  const [adjustedPosition, setAdjustedPosition] = useState({ x: position.x + 15, y: position.y + 15 });
  const [work, setWork] = useState<Work | null>(null);

  // Firebase에서 작업 정보 가져오기
  useEffect(() => {
    const loadWork = async () => {
      try {
        const fetchedWork = await getWorkById(workId);
        setWork(fetchedWork);
      } catch (error) {
        console.error('작업 로드 실패:', error);
      }
    };
    loadWork();
  }, [workId]);
  
  useEffect(() => {
    // 위키피디아 스타일: 링크 기준으로 위치 계산 (한 번만 계산하고 고정)
    const calculatePosition = () => {
      const _offsetX = 12; // 위키피디아는 더 가까운 간격 (reserved for future use)
      const offsetY = 8; // 링크 바로 아래에서 약간의 간격
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const tooltipWidth = 320; // 위키피디아는 조금 더 넓음
      const tooltipHeight = 180; // 위키피디아는 더 낮고 컴팩트
      
      // position은 링크의 아래쪽 중앙 좌표
      // Floating Window는 이 위치를 기준으로 중앙 정렬하여 배치
      let x = position.x - tooltipWidth / 2; // 중앙 정렬
      let y = position.y + offsetY; // 링크 바로 아래
      
      // 오른쪽 경계 체크: 화면 밖으로 나가면 왼쪽에 배치
      if (x + tooltipWidth > windowWidth - 10) {
        x = windowWidth - tooltipWidth - 10;
      }
      
      // 아래쪽 경계 체크: 화면 밖으로 나가면 위에 배치
      if (y + tooltipHeight > windowHeight - 10) {
        y = position.y - tooltipHeight - offsetY; // 링크 위에 배치
      }
      
      // 왼쪽 경계 체크
      if (x < 10) {
        x = 10;
      }
      
      // 위쪽 경계 체크
      if (y < 10) {
        y = 10;
      }
      
      setAdjustedPosition({ x, y });
    };
    
    calculatePosition();
    
    // 윈도우 리사이즈 시에도 위치 재조정 (화면 경계를 벗어났을 때만)
    window.addEventListener('resize', calculatePosition);
    
    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [position]);
  
  if (!work) {
    return null;
  }

  const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId) || work.images[0];
  const description = work.shortDescription || 
    (work.fullDescription.length > 100 
      ? work.fullDescription.substring(0, 100) + '...' 
      : work.fullDescription);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }
        }}
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
        {/* 뭉게구름 배경 - 여러 레이어로 부드러운 페이드 효과 */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0) 100%)',
            filter: 'blur(8px)',
            borderRadius: '50%',
            transform: 'scale(1.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)',
            filter: 'blur(4px)',
            borderRadius: '50%',
          }}
        />

        {/* 콘텐츠 */}
        <div
          onClick={() => onClick?.(workId)}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '16px',
          }}
        >
          {/* 작품명 + 년도 */}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--color-text-primary)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textShadow: '0 0 20px rgba(255,255,255,1), 0 0 40px rgba(255,255,255,0.8)',
            }}
          >
            {`「'${work.title}'」, ${work.year || ''}`}
          </span>

          {/* 썸네일 */}
          {thumbnailImage && (
            <div
              style={{
                width: '120px',
                height: '120px',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* 이미지 주변 뭉게구름 글로우 */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-15px',
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0) 70%)',
                  filter: 'blur(10px)',
                  borderRadius: '50%',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url || ''}
                  alt={work.title}
                  fill
                  sizes="120px"
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

