'use client';

import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import WorkCard from './WorkCard';
import type { Work } from '@/types';

interface WorkGridProps {
  works: Work[];
}

export default function WorkGrid({ works }: WorkGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // 스크롤이 필요한지 확인 (컨텐츠가 컨테이너보다 큰지)
    const needsScroll = scrollWidth > clientWidth;
    
    if (!needsScroll) {
      // 스크롤이 필요 없으면 모든 요소 숨김
      setShowLeftArrow(false);
      setShowRightArrow(false);
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }
    
    // Apple/Google 스타일: 작은 threshold를 사용하여 더 자연스러운 감지
    const threshold = 5; // 5px threshold
    const isAtStart = scrollLeft < threshold;
    const isAtEnd = scrollLeft > scrollWidth - clientWidth - threshold;
    
    // 화살표: 스크롤 가능하고 해당 방향으로 스크롤할 수 있을 때만 표시
    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);
    
    // Fading edge: Apple/Google 스타일
    // - 왼쪽: 시작 위치가 아니면 표시 (왼쪽에 더 많은 콘텐츠가 있을 때)
    // - 오른쪽: 끝 위치가 아니면 표시 (오른쪽에 더 많은 콘텐츠가 있을 때)
    setShowLeftFade(!isAtStart);
    setShowRightFade(!isAtEnd);
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      // ResizeObserver로 컨테이너 크기 변경 감지
      const resizeObserver = new ResizeObserver(checkScrollButtons);
      resizeObserver.observe(container);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        resizeObserver.disconnect();
      };
    }
  }, [works]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (works.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-base)',
        }}
      >
        카테고리를 선택하세요
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60%',
        maxWidth: '600px',
      }}
    >
      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className={`horizontal-scroll-container ${showLeftFade ? 'show-left-fade' : ''} ${showRightFade ? 'show-right-fade' : ''}`}
        style={{
          width: '100%',
          maxHeight: '150px',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: 'var(--space-3)',
          scrollbarWidth: 'none',
          scrollbarColor: 'transparent transparent',
        }}
      >
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.03,
                delayChildren: 0.1,
              },
            },
          }}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 'var(--space-2)',
            alignItems: 'flex-start',
          }}
        >
          {works.map((work, index) => (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                flexShrink: 0,
                width: '70px',
              }}
            >
              <WorkCard work={work} index={index} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 좌측 화살표 (컨테이너 외부 좌측 끝에 배치) */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          style={{
            position: 'absolute',
            left: '-40px', // 컨테이너 외부로 이동
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 11,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: 'var(--color-text-primary)',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          ‹
        </button>
      )}

      {/* 우측 화살표 (컨테이너 외부 우측 끝에 배치) */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          style={{
            position: 'absolute',
            right: '-40px', // 컨테이너 외부로 이동
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 11,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: 'var(--color-text-primary)',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          ›
        </button>
      )}
    </div>
  );
}


