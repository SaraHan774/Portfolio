'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Header,
  Footer,
  CategorySidebar,
  WorkListScroller,
  MobileCategoryMenu,
  Spinner
} from '@/presentation';
import { useCategories, useCategorySelection, useUIState } from '@/state';
import { getWorksByKeywordId, getWorksByExhibitionCategoryId } from '@/lib/services/worksService';
import type { Work } from '@/types';

// 카테고리 영역과 작업 목록 사이의 간격 (px)
const CATEGORY_TO_WORKLIST_GAP = 24;
// 헤더 아래 기본 여백 (var(--space-8)의 px 값)
const BASE_TOP_OFFSET = 64;

export default function HomePage() {
  const router = useRouter();

  // Use global state contexts
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIState();

  const [works, setWorks] = useState<Work[]>([]);
  
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

  // 키워드 선택 시 작품 필터링
  // 카테고리 전환 시 이전 작업 목록이 잔상으로 보이는 것을 방지하기 위해
  // 먼저 works를 초기화한 후 새 데이터를 로드
  useEffect(() => {
    if (selectedKeywordId) {
      // 카테고리 전환 시 이전 작업 목록 즉시 초기화
      setWorks([]);
      
      const loadWorks = async () => {
        try {
          const filteredWorks = await getWorksByKeywordId(selectedKeywordId);
          setWorks(filteredWorks);
        } catch (error) {
          console.error('작업 로드 실패:', error);
        }
      };
      void loadWorks();
    }
  }, [selectedKeywordId]);

  // 전시명 카테고리 선택 시 작품 필터링
  // 카테고리 전환 시 이전 작업 목록이 잔상으로 보이는 것을 방지하기 위해
  // 먼저 works를 초기화한 후 새 데이터를 로드
  useEffect(() => {
    if (selectedExhibitionCategoryId) {
      // 카테고리 전환 시 이전 작업 목록 즉시 초기화
      setWorks([]);
      
      const loadWorks = async () => {
        try {
          const filteredWorks = await getWorksByExhibitionCategoryId(selectedExhibitionCategoryId);
          setWorks(filteredWorks);
        } catch (error) {
          console.error('작업 로드 실패:', error);
        }
      };
      void loadWorks();
    }
  }, [selectedExhibitionCategoryId]);

  // 두 선택 모두 해제 시 작품 목록 초기화
  useEffect(() => {
    if (!selectedKeywordId && !selectedExhibitionCategoryId) {
      setWorks([]);
    }
  }, [selectedKeywordId, selectedExhibitionCategoryId]);

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
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
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
      {/* 상단 영역 없음 - PRD 기준 */}
      <div className="flex-1 relative" style={{ paddingTop: '60px' }}>
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
        {/* 카테고리 높이가 측정된 후에만 작업 목록을 렌더링 */}
        {works.length > 0 && selectedKeywordId && sentenceCategoryHeight > 0 && (
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
        {/* 카테고리 높이가 측정된 후에만 작업 목록을 렌더링 */}
        {works.length > 0 && selectedExhibitionCategoryId && exhibitionCategoryHeight > 0 && (
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
