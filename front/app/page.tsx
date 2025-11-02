'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import Sidebar from '@/app/components/layout/Sidebar';
import MobileCategoryMenu from '@/app/components/layout/MobileCategoryMenu';
import WorkGrid from '@/app/components/work/WorkGrid';
import {
  mockSentenceCategories,
  mockTextCategories,
  getWorksByKeywordId,
  getWorksByTextCategoryId,
} from '@/lib/mockData';
import type { Work } from '@/types';

export default function HomePage() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedTextCategoryId, setSelectedTextCategoryId] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 키워드 선택 시 작품 필터링
  useEffect(() => {
    if (selectedKeywordId) {
      const filteredWorks = getWorksByKeywordId(selectedKeywordId);
      setWorks(filteredWorks);
      setSelectedTextCategoryId(null); // 텍스트 카테고리 선택 해제
    }
  }, [selectedKeywordId]);

  // 텍스트 카테고리 선택 시 작품 필터링
  useEffect(() => {
    if (selectedTextCategoryId) {
      const filteredWorks = getWorksByTextCategoryId(selectedTextCategoryId);
      setWorks(filteredWorks);
      setSelectedKeywordId(null); // 키워드 선택 해제
    }
  }, [selectedTextCategoryId]);

  // 두 선택 모두 해제 시 작품 목록 초기화
  useEffect(() => {
    if (!selectedKeywordId && !selectedTextCategoryId) {
      setWorks([]);
    }
  }, [selectedKeywordId, selectedTextCategoryId]);

  const handleKeywordSelect = (keywordId: string) => {
    setSelectedKeywordId(keywordId);
  };

  const handleTextCategorySelect = (categoryId: string) => {
    setSelectedTextCategoryId(categoryId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileCategoryMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sentenceCategories={mockSentenceCategories}
        textCategories={mockTextCategories}
        selectedKeywordId={selectedKeywordId}
        selectedTextCategoryId={selectedTextCategoryId}
        onKeywordSelect={handleKeywordSelect}
        onTextCategorySelect={handleTextCategorySelect}
      />
      {/* 상단 영역 없음 - PRD 기준 */}
      <div className="flex-1 relative" style={{ paddingTop: '60px' }}>
        {/* 좌우 카테고리 영역 (absolute로 자유롭게 배치) */}
        <Sidebar
          sentenceCategories={mockSentenceCategories}
          textCategories={mockTextCategories}
          selectedKeywordId={selectedKeywordId}
          selectedTextCategoryId={selectedTextCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onTextCategorySelect={handleTextCategorySelect}
        />
        {/* 중앙 컨텐츠 영역 - 카테고리와 자연스럽게 공존 */}
        <main
          style={{
            minHeight: 'calc(100vh - 120px)', // 헤더와 푸터 제외
            paddingTop: 'var(--space-6)', // 헤더 아래 여백 조정
          }}
        >
          <WorkGrid works={works} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
