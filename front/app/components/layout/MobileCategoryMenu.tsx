'use client';

import { useState } from 'react';
import SentenceCategory from '@/app/components/category/SentenceCategory';
import TextCategory from '@/app/components/category/TextCategory';
import type { SentenceCategory as SentenceCategoryType, TextCategory as TextCategoryType } from '@/types';

interface MobileCategoryMenuProps {
  open: boolean;
  onClose: () => void;
  sentenceCategories: SentenceCategoryType[];
  textCategories: TextCategoryType[];
  selectedKeywordId: string | null;
  selectedTextCategoryId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  onTextCategorySelect: (categoryId: string) => void;
}

export default function MobileCategoryMenu({
  open,
  onClose,
  sentenceCategories,
  textCategories,
  selectedKeywordId,
  selectedTextCategoryId,
  onKeywordSelect,
  onTextCategorySelect,
}: MobileCategoryMenuProps) {
  const [hoveredKeywordId, setHoveredKeywordId] = useState<string | null>(null);
  const [hoveredTextCategoryId, setHoveredTextCategoryId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
      />
      {/* 드로어 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          backgroundColor: 'white',
          zIndex: 50,
          overflowY: 'auto',
          padding: 'var(--space-6)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>카테고리</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-1)',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-weight-bold)' }}>
            문장형 카테고리
          </h3>
          {sentenceCategories
            .filter((cat) => cat.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((category) => (
              <SentenceCategory
                key={category.id}
                category={category}
                selectedKeywordId={selectedKeywordId}
                onKeywordSelect={(keywordId) => {
                  onKeywordSelect(keywordId);
                  onClose();
                }}
                hoveredKeywordId={hoveredKeywordId}
                onKeywordHover={setHoveredKeywordId}
              />
            ))}
        </div>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-weight-bold)' }}>
            텍스트형 카테고리
          </h3>
          {textCategories
            .filter((cat) => cat.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((category) => (
              <TextCategory
                key={category.id}
                category={category}
                isSelected={selectedTextCategoryId === category.id}
                onSelect={() => {
                  onTextCategorySelect(category.id);
                  onClose();
                }}
                hoveredCategoryId={hoveredTextCategoryId}
                onHover={setHoveredTextCategoryId}
              />
            ))}
        </div>
      </div>
    </>
  );
}

