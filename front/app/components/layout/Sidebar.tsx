'use client';

import { motion } from 'framer-motion';
import CategorySidebar from '@/app/components/layout/CategorySidebar';
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
  // 작업 목록 표시 여부 및 방향 결정
  const showWorkList = works.length > 0 && onWorkSelect;
  const isLeftAligned = selectedKeywordId !== null; // 문장형 카테고리 선택 시 좌측 정렬
  const isRightAligned = selectedExhibitionCategoryId !== null; // 전시명 카테고리 선택 시 우측 정렬

  return (
    <>
      {/* 카테고리 영역 - selectedWorkId와 완전히 독립적 */}
      <CategorySidebar
        sentenceCategories={sentenceCategories}
        exhibitionCategories={exhibitionCategories}
        selectedKeywordId={selectedKeywordId}
        selectedExhibitionCategoryId={selectedExhibitionCategoryId}
        onKeywordSelect={onKeywordSelect}
        onExhibitionCategorySelect={onExhibitionCategorySelect}
        selectedWorkIds={selectedWorkIds}
      />

      {/* 작업 목록 영역 - 좌측 (문장형 카테고리 선택 시) */}
      {showWorkList && isLeftAligned && (
        <div
          className="hidden lg:block absolute"
          style={{
            left: 'var(--category-margin-left)',
            top: 'var(--space-20)', // 카테고리 충분히 아래 (160px)
            maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))',
            zIndex: 100,
          }}
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <WorkListScroller
              works={works}
              selectedWorkId={selectedWorkId}
              onWorkSelect={onWorkSelect}
              showThumbnail={showThumbnail}
              direction="ltr"
            />
          </motion.div>
        </div>
      )}

      {/* 작업 목록 영역 - 우측 (전시명 카테고리 선택 시) */}
      {showWorkList && isRightAligned && (
        <div
          className="hidden lg:block absolute"
          style={{
            right: 'var(--category-margin-right)',
            top: 'var(--space-20)', // 카테고리 충분히 아래 (160px)
            textAlign: 'right',
            maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-right))',
            zIndex: 100,
          }}
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <WorkListScroller
              works={works}
              selectedWorkId={selectedWorkId}
              onWorkSelect={onWorkSelect}
              showThumbnail={showThumbnail}
              direction="rtl"
            />
          </motion.div>
        </div>
      )}
    </>
  );
}
