'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SentenceCategory from '@/app/components/category/SentenceCategory';
import TextCategory from '@/app/components/category/TextCategory';
import WorkListScroller from '@/app/components/work/WorkListScroller';
import type { SentenceCategory as SentenceCategoryType, ExhibitionCategory, Work } from '@/types';

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
            initial={false}
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
            initial={false}
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
