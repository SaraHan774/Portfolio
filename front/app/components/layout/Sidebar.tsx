'use client';

import SentenceCategory from '@/app/components/category/SentenceCategory';
import TextCategory from '@/app/components/category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory, Work } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// 작업 이름 버튼 컴포넌트
function WorkTitleButton({
  work,
  isSelected,
  onClick,
  showThumbnail = false,
  anyWorkHovered = false,
}: {
  work: Work;
  isSelected: boolean;
  onClick: () => void;
  showThumbnail?: boolean;
  anyWorkHovered?: boolean; // 다른 작업 중 하나라도 hover 중인지 여부
}) {
  const [isHovered, setIsHovered] = useState(false);

  // 썸네일 결정: 이미지가 있으면 이미지 썸네일, 없으면 YouTube 썸네일
  const thumbnailImage = work.images?.find((img) => img.id === work.thumbnailImageId) || work.images?.[0];
  const firstVideo = work.videos?.[0];
  const youtubeVideoId = firstVideo?.youtubeVideoId?.split('?')[0]?.split('&')[0];
  const youtubeThumbnailUrl = youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg` : null;

  // 썸네일 URL 결정 (이미지 우선, 없으면 YouTube 썸네일)
  const thumbnailUrl = thumbnailImage?.thumbnailUrl || thumbnailImage?.url || youtubeThumbnailUrl;
  const hasThumbnail = !!thumbnailUrl;

  // 상세페이지(showThumbnail=false)에서는 하나라도 hover되면 전체 썸네일 표시 (선택된 작품 포함)
  // 홈페이지(showThumbnail=true)에서는 항상 썸네일 표시
  const shouldShowThumbnail = showThumbnail || anyWorkHovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 'var(--space-1)',
        position: 'relative',
      }}
    >
      {/* 점 공간 - 항상 동일한 높이 차지 (들썩임 방지) */}
      <span
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: '14px',
          lineHeight: 1,
          height: '14px',
          marginBottom: '-2px',
        }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: isSelected ? 0.4 : 0 }}
          style={{
            color: 'var(--dot-color)',
          }}
        >
          ˙
        </motion.span>
      </span>
      {/* 제목 + 년도: 「'작품명'」, 2023 - 선택/hover 시 stroke 효과, 미선택 시 회색 */}
      <span
        style={{
          fontWeight: isSelected || isHovered ? 700 : 400,
          fontSize: '12px',
          color: isSelected || isHovered ? 'transparent' : '#B3B3B3',
          WebkitTextStroke: isSelected || isHovered ? '0.7px var(--color-category-hover-stroke)' : '0px transparent',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          transition: 'color 0.2s ease-out, font-weight 0.2s ease-out',
          marginBottom: '4px', // 썸네일 공간을 항상 확보하여 들썩임 방지
        }}
      >
        {`「'${work.title}'」${work.year ? `, ${work.year}` : ''}`}
      </span>

      {/* 썸네일 공간 - 항상 확보하여 들썩임 방지 */}
      <div
        style={{
          width: '80px',
          height: '80px',
          position: 'relative',
          borderRadius: '2px',
          boxSizing: 'border-box',
        }}
      >
        {/* 썸네일: 홈에서는 항상 표시, 상세페이지에서는 hover 시에만 표시 */}
        {shouldShowThumbnail && hasThumbnail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '2px',
              overflow: 'hidden',
              border: isHovered ? '2px solid red' : '2px solid transparent',
              transition: 'border-color 0.2s ease-out',
              boxSizing: 'border-box',
            }}
          >
            <Image
              src={thumbnailUrl}
              alt={work.title}
              fill
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          </motion.div>
        )}
      </div>
    </button>
  );
}

// 가로 스크롤 작업 목록 컴포넌트
function WorkListScroller({
  works,
  selectedWorkId,
  onWorkSelect,
  showThumbnail,
  direction = 'ltr',
}: {
  works: Work[];
  selectedWorkId: string | null;
  onWorkSelect: (workId: string) => void;
  showThumbnail: boolean;
  direction?: 'ltr' | 'rtl';
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  // 하나라도 hover 중인지 추적 (상세페이지에서 전체 썸네일 표시용)
  const [anyWorkHovered, setAnyWorkHovered] = useState(false);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const hasOverflow = scrollWidth > clientWidth;

    if (!hasOverflow) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    // RTL 방향일 때는 스크롤 방향이 반대
    if (direction === 'rtl') {
      // RTL에서 scrollLeft는 0에서 시작하여 음수로 감소
      setShowRightArrow(scrollLeft < 0);
      setShowLeftArrow(scrollLeft > -(scrollWidth - clientWidth) + 1);
    } else {
      setShowLeftArrow(scrollLeft > 1);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [works, direction]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll = dir === 'left'
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount;
    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 좌측 인디케이터 - 텍스트 레벨 (...) - 텍스트 옆 고정 위치 */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '-40px', // 리스트와 간격 확보
            top: '12px', // 텍스트 레벨 고정 위치
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
          aria-label="왼쪽으로 스크롤"
        >
          ...
        </button>
      )}

      {/* 좌측 인디케이터 - 썸네일 레벨 (<<) - 썸네일 옆 고정 위치 */}
      {showLeftArrow && (showThumbnail || anyWorkHovered) && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: '-40px', // 리스트와 간격 확보
            bottom: '24px', // 썸네일 하단 고정 위치
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
          aria-label="왼쪽으로 스크롤"
        >
          {'<<'}
        </button>
      )}

      {/* 좌측 fading edge - 인디케이터까지 확장 */}
      {showLeftArrow && (
        <div
          style={{
            position: 'absolute',
            left: '-40px', // 인디케이터 위치까지 확장
            top: 0,
            bottom: 0,
            width: '80px', // 40px (기본) + 40px (인디케이터까지)
            background: 'linear-gradient(to right, var(--color-white) 0%, var(--color-white) 30%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}

      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollContainerRef}
        onMouseEnter={() => {
          // 컨테이너 내부에 마우스가 들어오면 썸네일 표시
          if (!showThumbnail) {
            setAnyWorkHovered(true);
          }
        }}
        onMouseLeave={() => {
          // 컨테이너 밖으로 마우스가 나가면 썸네일 숨김
          if (!showThumbnail) {
            setAnyWorkHovered(false);
          }
        }}
        style={{
          display: 'flex',
          flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
          gap: '32px', // 썸네일 공간을 항상 확보하므로 gap도 항상 썸네일 기준
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

      {/* 우측 fading edge - 인디케이터까지 확장 */}
      {showRightArrow && (
        <div
          style={{
            position: 'absolute',
            right: '-40px', // 인디케이터 위치까지 확장
            top: 0,
            bottom: 0,
            width: '80px', // 40px (기본) + 40px (인디케이터까지)
            background: 'linear-gradient(to left, var(--color-white) 0%, var(--color-white) 30%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}

      {/* 우측 인디케이터 - 텍스트 레벨 (...) - 텍스트 옆 고정 위치 */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: '-40px', // 리스트와 간격 확보
            top: '12px', // 텍스트 레벨 고정 위치
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
          aria-label="오른쪽으로 스크롤"
        >
          ...
        </button>
      )}

      {/* 우측 인디케이터 - 썸네일 레벨 (>>) - 썸네일 옆 고정 위치 */}
      {showRightArrow && (showThumbnail || anyWorkHovered) && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: '-40px', // 리스트와 간격 확보
            bottom: '24px', // 썸네일 하단 고정 위치
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
          aria-label="오른쪽으로 스크롤"
        >
          {'>>'}
        </button>
      )}
    </div>
  );
}

interface SidebarProps {
  sentenceCategories: SentenceCategoryType[];
  exhibitionCategories: ExhibitionCategory[];
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onExhibitionCategorySelect: (categoryId: string) => void;
  selectedWorkIds?: string[]; // 현재 선택된 카테고리의 작업 ID 목록 (disabled 상태 계산용)
  // 작업 목록 관련 props (선택사항)
  works?: Work[];
  selectedWorkId?: string | null;
  onWorkSelect?: (workId: string) => void;
  showThumbnail?: boolean; // 썸네일 표시 여부 (홈: true, 상세: false)
}

export default function Sidebar({
  sentenceCategories,
  exhibitionCategories,
  selectedKeywordId,
  selectedExhibitionCategoryId,
  onKeywordSelect,
  onExhibitionCategorySelect,
  selectedWorkIds = [],
  works = [],
  selectedWorkId = null,
  onWorkSelect,
  showThumbnail = false,
}: SidebarProps) {
  const [hoveredKeywordId, setHoveredKeywordId] = useState<string | null>(null);
  const [hoveredExhibitionCategoryId, setHoveredExhibitionCategoryId] = useState<string | null>(null);

  // 문장형 카테고리만 필터링 및 정렬
  const sortedSentenceCategories = sentenceCategories
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // 전시명 카테고리만 필터링 및 정렬
  const sortedExhibitionCategories = exhibitionCategories
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // 작업 목록 표시 여부 및 방향 결정
  const showWorkList = works.length > 0 && onWorkSelect;
  const isLeftAligned = selectedKeywordId !== null; // 문장형 카테고리 선택 시 좌측 정렬
  const isRightAligned = selectedExhibitionCategoryId !== null; // 전시명 카테고리 선택 시 우측 정렬

  return (
    <>
      {/* 좌측 문장형 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          left: 'var(--category-margin-left)', // 48px
          top: 'var(--space-8)', // 헤더 바로 아래 (64px)
          maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))', // 중앙 영역과 겹치지 않도록 간격 확보
          zIndex: 100, // main 영역 위에 표시되도록
        }}
      >
        {sortedSentenceCategories.map((category, index) => {
          const isLast = index === sortedSentenceCategories.length - 1;
          return (
            <div
              key={category.id}
              style={{
                marginBottom: isLast ? 0 : 'var(--category-spacing)', // 카테고리 간 간격
              }}
            >
              <SentenceCategory
                category={category}
                selectedKeywordId={selectedKeywordId}
                onKeywordSelect={onKeywordSelect}
                hoveredKeywordId={hoveredKeywordId}
                onKeywordHover={setHoveredKeywordId}
                selectedWorkIds={selectedWorkIds}
              />
            </div>
          );
        })}

        {/* 문장형 카테고리 선택 시: 작업 목록 가로 스크롤 (좌 → 우) */}
        {showWorkList && isLeftAligned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              marginTop: 'var(--space-4)',
            }}
          >
            <WorkListScroller
              works={works}
              selectedWorkId={selectedWorkId}
              onWorkSelect={onWorkSelect}
              showThumbnail={showThumbnail}
              direction="ltr"
            />
          </motion.div>
        )}
      </div>

      {/* 우측 전시명 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          right: 'var(--category-margin-right)', // 48px
          top: 'var(--space-8)', // 헤더 바로 아래 (64px)
          textAlign: 'right',
          maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-right))', // 중앙 영역과 겹치지 않도록 간격 확보
          zIndex: 100, // main 영역 위에 표시되도록
        }}
      >
        {sortedExhibitionCategories.map((category, index) => {
          const isLast = index === sortedExhibitionCategories.length - 1;
          return (
            <div
              key={category.id}
              style={{
                marginBottom: isLast ? 0 : 'var(--category-spacing)', // 카테고리 간 간격
              }}
            >
              <TextCategory
                category={category}
                isSelected={selectedExhibitionCategoryId === category.id}
                onSelect={() => onExhibitionCategorySelect(category.id)}
                hoveredCategoryId={hoveredExhibitionCategoryId}
                onHover={setHoveredExhibitionCategoryId}
                selectedWorkIds={selectedWorkIds}
              />
            </div>
          );
        })}

        {/* 전시명 카테고리 선택 시: 작업 목록 가로 스크롤 (우 → 좌) */}
        {showWorkList && isRightAligned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              marginTop: 'var(--space-4)',
            }}
          >
            <WorkListScroller
              works={works}
              selectedWorkId={selectedWorkId}
              onWorkSelect={onWorkSelect}
              showThumbnail={showThumbnail}
              direction="rtl"
            />
          </motion.div>
        )}
      </div>
    </>
  );
}
