'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import Sidebar from '@/app/components/layout/Sidebar';
import MobileCategoryMenu from '@/app/components/layout/MobileCategoryMenu';
import { useCategories } from '@/app/contexts/CategoriesContext';
import { getWorksByKeywordId, getWorksByExhibitionCategoryId } from '@/lib/services/worksService';
import type { Work } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedExhibitionCategoryId, setSelectedExhibitionCategoryId] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get categories from shared context (loaded once at app level)
  const { sentenceCategories, exhibitionCategories, isLoading } = useCategories();

  // 선택된 카테고리의 작업 ID 목록 계산 (disabled 상태 계산용)
  const selectedWorkIds = works.map(work => work.id);

  // 키워드 선택 시 작품 필터링
  useEffect(() => {
    if (selectedKeywordId) {
      const loadWorks = async () => {
        try {
          const filteredWorks = await getWorksByKeywordId(selectedKeywordId);
          setWorks(filteredWorks);
          setSelectedExhibitionCategoryId(null);
        } catch (error) {
          console.error('작업 로드 실패:', error);
        }
      };
      loadWorks();
    }
  }, [selectedKeywordId]);

  // 전시명 카테고리 선택 시 작품 필터링
  useEffect(() => {
    if (selectedExhibitionCategoryId) {
      const loadWorks = async () => {
        try {
          const filteredWorks = await getWorksByExhibitionCategoryId(selectedExhibitionCategoryId);
          setWorks(filteredWorks);
          setSelectedKeywordId(null);
        } catch (error) {
          console.error('작업 로드 실패:', error);
        }
      };
      loadWorks();
    }
  }, [selectedExhibitionCategoryId]);

  // 두 선택 모두 해제 시 작품 목록 초기화
  useEffect(() => {
    if (!selectedKeywordId && !selectedExhibitionCategoryId) {
      setWorks([]);
    }
  }, [selectedKeywordId, selectedExhibitionCategoryId]);

  const handleKeywordSelect = (keywordId: string) => {
    setSelectedKeywordId(keywordId);
  };

  const handleExhibitionCategorySelect = (categoryId: string) => {
    setSelectedExhibitionCategoryId(categoryId);
  };

  // 작품 선택 시 상세 페이지로 이동 (현재 선택된 카테고리 정보 전달)
  const handleWorkSelect = (workId: string) => {
    const params = new URLSearchParams();
    if (selectedKeywordId) {
      params.set('keywordId', selectedKeywordId);
    } else if (selectedExhibitionCategoryId) {
      params.set('exhibitionId', selectedExhibitionCategoryId);
    }
    const queryString = params.toString();
    router.push(`/works/${workId}${queryString ? `?${queryString}` : ''}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: 'var(--color-text-muted)' }}>로딩 중...</div>
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
        {/* 좌우 카테고리 영역 + 작품 목록 (Sidebar에서 통합 관리) */}
        <Sidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={selectedWorkIds}
          works={works}
          onWorkSelect={handleWorkSelect}
          showThumbnail={true}
        />
        {/* 중앙 컨텐츠 영역 - 카테고리 선택 안내 메시지 */}
        <main
          style={{
            minHeight: 'calc(100vh - 120px)',
            paddingTop: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {works.length === 0 && (
            <div
              style={{
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              카테고리를 선택하세요
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
