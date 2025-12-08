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
}

export default function FloatingWorkWindow({ workId, position }: FloatingWorkWindowProps) {
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
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1], // 위키피디아 스타일: 부드러운 fade-in
          }
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.98, 
          y: 8,
          transition: {
            duration: 0.2, // 위키피디아는 빠르게 사라짐
            ease: [0.4, 0, 0.2, 1],
          }
        }}
        className="floating-work-window"
        data-floating-window="true"
        style={{
          position: 'fixed',
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          width: '320px',
          maxHeight: '180px',
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray-300)',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)', // 위키피디아 스타일: 더 부드러운 그림자
          padding: '12px',
          zIndex: 1000,
          pointerEvents: 'auto',
          // 위키피디아 스타일: 더 깔끔한 디자인
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          // Floating Window 위에 hover하면 프리뷰 유지 (위키피디아 스타일)
          e.stopPropagation();
        }}
        onMouseLeave={(e) => {
          // 위키피디아 스타일: Floating Window에서 벗어나면 즉시 사라짐
          // 부모 컴포넌트의 mousemove 핸들러가 이를 감지함
          e.stopPropagation();
        }}
      >
        <Link href={`/works/${work.id}`}>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              cursor: 'pointer',
            }}
          >
            {/* 썸네일 - 위키피디아 스타일: 왼쪽에 작게 배치 */}
            <div
              style={{
                flexShrink: 0,
                width: '70px',
                height: '70px',
                position: 'relative',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: 'var(--color-gray-100)',
              }}
            >
              <Image
                src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url || ''}
                alt={work.title}
                fill
                sizes="70px"
                style={{
                  objectFit: 'cover',
                }}
              />
            </div>
            
            {/* 작업 정보 - 위키피디아 스타일: 더 컴팩트한 레이아웃 */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingLeft: '4px',
              }}
            >
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {work.title}
              </h4>
              
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {description}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

