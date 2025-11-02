'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import Sidebar from '@/app/components/layout/Sidebar';
import SelectedCategory from '@/app/components/layout/SelectedCategory';
import MobileCategoryMenu from '@/app/components/layout/MobileCategoryMenu';
import WorkGrid from '@/app/components/work/WorkGrid';
import {
  mockSentenceCategories,
  mockTextCategories,
  getWorksByKeywordId,
  getWorksByTextCategoryId,
  getSentenceByKeywordId,
} from '@/lib/mockData';
import type { Work, KeywordCategory } from '@/types';

export default function HomePage() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedTextCategoryId, setSelectedTextCategoryId] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedSentence, setSelectedSentence] = useState<{ sentence: any; keyword: KeywordCategory | null } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 키워드 선택 시 작품 필터링
  useEffect(() => {
    if (selectedKeywordId) {
      const filteredWorks = getWorksByKeywordId(selectedKeywordId);
      setWorks(filteredWorks);
      setSelectedTextCategoryId(null); // 텍스트 카테고리 선택 해제
      
      // 선택된 문장 정보 설정
      const sentence = getSentenceByKeywordId(selectedKeywordId);
      const keyword = sentence?.keywords.find((kw) => kw.id === selectedKeywordId);
      if (sentence && keyword) {
        setSelectedSentence({ sentence, keyword });
      }
    } else {
      setSelectedSentence(null);
    }
  }, [selectedKeywordId]);

  // 텍스트 카테고리 선택 시 작품 필터링
  useEffect(() => {
    if (selectedTextCategoryId) {
      const filteredWorks = getWorksByTextCategoryId(selectedTextCategoryId);
      setWorks(filteredWorks);
      setSelectedKeywordId(null); // 키워드 선택 해제
      setSelectedSentence(null);
    }
  }, [selectedTextCategoryId]);

  // 두 선택 모두 해제 시 작품 목록 초기화
  useEffect(() => {
    if (!selectedKeywordId && !selectedTextCategoryId) {
      setWorks([]);
      setSelectedSentence(null);
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
      <SelectedCategory
        sentence={selectedSentence?.sentence || null}
        keyword={selectedSentence?.keyword || null}
      />
      <div className="flex-1" style={{ position: 'relative' }}>
        <Sidebar
          sentenceCategories={mockSentenceCategories}
          textCategories={mockTextCategories}
          selectedKeywordId={selectedKeywordId}
          selectedTextCategoryId={selectedTextCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onTextCategorySelect={handleTextCategorySelect}
        />
        <main
          className="lg:ml-[var(--sidebar-width)] lg:mr-[var(--sidebar-width)]"
          style={{
            minHeight: 'calc(100vh - 60px)',
            paddingTop: 'var(--space-6)',
          }}
        >
          <WorkGrid works={works} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
