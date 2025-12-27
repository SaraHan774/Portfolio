'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Footer,
  CategorySidebar,
  WorkListScroller,
  MobileCategoryMenu,
  Spinner
} from '@/presentation';
import { useCategories, useCategorySelection, useUIState } from '@/state';
import { useFilteredWorks } from '@/domain';

// 카테고리 영역과 작업 목록 사이의 간격 (px)
const CATEGORY_TO_WORKLIST_GAP = 24;
// 헤더 아래 기본 여백 (var(--space-8)의 px 값)
const BASE_TOP_OFFSET = 64;

export default function HomePage() {
  const router = useRouter();

  // Use global state contexts
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIState();

  // Fetch works using React Query - eliminates manual effects and duplication
  const { works, hasData } = useFilteredWorks(
    selectedKeywordId,
    selectedExhibitionCategoryId
  );
  
  // 카테고리 영역의 높이를 저장하는 상태
  const [sentenceCategoryHeight, setSentenceCategoryHeight] = useState<number>(0);
  const [exhibitionCategoryHeight, setExhibitionCategoryHeight] = useState<number>(0);
  
  // 높이 변경 콜백 - useCallback으로 메모이제이션
  const handleSentenceCategoryHeightChange = useCallback((height: number) => {
    setSentenceCategoryHeight(height);
  }, []);
  
  const handleExhibitionCategoryHeightChange = useCallback((height: number) => {
    setExhibitionCategoryHeight(height);
  }, []);

  // Get categories from shared context (loaded once at app level)
  const { sentenceCategories, exhibitionCategories, isLoading } = useCategories();

  // 선택된 카테고리의 작업 ID 목록 계산 (disabled 상태 계산용)
  const selectedWorkIds = useMemo(() => works.map(work => work.id), [works]);

  const handleKeywordSelect = useCallback((keywordId: string) => {
    selectKeyword(keywordId);
  }, [selectKeyword]);

  const handleExhibitionCategorySelect = useCallback((categoryId: string) => {
    selectExhibitionCategory(categoryId);
  }, [selectExhibitionCategory]);

  // 작품 선택 시 상세 페이지로 이동 (현재 선택된 카테고리 정보 전달)
  const handleWorkSelect = useCallback((workId: string) => {
    const params = new URLSearchParams();
    if (selectedKeywordId) {
      params.set('keywordId', selectedKeywordId);
    } else if (selectedExhibitionCategoryId) {
      params.set('exhibitionId', selectedExhibitionCategoryId);
    }
    const queryString = params.toString();
    router.push(`/works/${workId}${queryString ? `?${queryString}` : ''}`);
  }, [selectedKeywordId, selectedExhibitionCategoryId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MobileCategoryMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sentenceCategories={sentenceCategories}
        exhibitionCategories={exhibitionCategories}
        selectedKeywordId={selectedKeywordId}
        selectedExhibitionCategoryId={selectedExhibitionCategoryId}
        onKeywordSelect={handleKeywordSelect}
        onExhibitionCategorySelect={handleExhibitionCategorySelect}
        selectedWorkIds={selectedWorkIds}
      />
      {/* 상단 영역 없음 - PRD 기준, 헤더 제거됨 */}
      <div className="flex-1 relative" style={{ paddingTop: '0' }}>
        {/* 카테고리 영역 - 작품 선택과 완전히 독립적 */}
        <CategorySidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={selectedWorkIds}
          onSentenceCategoryHeightChange={handleSentenceCategoryHeightChange}
          onExhibitionCategoryHeightChange={handleExhibitionCategoryHeightChange}
        />

        {/* 작업 목록 영역 - 좌측 (문장형 카테고리 선택 시) */}
        {/* 카테고리 선택되고 데이터 로드 완료 후 작업 목록 렌더링 */}
        {selectedKeywordId && sentenceCategoryHeight > 0 && hasData && (
          <div
            className="hidden lg:block absolute"
            style={{
              left: 'var(--category-margin-left)',
              top: `${BASE_TOP_OFFSET + sentenceCategoryHeight + CATEGORY_TO_WORKLIST_GAP}px`,
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
                selectedWorkId={null}
                onWorkSelect={handleWorkSelect}
                showThumbnail={true}
                direction="ltr"
              />
            </motion.div>
          </div>
        )}

        {/* 작업 목록 영역 - 우측 (전시명 카테고리 선택 시) */}
        {/* 카테고리 선택되고 데이터 로드 완료 후 작업 목록 렌더링 */}
        {selectedExhibitionCategoryId && exhibitionCategoryHeight > 0 && hasData && (
          <div
            className="hidden lg:block absolute"
            style={{
              right: 'var(--category-margin-right)',
              top: `${BASE_TOP_OFFSET + exhibitionCategoryHeight + CATEGORY_TO_WORKLIST_GAP}px`,
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
                selectedWorkId={null}
                onWorkSelect={handleWorkSelect}
                showThumbnail={true}
                direction="rtl"
              />
            </motion.div>
          </div>
        )}

        {/* 중앙 컨텐츠 영역 */}
        <main
          style={{
            minHeight: 'calc(100vh - 120px)',
            paddingTop: 'var(--space-6)',
          }}
        />
        
      </div>
      <Footer />
    </div>
  );
}
