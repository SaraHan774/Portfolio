'use client';

import SentenceCategory from '@/app/components/category/SentenceCategory';
import TextCategory from '@/app/components/category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory, Work } from '@/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// 작업 이름 버튼 컴포넌트
function WorkTitleButton({
  work,
  isSelected,
  onClick,
  showThumbnail = false,
}: {
  work: Work;
  isSelected: boolean;
  onClick: () => void;
  showThumbnail?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId) || work.images[0];

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
      {/* 제목: 「'작품명'」 */}
      <span
        style={{
          fontWeight: isSelected ? 700 : (isHovered ? 700 : 400),
          fontSize: '12px',
          color: 'var(--color-text-primary)',
          textAlign: 'center',
          position: 'relative',
          whiteSpace: 'nowrap',
          transition: 'font-weight 0.2s ease-out',
          marginBottom: showThumbnail ? '4px' : '0',
        }}
      >
        {`「'${work.title}'」`}
        {isSelected && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 }}
            style={{
              position: 'absolute',
              top: 'var(--dot-offset-top)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '14px',
              color: 'var(--dot-color)',
              lineHeight: 1,
            }}
          >
            ˙
          </motion.span>
        )}
      </span>

      {/* 년도 */}
      {work.year && (
        <span
          style={{
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            marginBottom: showThumbnail ? '4px' : '0',
          }}
        >
          {work.year}
        </span>
      )}

      {/* 썸네일: 홈에서만 표시 */}
      {showThumbnail && thumbnailImage && (
        <div
          style={{
            width: '80px',
            height: '80px',
            position: 'relative',
            borderRadius: '2px',
            overflow: 'hidden',
            border: isHovered ? '2px solid red' : '2px solid transparent',
            transition: 'border-color 0.2s ease-out',
            boxSizing: 'border-box',
          }}
        >
          <Image
            src={thumbnailImage.thumbnailUrl || thumbnailImage.url}
            alt={work.title}
            fill
            sizes="80px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
    </button>
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
          top: 'var(--space-16)', // 헤더 아래 여백
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

        {/* 문장형 카테고리 선택 시: 작업 목록 좌측 정렬 (좌 → 우) */}
        {showWorkList && isLeftAligned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              marginTop: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: showThumbnail ? '32px' : 'var(--space-2)', // 썸네일 표시 시 32px 간격
              alignItems: 'flex-start',
            }}
          >
            {works.map((w) => (
              <WorkTitleButton
                key={w.id}
                work={w}
                isSelected={selectedWorkId === w.id}
                onClick={() => onWorkSelect(w.id)}
                showThumbnail={showThumbnail}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* 우측 전시명 카테고리 영역 (세로로 나열) */}
      <div
        className="hidden lg:block absolute"
        style={{
          right: 'var(--category-margin-right)', // 48px
          top: 'var(--space-16)', // 헤더 아래 여백
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

        {/* 전시명 카테고리 선택 시: 작업 목록 우측 정렬 (우 → 좌) */}
        {showWorkList && isRightAligned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              marginTop: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'row-reverse', // 우 → 좌 방향
              flexWrap: 'wrap-reverse',
              gap: showThumbnail ? '32px' : 'var(--space-2)', // 썸네일 표시 시 32px 간격
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}
          >
            {works.map((w) => (
              <WorkTitleButton
                key={w.id}
                work={w}
                isSelected={selectedWorkId === w.id}
                onClick={() => onWorkSelect(w.id)}
                showThumbnail={showThumbnail}
              />
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
